# SNNStudio — SNN Hyperparameter Tuning Website

## Stack
- **Frontend:** React + Vite + TypeScript → Vercel
- **Backend:** Modal.com serverless Python → HTTPS endpoint
- **SNN Library:** snnTorch (PyTorch-based)
- **Dataset:** MNIST only for v1
- **Streaming:** SSE (Server-Sent Events)
- **Charts:** Chart.js via react-chartjs-2

## Data Flow
```
User fills hyperparams
  → clicks Train
  → POST /train (Modal HTTPS endpoint) with JSON body
  → Modal container spins up, loads MNIST, builds SNN
  → streams SSE events per epoch { epoch, loss, acc }
  → frontend EventSource reads stream, appends to terminal
  → final event { done: true, test_accuracy, history }
  → Results panel shows accuracy badge + loss/acc charts
```

---

## Folder Structure
```
SNNStudio/
├── backend/
│   ├── modal_app.py          # Modal app, SNN model, training loop, SSE
│   └── requirements.txt      # snntorch, torch, torchvision, fastapi
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── HyperparamCard.tsx
│   │   │   ├── DatasetSelector.tsx
│   │   │   ├── TerminalOutput.tsx
│   │   │   └── ResultsPanel.tsx
│   │   ├── hooks/
│   │   │   └── useTraining.ts
│   │   └── types.ts           # HyperparamConfig, TrainingEvent interfaces
│   ├── .env                   # VITE_MODAL_URL=https://...modal.run/train
│   └── vite.config.ts
└── PLAN.md
```

---

## Phase 1 — Backend (`backend/modal_app.py`)

### Step 1 — Scaffold
- Create `backend/` directory
- `requirements.txt`: `snntorch`, `torch`, `torchvision`, `fastapi`

### Step 2 — Modal app setup
- Import `modal`, define `image` with pip installs
- Define `stub = modal.App("snnstudio")`
- Mount image with all dependencies

### Step 3 — SNN Model class
- `SNNModel(nn.Module)` using `snnTorch`
- Constructor accepts: `neurons` (list of ints for hidden layers), `vth` (threshold), `beta` (decay), `model_type` ("LIF" | "IF")
- Architecture: `Linear → LIF/IF → Linear → LIF/IF → Linear (output)`
- `forward(x, T)` runs T time steps, accumulates spike outputs, returns mean output over time

### Step 4 — Training endpoint
- `@modal.web_endpoint(method="POST")` exposing an HTTPS URL
- Accepts JSON body: `{ epochs, lr, batch_size, neurons, T, vth, beta, model_type, optimizer }`
- Returns `StreamingResponse` with `content_type="text/event-stream"`
- CORS headers: `Access-Control-Allow-Origin: *`

### Step 5 — SSE training loop
- Download MNIST via `torchvision.datasets.MNIST`
- Build `DataLoader` with given `batch_size`
- Instantiate `SNNModel`, chosen optimizer (Adam or SGD), `CrossEntropyLoss`
- Training loop:
  - Per epoch: iterate batches, forward pass, compute loss, backprop
  - After each epoch: `yield f"data: {json.dumps({epoch, loss, train_acc})}\n\n"`
- After all epochs: evaluate on test set
- Final yield: `data: {"done": true, "test_accuracy": X, "history": [...]}\n\n`

### Step 6 — CORS preflight handler
- Add OPTIONS route on the Modal endpoint so browsers don't block the POST

---

## Phase 2 — Frontend (`frontend/`)

### Step 7 — Scaffold
- `npm create vite@latest frontend -- --template react-ts`
- Install: `react-chartjs-2`, `chart.js`
- Create folder structure as above

### Step 8 — `types.ts`
- `HyperparamConfig` interface matching backend JSON body
- `TrainingEvent` type: `{ epoch?, loss?, acc?, done?, test_accuracy?, history? }`

### Step 9 — `HyperparamCard.tsx`
- 3×3 grid of cards, one per hyperparam
- Each card: label, tooltip with description, appropriate input control

| Param | Control | Default | Range |
|---|---|---|---|
| Epochs | Slider + number | 10 | 1–100 |
| Learning Rate | Number input | 0.001 | — |
| Batch Size | Slider | 64 | 16–256 |
| Neurons (layers) | Comma-separated text | "256,128" | — |
| Time Steps (T) | Slider | 25 | 5–100 |
| Threshold (Vth) | Slider | 1.0 | 0.1–2.0 |
| Decay (Beta) | Slider | 0.9 | 0.1–0.99 |
| Neuron Model | Select | LIF | LIF / IF |
| Optimizer | Select | Adam | Adam / SGD |

