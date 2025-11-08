import { ExecuteStep } from "@/data/execute-step"

export function startExecution(
  executionId: string,
  steps: ExecuteStep[],
  onMessage: (msg: any) => void,
  onError: (err: any) => void,
  onClose: () => void
) {
  const ws = new WebSocket("ws://localhost:8000/ws/v1/agent/execute")

  ws.onopen = () => ws.send(JSON.stringify({ executionId, executionPlan: steps }))
  ws.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data))
    } catch (err) {
      console.error(err)
    }
  }
  ws.onerror = onError
  ws.onclose = onClose

  return ws
}
