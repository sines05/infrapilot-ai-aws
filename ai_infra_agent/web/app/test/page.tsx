"use client";

import React, { useEffect, useState } from "react";

interface Decision {
  id: string;
  action: string;
  resource: string;
  reasoning: string;
  confidence: number;
  parameters: any | null;
  timestamp: string;
}

interface ProcessResponse {
  action: string;
  confidence: number;
  decision: Decision;
  dry_run: boolean;
  executionPlan: any | null;
  mode: string;
  reasoning: string;
  request: string;
  requiresConfirmation: boolean;
  timestamp: string;
}

export default function ApiDryRunDemo() {
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendProcessRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { request: "create-ec2-instance", dry_run: true };
      const res = await fetch("http://localhost:8080/api/agent/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json: ProcessResponse = await res.json();
      setResult(json);
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h3>MCP Agent Dry-Run Demo</h3>
      <button onClick={sendProcessRequest} disabled={loading}>
        {loading ? "Processing..." : "Send Dry-Run Request"}
      </button>

      {error && <div style={{ color: "red", marginTop: 8 }}>Error: {error}</div>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <h4>Request: {result.request}</h4>
          <p>
            <strong>Action:</strong> {result.action}
          </p>
          <p>
            <strong>Dry Run:</strong> {result.dry_run ? "Yes" : "No"}
          </p>
          <p>
            <strong>Reasoning:</strong> {result.reasoning}
          </p>
          <p>
            <strong>Requires Confirmation:</strong>{" "}
            {result.requiresConfirmation ? "Yes" : "No"}
          </p>
          <h5>Decision Details:</h5>
          <pre>{JSON.stringify(result.decision, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
