import React, { useEffect, useState, useRef } from "react";

interface Message {
  t: Date;
  text: string;
}

interface HealthResponse {
  status?: string;
  error?: string;
  [key: string]: any;
}

interface ProcessResponse {
  result?: string;
  error?: string;
  [key: string]: any;
}

export default function ApiDemo() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResponse | null>(null);
  const [wsMessages, setWsMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  async function fetchHealth(): Promise<void> {
    try {
      const res = await fetch("http://localhost:8080/api/health");
      const json: HealthResponse = await res.json();
      setHealth(json);
    } catch (err) {
      setHealth({ error: String(err) });
    }
  }

  async function sendProcessRequest(): Promise<void> {
    try {
      const payload = { request: "Provision an S3 bucket", dry_run: true };
      const res = await fetch("http://localhost:8080/api/agent/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: ProcessResponse = await res.json();
      setProcessResult(json);
    } catch (err) {
      setProcessResult({ error: String(err) });
    }
  }

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setWsMessages((m) => [...m, { t: new Date(), text: "ws open" }]);
    };

    ws.onmessage = (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data);
        setWsMessages((m) => [...m, { t: new Date(), text: JSON.stringify(data) }]);
      } catch {
        setWsMessages((m) => [...m, { t: new Date(), text: evt.data }]);
      }
    };

    ws.onerror = () => {
      setWsMessages((m) => [...m, { t: new Date(), text: "ws error" }]);
    };

    ws.onclose = () => {
      setWsMessages((m) => [...m, { t: new Date(), text: "ws closed" }]);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h3>API demo (localhost:8080)</h3>

      <div>
        <button onClick={fetchHealth}>Click here to get: GET /api/health</button>
        <pre>{health ? JSON.stringify(health, null, 2) : "no response yet"}</pre>
      </div>

      <div>
        <button onClick={sendProcessRequest}>Click here to get: POST /api/agent/process (dry_run)</button>
        <pre>{processResult ? JSON.stringify(processResult, null, 2) : "no response yet"}</pre>
      </div>

      <div>
        <h4>WebSocket /ws messages</h4>
        <div style={{ maxHeight: 240, overflow: "auto", background: "#f7f7f7", padding: 8 }}>
          {wsMessages.map((m, i) => (
            <div key={i}>
              <small>{m.t.toLocaleTimeString()}</small>
              <div style={{ fontSize: 12 }}>{m.text}</div>
              <hr />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
