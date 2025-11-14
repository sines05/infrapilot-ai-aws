import { AIResponse } from "@/types/data";
import { getDependsOn, getMcpTool } from "../helper-function/agent-helper-function"

// --- WebSocket Execution Function ---
export function executePlan(
  aiResponse: AIResponse,
  onProgress: (msg: any) => void,
  onStatus: (status: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): WebSocket {
  const ws = new WebSocket("ws://localhost:8000/ws/v1/agent/execute");
  const executionId = `exec-${Date.now()}`;

  ws.onopen = () => {
    onStatus("WebSocket connected, sending plan...");
    ws.send(
      JSON.stringify({
        executionId,
        executionPlan: aiResponse.executionPlan.map((step) => ({
          id: step.stepId,
          mcpTool: step.mcpTool || getMcpTool(step.stepName),
          toolParameters: step.details,
          dependsOn: getDependsOn(step.stepId),
        })),
      })
    );
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onProgress(msg);

      if (msg.type === "execution_started") {
        onStatus(`Execution started: ${msg.executionId}`);
      } else if (msg.type === "execution_completed") {
        onStatus("Execution completed successfully!");
        onComplete();
        ws.close();
      } else if (msg.type === "error") {
        onError(msg.message);
        ws.close();
      }
    } catch {
      onError("Failed to parse WebSocket message");
    }
  };

  ws.onerror = () => {
    onError("WebSocket connection error");
  };

  ws.onclose = () => {
    onStatus("Execution session closed");
  };

  return ws;
}
