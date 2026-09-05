import pytest
from backend.rag.loader import load_knowledge_documents
from backend.rag.chunker import chunk_documents
from backend.rag.index import load_index, index_exists
from backend.rag.retriever import RAGRetriever


def test_rag_document_loader():
    docs = load_knowledge_documents("data/knowledge")
    assert len(docs) == 15
    titles = [d["title"] for d in docs]
    assert any("Broadband" in t for t in titles)


def test_rag_chunker():
    docs = load_knowledge_documents("data/knowledge")
    chunks = chunk_documents(docs)
    assert len(chunks) > 0
    first_chunk = chunks[0]
    assert "chunk_id" in first_chunk
    assert "source_id" in first_chunk
    assert "text" in first_chunk


def test_rag_retrieval_and_citation():
    assert index_exists() is True
    result = load_index()
    assert result is not None
    faiss_index, chunks_meta = result

    retriever = RAGRetriever(faiss_index, chunks_meta)
    # Pass api_key="" to ensure offline test execution using fallback local embedding
    query_results = retriever.retrieve("router blinking amber light", top_k=3, threshold=0.01, api_key="")
    
    assert len(query_results) > 0
    top_match = query_results[0]
    assert "source_id" in top_match
    assert "relevance_score" in top_match
