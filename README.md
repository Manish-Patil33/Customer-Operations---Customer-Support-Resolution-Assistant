TRACK_ID=PS04

# ResolveIQ — AI Support Resolution Workbench

> **NexusTiQ 24 Hackathon | Track PS04 — Customer Operations: Customer Support Resolution Assistant**

---

## Problem

Customer support operations in broadband and mobile telecommunication providers face three critical bottlenecks:
1. **Context Loss & Repetition**: Customers are repeatedly transferred and forced to restate their issue, leading to low CSAT.
2. **AI Hallucination Risk**: Unconstrained LLMs invent non-existent policies, refund amounts, or technical procedures when knowledge is missing.
3. **Unprepared Escalations**: When routine AI fails or encounters complex edge cases, handoffs to human agents are unstructured and lack context.

---

## Solution

**ResolveIQ** is an AI-powered **Customer Support Resolution Operating System** (Workbench) designed for broadband and mobile providers. It operates across **THREE authoritative sources**:
1. **Live Customer Conversation**
2. **Customer Account Record** (Plan, Billing Status, Ticket History, Service Status)
3. **Local Knowledge Base** (Support Articles & Policy Documents)

ResolveIQ automates routine resolutions with grounded citations, asks targeted questions when data is missing, and generates agent-ready handoffs with complete context when human review is required.

---

## Key Features

- **Tri-Source Context Fusion**: Synthesizes customer record, chat transcript, and support articles into unified case context.
- **Deterministic Business Rule Guardrails**: Python validation layer overrides LLM decisions on zero knowledge coverage, contradictions, or unverified account claims.
- **Traceable Grounding & Citations**: Every proposed resolution cites exact source documents (`KB-001` to `KB-015`) and relevance scores.
- **Contradiction Detection**: Flags conflicts between customer statements and account records (e.g. customer claiming 500 Mbps plan vs account record showing 200 Mbps).
- **Targeted Minimum Info Requests**: When data is missing, asks only the single required question rather than generic follow-ups.
- **Agent Handoff Package**: Generates structured escalation briefs detailing established facts, attempted steps, missing data, and reason for handoff.
- **Judge Mode Panel**: Interactive architecture visualization explaining the live pipeline step-by-step.

---

## Architecture

```
Customer Request + Account Data + Conversation History
                       ↓
         Out-of-Domain Safety Filter
                       ↓
   Local FAISS Vector Retrieval (Cosine Similarity)
                       ↓
          Top Relevant KB Chunks & Citations
                       ↓
          Gemini Structured Reasoning
                       ↓
     Deterministic Python Output Validation
                       ↓
      ┌────────────────┬────────────────┐
      ↓                ↓                ↓
   RESOLVE          ASK_INFO        ESCALATE
 (Draft + Citation) (Min Qs)    (Agent Handoff)
```

---

## AI / RAG Pipeline

| Stage | Implementation Details |
|-------|------------------------|
| **Knowledge Base** | 15 Markdown articles (`KB-001` to `KB-015`) |
| **Chunking** | Paragraph-aware section chunking with overlap (600 chars) |
| **Embeddings** | Gemini `text-embedding-004` + Local Vector Fallback generator |
| **Vector Store** | Local FAISS index (`rag_index/faiss_index.bin`) |
| **Similarity** | Cosine similarity via L2-normalized inner product |
| **Reasoning Engine** | Google Gemini 2.0 Flash (`gemini-2.0-flash`) |
| **Validation Layer** | Deterministic Pydantic schema & business rules (`output_validator.py`) |

---

## Grounding and Citations

Every resolution recommendation is strictly grounded in local KB articles and customer account records.
Example evidence output:
```json
{
  "source_id": "KB-001",
  "title": "Broadband Connectivity Troubleshooting",
  "snippet": "Router restart procedure: Unplug power for 30 seconds...",
  "relevance_score": 0.91
}
```
If no knowledge article covers the query (`knowledge_coverage = 0.0`), the system refuses to generate a resolution and forces an **ESCALATE** decision.

---

## Human-in-the-Loop

```
AI CAN:                          HUMAN DECIDES:
✓ Retrieve evidence              ✓ Complex edge cases
✓ Summarize conversation         ✓ Account contradictions
✓ Draft routine resolutions      ✓ Policy exceptions
✓ Identify missing info          ✓ Conflicting claims
✓ Prepare escalation handoffs    ✓ Final approval before sending
```

---

