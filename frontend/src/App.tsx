import { useState, useCallback } from "react";
import type { HyperparamConfig } from "./types";
import { useTraining } from "./hooks/useTraining";
import HyperparamCard from "./components/HyperparamCard";
import DatasetSelector from "./components/DatasetSelector";
import TerminalOutput from "./components/TerminalOutput";
import ResultsPanel from "./components/ResultsPanel";
import "./App.css";

const DEFAULT_CONFIG: HyperparamConfig = {
  epochs: 10,
  lr: 0.001,
  batch_size: 64,
  neurons: [256, 128],
  T: 25,
  vth: 1.0,
  beta: 0.9,
  model_type: "LIF",
  optimizer: "Adam",
};

export default function App() {
  const [config, setConfig] = useState<HyperparamConfig>(DEFAULT_CONFIG);
  const [dataset, setDataset] = useState("MNIST");

  const { logs, isTraining, result, error, startTraining, reset } = useTraining();

  const handleParamChange = useCallback(
    (key: keyof HyperparamConfig, value: number | string | number[]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleTrain = () => {
    if (isTraining) return;
    startTraining(config, dataset);
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-snn">SNN</span>
          <span className="logo-studio">Studio</span>
        </div>
        <p className="app-tagline">
          Configure &amp; train a Spiking Neural Network in your browser
        </p>
      </header>

      <main className="app-main">
        {/* ── Dataset ── */}
        <DatasetSelector
          selected={dataset}
          onSelect={setDataset}
          disabled={isTraining}
        />

        {/* ── Hyperparameters ── */}
        <section className="section">
          <h2 className="section-title">Hyperparameters</h2>
          <HyperparamCard
            config={config}
            onChange={handleParamChange}
            disabled={isTraining}
          />
        </section>

        {/* ── Epoch warning ── */}
        {config.epochs > 20 && (
          <p className="epoch-warning">
            ⚠️ Epochs capped at 20 on Modal free tier (300s timeout limit).
          </p>
        )}

        {/* ── Train button ── */}
        <div className="train-row">
          <button
            className={`train-btn ${isTraining ? "train-btn--loading" : ""}`}
            onClick={handleTrain}
            disabled={isTraining}
          >
            {isTraining ? (
              <>
                <span className="spinner" />
                Training...
              </>
            ) : (
              "▶  Train Model"
            )}
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="error-banner">
            ❌ Error: {error}
            <button className="error-dismiss" onClick={reset}>Dismiss</button>
          </div>
        )}

        {/* ── Terminal ── */}
        <section className="section">
          <h2 className="section-title">Training Output</h2>
          <TerminalOutput logs={logs} isTraining={isTraining} />
        </section>

        {/* ── Results ── */}
        {result && <ResultsPanel result={result} onReset={reset} />}
      </main>

      <footer className="app-footer">
        Built with{" "}
        <a href="https://snntorch.readthedocs.io" target="_blank" rel="noreferrer">
          snnTorch
        </a>{" "}
        &amp;{" "}
        <a href="https://modal.com" target="_blank" rel="noreferrer">
          Modal
        </a>
      </footer>
    </div>
  );
}
