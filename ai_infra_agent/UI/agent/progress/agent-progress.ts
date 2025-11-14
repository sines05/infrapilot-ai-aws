import { AIResponse } from "@/types/data";
import { getMcpTool } from "../helper-function/agent-helper-function"

// --- Agent Request Processing Function ---
export async function processAgentRequest(
  input: string,
  dryRunMode: boolean
): Promise<AIResponse> {
  const response = await fetch("http://localhost:8000/api/v1/agent/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request: input,
      dry_run: dryRunMode,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || `HTTP ${response.status}`);
  }

  const data = await response.json();

  // Chuẩn hóa dữ liệu trả về
  const aiResponse: AIResponse = {
    request: data.request,
    mode: dryRunMode ? "Dry Run" : "Live",
    confidence: data.confidence || 0.95,
    action: data.action || "create_infrastructure",
    reasoning: data.reasoning || "Plan generated.",
    executionPlan: (data.executionPlan || []).map((step: any, i: number) => ({
      stepId: step.id || `step-${i + 1}`,
      stepName: step.name || `Step ${i + 1}`,
      description: step.description || "No description",
      duration: step.estimatedDuration || "Estimating...",
      status: "pending",
      details: step.toolParameters || {},
      mcpTool: step.mcpTool || getMcpTool(step.name),
    })),
  };

  return aiResponse;
}
