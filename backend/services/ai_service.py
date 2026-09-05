"""
AI Service
Orchestrates the full resolution pipeline:
  1. Build retrieval query from case context
  2. Retrieve relevant knowledge chunks
  3. Build LLM prompt with evidence
  4. Call Gemini for structured resolution
  5. Validate output deterministically
"""
import os
import json
import logging
import re
from typing import Optional, Dict, Any, List, Tuple

from backend.models.schemas import (
    AIResolutionOutput, CaseClassification, Decision, EvidenceItem,
    ContradictionItem, MinimumInfoRequired, DecisionType
)
from backend.prompts.templates import (
    RESOLUTION_SYSTEM_PROMPT, RESOLUTION_USER_PROMPT, NULL_CASE_PROMPT
)
from backend.validators.output_validator import validate_and_correct
from backend.rag.citations import format_citations, calculate_knowledge_coverage
from backend.utils.data_loader import (
    get_customer, get_customer_context_string,
    get_conversation, get_conversation_context_string,
    get_tickets_for_customer
)

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash"

# Non-telecom keywords that indicate out-of-domain requests
OUT_OF_DOMAIN_KEYWORDS = [
    "weather", "forecast", "rain", "temperature", "stock", "stock market",
    "cricket", "sports", "recipe", "cooking", "politics", "election",
    "astrology", "horoscope", "joke", "poem", "movie", "music",
    "news", "general knowledge", "mathematics", "history",
]


