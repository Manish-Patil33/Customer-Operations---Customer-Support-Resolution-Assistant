"""
Pydantic models for structured AI output and internal data structures.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, field_validator
from enum import Enum


class DecisionType(str, Enum):
    RESOLVE = "RESOLVE"
    ASK_INFORMATION = "ASK_INFORMATION"
    ESCALATE = "ESCALATE"


class Priority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class CaseCategory(str, Enum):
    BILLING = "billing"
    BROADBAND = "broadband"
    MOBILE = "mobile"
    PLAN = "plan"
    ACCOUNT = "account"
    TECHNICAL = "technical"
    OTHER = "other"


class CaseClassification(BaseModel):
    category: str = "other"
    intent: str = ""
    priority: str = "medium"


class EvidenceItem(BaseModel):
    source_id: str
    source_type: str = "KNOWLEDGE"  # KNOWLEDGE | ACCOUNT | CONVERSATION
    title: str
    snippet: str
    relevance_score: float = 0.0
    chunk_id: str = ""


class Decision(BaseModel):
    type: str = "ESCALATE"
    reason: str = ""


class MinimumInfoRequired(BaseModel):
    field: str
    why: str
    question: str


class ContradictionItem(BaseModel):
    source_a: str
    claim_a: str
    source_b: str
    claim_b: str
    description: str = ""


class AIResolutionOutput(BaseModel):
    """
    Structured output from the AI resolution engine.
    Every field has a safe default so partial JSON doesn't crash the app.
    """
    case_classification: CaseClassification = CaseClassification()
    established_facts: List[str] = []
    missing_information: List[str] = []
    contradictions: List[ContradictionItem] = []
    retrieved_evidence: List[EvidenceItem] = []
    decision: Decision = Decision()
    resolution_draft: str = ""
    minimum_info_required: List[MinimumInfoRequired] = []
    handoff_summary: str = ""
    already_tried: List[str] = []
    confidence: float = 0.0
    knowledge_coverage: float = 0.0
    explainability: Dict[str, Any] = {}
    draft_quality: float = 0.0


class ResolutionRequest(BaseModel):
    """API request to analyze a case."""
    case_id: str
    customer_id: Optional[str] = None
    conversation_id: Optional[str] = None
    additional_context: Optional[str] = None


class CustomerRecord(BaseModel):
    """Customer data model."""
    customer_id: str
    name: str
    email: str = ""
    phone: str = ""
    plan: str = ""
    plan_price: float = 0.0
    billing_status: str = "unknown"
    current_bill: float = 0.0
    previous_bill: float = 0.0
    service_status: str = "unknown"
    service_type: str = "broadband"
    activation_date: str = ""
    address: str = ""
    account_notes: Optional[str] = None
    recent_ticket_ids: List[str] = []
    last_payment_date: str = ""
    last_payment_amount: float = 0.0


class TicketRecord(BaseModel):
    """Support ticket model."""
    ticket_id: str
    customer_id: str
    category: str
    subject: str
    description: str = ""
    status: str
    priority: str = "medium"
    created_at: str = ""
    resolved_at: Optional[str] = None
    resolution: Optional[str] = None
    agent_notes: Optional[str] = None


class ConversationMessage(BaseModel):
    role: str  # customer | agent | system
    content: str
    timestamp: str = ""


class ConversationRecord(BaseModel):
    conversation_id: str
    customer_id: str
    case_id: str
    channel: str = "chat"
    messages: List[ConversationMessage] = []
    extracted_facts: List[str] = []
