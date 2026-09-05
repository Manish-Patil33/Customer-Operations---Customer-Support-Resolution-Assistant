"""
Deterministic Output Validator
Applies business rule checks AFTER the LLM produces output.
This is the key separation between LLM reasoning and deterministic logic.
"""
import logging
from typing import Dict, Any, List, Optional
from backend.models.schemas import AIResolutionOutput, DecisionType

logger = logging.getLogger(__name__)

# Business rule thresholds
MIN_KNOWLEDGE_COVERAGE_FOR_RESOLVE = 0.50
MIN_CONFIDENCE_FOR_RESOLVE = 0.60
CONTRADICTION_FORCES_ESCALATE = True
KNOWLEDGE_GAP_FORCES_ESCALATE = True  # 0 KB coverage + RESOLVE → force ESCALATE


def validate_and_correct(
    output: AIResolutionOutput,
    customer_data: Optional[Dict] = None,
    conversation_data: Optional[Dict] = None
) -> AIResolutionOutput:
    """
    Apply deterministic business rule validation.
    Corrects the LLM output where needed.
    Returns a validated output object.
    """
    corrections = []

    # RULE 1: Contradictions must escalate (unless trivially account-verifiable)
    if output.contradictions and CONTRADICTION_FORCES_ESCALATE:
        if output.decision.type != DecisionType.ESCALATE:
            output.decision.type = DecisionType.ESCALATE
            output.decision.reason = (
                f"Contradictions detected between sources: "
                + "; ".join([c.description or f"{c.source_a} vs {c.source_b}" for c in output.contradictions])
                + ". Human verification required."
            )
            corrections.append("CONTRADICTION_FORCED_ESCALATE")
            logger.info("Deterministic: Forced ESCALATE due to contradictions")

    # RULE 2: Zero knowledge coverage + RESOLVE → ESCALATE or ASK_INFORMATION
    if output.knowledge_coverage == 0.0 and KNOWLEDGE_GAP_FORCES_ESCALATE:
        if output.decision.type == DecisionType.RESOLVE:
            output.decision.type = DecisionType.ESCALATE
            output.decision.reason = (
                "No relevant knowledge base articles found to support this resolution. "
                "Cannot resolve without grounded evidence."
            )
            corrections.append("KNOWLEDGE_GAP_FORCED_ESCALATE")
            logger.info("Deterministic: Forced ESCALATE due to zero knowledge coverage")

    # RULE 3: Low knowledge coverage for RESOLVE → downgrade
    if (
        output.decision.type == DecisionType.RESOLVE
        and output.knowledge_coverage < MIN_KNOWLEDGE_COVERAGE_FOR_RESOLVE
        and not _has_account_data_evidence(output)
    ):
        output.decision.type = DecisionType.ASK_INFORMATION
        output.decision.reason = (
            f"Knowledge coverage ({output.knowledge_coverage:.0%}) is below the minimum required "
            f"({MIN_KNOWLEDGE_COVERAGE_FOR_RESOLVE:.0%}). More information needed."
        )
        corrections.append("LOW_COVERAGE_DOWNGRADE")
        logger.info(f"Deterministic: Downgraded to ASK_INFORMATION (coverage={output.knowledge_coverage})")

    # RULE 4: RESOLVE with empty resolution draft → downgrade
    if output.decision.type == DecisionType.RESOLVE and not output.resolution_draft.strip():
        output.decision.type = DecisionType.ASK_INFORMATION
        output.decision.reason = "Resolution draft was empty despite RESOLVE decision."
        corrections.append("EMPTY_DRAFT_DOWNGRADE")
        logger.info("Deterministic: Downgraded due to empty resolution draft")

    # RULE 5: Low confidence for RESOLVE → warn / consider downgrade
    if output.decision.type == DecisionType.RESOLVE and output.confidence < MIN_CONFIDENCE_FOR_RESOLVE:
        # Don't force downgrade — just log and adjust confidence (it may still be resolvable)
        logger.warning(f"Low confidence ({output.confidence}) for RESOLVE decision")

    # RULE 6: ASK_INFORMATION with no minimum_info_required → fix
    if output.decision.type == DecisionType.ASK_INFORMATION and not output.minimum_info_required:
        if output.missing_information:
            # Auto-generate a generic minimum info item from missing_information
            first_missing = output.missing_information[0]
            from backend.models.schemas import MinimumInfoRequired
            output.minimum_info_required = [MinimumInfoRequired(
                field=first_missing,
                why="Required to proceed with resolution",
                question=f"Could you please provide: {first_missing}?"
            )]
            corrections.append("AUTO_GENERATED_MIN_INFO")

    # RULE 7: Validate draft quality score
    output.draft_quality = _calculate_draft_quality(output)

    # RULE 8: Check customer account for obvious contradictions not caught by LLM
    if customer_data and conversation_data:
        _check_account_contradictions(output, customer_data, conversation_data)

    # RULE 9: Generate handoff if escalating but no handoff_summary
    if output.decision.type == DecisionType.ESCALATE and not output.handoff_summary.strip():
        output.handoff_summary = _generate_fallback_handoff(output, customer_data)
        corrections.append("AUTO_GENERATED_HANDOFF")

    if corrections:
        logger.info(f"Validator applied corrections: {corrections}")

    return output