## Edge Case Handling

1. **Routine Case**: Resolved automatically with grounded citation.
2. **Missing Information**: System requests only the exact missing field (`ASK_INFORMATION`).
3. **Contradictions**: Flagged for human verification (`ESCALATE`).
4. **Out-of-Domain Request**: Knowledge gap identified; system escalates without hallucination (`ESCALATE`).
5. **Exhausted Troubleshooting**: Recognizes previously attempted steps and hands off to tier-2 support.
6. **Gemini API Failure**: Gracefully falls back to manual agent review view without crashing.

---

## Data and Documents

All synthetic data is locally stored in `data/`:
- `data/customers/`: 25 telecom customer account profiles
- `data/tickets/`: 25 support tickets with historical context
- `data/conversations/`: 8 multi-turn customer chat transcripts
- `data/knowledge/`: 15 markdown support policy and technical articles
- `data/demo_cases/`: 8 pre-configured hackathon demo scenarios

---

## Tech Stack

### Backend
- **Python 3.11+**
- **FastAPI** + **Uvicorn**
- **Google Gemini API** (`google-genai`)
- **FAISS** (Local vector search)
- **Pydantic v2**

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + Custom Dark Glassmorphic Design System
- **Framer Motion**
- **Lucide Icons**

---

## Project Structure

```
.
├── app.py                      # Single entry point — starts server on port 8000
├── requirements.txt            # Python dependencies
├── README.md                   # Hackathon judge documentation
├── DEMO_SCRIPT.md              # 2-3 minute presentation script
├── .env.example                # Environment variable template
├── .gitignore                  # Git exclusions
│
├── backend/                    # FastAPI backend
│   ├── api/                    # Route handlers (cases, customers, knowledge, etc.)
│   ├── models/                 # Pydantic schemas
│   ├── rag/                    # Loader, chunker, embedder, index, retriever
│   ├── services/               # AIService resolution engine
│   ├── validators/             # Output validator & business rules
│   └── utils/                  # Data loader & analytics compiler
│
├── data/                       # Local synthetic data & knowledge base
├── rag_index/                  # Precomputed local FAISS index (committed)
├── frontend/                   # React TypeScript frontend
│   └── dist/                   # Pre-built static assets (committed)
└── tests/                      # Pytest unit & integration test suite
```

---

## Environment Variable

| Variable | Description | Default / Required |
|----------|-------------|-------------------|
| `GEMINI_API_KEY` | Google Gemini API key | Optional for demo fallback, Required for live Gemini reasoning |

Set environment variable before running:
```powershell
$env:GEMINI_API_KEY="your_api_key_here"
```

---

## How to Run

### Single Command Startup (Fresh Clone)

```bash
pip install -r requirements.txt
python app.py
```

Open browser at: **[http://localhost:8000](http://localhost:8000)**

*No second terminal required. No `npm run dev` required. Frontend static files are pre-built in `frontend/dist/` and local FAISS index is precomputed in `rag_index/`.*

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health & RAG index status |
| `GET` | `/api/dashboard` | Dashboard KPI summary |
| `GET` | `/api/cases` | List demo cases |
| `GET` | `/api/cases/{id}` | Get case, conversation & customer context |
| `POST` | `/api/cases/{id}/analyze` | Execute AI resolution pipeline |
| `GET` | `/api/customers` | List customer records |
| `GET` | `/api/knowledge` | List knowledge base articles |
| `GET` | `/api/rag/health` | RAG vector engine diagnostic info |

---

## Demo Scenarios

1. `CASE-1001`: Router Troubleshooting (Routine -> **RESOLVE**)
2. `CASE-1002`: Billing Discrepancy (Missing Payment Date -> **ASK_INFORMATION**)
3. `CASE-1003`: Unauthorized Plan Upgrade (Contradiction -> **ESCALATE**)
4. `CASE-1004`: Weather Forecast Request (Out-of-Domain -> **ESCALATE**)
5. `CASE-1005`: Persistent Outage (Troubleshooting Exhausted -> **ESCALATE**)

---

## Performance

- **Startup Time**: ~1.2 seconds (Precomputed local FAISS index loaded instantly)
- **RAG Retrieval Time**: < 15 milliseconds
- **AI Analysis Response Time**: 1.5 - 3.2 seconds (Single Gemini reasoning call)
- **Memory Footprint**: < 120 MB RAM

---

## Demo Video

DEMO_VIDEO_LINK_HERE
