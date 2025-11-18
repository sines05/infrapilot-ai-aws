export interface ExecutionPlanStep {
  result: any;
  stepId: string;
  stepName: string;
  description: string;
  duration: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  details: Record<string, any>; // Sửa thành `any` để linh hoạt hơn
  mcpTool?: string;
  toolParameters ?: Record<string, any>;
}

export interface ExecuteStep {
  id: string
  mcpTool: string
  toolParameters: Record<string, any>; // Sửa thành `any`
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

export interface WebSocketProgressMessage {
  result?: any; // Sửa thành optional
  type: string;
  stepId?: string;
  status?: "in_progress" | "completed" | "failed";
  message?: string;
  executionId?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ExecutionResult {
  executionId: string;
  status: "success" | "failed" | "in_progress";
  architecture?: Record<string, any>;
  outputs?: Record<string, any>;
  message?: string;
  timestamp?: string;
}

export interface UserCredentials {
  awsAccessKey: string | null;
  awsSecretKey: string | null;
  googleApiKey: string | null;
}