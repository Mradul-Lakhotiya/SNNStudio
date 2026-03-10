# SNNStudio — Implementation Presentation
> 5-minute section | 5 slides

---

## Slide 1 — Backend: Architecture
### "How the SNN is trained in the cloud"

- Built on **Modal.com** — serverless Python platform, spins up a container on-demand per request
- Each training run gets its own isolated **NVIDIA T4 GPU** container — warm start is ~6ms
- The entire backend is a **single Python file** (`modal_app.py`) — one command to deploy, one HTTPS URL to call
- Uses **snnTorch** (PyTorch-based) — the most mature SNN research library, supports LIF and IF neuron models
- SNN architecture: `784 inputs → [hidden layers] → 10 outputs`, runs for **T time steps** per sample
  - Information is encoded in **spike timing**, not continuous values — this is what makes it an SNN
- All 9 hyperparameters are accepted as a JSON body — fully configurable per request

---

## Slide 2 — Backend: Live Streaming
### "How training output reaches the browser in real time"

- Instead of waiting for training to finish, the backend uses **Server-Sent Events (SSE)** — a one-way HTTP stream
- After **each epoch**, the server immediately pushes:
  ```json
  { "epoch": 3, "total_epochs": 10, "loss": 0.4231, "acc": 87.3 }
  ```
- Final message sends:
  ```json
  { "done": true, "test_accuracy": 94.4, "history": [...] }
  ```
- This avoids HTTP timeouts, gives live feedback, and needs no WebSocket or persistent connection
- Modal handles CORS automatically — no extra server configuration needed

---

## Slide 3 — Frontend: UI & Components
### "What the user interacts with"

- Built with **React + Vite + TypeScript** — fast, type-safe, production-ready
- **Dataset Selector** — preset cards (MNIST active, Fashion-MNIST / CIFAR-10 as "Coming Soon") — extensible by design
- **HyperparamCard grid** — 9 interactive cards, each with:
  - Labeled control (slider / number input / dropdown)
  - Tooltip explaining what the parameter does
- **Train button** — shows a spinner and disables during training, prevents double-submission
- **Terminal component** — dark background, green monospace text, auto-scrolls, blinking cursor while training
- **ResultsPanel** — animated fade-in after training completes:
  - Test accuracy badge (large, prominent)
  - Two Chart.js line charts: **Loss over epochs** + **Accuracy over epochs**

---

## Slide 4 — Frontend: Data Flow
### "How the browser talks to the backend"

- Uses `@microsoft/fetch-event-source` — enables **POST-based SSE** (native `EventSource` only supports GET)
- `useTraining` custom React hook manages all state:
  - `logs` — array of terminal lines
  - `isTraining` — controls spinner and disabled states
  - `result` — final accuracy + history for charts
  - `error` — shown in an error banner if something goes wrong
- **Full request flow:**
  ```
  POST config JSON → open SSE stream → parse each event
      → append to terminal → on done: render results panel
  ```
- `Starting container...` shown immediately on first connect — prevents the user thinking it's broken during cold start
- UI shows a warning if `epochs > 20` — Modal free tier has a 300s per-invocation timeout

---

## Slide 5 — Future Plans: Self-Hosted with Docker
### "Making it run on any machine, anywhere"

**Current state:**
- Frontend on **Vercel** (static hosting)
- Backend on **Modal.com** (serverless GPU)
- Both are cloud-dependent — require internet + third-party accounts

**Goal:** Package everything into Docker so the full app runs on a single machine

**Plan:**
- `backend/Dockerfile` — Python 3.11 + snnTorch + FastAPI as a standalone server
- `frontend/Dockerfile` — Vite production build served via Nginx
- `docker-compose.yml` — `docker compose up` starts both services together
- GPU passthrough via `nvidia-container-toolkit` for local GPU training
- Modal endpoint URL simply becomes `http://localhost:8000`

**Benefit:**
- No internet dependency
- No vendor lock-in
- Works in air-gapped environments (university labs, private servers)
- Deployable on any Linux machine with an NVIDIA GPU

---

## Timing Guide

| Slide | Topic | Time |
|---|---|---|
| 1 | Backend: Architecture | ~1 min |
| 2 | Backend: Live Streaming | ~1 min |
| 3 | Frontend: UI & Components | ~1 min |
| 4 | Frontend: Data Flow | ~1 min |
| 5 | Future Plans: Docker | ~1 min |
| **Total** | | **~5 min** |
