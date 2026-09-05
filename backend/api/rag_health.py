"""
RAG Health API Route
"""
import os
from fastapi import APIRouter
from backend.rag.index import get_index_stats, index_exists

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.get("/health")
def rag_health():
    """Return RAG pipeline health and configuration."""
    import app as main_app

    stats = get_index_stats()
    ai_available = getattr(main_app.ai_service, "is_available", False) if hasattr(main_app, "ai_service") else False

    return {
        "gemini_api": {
            "status": "connected" if ai_available else "unavailable",
            "model": "gemini-1.5-flash",
            "embedding_model": "models/text-embedding-004",
            "api_key_configured": bool(os.getenv("GEMINI_API_KEY")),
        },
        "vector_index": {
            "status": "loaded" if index_exists() else "not_found",
            "type": "FAISS (local)",
            "num_chunks": stats.get("num_chunks", 0),
            "num_documents": stats.get("num_documents", 0),
            "dimension": stats.get("dimension", 0),
            "build_time": stats.get("build_time"),
        },
        "retriever": {
            "status": "active" if getattr(main_app, "retriever", None) else "inactive",
            "top_k": 5,
            "threshold": 0.50,
            "method": "Cosine Similarity (Inner Product after L2 normalization)",
        },
        "external_services": {
            "openai": "NOT USED",
            "pinecone": "NOT USED",
            "weaviate": "NOT USED",
            "huggingface": "NOT USED",
            "any_external_rag": "NOT USED",
        },
        "pipeline": [
            "Documents (Markdown)",
            "Chunking (paragraph-aware)",
            "Gemini Embeddings (gemini-embedding-001)",
            "FAISS Local Vector Index",
            "Cosine Similarity Search",
            "Top-K Relevant Chunks",
            "Gemini Reasoning (gemini-1.5-flash)",
            "Structured JSON Output",
            "Deterministic Validation",
            "Evidence Citations"
        ],
        "fallback_enabled": True,
        "index_precomputed": index_exists(),
    }