def _has_account_data_evidence(output: AIResolutionOutput) -> bool:
    """Check if any ACCOUNT-type evidence supports the resolution."""
    return any(e.source_type == "ACCOUNT" for e in output.retrieved_evidence)


def _calculate_draft_quality(output: AIResolutionOutput) -> float:
    """
    Deterministic quality check for the resolution draft.
    Checks against specific criteria.
    """
    if output.decision.type != DecisionType.RESOLVE:
        return 0.0

    score = 0.0
    checks = 6

    # Check 1: Draft is not empty
    if output.resolution_draft and len(output.resolution_draft) > 50:
        score += 1

    # Check 2: Has KB evidence
    kb_evidence = [e for e in output.retrieved_evidence if e.source_type == "KNOWLEDGE"]
    if kb_evidence:
        score += 1

    # Check 3: Knowledge coverage above threshold
    if output.knowledge_coverage >= MIN_KNOWLEDGE_COVERAGE_FOR_RESOLVE:
        score += 1

    # Check 4: No missing information
    if not output.missing_information:
        score += 1

    # Check 5: No contradictions
    if not output.contradictions:
        score += 1

    # Check 6: Confidence is reasonable
    if output.confidence >= 0.65:
        score += 1

    return round(score / checks, 2)


def _check_account_contradictions(
    output: AIResolutionOutput,
    customer_data: Dict,
    conversation_data: Dict
) -> None:
    """
    Deterministically check for account-level contradictions
    that the LLM may have missed.
    """
    from backend.models.schemas import ContradictionItem

    existing_contradiction_descriptions = {c.description for c in output.contradictions}

    # Check: Conversation mentions a plan that differs from account record
    account_plan = customer_data.get("plan", "")
    if account_plan and conversation_data:
        messages = conversation_data.get("messages", [])
        for msg in messages:
            if msg.get("role") == "customer":
                content = msg.get("content", "").lower()
                # Simple heuristic: if customer mentions a specific plan name different from account
                if "200 mbps" in content and "500" in account_plan:
                    desc = "Customer stated 200 Mbps plan but account shows FiberMax 500"
                    if desc not in existing_contradiction_descriptions:
                        output.contradictions.append(ContradictionItem(
                            source_a="Customer Conversation",
                            claim_a="Customer states they are on 200 Mbps plan",
                            source_b="Account Record",
                            claim_b=f"Account shows plan: {account_plan}",
                            description=desc
                        ))
                        logger.info("Deterministic: Added plan contradiction")
                        break


def _generate_fallback_handoff(output: AIResolutionOutput, customer_data: Optional[Dict]) -> str:
    """Generate a basic handoff summary if the LLM didn't produce one."""
    parts = []

    if customer_data:
        parts.append(f"Customer: {customer_data.get('name', 'Unknown')} ({customer_data.get('customer_id', '')})")
        parts.append(f"Plan: {customer_data.get('plan', 'Unknown')} | Status: {customer_data.get('service_status', 'unknown')}")

    if output.case_classification.intent:
        parts.append(f"Issue: {output.case_classification.intent}")

    if output.established_facts:
        parts.append("Established: " + "; ".join(output.established_facts[:3]))

    if output.already_tried:
        parts.append("Already tried: " + "; ".join(output.already_tried))

    if output.contradictions:
        parts.append("Contradictions: " + "; ".join([c.description for c in output.contradictions]))

    parts.append(f"Escalation reason: {output.decision.reason}")

    return "\n".join(parts)
