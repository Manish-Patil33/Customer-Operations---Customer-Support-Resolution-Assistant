"""
Cases API Routes
"""
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from backend.utils.data_loader import (
    get_demo_case, get_all_demo_cases, get_customer,
    get_conversation_by_case, get_tickets_for_customer
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/cases", tags=["cases"])


class AnalyzeRequest(BaseModel):
    additional_context: Optional[str] = None


@router.get("")
def list_cases():
    """Return all demo cases for the case inbox."""
    cases = get_all_demo_cases()
    result = []
    for case in cases:
        customer = get_customer(case.get("customer_id", ""))
        result.append({
            **case,
            "customer_name": customer["name"] if customer else "Unknown",
            "customer_plan": customer.get("plan") if customer else "",
        })
    return result


@router.get("/{case_id}")
def get_case(case_id: str):
    """Return a single case with full context."""
    case = get_demo_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    customer = get_customer(case.get("customer_id", ""))
    conversation = get_conversation_by_case(case_id)
    tickets = get_tickets_for_customer(case.get("customer_id", "")) if customer else []

    return {
        **case,
        "customer": customer,
        "conversation": conversation,
        "tickets": tickets[:5],
    }


@router.post("/{case_id}/analyze")
async def analyze_case(case_id: str, request: AnalyzeRequest = AnalyzeRequest()):
    """
    Run the full AI resolution pipeline for a case.
    Returns structured analysis with evidence, decision, and draft.
    """
    # Import here to avoid circular imports
    from backend.services.ai_service import AIService
    import app as main_app

    case = get_demo_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    try:
        ai_service: AIService = main_app.get_ai_service()
        output = ai_service.analyze_case(
            case_id=case_id,
            customer_id=case.get("customer_id"),
            conversation_id=case.get("conversation_id"),
            additional_context=request.additional_context if request else None,
        )
        return output.model_dump()
    except Exception as e:
        logger.error(f"Analysis failed for {case_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{case_id}/escalate")
def escalate_case(case_id: str):
    """Mark a case as escalated (demo action)."""
    case = get_demo_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return {"status": "escalated", "case_id": case_id, "message": "Case escalated to Tier-2 queue."}


@router.post("/{case_id}/approve")
def approve_resolution(case_id: str):
    """Approve and 'send' a resolution (demo action only)."""
    case = get_demo_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return {
        "status": "approved",
        "case_id": case_id,
        "message": "Resolution approved. In production, this would send the response to the customer. (Demo mode — no message sent.)"
    }
