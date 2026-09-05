"""
RAG Vector Index
Builds, saves, and loads a FAISS vector index for knowledge chunks.
Precomputed index is stored in rag_index/ for fast startup.
"""
import os
import json
import pickle
import logging
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

INDEX_DIR = Path("rag_index")
INDEX_FILE = INDEX_DIR / "faiss_index.bin"
CHUNKS_FILE = INDEX_DIR / "chunks_metadata.pkl"
STATS_FILE = INDEX_DIR / "index_stats.json"


def build_and_save_index(embedded_chunks: List[Dict[str, Any]]) -> bool:
    """
    Build FAISS index from embedded chunks and save to disk.
    Returns True on success.
    """
    try:
        import faiss

        if not embedded_chunks:
            logger.error("No embedded chunks to index")
            return False

        embeddings = [c["embedding"] for c in embedded_chunks]
        dimension = len(embeddings[0])
        vectors = np.array(embeddings, dtype=np.float32)

        # Normalize for cosine similarity
        faiss.normalize_L2(vectors)

        # Build index
        index = faiss.IndexFlatIP(dimension)  # Inner product = cosine after normalization
        index.add(vectors)

        # Save index
        INDEX_DIR.mkdir(exist_ok=True)
        faiss.write_index(index, str(INDEX_FILE))

        # Save chunk metadata (without embeddings to save space)
        chunks_meta = [{k: v for k, v in c.items() if k != "embedding"} for c in embedded_chunks]
        with open(CHUNKS_FILE, "wb") as f:
            pickle.dump(chunks_meta, f)

        # Save stats
        stats = {
            "num_chunks": len(embedded_chunks),
            "dimension": dimension,
            "num_documents": len(set(c["source_id"] for c in embedded_chunks)),
            "build_time": __import__("datetime").datetime.utcnow().isoformat(),
        }
        with open(STATS_FILE, "w") as f:
            json.dump(stats, f, indent=2)

        logger.info(f"Index built: {len(embedded_chunks)} chunks, dimension={dimension}")
        return True

    except Exception as e:
        logger.error(f"Failed to build index: {e}")
        return False


def load_index() -> Optional[tuple]:
    """
    Load FAISS index and chunk metadata from disk.
    Returns (faiss_index, chunks_metadata) or None if not available.
    """
    try:
        import faiss

        if not INDEX_FILE.exists() or not CHUNKS_FILE.exists():
            logger.warning("Index files not found")
            return None

        index = faiss.read_index(str(INDEX_FILE))

        with open(CHUNKS_FILE, "rb") as f:
            chunks_meta = pickle.load(f)

        logger.info(f"Index loaded: {index.ntotal} vectors, {len(chunks_meta)} chunks")
        return index, chunks_meta

    except Exception as e:
        logger.error(f"Failed to load index: {e}")
        return None


def get_index_stats() -> Dict[str, Any]:
    """Return index statistics."""
    if STATS_FILE.exists():
        with open(STATS_FILE) as f:
            return json.load(f)
    return {"num_chunks": 0, "num_documents": 0, "build_time": None}


def index_exists() -> bool:
    """Check if a precomputed index exists on disk."""
    return INDEX_FILE.exists() and CHUNKS_FILE.exists()
