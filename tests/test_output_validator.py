import pytest
from backend.models.schemas import (
    AIResolutionOutput,
    Decision,
    DecisionType,
    ContradictionItem,
    EvidenceItem,
    CaseClassification,
)
from backend.validators.output_validator import validate_and_correct


def test_validator_forces_escalate_on_contradiction():
    output = AIResolutionOutput(
        case_classification=CaseClassification(category="Internet", intent="Speed issue"),
        decision=Decision(
            type=DecisionType.RESOLVE.value,
            reason="Can resolve based on steps"
        ),
        contradictions=[
            ContradictionItem(
                source_a="Customer Conversation",
                claim_a="Modem lights are red",
                source_b="Account Record",
                claim_b="Status shows active connection",
                description="Modem red light vs active status record"
            )
        ],
        knowledge_coverage=0.8,
        resolution_draft="Please restart modem.",
        established_facts=["Power is on"]
    )

    validated = validate_and_correct(output)
    assert validated.decision.type == DecisionType.ESCALATE.value
    assert "Contradictions detected" in validated.decision.reason


def test_validator_forces_escalate_on_zero_coverage():
    output = AIResolutionOutput(
        case_classification=CaseClassification(category="Billing", intent="Overcharge query"),
        decision=Decision(
            type=DecisionType.RESOLVE.value,
            reason="Appears to be a billing discrepancy"
        ),
        contradictions=[],
        knowledge_coverage=0.0,
        resolution_draft="We will refund you.",
        established_facts=["Customer asked for refund"]
    )

    validated = validate_and_correct(output)
    assert validated.decision.type == DecisionType.ESCALATE.value
    assert "No relevant knowledge base articles" in validated.decision.reason


def test_validator_downgrades_low_coverage():
    output = AIResolutionOutput(
        case_classification=CaseClassification(category="Mobile", intent="Roaming query"),
        decision=Decision(
            type=DecisionType.RESOLVE.value,
            reason="Partial information found"
        ),
        contradictions=[],
        knowledge_coverage=0.3,  # Below 0.50 threshold
        resolution_draft="Roaming works internationally.",
        established_facts=["Traveling next week"]
    )

    validated = validate_and_correct(output)
    assert validated.decision.type == DecisionType.ASK_INFORMATION.value
    assert "below the minimum required" in validated.decision.reason


def test_validator_auto_generates_min_info():
    output = AIResolutionOutput(
        case_classification=CaseClassification(category="Account", intent="Address change"),
        decision=Decision(
            type=DecisionType.ASK_INFORMATION.value,
            reason="Need new address"
        ),
        missing_information=["New postal code"],
        minimum_info_required=[]
    )

    validated = validate_and_correct(output)
    assert len(validated.minimum_info_required) == 1
    assert validated.minimum_info_required[0].field == "New postal code"
