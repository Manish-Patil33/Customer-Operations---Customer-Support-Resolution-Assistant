"""
Escalations API Route
"""
from fastapi import APIRouter
from backend.utils.data_loader import get_all_demo_cases, get_customer

router = APIRouter(prefix="/api/escalations", tags=["escalations"])


@router.get("")
def list_escalations():
    """Return all cases that are flagged for escalation."""
    cases = get_all_demo_cases()
    escalated = []

    for case in cases:
        if case.get("expected_decision") == "ESCALATE":
            customer = get_customer(case.get("customer_id", ""))
            escalated.append({
                "case_id": case["case_id"],
                "title": case["title"],
                "customer_id": case.get("customer_id"),
                "customer_name": customer["name"] if customer else "Unknown",
                "customer_plan": customer.get("plan", "") if customer else "",
                "category": case.get("category"),
                "priority": case.get("priority"),
                "scenario_label": case.get("scenario_label"),
                "ai_confidence": case.get("ai_confidence"),
                "knowledge_coverage": case.get("knowledge_coverage"),
                "description": case.get("description"),
            })

    return escalated
