import "./DatasetSelector.css";

interface Dataset {
  id: string;
  label: string;
  description: string;
  available: boolean;
  icon: string;
}

const DATASETS: Dataset[] = [
  {
    id: "MNIST",
    label: "MNIST",
    description: "Handwritten digits 0–9. 70k images, 28×28 grayscale.",
    available: true,
    icon: "✏️",
  },
  {
    id: "FashionMNIST",
    label: "Fashion-MNIST",
    description: "Clothing items. 70k images, 28×28 grayscale.",
    available: false,
    icon: "👕",
  },
  {
    id: "CIFAR10",
    label: "CIFAR-10",
    description: "10 object classes. 60k images, 32×32 color.",
    available: false,
    icon: "🖼️",
  },
];

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  disabled: boolean;
}

export default function DatasetSelector({ selected, onSelect, disabled }: Props) {
  return (
    <div className="dataset-section">
      <h2 className="section-title">Dataset</h2>
      <div className="dataset-row">
        {DATASETS.map((ds) => (
          <button
            key={ds.id}
            className={[
              "dataset-card",
              selected === ds.id ? "dataset-card--selected" : "",
              !ds.available ? "dataset-card--unavailable" : "",
              disabled ? "dataset-card--disabled" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => ds.available && !disabled && onSelect(ds.id)}
            disabled={!ds.available || disabled}
          >
            <span className="dataset-icon">{ds.icon}</span>
            <span className="dataset-label">{ds.label}</span>
            <span className="dataset-desc">{ds.description}</span>
            {!ds.available && <span className="dataset-badge">Coming Soon</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
