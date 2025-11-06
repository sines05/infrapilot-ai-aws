import React, { useState, useRef } from "react";

interface HealthResponse {
  status?: string;
  error?: string;
  [key: string]: any;
}

export default function ApiDemo() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
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

  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h3>API demo (localhost:8080)</h3>

      <div>
        <button onClick={fetchHealth}>Click here to get: GET /api/health</button>
        <pre>{health ? JSON.stringify(health, null, 2) : "no response yet"}</pre>
      </div>
    </div>
  );
}
