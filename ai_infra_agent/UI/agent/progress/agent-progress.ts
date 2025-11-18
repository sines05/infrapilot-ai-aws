// agent/progress/agent-progress.ts

import { AIResponse, ExecutionPlanStep } from "@/types/data";

/**
 * Gửi yêu cầu đến backend qua API proxy và chuẩn hóa phản hồi cho frontend.
 * API proxy sẽ xử lý authentication token từ NextAuth session.
 */
export async function processAgentRequest(prompt: string, dryRunMode: boolean): Promise<AIResponse> {
  
  // Gọi API proxy trong Next.js thay vì gọi trực tiếp backend
  // API proxy sẽ lấy token từ NextAuth session và forward request đến backend
  const response = await fetch("/api/agent/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request: prompt }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown server error" }));
    throw new Error(`Failed to process agent request: ${errorData.detail || response.statusText}`);
  }

  const rawData = await response.json();

  // Chuyển đổi từ cấu trúc API backend sang cấu trúc ExecutionPlanStep của frontend
  const transformedPlan: ExecutionPlanStep[] = rawData.executionPlan.map((stepFromApi: any) => {
    return {
      stepId: stepFromApi.id,
      stepName: stepFromApi.name,
      description: stepFromApi.description,
      details: stepFromApi.toolParameters, // Map 'toolParameters' -> 'details'
      mcpTool: stepFromApi.mcpTool,
      duration: stepFromApi.estimatedDuration || "N/A", // Lấy từ API nếu có
      status: "pending", // Luôn bắt đầu là pending
      result: undefined,
    };
  });

  // Tạo đối tượng AIResponse cuối cùng
  const aiResponse: AIResponse = {
    request: prompt,
    mode: rawData.mode || (dryRunMode ? "dry-run" : "live"),
    confidence: rawData.confidence,
    action: rawData.action,
    reasoning: rawData.reasoning,
    executionPlan: transformedPlan,
  };

  return aiResponse;
}