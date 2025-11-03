"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Clock, ChevronDown, Play, Loader2, Repeat } from "lucide-react"

interface ExecutionPlanStep {
  stepId: string
  stepName: string
  description: string
  duration: string
  status: string
  details: Record<string, string>
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
  const [decisionId, setDecisionId] = useState<string | null>(null)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isExecutionComplete, setIsExecutionComplete] = useState(false) // Track if execution is complete
  const wsRef = useRef<WebSocket | null>(null)

  // WebSocket setup
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/ws")
    wsRef.current = ws

    ws.onopen = () => {
      console.log("WebSocket connected")
      setStatusMessage("WebSocket connected")
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("WebSocket message received:", data)
        if (data.type === "processing_started") {
          setLoading(true)
          setStatusMessage(`Processing request: "${data.request}"`)
        } else if (data.type === "processing_completed") {
          setLoading(false)
          setStatusMessage("Processing completed successfully")
          setShowResponse(true)
          console.log("Processing completed, decisionId:", data.decisionId)
          if (data.mode === "demo") {
            setStatusMessage("Demo mode: Execution not supported")
            setDecisionId(null)
            console.log("Cleared decisionId due to demo mode")
          } else if (data.decisionId) {
            setDecisionId(data.decisionId)
            console.log("Stored decisionId:", data.decisionId)
          } else {
            setStatusMessage("Error: No decision ID received in processing_completed message")
            setDecisionId(null)
            console.error("No decisionId in processing_completed message:", data)
          }
        } else if (data.type === "execution_started") {
          setExecutionId(data.executionId)
          console.log("Execution started, executionId:", data.executionId, "Expected: exec-", decisionId)
          if (decisionId && data.executionId !== `exec-${decisionId}`) {
            console.warn("Execution ID mismatch: received", data.executionId, "expected exec-", decisionId)
            setStatusMessage("Warning: Server started execution unexpectedly. Please try processing the request again.")
          } else {
            setStatusMessage(`Execution started for ${data.executionId}`)
          }
        } else if (data.type === "execution_progress") {
          setAIResponse((prev) =>
            prev
              ? {
                  ...prev,
                  executionPlan: prev.executionPlan.map((step) =>
                    step.stepId === data.stepId ? { ...step, status: data.status || "in_progress" } : step
                  ),
                }
              : prev
          )
          setStatusMessage(`Execution progress: ${data.message}`)
        } else if (data.type === "plan_recovery_request") {
          setStatusMessage(`Plan recovery required for execution ${data.executionId}. Please confirm.`)
          if (window.confirm("Approve recovery strategy?")) {
            wsRef.current?.send(
              JSON.stringify({
                type: "plan_recovery_decision",
                executionId: data.executionId,
                approved: true,
                timestamp: new Date().toISOString(),
              })
            )
          } else {
            wsRef.current?.send(
              JSON.stringify({
                type: "plan_recovery_abort",
                executionId: data.executionId,
                timestamp: new Date().toISOString(),
              })
            )
          }
        } else if (data.type === "plan_recovery_completed") {
          setStatusMessage("Recovery completed successfully")
        } else if (data.type === "plan_recovery_failed") {
          setStatusMessage(`Recovery failed: ${data.reason}`)
        } else if (data.type === "state_update") {
          console.log("Received state_update:", data)
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error, "Raw message:", event.data)
        setStatusMessage("Error: Failed to parse WebSocket message")
      }
    }

    ws.onclose = () => {
      console.log("WebSocket disconnected")
      setStatusMessage("WebSocket disconnected")
      setLoading(false)
      setIsExecuting(false)
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      setStatusMessage("WebSocket error occurred")
      setLoading(false)
      setIsExecuting(false)
    }

    return () => {
      ws.close()
    }
  }, [])

  const handleProcessRequest = async () => {
    if (!prompt.trim()) {
      setStatusMessage("Please enter a valid request")
      return
    }

    if (loading || isExecuting) {
      setStatusMessage("Processing in progress, please wait")
      return
    }

    setLoading(true)
    setShowResponse(false)
    setStatusMessage("Processing request...")
    setDecisionId(null)
    setExecutionId(null)
    setIsExecutionComplete(false)

    try {
      const response = await fetch("http://localhost:8080/api/agent/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: prompt,
          dry_run: dryRunMode,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Process request error response:", errorText)
        throw new Error(errorText || `HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setAIResponse({
        request: data.request,
        mode: data.mode === "demo" ? "Demo" : dryRunMode ? "Dry Run" : "Live",
        confidence: data.confidence || 0,
        action: data.action || "unknown",
        reasoning: data.reasoning || "No reasoning provided",
        executionPlan: data.executionPlan?.map((step: any, index: number) => ({
          stepId: step.stepId || `step-${index + 1}`,
          stepName: step.stepName || `Step ${index + 1}`,
          description: step.description || "No description provided",
          duration: step.estimatedDuration || "Estimating...",
          status: step.status || "pending",
          details: step.parameters || {},
        })) || [],
      })
    } catch (error) {
      console.error("Error calling process API:", error)
      setStatusMessage(`Error: Failed to process request. ${error instanceof Error ? error.message : "Unknown error"}`)
      setLoading(false)
    }
  }

  const handleConfirmExecute = async () => {
    if (!decisionId) {
      setStatusMessage("Error: No decision ID available for execution")
      console.error("No decisionId available for execution")
      return
    }

    console.log("Sending decisionId to execute endpoint:", decisionId)
    setIsExecuting(true)
    setStatusMessage("Starting execution...")

    try {
      const response = await fetch("http://localhost:8080/api/agent/execute-with-plan-recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decisionId: decisionId,
        }),
      })

      const contentType = response.headers.get("Content-Type") || ""
      const responseText = await response.text()
      console.log("Execute response status:", response.status, "Content-Type:", contentType, "Raw response:", responseText)

      let responseData = null
      if (contentType.includes("application/json")) {
        try {
          responseData = JSON.parse(responseText)
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError, "Raw response:", responseText)
          responseData = { error: responseText.trim() || "Failed to parse server response" }
        }
      } else {
        responseData = { error: responseText.trim() || "No error message provided" }
      }

      if (!response.ok) {
        console.error("Execute error response:", responseData)
        throw new Error(responseData.error || `HTTP error! Status: ${response.status}`)
      }

      setStatusMessage("Plan execution started successfully")
      setIsExecutionComplete(true)
      window.alert("Plan execution started successfully")
      console.log("Execution successful, response:", responseData)
    } catch (error) {
      console.error("Error executing plan:", error)
      setStatusMessage(`Error: Failed to execute plan. ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 h-full bg-background p-6 overflow-y-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Amazon Web Services AI Agent</h1>
        <p className="text-base text-muted-foreground">
          Describe what you want to do with your infrastructure in natural language.
        </p>
      </div>

      <div
        className={`border rounded-lg p-4 text-sm font-medium flex items-center gap-2 ${
          statusMessage.includes("Error") || statusMessage.includes("Warning")
            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-200"
            : statusMessage.includes("successfully")
            ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-200"
            : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200"
        }`}
      >
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        {statusMessage}
      </div>

      <div className="space-y-4 bg-card border border-border rounded-xl p-6 shadow-sm">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your infrastructure request..."
          className="w-full h-20 p-4 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all"
          disabled={loading || isExecuting}
        />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <input
                type="checkbox"
                checked={dryRunMode}
                onChange={(e) => setDryRunMode(e.target.checked)}
                className="w-4 h-4 rounded border-input cursor-pointer accent-primary"
                disabled={loading || isExecuting}
              />
              <span className="text-sm font-medium text-foreground">Dry Run Mode</span>
            </label>
          </div>
          <Button
            onClick={handleProcessRequest}
            disabled={loading || isExecuting || !prompt.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Process Request
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          💡 Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to quickly process your request
        </p>
      </div>

      {showResponse && aiResponse && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">AI Agent Response</h2>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-md">
                i
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="font-bold text-foreground text-lg">Request Processed</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Request:</span>
                    <span className="text-foreground">{aiResponse.request}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Mode:</span>
                    <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                      {aiResponse.mode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Confidence:</span>
                    <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                      {(aiResponse.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-foreground">Action</h3>
            <p className="text-sm text-muted-foreground font-mono bg-muted p-4 rounded-lg border border-border">
              {aiResponse.action}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-foreground">Reasoning</h3>
            <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-4 rounded-lg border border-border">
              {aiResponse.reasoning}
            </p>
          </div>
        </div>
      )}

      {showResponse && aiResponse && aiResponse.executionPlan.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Execution Plan {dryRunMode && "(Dry Run)"}</h2>
          </div>

          <div className="space-y-3">
            {aiResponse.executionPlan.map((step, index) => (
              <div
                key={step.stepId}
                className="border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                  className="p-5 bg-card hover:bg-muted/50 cursor-pointer flex items-start gap-4 transition-colors border-l-4 border-l-primary"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-base">{step.stepName}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{step.description}</p>
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Duration: {step.duration}
                      </span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          step.status === "pending"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : step.status === "completed"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            step.status === "pending"
                              ? "bg-yellow-500"
                              : step.status === "completed"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        Status: {step.status}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                      expandedStep === index ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {expandedStep === index && (
                  <div className="border-t border-border p-5 bg-muted/30 space-y-3 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-3">Step Details</h4>
                      <p className="text-sm text-foreground leading-relaxed">
                        Configuration for {step.stepName}:
                      </p>
                      <ul className="text-sm text-foreground mt-3 space-y-2 ml-4">
                        {Object.entries(step.details).map(([key, value]) => (
                          <li key={key} className="flex items-center gap-2">
                            <span className="text-primary">•</span> {key}: {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleConfirmExecute}
              disabled={loading || isExecuting || isExecutionComplete || !decisionId || statusMessage.includes("Warning")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {isExecuting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Confirm & Execute {dryRunMode && "(Dry Run)"}
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-transparent hover:bg-muted transition-colors"
              disabled={loading || isExecuting}
              onClick={() => {
                setShowResponse(false)
                setDecisionId(null)
                setExecutionId(null)
                setIsExecutionComplete(false)
              }}
            >
              <Repeat className="w-4 h-4" />
              Restart
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}