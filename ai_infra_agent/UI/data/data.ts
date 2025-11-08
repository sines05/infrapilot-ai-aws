export interface ExecutionPlanStep {
  stepId: string;
  stepName: string;
  description: string;
  duration: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  details: Record<string, string>;
  mcpTool?: string;
  toolParameters: Record<string, any>;
}

export interface ExecuteStep {
  id: string
  mcpTool: string
  toolParameters: Record<string, string>
  dependsOn: string[]
}

export interface AIResponse {
  request: string;
  mode: string;
  confidence: number;
  action: string;
  reasoning: string;
  executionPlan: ExecutionPlanStep[];
}
