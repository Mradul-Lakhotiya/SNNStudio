# SNNStudio

A web application for training **Spiking Neural Networks (SNNs)** directly from your browser. Configure hyperparameters, hit **Train**, and watch the model train live via a streaming terminal. Final accuracy and loss/accuracy curves are shown on completion.

![Architecture: React frontend → Modal.com GPU backend → SSE stream]

## How It Works

```
Browser (React + Vite)
  └─ User sets hyperparams → clicks Train
       └─ POST to Modal.com HTTPS endpoint
            └─ GPU container spins up
            └─ snnTorch SNN trains on MNIST
            └─ SSE stream → epoch logs appear in terminal
            └─ Final accuracy + charts shown
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | [Modal.com](https://modal.com) serverless Python (T4 GPU) |
| SNN Library | [snnTorch](https://snntorch.readthedocs.io) (PyTorch-based) |
| Streaming | Server-Sent Events (SSE) via `@microsoft/fetch-event-source` |
| Charts | Chart.js + react-chartjs-2 |
| Deployment | Vercel (frontend) + Modal (backend) |

## Hyperparameters

| Parameter | Description | Default |
|---|---|---|
| Epochs | Training passes over the dataset | 10 |
| Learning Rate | Optimizer step size | 0.001 |
| Batch Size | Samples per weight update | 64 |
| Hidden Layers | Neurons per layer (comma-separated) | 256, 128 |
| Time Steps (T) | Simulation time steps per input | 25 |
| Threshold (Vth) | Membrane voltage spike threshold | 1.0 |
| Decay (Beta) | Membrane potential decay rate (LIF only) | 0.9 |
| Neuron Model | LIF (Leaky Integrate-and-Fire) or IF | LIF |
| Optimizer | Adam or SGD | Adam |

## Project Structure

```
SNNStudio/
├── backend/
│   ├── modal_app.py        # Modal endpoint, SNN model, training loop, SSE
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.tsx                         # Main layout
│   │   ├── types.ts                        # TypeScript interfaces
│   │   ├── hooks/useTraining.ts            # SSE streaming hook
│   │   └── components/
│   │       ├── HyperparamCard.tsx/.css     # 3×3 param input grid
│   │       ├── DatasetSelector.tsx/.css    # Dataset preset cards
│   │       ├── TerminalOutput.tsx/.css     # Live training terminal
│   │       └── ResultsPanel.tsx/.css       # Accuracy badge + charts
│   ├── .env                                # VITE_MODAL_URL (not committed)
│   └── .env.example                        # Template for .env
└── PLAN.md                                 # Architecture decisions
```

---

## Setup & Running Locally

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Python](https://python.org) 3.10+
- A free [Modal.com](https://modal.com) account

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/Mradul-Lakhotiya/SNNStudio.git
cd SNNStudio
```

---

### Step 2 — Deploy the backend (Modal)

Install the Modal CLI and authenticate:

```bash
pip install modal
modal setup        # opens browser to log in — takes ~30 seconds
```

Install the local dependency needed to parse the app file, then deploy:

```bash
pip install fastapi
cd backend
modal deploy modal_app.py
```

After deployment you'll see output like:

```
✓ Created web function train => https://YOUR-USERNAME--snnstudio-train.modal.run
✓ App deployed in 3s!
```

Copy that URL — you'll need it in the next step.

> **GPU note:** The backend runs on an NVIDIA T4 GPU by default (`gpu="T4"`).
> To use a different GPU, edit `@app.function(gpu="T4")` in `modal_app.py`.
> Modal's free tier includes 200 compute hours/month.

---

### Step 3 — Configure the frontend

```bash
cd ../frontend
cp .env.example .env
```

Edit `.env` and paste your Modal URL:

```env
VITE_MODAL_URL=https://YOUR-USERNAME--snnstudio-train.modal.run
```

---

### Step 4 — Run the frontend

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deploying to Vercel (public hosting)

1. Push the repo to GitHub (already done if you cloned it).
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo.
3. Set the **Root Directory** to `frontend`.
4. Add an environment variable:
   - Key: `VITE_MODAL_URL`
   - Value: `https://YOUR-USERNAME--snnstudio-train.modal.run`
5. Click **Deploy**.

Every push to `main` will auto-redeploy the frontend.

---

## Re-deploying the backend after changes

```bash
cd backend
modal deploy modal_app.py
```

The URL stays the same — no need to update `.env` again.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `network error` in the UI | Check that `VITE_MODAL_URL` in `.env` is set correctly and the backend is deployed |
| `No such file or directory: modal_app.py` | You're in the wrong directory — run `modal deploy` from `backend/`, not `frontend/` |
| Modal cold start takes 15–30s | Normal on first request — the container has to spin up; subsequent runs are instant (warm start) |
| Training hangs after ~5 min | Modal free tier has a 300s timeout — reduce epochs (max ~20 is safe) |
| `too many values to unpack` | Outdated backend — redeploy with `modal deploy modal_app.py` |

---
