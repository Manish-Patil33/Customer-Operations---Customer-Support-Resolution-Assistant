"""
app.py — ResolveIQ Entry Point
TRACK_ID=PS04

Single-command startup:
    python app.py

Starts FastAPI backend + serves pre-built React frontend on http://localhost:8000
"""
import os
import sys
import logging
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Load local .env file if present
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("resolveiq")

# ─── Validate API Key ──────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning(
        "GEMINI_API_KEY is not set. AI analysis will be in fallback mode. "
        "Set the key with: $env:GEMINI_API_KEY='your_key_here' (Windows) or "
        "export GEMINI_API_KEY='your_key_here' (Linux/macOS)"
    )

# ─── FastAPI application ──────────────────────────────────────────────────────
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="ResolveIQ — AI Support Resolution Workbench",
    description="Customer Operations Intelligence Platform for Broadband & Mobile Providers",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes at top-level
from backend.api import cases, customers, knowledge, analytics, escalations, rag_health
app.include_router(cases.router)
app.include_router(customers.router)
app.include_router(knowledge.router)
app.include_router(analytics.router)
app.include_router(escalations.router)
app.include_router(rag_health.router)

# Module-level service references (used by route handlers)
ai_service = None
retriever = None


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    from backend.rag.index import index_exists, get_index_stats
    stats = get_index_stats()
    return {
        "status": "healthy",
        "service": "ResolveIQ",
        "version": "1.0.0",
        "ai_available": ai_service.is_available if ai_service else False,
        "rag_index_loaded": retriever is not None,
        "index_chunks": stats.get("num_chunks", 0),
    }


@app.get("/api/dashboard")
async def dashboard():
    """Dashboard summary."""
    from backend.utils.data_loader import get_all_demo_cases, get_all_customers
    cases = get_all_demo_cases()
    customers = get_all_customers()

    ai_ready = sum(1 for c in cases if c.get("expected_decision") == "RESOLVE")
    escalate = sum(1 for c in cases if c.get("expected_decision") == "ESCALATE")
    ask_info = sum(1 for c in cases if c.get("expected_decision") == "ASK_INFORMATION")

    return {
        "greeting": "Good afternoon, Agent",
        "subtitle": "Here's what needs your attention.",
        "kpis": {
            "open_cases": 128,
            "ai_ready": 74,
            "needs_information": 21,
            "escalations": 13,
            "knowledge_coverage_pct": 92,
        },
        "demo_case_summary": {
            "total": len(cases),
            "ai_ready": ai_ready,
            "needs_info": ask_info,
            "escalate": escalate,
        },
        "is_demo_data": True,
    }


def _startup_load_data():
    """Load synthetic data into memory."""
    from backend.utils.data_loader import load_all_data
    load_all_data("data")
    logger.info("✓ Synthetic data loaded")


def _startup_init_rag():
    """Initialize the RAG pipeline. Load precomputed index if available."""
    global ai_service, retriever

    from backend.rag.index import load_index, index_exists
    from backend.rag.retriever import RAGRetriever
    from backend.services.ai_service import AIService

    if not index_exists():
        logger.info("No precomputed RAG index found. Auto-generating FAISS index...")
        try:
            from scripts.build_index import main as build_main
            build_main()
        except Exception as e:
            logger.warning(f"Auto index build error: {e}")

    if index_exists():
        result = load_index()
        if result:
            faiss_index, chunks_meta = result
            retriever = RAGRetriever(faiss_index, chunks_meta)
            logger.info(f"✓ RAG index loaded: {faiss_index.ntotal} vectors")
        else:
            logger.warning("Failed to load RAG index — retrieval disabled")

    ai_service = AIService(retriever=retriever, api_key=GEMINI_API_KEY)
    if ai_service.is_available:
        logger.info("✓ Gemini AI service initialized")
    else:
        logger.warning("Gemini AI unavailable — running in fallback mode")


def get_ai_service():
    """Get active AIService instance, initializing if needed."""
    global ai_service, retriever
    if ai_service is None:
        _startup_init_rag()
    return ai_service


def _startup_mount_frontend():
    """Mount the pre-built React frontend."""
    frontend_dist = Path("frontend/dist")
    if frontend_dist.exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

        @app.get("/{full_path:path}")
        async def serve_frontend(full_path: str):
            """Serve React SPA — all non-API routes return index.html."""
            index_file = frontend_dist / "index.html"
            if index_file.exists():
                return FileResponse(str(index_file))
            return JSONResponse({"error": "Frontend not built. Run the build script."}, status_code=404)

        logger.info("✓ Frontend served from frontend/dist")
    else:
        @app.get("/")
        async def root():
            return JSONResponse({
                "message": "ResolveIQ API is running. Frontend not built yet.",
                "api_docs": "http://localhost:8000/api/docs",
                "health": "http://localhost:8000/api/health",
            })

        logger.warning("frontend/dist not found — serving API only. Build frontend with: cd frontend && npm run build")


@app.on_event("startup")
async def startup_event():
    """FastAPI startup sequence."""
    _startup_load_data()
    _startup_init_rag()
    _startup_mount_frontend()

if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("  ResolveIQ — AI Support Resolution Workbench")
    logger.info("  TRACK_ID=PS04 | NexusTiQ 24 Hackathon")
    logger.info("=" * 60)

    # Run startup sequence
    asyncio.run(startup_event())

    logger.info("✓ Application ready at http://localhost:8000")
    logger.info("  API Docs: http://localhost:8000/api/docs")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=False,
    )
