import type { HyperparamConfig } from "../types";
import "./HyperparamCard.css";

interface ParamDef {
  key: keyof HyperparamConfig;
  label: string;
  tooltip: string;
  control: "slider" | "number" | "text" | "select";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

const PARAMS: ParamDef[] = [
  {
    key: "epochs",
    label: "Epochs",
    tooltip: "Number of full passes over the training dataset.",
    control: "slider",
    min: 1,
    max: 20,
    step: 1,
  },
  {
    key: "lr",
    label: "Learning Rate",
    tooltip: "Step size for the optimizer. Smaller = slower but more stable.",
    control: "number",
    min: 0.00001,
    max: 1,
    step: 0.0001,
  },
  {
    key: "batch_size",
    label: "Batch Size",
    tooltip: "Number of samples processed before updating weights.",
    control: "slider",
    min: 16,
    max: 256,
    step: 16,
  },
  {
    key: "neurons",
    label: "Hidden Layers",
    tooltip: 'Neurons per hidden layer, comma-separated. E.g. "256,128"',
    control: "text",
  },
  {
    key: "T",
    label: "Time Steps (T)",
    tooltip: "Number of simulation time steps per input sample.",
    control: "slider",
    min: 5,
    max: 100,
    step: 5,
  },
  {
    key: "vth",
    label: "Threshold (Vth)",
    tooltip: "Membrane voltage threshold at which a neuron fires a spike.",
    control: "slider",
    min: 0.1,
    max: 2.0,
    step: 0.1,
  },
  {
    key: "beta",
    label: "Decay (Beta)",
    tooltip: "Membrane potential decay rate between time steps (LIF only).",
    control: "slider",
    min: 0.1,
    max: 0.99,
    step: 0.01,
  },
  {
    key: "model_type",
    label: "Neuron Model",
    tooltip: "LIF: Leaky Integrate-and-Fire. IF: Integrate-and-Fire (no decay).",
    control: "select",
    options: ["LIF", "IF"],
  },
  {
    key: "optimizer",
    label: "Optimizer",
    tooltip: "Adam is adaptive and usually faster. SGD is simpler.",
    control: "select",
    options: ["Adam", "SGD"],
  },
];

interface Props {
  config: HyperparamConfig;
  onChange: (key: keyof HyperparamConfig, value: number | string | number[]) => void;
  disabled: boolean;
}

export default function HyperparamCard({ config, onChange, disabled }: Props) {
  const getValue = (key: keyof HyperparamConfig) => {
    const v = config[key];
    if (key === "neurons") return (v as number[]).join(",");
    return v;
  };

  const handleChange = (param: ParamDef, raw: string) => {
    if (param.key === "neurons") {
      const parsed = raw
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0);
      onChange(param.key, parsed.length ? parsed : [256]);
    } else if (param.control === "select") {
      onChange(param.key, raw);
    } else {
      onChange(param.key, parseFloat(raw));
    }
  };

  return (
    <div className="hyperparam-grid">
      {PARAMS.map((param) => (
        <div className={`param-card ${disabled ? "param-card--disabled" : ""}`} key={param.key}>
          <div className="param-header">
            <span className="param-label">{param.label}</span>
            <span className="param-tooltip" title={param.tooltip}>?</span>
          </div>

          {param.control === "slider" && (
            <div className="param-slider-row">
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={getValue(param.key) as number}
                disabled={disabled}
                onChange={(e) => handleChange(param, e.target.value)}
                className="param-slider"
              />
              <span className="param-value">{getValue(param.key)}</span>
            </div>
          )}

          {param.control === "number" && (
            <input
              type="number"
              min={param.min}
              max={param.max}
              step={param.step}
              value={getValue(param.key) as number}
              disabled={disabled}
              onChange={(e) => handleChange(param, e.target.value)}
              className="param-input"
            />
          )}

          {param.control === "text" && (
            <input
              type="text"
              value={getValue(param.key) as string}
              disabled={disabled}
              onChange={(e) => handleChange(param, e.target.value)}
              className="param-input"
              placeholder="e.g. 256,128"
            />
          )}

          {param.control === "select" && (
            <select
              value={getValue(param.key) as string}
              disabled={disabled}
              onChange={(e) => handleChange(param, e.target.value)}
              className="param-select"
            >
              {param.options!.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
