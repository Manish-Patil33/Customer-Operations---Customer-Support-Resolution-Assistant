"""
Index Builder Script
Precomputes the RAG vector index from knowledge documents using Gemini embeddings or local vector embeddings.

Usage:
    python scripts/build_index.py
"""
import os
import sys
import logging

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("build_index")


def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY is not set. Building FAISS index using deterministic local embeddings...")
    else:
        logger.info("GEMINI_API_KEY detected. Building FAISS index using Gemini embeddings...")

    logger.info("ResolveIQ — RAG Index Builder")
    logger.info("=" * 50)

    # Step 1: Load documents
    from backend.rag.loader import load_knowledge_documents
    logger.info("Loading knowledge documents...")
    documents = load_knowledge_documents("data/knowledge")
    logger.info(f"Loaded {len(documents)} documents")

    if not documents:
        logger.error("No documents found in data/knowledge/")
        sys.exit(1)

    # Step 2: Chunk documents
    from backend.rag.chunker import chunk_documents
    logger.info("Chunking documents...")
    chunks = chunk_documents(documents)
    logger.info(f"Created {len(chunks)} chunks")

    # Step 3: Generate embeddings
    from backend.rag.embedder import embed_chunks
    logger.info("Generating embeddings...")
    embedded_chunks = embed_chunks(chunks, api_key=api_key)
    logger.info(f"Embedded {len(embedded_chunks)} chunks")

    if not embedded_chunks:
        logger.error("No embeddings generated.")
        sys.exit(1)

    # Step 4: Build FAISS index
    from backend.rag.index import build_and_save_index
    logger.info("Building FAISS index...")
    success = build_and_save_index(embedded_chunks)

    if success:
        logger.info("=" * 50)
        logger.info("✓ RAG index built successfully!")
        logger.info("  Index saved to: rag_index/")
        logger.info(f"  Chunks indexed: {len(embedded_chunks)}")
        logger.info(f"  Documents indexed: {len(documents)}")
        logger.info("  Run 'python app.py' to start the application.")
    else:
        logger.error("Index build failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
