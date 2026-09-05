"""
RAG Retriever
Retrieves the most relevant knowledge chunks for a given query.
Uses FAISS for vector similarity search + score filtering.
"""
import logging
import numpy as np
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

RELEVANCE_THRESHOLD = 0.50  # Minimum similarity score to consider a chunk relevant
TOP_K = 5                    # Return top K results


class RAGRetriever:
    """Retrieves relevant knowledge chunks using FAISS vector search."""

    def __init__(self, faiss_index, chunks_metadata: List[Dict]):
        self.index = faiss_index
        self.chunks = chunks_metadata
        self._available = True

    def retrieve(
        self,
        query: str,
        top_k: int = TOP_K,
        threshold: float = RELEVANCE_THRESHOLD,
        api_key: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve top-k most relevant chunks for the query.
        Returns list of chunks with relevance scores, filtered by threshold.
        """
        if not self._available:
            return []

        try:
            from backend.rag.embedder import get_query_embedding

            query_embedding = get_query_embedding(query, api_key)
            if query_embedding is None:
                logger.warning("Could not generate query embedding")
                return []

            return self._search(query_embedding, top_k, threshold)

        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            return []

    def _search(
        self,
        query_embedding: List[float],
        top_k: int,
        threshold: float
    ) -> List[Dict[str, Any]]:
        """Perform FAISS search with the given embedding."""
        import faiss

        query_vector = np.array([query_embedding], dtype=np.float32)
        faiss.normalize_L2(query_vector)

        scores, indices = self.index.search(query_vector, min(top_k * 2, self.index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            similarity = float(score)
            if similarity < threshold:
                continue

            chunk = dict(self.chunks[idx])
            chunk["relevance_score"] = round(similarity, 4)
            results.append(chunk)

            if len(results) >= top_k:
                break

        return results

    def retrieve_multi_query(
        self,
        queries: List[str],
        top_k: int = TOP_K,
        threshold: float = RELEVANCE_THRESHOLD,
        api_key: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve chunks for multiple queries, deduplicate, and sort by relevance.
        Useful for cases with multiple intents.
        """
        seen_chunk_ids = set()
        all_results = []

        for query in queries:
            results = self.retrieve(query, top_k, threshold, api_key)
            for r in results:
                if r["chunk_id"] not in seen_chunk_ids:
                    seen_chunk_ids.add(r["chunk_id"])
                    all_results.append(r)

        # Sort by relevance score descending
        all_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return all_results[:top_k]
