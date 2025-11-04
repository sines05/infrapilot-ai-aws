"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Clock, ChevronDown, Play, Loader2, Repeat } from "lucide-react"

interface ExecutionPlanStep {
  stepId: string
  stepName: string
  description: string
  duration: string
  status: "pending" | "in_progress" | "completed" | "failed"
  details: Record<string, string>
  mcpTool?: string  // Lưu mcpTool từ backend
}

interface AIResponse {
  request: string
  mode: string
  confidence: number
  action: string
  reasoning: string
  executionPlan: ExecutionPlanStep[]
}

export default function ChatPage() {
  const [prompt, setPrompt] = useState("")
  const [dryRunMode, setDryRunMode] = useState(true)
  const [showResponse, setShowResponse] = useState(false)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [aiResponse, setAIResponse] = useState<AIResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState("Ready to process your request")
  const [isExecuting, setIsExecuting] = useState(false)
  const [isExecutionComplete, setIsExecutionComplete] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  // === MAP stepName → mcpTool ===
  const getMcpTool = (stepName: string): string => {
    const map: Record<string, string> = {
      "Get latest Ubuntu AMI": "get-latest-ubuntu-ami",
      "Discover subnets in default VPC": "list-subnets",
      "Create EC2 Key Pair": "create-key-pair",
      "Create new EC2 instance": "create-ec2-instance",
    }
    return map[stepName] || "unknown-tool"
  }

  // === MAP stepId → dependsOn (nếu cần) ===
  const getDependsOn = (stepId: string): string[] => {
    const map: Record<string, string[]> = {
      "step-create-ec2-instance": [
        "step-get-ubuntu-ami",
        "step-discover-subnets",
        "step-create-key-pair"
      ],
    }
    return map[stepId] || []
  }

  // === XỬ LÝ PROCESS REQUEST ===
  const handleProcessRequest = async () => {
    if (!prompt.trim() || loading || isExecuting) return

    setLoading(true)
    setShowResponse(false)
    setStatusMessage("Processing request...")
    setIsExecutionComplete(false)

    try {
      const response = await fetch("http://localhost:8000/api/v1/agent/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: prompt,
          dry_run: dryRunMode,
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || `HTTP ${response.status}`)
      }

      const data = await response.json()

      setAIResponse({
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
          status: "pending" as const,
          details: step.toolParameters || {},
          mcpTool: step.mcpTool || getMcpTool(step.name), // Lưu mcpTool
        })),
      })

      setShowResponse(true)
      setStatusMessage("Plan ready. Click Confirm & Execute.")
    } catch (error: any) {
      setStatusMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // === XỬ LÝ CONFIRM & EXECUTE (GỬI ĐÚNG FORMAT) ===
  const handleConfirmExecute = async () => {
    if (!aiResponse?.executionPlan.length || isExecuting) return

    setIsExecuting(true)
    setIsExecutionComplete(false)
    setStatusMessage("Starting execution...")

    const executionId = `exec-${Date.now()}`

    try {
      const ws = new WebSocket("ws://localhost:8000/ws/v1/agent/execute")
      wsRef.current = ws

      ws.onopen = () => {
        console.log("WebSocket connected, sending plan...")
        ws.send(JSON.stringify({
          executionId,
          executionPlan: aiResponse.executionPlan.map(step => ({
            id: step.stepId,
            mcpTool: step.mcpTool || getMcpTool(step.stepName),
            toolParameters: step.details,
            dependsOn: getDependsOn(step.stepId),
          })),
        }))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          console.log("WS message:", msg)

          if (msg.type === "execution_started") {
            setStatusMessage(`Execution started: ${msg.executionId}`)
          } else if (msg.type === "execution_progress") {
            setAIResponse(prev => prev ? {
              ...prev,
              executionPlan: prev.executionPlan.map(s =>
                s.stepId === msg.stepId
                  ? { ...s, status: msg.status || "in_progress" }
                  : s
              )
            } : prev)
            setStatusMessage(`${msg.stepName}: ${msg.status}`)
          } else if (msg.type === "execution_completed") {
            setStatusMessage("EC2 created successfully!")
            setIsExecutionComplete(true)
            ws.close()
          } else if (msg.type === "error") {
            setStatusMessage(`Error: ${msg.message}`)
            setIsExecutionComplete(true)
            ws.close()
          } else if (msg.type === "plan_recovery_request") {
            const approve = window.confirm(`Recovery needed: ${msg.reason}. Approve?`)
            ws.send(JSON.stringify({
              type: approve ? "plan_recovery_decision" : "plan_recovery_abort",
              executionId: msg.executionId,
              approved: approve,
            }))
          }
        } catch (err) {
          console.error("Failed to parse WS message:", err)
        }
      }

      ws.onerror = () => {
        setStatusMessage("WebSocket connection error")
        setIsExecuting(false)
      }

      ws.onclose = () => {
        setIsExecuting(false)
        if (!isExecutionComplete) {
          setStatusMessage("Execution interrupted")
        }
      }

    } catch (error: any) {
      setStatusMessage(`Failed to start: ${error.message}`)
      setIsExecuting(false)
    }
  }

  // === DỌN DẸP WEBSOCKET ===
  useEffect(() => {
    return () => {
      wsRef.current?.close()
    }
  }, [])

  return (
    <div className="flex flex-col gap-8 h-full bg-background p-6 overflow-y-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Amazon Web Services AI Agent</h1>
        <p className="text-base text-muted-foreground">
          Describe what you want to do with your infrastructure in natural language.
        </p>
      </div>

      {/* Status Bar */}
      <div className={`border rounded-lg p-4 text-sm font-medium flex items-center gap-2 ${
        statusMessage.includes("Error") ? "bg-red-50 border-red-200 text-red-800" :
        statusMessage.includes("successfully") ? "bg-green-50 border-green-200 text-green-800" :
        "bg-emerald-50 border-emerald-200 text-emerald-800"
      }`}>
        <CheckCircle2 className="w-4 h-4" />
        {statusMessage}
      </div>

      {/* Input */}
      <div className="space-y-4 bg-card border border-border rounded-xl p-6 shadow-sm">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your infrastructure request..."
          className="w-full h-20 p-4 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          disabled={loading || isExecuting}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              handleProcessRequest()
            }
          }}
        />

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dryRunMode}
              onChange={(e) => setDryRunMode(e.target.checked)}
              className="w-4 h-4 rounded border-input accent-primary"
              disabled={loading || isExecuting}
            />
            <span className="text-sm font-medium">Dry Run Mode</span>
          </label>

          <Button
            onClick={handleProcessRequest}
            disabled={loading || isExecuting || !prompt.trim()}
            className="gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Process Request
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to process
        </p>
      </div>

      {/* AI Response */}
      {showResponse && aiResponse && (
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">AI Agent Response</h2>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  i
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="font-bold text-lg">Request Processed</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Request:</strong> {aiResponse.request}</div>
                    <div><strong>Mode:</strong> <span className="px-2 py-1 bg-blue-100 rounded text-xs">{aiResponse.mode}</span></div>
                    <div><strong>Confidence:</strong> <span className="px-2 py-1 bg-green-100 rounded text-xs">{(aiResponse.confidence * 100).toFixed(1)}%</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">Action</h3>
              <p className="text-sm font-mono bg-muted p-4 rounded-lg border">{aiResponse.action}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">Reasoning</h3>
              <p className="text-sm bg-muted/50 p-4 rounded-lg border">{aiResponse.reasoning}</p>
            </div>
          </div>

          {/* Execution Plan */}
          {aiResponse.executionPlan.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Execution Plan {dryRunMode && "(Dry Run)"}</h2>
              </div>

              <div className="space-y-3">
                {aiResponse.executionPlan.map((step, i) => (
                  <div key={step.stepId} className="border rounded-xl overflow-hidden shadow-sm">
                    <div
                      onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                      className="p-5 bg-card hover:bg-muted/50 cursor-pointer flex items-start gap-4 border-l-4 border-l-primary"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{step.stepName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {step.duration}</span>
                          <span className={`flex items-center gap-1 font-medium ${
                            step.status === "pending" ? "text-yellow-600" :
                            step.status === "completed" ? "text-green-600" :
                            step.status === "failed" ? "text-red-600" : "text-blue-600"
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              step.status === "pending" ? "bg-yellow-500" :
                              step.status === "completed" ? "bg-green-500" :
                              step.status === "failed" ? "bg-red-500" : "bg-blue-500"
                            }`} />
                            {step.status}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform ${expandedStep === i ? "rotate-180" : ""}`} />
                    </div>

                    {expandedStep === i && (
                      <div className="border-t p-5 bg-muted/30">
                        <h4 className="font-bold text-sm mb-2">Parameters</h4>
                        <ul className="text-sm space-y-1">
                          {Object.entries(step.details).map(([k, v]) => (
                            <li key={k} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <strong>{k}:</strong> {v}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConfirmExecute}
                  disabled={isExecuting || isExecutionComplete || !aiResponse?.executionPlan.length}
                  className="gap-2"
                >
                  {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm & Execute {dryRunMode && "(Dry Run)"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResponse(false)
                    setAIResponse(null)
                    setIsExecutionComplete(false)
                  }}
                  disabled={isExecuting}
                >
                  <Repeat className="w-4 h-4" />
                  Restart
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}