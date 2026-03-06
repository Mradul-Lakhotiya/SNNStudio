import { useState, useCallback, useRef } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { HyperparamConfig, DoneEvent } from "../types";

interface UseTrainingReturn {
  logs: string[];
  isTraining: boolean;
  result: DoneEvent | null;
  error: string | null;
  startTraining: (config: HyperparamConfig, dataset: string) => void;
  reset: () => void;
}

export function useTraining(): UseTrainingReturn {
  const [logs, setLogs] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [result, setResult] = useState<DoneEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setLogs([]);
    setIsTraining(false);
    setResult(null);
    setError(null);
  }, []);

  const startTraining = useCallback(
    (config: HyperparamConfig, dataset: string) => {
      reset();
      setIsTraining(true);
      setLogs(["Starting container..."]);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const modalUrl = import.meta.env.VITE_MODAL_URL as string;

      fetchEventSource(modalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, dataset }),
        signal: ctrl.signal,

        onopen: async (res) => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Server error ${res.status}: ${text}`);
          }
        },

        onmessage: (ev) => {
          if (!ev.data) return;
          try {
            const data = JSON.parse(ev.data);

            if ((data as DoneEvent).done) {
              const done = data as DoneEvent;
              setResult(done);
              setIsTraining(false);
              setLogs((prev) => [
                ...prev,
                ``,
                `✅ Training complete! Test Accuracy: ${done.test_accuracy}%`,
              ]);
              ctrl.abort();
              return;
            }

            if (data.log) {
              setLogs((prev) => [...prev, `> ${data.log}`]);
              return;
            }

            if (data.epoch !== undefined) {
              const line = `[Epoch ${String(data.epoch).padStart(2, " ")}/${data.total_epochs}]  Loss: ${data.loss.toFixed(4)}  Acc: ${data.acc.toFixed(1)}%`;
              setLogs((prev) => [...prev, line]);
            }
          } catch {
            // ignore JSON parse errors on keep-alive lines
          }
        },

        onerror: (err) => {
          if (ctrl.signal.aborted) return;
          setError(err instanceof Error ? err.message : "Unknown streaming error");
          setIsTraining(false);
          throw err; // stops fetchEventSource from retrying
        },

        openWhenHidden: true,
      });
    },
    [reset]
  );

  return { logs, isTraining, result, error, startTraining, reset };
}
