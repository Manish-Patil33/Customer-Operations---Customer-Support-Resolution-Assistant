"""
RAG Embedder
Generates embeddings using Gemini embedding model (text-embedding-004).
Includes local deterministic fallback embedding generator when GEMINI_API_KEY is not set,
ensuring offline vector search and seamless clean-clone startup.
"""
import os
import re
import math
import time
import hashlib
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "gemini-embedding-001"  # Supported Gemini embedding model
BATCH_SIZE = 20
EMBEDDING_DIM = 3072


def _get_client(api_key: Optional[str] = None):
    """Get a configured Gemini client."""
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=key)
    except Exception as e:
        logger.warning(f"Could not initialize Gemini client: {e}")
        return None


def _fallback_text_embedding(text: str, dim: int = EMBEDDING_DIM) -> List[float]:
    """
    Generate a deterministic fallback vector embedding for offline/keyless local search.
    Uses n-gram and word hashing to produce meaningful vector representations for FAISS similarity.
    """
    vec = [0.0] * dim
    words = re.findall(r'\w+', text.lower())
    for word in words:
        h1 = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16) % dim
        h2 = int(hashlib.sha256(word.encode('utf-8')).hexdigest(), 16) % dim
        vec[h1] += 1.0
        vec[h2] += 0.5

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


def get_embedding(text: str, api_key: Optional[str] = None) -> List[float]:
    """
    Get embedding for a single text using Gemini API, with fallback to local vector generator.
    """
    client = _get_client(api_key)
    if client:
        try:
            result = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text,
            )
            return result.embeddings[0].values
        except Exception as e:
            logger.warning(f"Gemini API embedding call failed: {e}. Using fallback vector.")
    
    return _fallback_text_embedding(text)


def get_query_embedding(text: str, api_key: Optional[str] = None) -> List[float]:
    """
    Get embedding for a query text.
    """
    return get_embedding(text, api_key=api_key)


def embed_chunks(chunks: List[dict], api_key: Optional[str] = None) -> List[dict]:
    """
    Embed all chunks in batches using Gemini API or fallback vector generator.
    Returns chunks with 'embedding' field added.
    """
    client = _get_client(api_key)
    embedded_chunks = []

    if client:
        logger.info("Generating embeddings via Gemini API...")
        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i : i + BATCH_SIZE]
            for chunk in batch:
                try:
                    result = client.models.embed_content(
                        model=EMBEDDING_MODEL,
                        contents=chunk["text"],
                    )
                    c_copy = dict(chunk)
                    c_copy["embedding"] = result.embeddings[0].values
                    embedded_chunks.append(c_copy)
                except Exception as e:
                    logger.warning(f"Gemini embedding failed for chunk {chunk['chunk_id']}: {e}. Falling back.")
                    c_copy = dict(chunk)
                    c_copy["embedding"] = _fallback_text_embedding(chunk["text"])
                    embedded_chunks.append(c_copy)
                time.sleep(0.1)
    else:
        logger.info("GEMINI_API_KEY not set — generating deterministic local vector embeddings for FAISS...")
        for chunk in chunks:
            c_copy = dict(chunk)
            c_copy["embedding"] = _fallback_text_embedding(chunk["text"])
            embedded_chunks.append(c_copy)

    logger.info(f"Successfully embedded {len(embedded_chunks)}/{len(chunks)} chunks")
    return embedded_chunks
