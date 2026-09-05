"""
RAG Citations
Formats retrieved evidence into traceable citation objects.
"""
from typing import List, Dict, Any


SOURCE_TYPES = {
    "KB": "KNOWLEDGE",
    "ACCOUNT": "ACCOUNT",
    "CONVERSATION": "CONVERSATION",
}


def format_citations(retrieved_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Format retrieved RAG chunks into structured citations.
    """
    citations = []
    for chunk in retrieved_chunks:
        citation = {
            "source_id": chunk.get("source_id", "UNKNOWN"),
            "source_type": "KNOWLEDGE",
            "title": chunk.get("source_title", "Unknown Article"),
            "category": chunk.get("source_category", "General"),
            "snippet": _truncate_snippet(chunk.get("text", ""), 300),
            "relevance_score": round(chunk.get("relevance_score", 0.0), 3),
            "chunk_id": chunk.get("chunk_id", ""),
        }
        citations.append(citation)
    return citations


def format_account_citation(field: str, value: Any, customer_id: str) -> Dict[str, Any]:
    """Create a citation object for a customer account data point."""
    return {
        "source_id": f"ACCOUNT:{customer_id}",
        "source_type": "ACCOUNT",
        "title": "Customer Account Record",
        "category": "Account Data",
        "snippet": f"Field: {field} = {value}",
        "relevance_score": 1.0,
        "chunk_id": f"account_{customer_id}_{field}",
    }


def format_conversation_citation(fact: str, conversation_id: str) -> Dict[str, Any]:
    """Create a citation object for a fact established from conversation."""
    return {
        "source_id": f"CONV:{conversation_id}",
        "source_type": "CONVERSATION",
        "title": "Customer Conversation",
        "category": "Conversation",
        "snippet": fact,
        "relevance_score": 1.0,
        "chunk_id": f"conv_{conversation_id}_{hash(fact)}",
    }


def _truncate_snippet(text: str, max_len: int) -> str:
    """Truncate text to max_len with ellipsis."""
    if len(text) <= max_len:
        return text
    return text[:max_len - 3] + "..."


def calculate_knowledge_coverage(citations: List[Dict[str, Any]], threshold: float = 0.65) -> float:
    """
    Calculate knowledge coverage score based on how many strong citations were found.
    This is a deterministic metric, NOT the same as LLM confidence.
    """
    if not citations:
        return 0.0

    kb_citations = [c for c in citations if c["source_type"] == "KNOWLEDGE"]
    if not kb_citations:
        return 0.0

    # Average of top citation scores, weighted toward the best match
    scores = sorted([c["relevance_score"] for c in kb_citations], reverse=True)
    # Weighted average: top result counts most
    weights = [1.0 / (i + 1) for i in range(len(scores))]
    weighted_sum = sum(s * w for s, w in zip(scores, weights))
    weight_total = sum(weights)

    coverage = weighted_sum / weight_total if weight_total > 0 else 0.0
    return round(min(coverage, 1.0), 3)
