// API Types — matches backend Pydantic schemas

export type DecisionType = 'RESOLVE' | 'ASK_INFORMATION' | 'ESCALATE';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type CaseCategory = 'billing' | 'broadband' | 'mobile' | 'plan' | 'account' | 'technical' | 'other';

export interface CaseClassification {
  category: string;
  intent: string;
  priority: string;
}

export interface EvidenceItem {
  source_id: string;
  source_type: 'KNOWLEDGE' | 'ACCOUNT' | 'CONVERSATION';
  title: string;
  snippet: string;
  relevance_score: number;
  chunk_id?: string;
}

export interface Decision {
  type: DecisionType;
  reason: string;
}

export interface MinimumInfoRequired {
  field: string;
  why: string;
  question: string;
}

export interface ContradictionItem {
  source_a: string;
  claim_a: string;
  source_b: string;
  claim_b: string;
  description: string;
}

export interface Explainability {
  intent_detected?: string;
  evidence_strength?: 'strong' | 'moderate' | 'weak' | 'none';
  account_consistency?: 'verified' | 'unverified' | 'contradicted';
  coverage_assessment?: 'complete' | 'partial' | 'insufficient' | 'none';
  decision_logic?: string;
  error?: string;
}

export interface AIResolutionOutput {
  case_classification: CaseClassification;
  established_facts: string[];
  missing_information: string[];
  contradictions: ContradictionItem[];
  retrieved_evidence: EvidenceItem[];
  decision: Decision;
  resolution_draft: string;
  minimum_info_required: MinimumInfoRequired[];
  handoff_summary: string;
  already_tried: string[];
  confidence: number;
  knowledge_coverage: number;
  explainability: Explainability;
  draft_quality: number;
}

export interface Customer {
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  plan_price: number;
  billing_status: string;
  current_bill: number;
  previous_bill: number;
  service_status: string;
  service_type: string;
  activation_date: string;
  address: string;
  account_notes?: string;
  recent_ticket_ids: string[];
  last_payment_date: string;
  last_payment_amount: number;
  tickets?: Ticket[];
}

export interface Ticket {
  ticket_id: string;
  customer_id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  resolved_at?: string;
  resolution?: string;
  agent_notes?: string;
}

export interface ConversationMessage {
  role: 'customer' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

export interface Conversation {
  conversation_id: string;
  customer_id: string;
  case_id: string;
  channel: string;
  messages: ConversationMessage[];
  extracted_facts: string[];
}

export interface DemoCase {
  case_id: string;
  title: string;
  scenario_type: string;
  scenario_label: string;
  customer_id: string;
  conversation_id: string;
  priority: Priority;
  category: CaseCategory;
  description: string;
  expected_decision: DecisionType;
  expected_kb: string[];
  ai_confidence: number;
  knowledge_coverage: number;
  customer_name?: string;
  customer_plan?: string;
  customer?: Customer;
  conversation?: Conversation;
  tickets?: Ticket[];
}

export interface KBArticle {
  id: string;
  title: string;
  category: string;
  version: string;
  last_updated: string;
  summary: string;
  content?: string;
  content_length: number;
}

export interface RAGHealth {
  gemini_api: {
    status: string;
    model: string;
    embedding_model: string;
    api_key_configured: boolean;
  };
  vector_index: {
    status: string;
    type: string;
    num_chunks: number;
    num_documents: number;
    dimension: number;
    build_time?: string;
  };
  retriever: {
    status: string;
    top_k: number;
    threshold: number;
    method: string;
  };
  pipeline: string[];
  fallback_enabled: boolean;
  index_precomputed: boolean;
  external_services?: Record<string, string>;
}

export interface AnalyticsData {
  kpis: {
    open_cases: number;
    ai_ready: number;
    needs_information: number;
    escalations: number;
    knowledge_coverage_pct: number;
    avg_resolution_time_min: number;
    resolution_rate_pct: number;
    ai_ready_rate_pct: number;
    escalation_rate_pct: number;
    missing_info_rate_pct: number;
  };
  confidence_distribution: Record<string, number>;
  weekly_trend: Array<{ day: string; resolved: number; escalated: number; pending: number }>;
  category_breakdown: Array<{ name: string; count: number; color: string }>;
  escalation_reasons: Array<{ reason: string; count: number }>;
  is_demo_data: boolean;
}
