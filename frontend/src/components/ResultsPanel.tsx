import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { DoneEvent } from "../types";
import "./ResultsPanel.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Props {
  result: DoneEvent;
  onReset: () => void;
}

const chartOptions = (title: string) => ({
  responsive: true,
  plugins: {
    legend: { display: false },
    title: {
      display: true,
      text: title,
      color: "#a78bfa",
      font: { size: 13, weight: 600 },
    },
  },
  scales: {
    x: { ticks: { color: "#6b7280" }, grid: { color: "#1a1a2e" } },
    y: { ticks: { color: "#6b7280" }, grid: { color: "#1a1a2e" } },
  },
});

export default function ResultsPanel({ result, onReset }: Props) {
  const labels = result.history.map((h) => `E${h.epoch}`);

  const lossData = {
    labels,
    datasets: [
      {
        data: result.history.map((h) => h.loss),
        borderColor: "#f87171",
        backgroundColor: "rgba(248,113,113,0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  const accData = {
    labels,
    datasets: [
      {
        data: result.history.map((h) => h.acc),
        borderColor: "#34d399",
        backgroundColor: "rgba(52,211,153,0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  return (
    <div className="results-panel">
      <div className="results-header">
        <div className="accuracy-badge">
          <span className="accuracy-label">Test Accuracy</span>
          <span className="accuracy-value">{result.test_accuracy}%</span>
        </div>
        <button className="reset-btn" onClick={onReset}>
          Train Again
        </button>
      </div>
      <div className="charts-row">
        <div className="chart-box">
          <Line data={lossData} options={chartOptions("Loss per Epoch")} />
        </div>
        <div className="chart-box">
          <Line data={accData} options={chartOptions("Train Accuracy per Epoch")} />
        </div>
      </div>
    </div>
  );
}
