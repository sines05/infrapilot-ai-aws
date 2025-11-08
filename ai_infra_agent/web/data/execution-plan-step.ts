export interface ExecutionPlanStep {
  stepId: string
  stepName: string
  description: string
  duration: string
  status: "pending" | "in_progress" | "completed" | "failed"
  details: Record<string, string>
  mcpTool?: string
}