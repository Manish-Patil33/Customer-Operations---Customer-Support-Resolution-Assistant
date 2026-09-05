"""
Analytics API Route
"""
from fastapi import APIRouter
from backend.utils.data_loader import build_analytics_data, get_all_demo_cases

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("")
def get_analytics():
    """Return analytics summary data."""
    base = build_analytics_data()

    # Add fake trend data for chart visualization (synthetic demo data)
    cases = get_all_demo_cases()
    confidence_buckets = {"High (>80%)": 0, "Medium (50-80%)": 0, "Low (<50%)": 0}
    for c in cases:
        conf = c.get("ai_confidence", 0)
        if conf > 80:
            confidence_buckets["High (>80%)"] += 1
        elif conf >= 50:
            confidence_buckets["Medium (50-80%)"] += 1
        else:
            confidence_buckets["Low (<50%)"] += 1

    return {
        **base,
        "kpis": {
            "open_cases": 128,
            "ai_ready": 74,
            "needs_information": 21,
            "escalations": 13,
            "knowledge_coverage_pct": 92,
            "avg_resolution_time_min": 8.4,
            "resolution_rate_pct": 81.2,
            "ai_ready_rate_pct": 57.8,
            "escalation_rate_pct": 10.2,
            "missing_info_rate_pct": 16.4,
        },
        "confidence_distribution": confidence_buckets,
        "weekly_trend": [
            {"day": "Mon", "resolved": 42, "escalated": 8, "pending": 12},
            {"day": "Tue", "resolved": 38, "escalated": 11, "pending": 9},
            {"day": "Wed", "resolved": 55, "escalated": 6, "pending": 14},
            {"day": "Thu", "resolved": 47, "escalated": 9, "pending": 11},
            {"day": "Fri", "resolved": 61, "escalated": 13, "pending": 18},
            {"day": "Sat", "resolved": 29, "escalated": 5, "pending": 7},
            {"day": "Sun", "resolved": 18, "escalated": 3, "pending": 4},
        ],
        "category_breakdown": [
            {"name": "Billing", "count": 34, "color": "#818cf8"},
            {"name": "Broadband", "count": 52, "color": "#34d399"},
            {"name": "Mobile", "count": 28, "color": "#f59e0b"},
            {"name": "Plan", "count": 9, "color": "#60a5fa"},
            {"name": "Account", "count": 5, "color": "#e879f9"},
        ],
        "escalation_reasons": [
            {"reason": "Knowledge Gap", "count": 4},
            {"reason": "Contradictions", "count": 3},
            {"reason": "Complexity", "count": 3},
            {"reason": "High Value", "count": 2},
            {"reason": "Repeat Issue", "count": 1},
        ],
        "is_demo_data": True,
    }
