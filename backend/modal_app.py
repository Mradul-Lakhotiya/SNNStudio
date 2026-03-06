import json
import modal
from fastapi import Request
from fastapi.responses import StreamingResponse

# ---------------------------------------------------------------------------
# Modal image — all Python deps baked in
# ---------------------------------------------------------------------------
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "torch",
    "torchvision",
    "snntorch",
    "fastapi",
)

app = modal.App("snnstudio", image=image)

# ---------------------------------------------------------------------------
# SNN Model
# ---------------------------------------------------------------------------
def build_model(neurons: list[int], vth: float, beta: float, model_type: str):
    """Build and return an SNNModel instance."""
    import torch.nn as nn
    import snntorch as snn

    class SNNModel(nn.Module):
        def __init__(self):
            super().__init__()
            layer_sizes = [784] + neurons + [10]
            self.linears = nn.ModuleList(
                [nn.Linear(layer_sizes[i], layer_sizes[i + 1]) for i in range(len(layer_sizes) - 1)]
            )
            NeuronClass = snn.Leaky if model_type == "LIF" else snn.Leaky  # IF ≈ Leaky with beta=0
            actual_beta = beta if model_type == "LIF" else 0.0
            self.neurons = nn.ModuleList(
                [NeuronClass(beta=actual_beta, threshold=vth, init_hidden=True)
                 for _ in range(len(layer_sizes) - 1)]
            )

        def forward(self, x, T: int):
            # Reset hidden states
            for n in self.neurons:
                n.reset_hidden()

            # x: [batch, 784]
            spike_accum = None
            for _ in range(T):
                out = x
                for i, (lin, neu) in enumerate(zip(self.linears, self.neurons)):
                    out = lin(out)
                    out = neu(out)  # init_hidden=True → returns spk directly (no tuple)
                spike_accum = out if spike_accum is None else spike_accum + out

            return spike_accum / T  # mean firing rate as logits

    return SNNModel()


# ---------------------------------------------------------------------------
# Training generator (yields SSE strings)
# ---------------------------------------------------------------------------
def train_generator(config: dict):
    import torch
    import torch.nn as nn
    from torchvision import datasets, transforms
    from torch.utils.data import DataLoader

    epochs     = int(config.get("epochs", 10))
    lr         = float(config.get("lr", 1e-3))
    batch_size = int(config.get("batch_size", 64))
    neurons    = [int(n) for n in config.get("neurons", [256, 128])]
    T          = int(config.get("T", 25))
    vth        = float(config.get("vth", 1.0))
    beta       = float(config.get("beta", 0.9))
    model_type = str(config.get("model_type", "LIF"))
    optimizer_name = str(config.get("optimizer", "Adam"))

    # Clamp epochs to avoid Modal timeout (300s limit)
    epochs = min(epochs, 20)

    yield f"data: {json.dumps({'log': 'Loading MNIST dataset...'})}\n\n"

    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,)),
    ])
    train_ds = datasets.MNIST("/tmp/data", train=True,  download=True, transform=transform)
    test_ds  = datasets.MNIST("/tmp/data", train=False, download=True, transform=transform)
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    test_loader  = DataLoader(test_ds,  batch_size=256,        shuffle=False)

    yield f"data: {json.dumps({'log': f'Dataset ready. Building SNN ({model_type}, layers={[784]+neurons+[10]})...'})}\n\n"

    model = build_model(neurons, vth, beta, model_type)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    if optimizer_name == "Adam":
        opt = torch.optim.Adam(model.parameters(), lr=lr)
    else:
        opt = torch.optim.SGD(model.parameters(), lr=lr, momentum=0.9)

    criterion = nn.CrossEntropyLoss()
    history = []

    yield f"data: {json.dumps({'log': f'Device: {str(device).upper()}  |  Starting training: {epochs} epoch(s), lr={lr}, batch={batch_size}, T={T}'})}\n\n"

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for imgs, labels in train_loader:
            imgs   = imgs.view(imgs.size(0), -1).to(device)
            labels = labels.to(device)

            opt.zero_grad()
            output = model(imgs, T)
            loss = criterion(output, labels)
            loss.backward()
            opt.step()

            total_loss += loss.item() * labels.size(0)
            preds = output.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

        train_acc = correct / total * 100
        avg_loss  = total_loss / total
        history.append({"epoch": epoch, "loss": round(avg_loss, 4), "acc": round(train_acc, 2)})

        yield f"data: {json.dumps({'epoch': epoch, 'total_epochs': epochs, 'loss': round(avg_loss, 4), 'acc': round(train_acc, 2)})}\n\n"

    # ── Test evaluation ──────────────────────────────────────────────────────
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for imgs, labels in test_loader:
            imgs = imgs.view(imgs.size(0), -1).to(device)
            labels = labels.to(device)
            output = model(imgs, T)
            preds = output.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

    test_acc = correct / total * 100
    yield f"data: {json.dumps({'done': True, 'test_accuracy': round(test_acc, 2), 'history': history})}\n\n"


# ---------------------------------------------------------------------------
# Modal web endpoint
# ---------------------------------------------------------------------------
@app.function(gpu="T4")
@modal.fastapi_endpoint(method="POST", docs=True)
async def train(request: Request):
    # Handle CORS preflight
    if request.method == "OPTIONS":
        from fastapi.responses import Response
        return Response(
            status_code=204,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        )

    config = await request.json()

    def generator():
        yield f"data: {json.dumps({'log': 'Container ready. Initializing...'})}\n\n"
        yield from train_generator(config)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
