import React, { useState } from "react";

interface ProcessResponse {
  result?: string;
  error?: string;
  [key: string]: any;
}

export default function ApiDemo() {
  const [processResult, setProcessResult] = useState<ProcessResponse | null>(null);

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

  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h3>API demo (localhost:8080)</h3>

      <div>
        <button onClick={sendProcessRequest}>Click here to get: POST /api/agent/process (dry_run)</button>
        <pre>{processResult ? JSON.stringify(processResult, null, 2) : "no response yet"}</pre>
      </div>
    </div>
  );
}
