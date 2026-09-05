"""
Knowledge Base API Routes
"""
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from backend.rag.loader import load_knowledge_documents

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

_kb_cache = None


def _get_kb():
    global _kb_cache
    if _kb_cache is None:
        _kb_cache = load_knowledge_documents("data/knowledge")
    return _kb_cache


@router.get("")
def list_knowledge_articles():
    """Return all knowledge base articles (metadata only)."""
    articles = _get_kb()
    return [
        {
            "id": a["id"],
            "title": a["title"],
            "category": a["category"],
            "version": a["version"],
            "last_updated": a["last_updated"],
            "summary": a["summary"],
            "content_length": a["content_length"],
        }
        for a in articles
    ]


@router.get("/{article_id}")
def get_knowledge_article(article_id: str):
    """Return a full knowledge base article."""
    articles = _get_kb()
    article_id_upper = article_id.upper()
    for a in articles:
        if a["id"] == article_id_upper:
            return a
    raise HTTPException(status_code=404, detail=f"Article {article_id} not found")
