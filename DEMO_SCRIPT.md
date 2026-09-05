# ResolveIQ — Hackathon Presentation & Video Demo Script

> **Track PS04 — Customer Operations: Customer Support Resolution Assistant**
> **Target Video Duration:** 2–3 minutes

---

## 🎬 Video Recording Walkthrough

### 0:00 – 0:25 | Introduction & Problem Context
- **Screen:** ResolveIQ Dashboard ([http://localhost:8000](http://localhost:8000))
- **Speaker:** 
  > *"Welcome to ResolveIQ — an AI-powered Customer Support Resolution Workbench built for broadband and mobile service providers. Support agents face context loss, hallucination risk, and slow escalations. ResolveIQ is not a chatbot; it is a grounded resolution operating system that unifies 3 data sources: customer account records, live customer conversations, and official support knowledge documents."*
- **Action:** Highlight the KPI metrics (Open Cases, AI Ready, Knowledge Coverage, Escalations) and point to the **AI vs Human Boundary Control** card.

---

### 0:25 – 1:05 | Demo Scenario 1: Routine Case (Grounding & Citation)
- **Screen:** Case Workspace (`CASE-1001` — Nandini Bhat, Router Troubleshooting)
- **Speaker:**
  > *"Let's examine Case 1001. Customer Nandini Bhat has a blinking amber light on her FiberMax 200 router. On the left is her live chat history; on the right is her complete Customer 360 profile. We click 'Analyze Case'."*
- **Action:** Click **Analyze Case**.
- **Speaker:**
  > *"ResolveIQ queries our local FAISS vector index, retrieves KB-001 ('Router Restart Procedure'), verifies her active account status, and produces a grounded resolution draft with exact traceable citations and 94% knowledge coverage. The agent can review, edit, and click 'Approve & Send'."*

---

### 1:05 – 1:45 | Demo Scenario 2: Contradiction Detection & Human Handoff
- **Screen:** Case Workspace (`CASE-1003` — Ananya Das, Unauthorized Plan Upgrade)
- **Speaker:**
  > *"Now let's look at a difficult edge case — Case 1003. The customer claims they signed up for a 500 Mbps plan, but their account record shows FiberMax 200. Instead of guessing or choosing randomly, ResolveIQ's deterministic rule engine detects the source contradiction."*
- **Action:** Click **Analyze Case**.
- **Speaker:**
  > *"Notice how the system automatically downgrades the decision to ESCALATE, highlights 'CONTRADICTION DETECTED', and generates a complete, agent-ready handoff summary so the human supervisor doesn't need to re-read the entire chat thread."*

---

### 1:45 – 2:15 | Demo Scenario 3: Knowledge Gap & Out-of-Domain Safety
- **Screen:** Case Workspace (`CASE-1004` — Vikram Singh, Out-of-Domain Request)
- **Speaker:**
  > *"What happens when a customer asks something completely outside telecom support — like a weather forecast in Case 1004? Rather than hallucinating from general world knowledge, ResolveIQ flags a 0% Knowledge Coverage gap and immediately escalates with zero policy invention."*

---

### 2:15 – 2:45 | Judge Mode & Architecture Overview
- **Screen:** Toggle **Judge Mode** on sidebar.
- **Speaker:**
  > *"By enabling Judge Mode, evaluators can inspect every stage of our architecture: 1) Tri-Source Input, 2) Local FAISS Retrieval, 3) Gemini Reasoning, 4) Deterministic Python Business Rules, and 5) Validated Output. The entire application runs from a fresh clone with a single command: `python app.py`."*

---

### 2:45 – 3:00 | Conclusion
- **Speaker:**
  > *"ResolveIQ eliminates agent guesswork, prevents AI hallucination, and speeds up customer resolution while keeping humans strictly in control. Thank you!"*
