"""
Data Loader Utility
Loads and caches customer, ticket, conversation, and demo case data.
"""
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

# In-memory cache
_customers: Dict[str, Dict] = {}
_tickets: Dict[str, Dict] = {}
_conversations: Dict[str, Dict] = {}
_conversations_by_case: Dict[str, Dict] = {}
_demo_cases: Dict[str, Dict] = {}
_customers_by_ticket: Dict[str, str] = {}  # ticket_id → customer_id


def load_all_data(data_dir: str = "data") -> None:
    """Load all synthetic data into memory at startup."""
    global _customers, _tickets, _conversations, _demo_cases, _conversations_by_case, _customers_by_ticket

    data_path = Path(data_dir)

    # Load customers
    customers_file = data_path / "customers" / "customers.json"
    if customers_file.exists():
        data = json.loads(customers_file.read_text(encoding="utf-8"))
        for c in data.get("customers", []):
            _customers[c["customer_id"]] = c
        logger.info(f"Loaded {len(_customers)} customers")

    # Load tickets
    tickets_file = data_path / "tickets" / "tickets.json"
    if tickets_file.exists():
        data = json.loads(tickets_file.read_text(encoding="utf-8"))
        for t in data.get("tickets", []):
            _tickets[t["ticket_id"]] = t
        logger.info(f"Loaded {len(_tickets)} tickets")

    # Load conversations
    conv_file = data_path / "conversations" / "conversations.json"
    if conv_file.exists():
        data = json.loads(conv_file.read_text(encoding="utf-8"))
        for c in data.get("conversations", []):
            _conversations[c["conversation_id"]] = c
            _conversations_by_case[c["case_id"]] = c
        logger.info(f"Loaded {len(_conversations)} conversations")

    # Load demo cases
    cases_file = data_path / "demo_cases" / "cases.json"
    if cases_file.exists():
        data = json.loads(cases_file.read_text(encoding="utf-8"))
        for c in data.get("demo_cases", []):
            _demo_cases[c["case_id"]] = c
        logger.info(f"Loaded {len(_demo_cases)} demo cases")


def get_customer(customer_id: str) -> Optional[Dict]:
    return _customers.get(customer_id)


def get_all_customers() -> List[Dict]:
    return list(_customers.values())


def get_ticket(ticket_id: str) -> Optional[Dict]:
    return _tickets.get(ticket_id)


def get_tickets_for_customer(customer_id: str) -> List[Dict]:
    """Return all tickets for a given customer, sorted by created_at descending."""
    tickets = [t for t in _tickets.values() if t.get("customer_id") == customer_id]
    return sorted(tickets, key=lambda t: t.get("created_at", ""), reverse=True)


def get_conversation(conversation_id: str) -> Optional[Dict]:
    return _conversations.get(conversation_id)


def get_conversation_by_case(case_id: str) -> Optional[Dict]:
    return _conversations_by_case.get(case_id)


def get_demo_case(case_id: str) -> Optional[Dict]:
    return _demo_cases.get(case_id)


def get_all_demo_cases() -> List[Dict]:
    return list(_demo_cases.values())


def get_customer_context_string(customer_id: str) -> str:
    """Format customer data as a string for LLM context."""
    customer = get_customer(customer_id)
    if not customer:
        return "No customer record found."

    tickets = get_tickets_for_customer(customer_id)
    recent_tickets_str = ""
    for t in tickets[:3]:
        recent_tickets_str += (
            f"\n  - {t['ticket_id']}: {t['subject']} ({t['status']}) - {t.get('created_at', '')[:10]}"
        )

    return f"""Customer ID: {customer['customer_id']}
Name: {customer['name']}
Plan: {customer['plan']} (₹{customer['plan_price']}/month)
Service Type: {customer['service_type']}
Service Status: {customer['service_status']}
Billing Status: {customer['billing_status']}
Current Bill: ₹{customer['current_bill']}
Previous Bill: ₹{customer['previous_bill']}
Account Active Since: {customer['activation_date']}
Last Payment: ₹{customer['last_payment_amount']} on {customer['last_payment_date']}
Account Notes: {customer.get('account_notes') or 'None'}
Recent Tickets: {recent_tickets_str or 'None'}"""


def get_conversation_context_string(conversation_id: str) -> str:
    """Format conversation as a string for LLM context."""
    conv = get_conversation(conversation_id)
    if not conv:
        return "No conversation history available."

    lines = []
    for msg in conv.get("messages", []):
        role = msg.get("role", "unknown").upper()
        content = msg.get("content", "")
        timestamp = msg.get("timestamp", "")[:16].replace("T", " ")
        lines.append(f"[{timestamp}] {role}: {content}")

    facts = conv.get("extracted_facts", [])
    if facts:
        lines.append("\nEXTRACTED FACTS: " + "; ".join(facts))

    return "\n".join(lines)


def build_analytics_data() -> Dict[str, Any]:
    """Build analytics summary from in-memory data."""
    cases = get_all_demo_cases()

    category_counts: Dict[str, int] = {}
    decision_counts: Dict[str, int] = {}

    for case in cases:
        cat = case.get("category", "other")
        category_counts[cat] = category_counts.get(cat, 0) + 1

        decision = case.get("expected_decision", "ESCALATE")
        decision_counts[decision] = decision_counts.get(decision, 0) + 1

    open_tickets = [t for t in _tickets.values() if t.get("status") in ("open", "pending")]
    resolved_tickets = [t for t in _tickets.values() if t.get("status") == "resolved"]

    return {
        "total_cases": len(cases),
        "open_tickets": len(open_tickets),
        "resolved_tickets": len(resolved_tickets),
        "total_tickets": len(_tickets),
        "total_customers": len(_customers),
        "category_distribution": category_counts,
        "decision_distribution": decision_counts,
        "ai_ready_cases": sum(1 for c in cases if c.get("expected_decision") == "RESOLVE"),
        "escalation_cases": sum(1 for c in cases if c.get("expected_decision") == "ESCALATE"),
        "avg_confidence": round(
            sum(c.get("ai_confidence", 0) for c in cases) / max(len(cases), 1), 1
        ),
    }
