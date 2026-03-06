import { useEffect, useRef } from "react";
import "./TerminalOutput.css";

interface Props {
  logs: string[];
  isTraining: boolean;
}

export default function TerminalOutput({ logs, isTraining }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="terminal-wrapper">
      <div className="terminal-bar">
        <span className="terminal-dot terminal-dot--red" />
        <span className="terminal-dot terminal-dot--yellow" />
        <span className="terminal-dot terminal-dot--green" />
        <span className="terminal-title">training output</span>
      </div>
      <div className="terminal-body">
        {logs.length === 0 && !isTraining && (
          <span className="terminal-placeholder">
            Output will appear here once training starts...
          </span>
        )}
        {logs.map((line, i) => (
          <div key={i} className="terminal-line">
            {line}
          </div>
        ))}
        {isTraining && (
          <span className="terminal-cursor" aria-hidden="true">
            ▋
          </span>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
