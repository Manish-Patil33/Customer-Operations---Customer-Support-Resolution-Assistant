import pytest
from backend.services.ai_service import AIService
from backend.models.schemas import AIResolutionOutput, DecisionType, Decision, CaseClassification
from backend.utils.data_loader import load_all_data

load_all_data("data")


def test_ai_service_fallback_mode_when_no_api_key():
    service = AIService(retriever=None, api_key="")
    assert service.is_available is False

    output = service.analyze_case(
        case_id="CASE-1001",
        customer_id="CUS-10023",
        conversation_id="CONV-1001",
        additional_context=None
    )

    assert isinstance(output, AIResolutionOutput)
    assert output.decision.type in [DecisionType.RESOLVE.value, DecisionType.ASK_INFORMATION.value, DecisionType.ESCALATE.value]


def test_ai_service_handles_contradiction_case():
    service = AIService(retriever=None, api_key="")
    # CASE-1003 is unauthorized plan upgrade
    output = service.analyze_case(
        case_id="CASE-1003",
        customer_id="CUS-10045",
        conversation_id="CONV-1003"
    )

    assert isinstance(output, AIResolutionOutput)
    assert output.decision.type == DecisionType.ESCALATE.value


def test_ai_service_handles_knowledge_gap_case():
    service = AIService(retriever=None, api_key="")
    # CASE-1004 is out-of-domain weather forecast request
    output = service.analyze_case(
        case_id="CASE-1004",
        customer_id="CUS-10056",
        conversation_id="CONV-1004"
    )

    assert isinstance(output, AIResolutionOutput)
    assert output.decision.type == DecisionType.ESCALATE.value


def test_ai_service_extract_json():
    service = AIService(retriever=None, api_key="")
    raw_response = "Here is the json output ```json\n{\"category\": \"billing\", \"decision\": {\"type\": \"RESOLVE\"}}\n```"
    extracted = service._extract_json(raw_response)
    assert '{"category": "billing"' in extracted