class AIService:
    """Core AI resolution service."""

    def __init__(self, retriever=None, api_key: Optional[str] = None):
        self.retriever = retriever
        self.api_key = os.getenv("GEMINI_API_KEY") if api_key is None else api_key
        self._gemini_available = False
        self._init_gemini()

    def _init_gemini(self):
        """Initialize Gemini client."""
        try:
            from google import genai
            if self.api_key:
                self._client = genai.Client(api_key=self.api_key)
                self._gemini_available = True
                logger.info(f"Gemini initialized: {GEMINI_MODEL}")
            else:
                logger.warning("GEMINI_API_KEY not set — AI features disabled")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            self._gemini_available = False

    @property
    def is_available(self) -> bool:
        return self._gemini_available

    def analyze_case(
        self,
        case_id: str,
        customer_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        additional_context: Optional[str] = None,
        demo_case_data: Optional[Dict] = None,
    ) -> AIResolutionOutput:
        """
        Full resolution pipeline for a support case.
        """
        # Step 1: Load customer and conversation data
        customer_data = get_customer(customer_id) if customer_id else None
        conversation_data = get_conversation(conversation_id) if conversation_id else None

        # Step 2: Check for out-of-domain request
        if conversation_data and self._is_out_of_domain(conversation_data):
            return self._handle_null_case(conversation_data, customer_data)

        # Step 3: Build retrieval query
        retrieval_query = self._build_retrieval_query(
            customer_data, conversation_data, additional_context
        )

        # Step 4: Retrieve knowledge chunks
        retrieved_chunks = []
        if self.retriever and retrieval_query:
            retrieved_chunks = self.retriever.retrieve(
                retrieval_query, top_k=5, api_key=self.api_key
            )
            logger.info(f"Retrieved {len(retrieved_chunks)} chunks for case {case_id}")

        # Step 5: Format evidence and calculate coverage
        evidence_citations = format_citations(retrieved_chunks)
        knowledge_coverage = calculate_knowledge_coverage(evidence_citations)

        # Step 6: Build ticket history context
        ticket_history = ""
        if customer_id:
            tickets = get_tickets_for_customer(customer_id)
            for t in tickets[:5]:
                ticket_history += f"\n{t['ticket_id']}: {t['subject']} ({t['status']}) - {t.get('resolution', 'No resolution yet')}"

        # Step 7: Call Gemini if available
        if not self._gemini_available:
            return self._fallback_output(
                case_id, customer_data, conversation_data,
                evidence_citations, knowledge_coverage
            )

        output = self._call_gemini(
            customer_data=customer_data,
            conversation_data=conversation_data,
            evidence_citations=evidence_citations,
            knowledge_coverage=knowledge_coverage,
            ticket_history=ticket_history,
        )

        # Step 8: Deterministic validation
        output = validate_and_correct(output, customer_data, conversation_data)

        return output

    def _is_out_of_domain(self, conversation_data: Dict) -> bool:
        """Check if the conversation is asking about something outside telecom support."""
        messages = conversation_data.get("messages", [])
        customer_messages = [m["content"].lower() for m in messages if m.get("role") == "customer"]
        combined_text = " ".join(customer_messages)

        for keyword in OUT_OF_DOMAIN_KEYWORDS:
            if keyword in combined_text:
                # Double-check it's not telecom-related context
                telecom_terms = ["bill", "internet", "data", "sim", "plan", "router", "broadband", "mobile"]
                has_telecom = any(t in combined_text for t in telecom_terms)
                if not has_telecom:
                    return True
        return False

    def _handle_null_case(
        self, conversation_data: Dict, customer_data: Optional[Dict]
    ) -> AIResolutionOutput:
        """Handle an out-of-domain request."""
        messages = conversation_data.get("messages", [])
        customer_msgs = [m["content"] for m in messages if m.get("role") == "customer"]
        request_text = customer_msgs[0] if customer_msgs else "Unknown request"

        # Detect intent
        intent = "Non-telecom request"
        for kw in OUT_OF_DOMAIN_KEYWORDS:
            if kw in request_text.lower():
                intent = f"{kw.capitalize()} inquiry (outside telecom support)"
                break

        output = AIResolutionOutput(
            case_classification=CaseClassification(
                category="other",
                intent=intent,
                priority="low"
            ),
            established_facts=[
                "Customer contacted support",
                "Request is outside the telecom support knowledge domain"
            ],
            missing_information=[],
            contradictions=[],
            retrieved_evidence=[],
            decision=Decision(
                type=DecisionType.ESCALATE,
                reason="Request is outside the supported knowledge domain. ResolveIQ handles broadband and mobile service support only. No relevant KB articles exist."
            ),
            resolution_draft="",
            handoff_summary=(
                f"Customer contacted support with an out-of-scope request: {intent}. "
                "No telecom service issue was identified. "
                "Recommend redirecting to appropriate channel or informing the customer "
                "that this query is outside our support scope."
            ),
            already_tried=[],
            confidence=0.99,
            knowledge_coverage=0.0,
            explainability={
                "intent_detected": intent,
                "evidence_strength": "none",
                "account_consistency": "unverified",
                "coverage_assessment": "none",
                "decision_logic": "Request is outside the supported telecom support knowledge domain. No relevant KB articles exist. Escalating rather than answering from general knowledge."
            },
            draft_quality=0.0,
        )
        return output

    def _build_retrieval_query(
        self,
        customer_data: Optional[Dict],
        conversation_data: Optional[Dict],
        additional_context: Optional[str]
    ) -> str:
        """Build an effective retrieval query from case context."""
        parts = []

        if conversation_data:
            facts = conversation_data.get("extracted_facts", [])
            if facts:
                parts.extend(facts[:3])

            messages = conversation_data.get("messages", [])
            customer_msgs = [m["content"] for m in messages if m.get("role") == "customer"]
            if customer_msgs:
                parts.append(customer_msgs[-1])  # Most recent customer message

        if customer_data:
            plan = customer_data.get("plan", "")
            billing_status = customer_data.get("billing_status", "")
            service_status = customer_data.get("service_status", "")
            if billing_status == "overdue":
                parts.append("billing payment overdue")
            if service_status in ("suspended", "restricted"):
                parts.append(f"service {service_status}")
            if plan:
                parts.append(plan)

        if additional_context:
            parts.append(additional_context)

        return " ".join(parts)

    def _call_gemini(
        self,
        customer_data: Optional[Dict],
        conversation_data: Optional[Dict],
        evidence_citations: List[Dict],
        knowledge_coverage: float,
        ticket_history: str,
    ) -> AIResolutionOutput:
        """Call Gemini with structured prompt and parse the response."""
        try:
            # Build context strings
            customer_str = (
                get_customer_context_string(customer_data["customer_id"])
                if customer_data else "No customer record provided."
            )
            conversation_str = (
                get_conversation_context_string(conversation_data["conversation_id"])
                if conversation_data else "No conversation history provided."
            )

            # Format evidence
            evidence_str = self._format_evidence_for_prompt(evidence_citations, knowledge_coverage)

            prompt = RESOLUTION_USER_PROMPT.format(
                customer_context=customer_str,
                conversation_context=conversation_str,
                knowledge_context=evidence_str,
                ticket_history=ticket_history or "No previous tickets.",
            )

            full_prompt = RESOLUTION_SYSTEM_PROMPT + "\n\n" + prompt

            # Call Gemini using new SDK
            response = self._client.models.generate_content(
                model=GEMINI_MODEL,
                contents=full_prompt,
                config={
                    "temperature": 0.1,
                    "max_output_tokens": 4096,
                }
            )

            raw_text = response.text
            return self._parse_gemini_response(raw_text, evidence_citations, knowledge_coverage)

        except Exception as e:
            logger.error(f"Gemini call failed: {e}")
            return self._error_output(str(e))

    def _format_evidence_for_prompt(self, citations: List[Dict], coverage: float) -> str:
        """Format citations as readable evidence for the prompt."""
        if not citations:
            return f"No relevant knowledge base articles found. Knowledge coverage: 0%."

        lines = [f"Knowledge coverage: {coverage:.0%}\n"]
        for i, c in enumerate(citations, 1):
            lines.append(f"[{c['source_id']}] {c['title']}")
            lines.append(f"Relevance: {c['relevance_score']:.2f}")
            lines.append(f"Content: {c['snippet']}")
            lines.append("")

        return "\n".join(lines)

    def _parse_gemini_response(
        self,
        raw_text: str,
        evidence_citations: List[Dict],
        knowledge_coverage: float
    ) -> AIResolutionOutput:
        """Parse Gemini's JSON response into a validated AIResolutionOutput."""
        try:
            # Extract JSON from response (handle markdown code blocks)
            json_text = self._extract_json(raw_text)
            data = json.loads(json_text)

            # Build the output object with safe defaults
            output = AIResolutionOutput(
                case_classification=CaseClassification(
                    **data.get("case_classification", {})
                ),
                established_facts=data.get("established_facts", []),
                missing_information=data.get("missing_information", []),
                contradictions=[
                    ContradictionItem(**c) for c in data.get("contradictions", [])
                ],
                retrieved_evidence=[
                    EvidenceItem(**e) for e in data.get("retrieved_evidence", evidence_citations[:3])
                ],
                decision=Decision(**data.get("decision", {})),
                resolution_draft=data.get("resolution_draft", ""),
                minimum_info_required=[
                    MinimumInfoRequired(**m) for m in data.get("minimum_info_required", [])
                ],
                handoff_summary=data.get("handoff_summary", ""),
                already_tried=data.get("already_tried", []),
                confidence=float(data.get("confidence", 0.5)),
                knowledge_coverage=float(data.get("knowledge_coverage", knowledge_coverage)),
                explainability=data.get("explainability", {}),
                draft_quality=float(data.get("draft_quality", 0.0)),
            )

            # Ensure knowledge_coverage is set from our own calculation if LLM didn't set it
            if output.knowledge_coverage == 0.0 and knowledge_coverage > 0:
                output.knowledge_coverage = knowledge_coverage

            # Merge LLM evidence with our retrieved citations (use ours if LLM didn't populate)
            if not output.retrieved_evidence and evidence_citations:
                output.retrieved_evidence = [EvidenceItem(**c) for c in evidence_citations[:5]]

            return output

        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}\nRaw: {raw_text[:500]}")
            return self._error_output(f"Invalid JSON response from AI: {e}")
        except Exception as e:
            logger.error(f"Response parsing error: {e}")
            return self._error_output(str(e))

    def _extract_json(self, text: str) -> str:
        """Extract JSON from text that may contain markdown code blocks."""
        # Try to find JSON in ```json ... ``` blocks
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            return match.group(1)

        # Try to find a JSON object directly
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return match.group(0)

        return text

    def _fallback_output(
        self,
        case_id: str,
        customer_data: Optional[Dict],
        conversation_data: Optional[Dict],
        evidence_citations: List[Dict],
        knowledge_coverage: float,
    ) -> AIResolutionOutput:
        """Return a graceful fallback when Gemini is unavailable."""
        return AIResolutionOutput(
            case_classification=CaseClassification(
                category="other",
                intent="Unable to analyze — AI service unavailable",
                priority="medium"
            ),
            established_facts=["AI service is temporarily unavailable"],
            missing_information=[],
            contradictions=[],
            retrieved_evidence=[EvidenceItem(**c) for c in evidence_citations[:3]],
            decision=Decision(
                type=DecisionType.ESCALATE,
                reason="AI service temporarily unavailable. Manual review required."
            ),
            resolution_draft="",
            handoff_summary="AI service unavailable. Agent should review case manually with provided account and conversation data.",
            already_tried=[],
            confidence=0.0,
            knowledge_coverage=knowledge_coverage,
            explainability={"error": "AI service unavailable"},
            draft_quality=0.0,
        )

    def _error_output(self, error_msg: str) -> AIResolutionOutput:
        """Return an error output that doesn't crash the application."""
        return AIResolutionOutput(
            case_classification=CaseClassification(
                category="other",
                intent="Analysis failed",
                priority="medium"
            ),
            established_facts=[],
            missing_information=[],
            contradictions=[],
            retrieved_evidence=[],
            decision=Decision(
                type=DecisionType.ESCALATE,
                reason=f"Analysis failed: {error_msg[:100]}. Manual review required."
            ),
            resolution_draft="",
            handoff_summary="AI analysis failed. Manual agent review required.",
            already_tried=[],
            confidence=0.0,
            knowledge_coverage=0.0,
            explainability={"error": error_msg},
            draft_quality=0.0,
        )