### Step 10 — `DatasetSelector.tsx`
- Row of preset dataset cards with icon
- MNIST: active and selectable
- Fashion-MNIST, CIFAR-10: visible but disabled with "Coming Soon" badge
- Selected dataset highlighted with a colored border

### Step 11 — `useTraining.ts` hook
- State: `logs: string[]`, `isTraining: boolean`, `result: TrainingEvent | null`, `error: string | null`
- `startTraining(config: HyperparamConfig, dataset: string)`:
  - POST to `VITE_MODAL_URL` with config + dataset as JSON
  - Open `EventSource` on the response stream
  - On each SSE message: parse JSON, append formatted line to `logs`
  - On final `done` event: set `result`, set `isTraining = false`
  - On error: set `error` string

### Step 12 — `TerminalOutput.tsx`
- Fixed-height scrollable `<div>`, monospace font
- Dark background `#0d0d0d`, green text `#00ff41`
- Auto-scrolls to bottom on every new log line
- Blinking cursor shown when `isTraining === true`
- Line format: `[Epoch 3/10]  Loss: 0.4231  Acc: 87.3%`
- Shows `Starting container...` on first connect before first epoch arrives

### Step 13 — `ResultsPanel.tsx`
- Only rendered after `result.done === true`
- Large accuracy badge: e.g. `Test Accuracy: 92.4%`
- Two Chart.js line charts side by side:
  - Loss over epochs
  - Accuracy over epochs
- "Train Again" button resets all state

### Step 14 — `App.tsx` layout (top to bottom)
1. Header — "SNNStudio" wordmark + short tagline
2. `DatasetSelector` — choose dataset
3. `HyperparamCard` grid — configure all 9 params
4. "Train" button — disabled + spinner while `isTraining === true`
5. `TerminalOutput` — always visible, empty until training starts
6. `ResultsPanel` — conditionally rendered on completion

---

## Phase 3 — Integration & Deployment

### Step 15 — Environment config
- `frontend/.env`: `VITE_MODAL_URL=https://<your-modal-username>--snnstudio-train.modal.run`
- `frontend/.env.example`: same with placeholder value (safe to commit)

### Step 16 — Deploy backend
```bash
cd backend
modal deploy modal_app.py
```
- Copy the endpoint URL from Modal dashboard output
- Smoke test:
  ```bash
  curl -X POST <url> \
    -H "Content-Type: application/json" \
    -d '{"epochs":2,"lr":0.001,"batch_size":64,"neurons":[256,128],"T":25,"vth":1.0,"beta":0.9,"model_type":"LIF","optimizer":"Adam"}'
  ```
- Confirm SSE epoch lines appear in terminal

### Step 17 — Deploy frontend
- Connect GitHub repo to Vercel
- Set `VITE_MODAL_URL` environment variable in Vercel project settings
- Push to `main` → auto-deploy triggers

---

## Verification Checklist
- [ ] `modal serve modal_app.py` + curl POST → SSE epoch stream appears
- [ ] Local frontend + Train button → terminal fills with live epoch logs
- [ ] Training completes → accuracy badge and charts render
- [ ] "Train Again" resets terminal and results
- [ ] Public Vercel URL → full end-to-end flow works
- [ ] Edge cases: LR = 0, 1 epoch, max batch size, both neuron models, both optimizers

---

## Decisions & Exclusions
- **No Google Colab** — no external trigger API exists; Modal is the clean replacement
- **MNIST only for v1** — dataset selector shows others as disabled placeholders
- **SSE over WebSocket** — simpler, stateless, no extra server on frontend side
- **No auth** — public site, no login required
- **No GPU on Modal free tier** — CPU training on MNIST is ~2–5 min for 10 epochs
- **No model saving/downloading in v1** — only accuracy and loss curves shown

---

## Potential Issues to Watch
1. **Modal cold start** — first invocation ~15–30s to spin up container; show `Starting container...` in terminal until first epoch event arrives
2. **Modal 300s timeout** — free tier per-invocation limit; cap epochs at ~20 or display a warning when user sets epochs > 20
3. **CORS** — Modal endpoint must explicitly return `Access-Control-Allow-Origin: *` on every response including errors
4. **SSE + EventSource** — browser `EventSource` does not support POST natively; use `fetch` with `ReadableStream` instead, or use a library like `@microsoft/fetch-event-source`
