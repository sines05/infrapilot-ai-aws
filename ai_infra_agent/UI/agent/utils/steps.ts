import { ExecutionPlanStep } from "@/data/execution-plan-step"

export const getMcpTool = (stepName: string): string => {
  const map: Record<string, string> = {
    "Get latest Ubuntu AMI": "get-latest-ubuntu-ami",
    "Discover subnets in default VPC": "list-subnets",
    "Create EC2 Key Pair": "create-key-pair",
    "Create new EC2 instance": "create-ec2-instance",
  }
  return map[stepName] || "unknown-tool"
}

export const getDependsOn = (stepId: string): string[] => {
  const map: Record<string, string[]> = {
    "step-create-ec2-instance": [
      "step-get-ubuntu-ami",
      "step-discover-subnets",
      "step-create-key-pair"
    ],
  }
  return map[stepId] || []
}

export const formatExecutionPlan = (plan: any[]): ExecutionPlanStep[] => {
  return plan.map((step, i) => ({
    stepId: step.id || `step-${i + 1}`,
    stepName: step.name || `Step ${i + 1}`,
    description: step.description || "No description",
    duration: step.estimatedDuration || "Estimating...",
    status: "pending" as const,
    details: step.toolParameters || {},
    mcpTool: step.mcpTool || getMcpTool(step.name),
  }))
}
