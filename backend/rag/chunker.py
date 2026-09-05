"""
RAG Document Chunker
Splits knowledge documents into overlapping chunks for embedding.
"""
from typing import List, Dict, Any
import re


CHUNK_SIZE = 600      # characters per chunk
CHUNK_OVERLAP = 100   # overlap between chunks


def chunk_documents(documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Chunk all documents into overlapping segments.
    Each chunk retains source document metadata.
    """
    all_chunks = []
    for doc in documents:
        chunks = chunk_document(doc)
        all_chunks.extend(chunks)
    return all_chunks


def chunk_document(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Chunk a single document.
    Tries to split at paragraph boundaries, then falls back to character-based chunking.
    """
    content = doc["content"]
    # Split by section headers or double newlines for paragraph-aware chunking
    sections = _split_by_sections(content)

    chunks = []
    chunk_index = 0
    buffer = ""

    for section in sections:
        # If adding this section keeps us under CHUNK_SIZE, add it
        if len(buffer) + len(section) <= CHUNK_SIZE:
            buffer += section + "\n\n"
        else:
            # Save current buffer as a chunk if it has content
            if buffer.strip():
                chunks.append(_make_chunk(doc, buffer.strip(), chunk_index))
                chunk_index += 1
                # Start new buffer with overlap from end of previous buffer
                overlap_text = buffer[-CHUNK_OVERLAP:] if len(buffer) > CHUNK_OVERLAP else buffer
                buffer = overlap_text + section + "\n\n"
            else:
                # Section itself is too large - split it by character
                sub_chunks = _split_large_section(section, CHUNK_SIZE, CHUNK_OVERLAP)
                for sc in sub_chunks:
                    chunks.append(_make_chunk(doc, sc, chunk_index))
                    chunk_index += 1
                buffer = ""

    # Add remaining buffer
    if buffer.strip():
        chunks.append(_make_chunk(doc, buffer.strip(), chunk_index))

    return chunks


def _split_by_sections(content: str) -> List[str]:
    """Split content at markdown section headers (##, ###)."""
    # Keep the header with its content
    parts = re.split(r'(?=\n## |\n### )', content)
    return [p.strip() for p in parts if p.strip()]


def _split_large_section(text: str, size: int, overlap: int) -> List[str]:
    """Character-based chunking with overlap for sections that exceed CHUNK_SIZE."""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append(text[start:end])
        start = end - overlap if end < len(text) else end
    return chunks


def _make_chunk(doc: Dict[str, Any], text: str, index: int) -> Dict[str, Any]:
    """Build a chunk dict with full source metadata."""
    return {
        "chunk_id": f"{doc['id']}_chunk_{index}",
        "source_id": doc["id"],
        "source_title": doc["title"],
        "source_category": doc["category"],
        "chunk_index": index,
        "text": text,
        "text_length": len(text),
    }
