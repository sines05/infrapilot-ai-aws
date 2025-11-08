export interface ExecuteStep {
  id: string
  mcpTool: string
  toolParameters: Record<string, string>
  dependsOn: string[]
}