"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Settings, CheckCircle2, AlertCircle, Clock, ChevronDown, Loader2, Repeat, RotateCcw } from "lucide-react";
import { AIResponse, ExecutionResult, WebSocketProgressMessage, Message } from "@/types/data";
import { processAgentRequest } from "@/agent/progress/agent-progress";
import { executePlan } from "@/agent/websocket/agent-websocket";
import CredentialsNotifier from '@/components/auth/CredentialsNotifier';
import { saveExecutionResult } from "@/lib/actions/infrastructure.actions";
import { getUserCredentials } from "@/lib/actions/user.actions";
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm InfraPilot AI, your infrastructure automation assistant. What would you like to automate today?",
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [dryRunMode, setDryRunMode] = useState(true);
  const [showResponse, setShowResponse] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [aiResponse, setAIResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ready to process your request");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExecutionComplete, setIsExecutionComplete] = useState(false);
  const [executionFailed, setExecutionFailed] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [accumulatedResults, setAccumulatedResults] = useState<Record<string, any>>({});

  const { data: session, status } = useSession();

  // -----------------------------
  // NEW: State kiểm tra credentials
  // -----------------------------
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchCredentials = async () => {
      if (status !== "authenticated") return;

      const credentials = await getUserCredentials();

      if (credentials?.awsAccessKey || credentials?.awsSecretKey || credentials?.googleApiKey) {
        setHasCredentials(true);
      } else {
        setHasCredentials(false);
      }
    };

    fetchCredentials();
  }, [status]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);
  useEffect(() => () => wsRef.current?.close(), []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || isExecuting) return;

    setExecutionFailed(false);
    setShowResponse(false);
    setAIResponse(null);
    setIsExecutionComplete(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = input;
    setCurrentPrompt(currentInput);
    setInput("");
    setLoading(true);
    setStatusMessage("Processing request...");

    try {
      const data = await processAgentRequest(currentInput, dryRunMode);
      setAIResponse(data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reasoning,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setShowResponse(true);
      setStatusMessage("Plan ready. Click Confirm & Execute.");
    } catch (error: any) {
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmExecute = async () => {
    if (!aiResponse?.executionPlan.length || isExecuting || status !== 'authenticated' || !session?.user || !currentPrompt) {
      if (status !== 'authenticated') setStatusMessage("Error: User not authenticated.");
      return;
    }

    setAccumulatedResults({});
    setIsExecuting(true);
    setIsExecutionComplete(false);
    setExecutionFailed(false);
    setStatusMessage("Fetching credentials and starting execution...");

    try {
      const credentials = await getUserCredentials();
      if (!credentials?.awsAccessKey || !credentials?.awsSecretKey) {
        throw new Error("AWS credentials are missing. Please add them in the Credentials page.");
      }

      setStatusMessage("Credentials loaded. Connecting to agent...");

      const ws = await executePlan(
        aiResponse,
        credentials,

        // onProgress
        (msg: WebSocketProgressMessage) => {
          console.log('[CLIENT] Progress Update:', msg);

          if (msg.stepId && msg.status === "completed" && msg.result) {
            setAccumulatedResults(prev => ({ ...prev, [msg.stepId as string]: msg.result }));
          }

          if (msg.stepId) {
            setAIResponse((prev) => {
              if (!prev) return null;

              const newPlan = prev.executionPlan.map((step) => {
                if (step.stepId === msg.stepId) {
                  return {
                    ...step,
                    status: msg.status || step.status,
                    result: msg.result || step.result
                  };
                }
                return step;
              });

              return { ...prev, executionPlan: newPlan };
            });
          }
        },

        // onStatus
        (newStatus: string) => {
          console.log('[CLIENT] Status Update:', newStatus);
          setStatusMessage(newStatus);
        },

        // onComplete
        async (result?: ExecutionResult) => {
          console.log('[CLIENT] Execution Completed. Result:', result);
          setIsExecuting(false);
          setIsExecutionComplete(true);
          setExecutionFailed(false);

          let finalResultToSave: ExecutionResult | undefined = result;

          if (!finalResultToSave && Object.keys(accumulatedResults).length > 0) {
            finalResultToSave = {
              executionId: `exec-client-assembled-${Date.now()}`,
              status: "success",
              architecture: {},
              outputs: accumulatedResults,
              message: "Execution finished, but final data was assembled by the client.",
              timestamp: new Date().toISOString(),
            };
          }

          if (finalResultToSave) {
            try {
              const userId = (session.user as any)?.id;
              if (!userId) throw new Error("User ID not found in session.");

              const descriptionAsJson = JSON.stringify(finalResultToSave, null, 2);
              setStatusMessage("Saving execution results...");

              const saveResult = await saveExecutionResult({
                userId,
                action: currentPrompt,
                type: "AI Script Generation",
                description: descriptionAsJson
              });

              if (!saveResult?.success)
                throw new Error(saveResult?.error || "Failed to save to database.");

              setStatusMessage("Execution completed and results saved successfully!");

            } catch (error: any) {
              console.error("[CLIENT] Save failed:", error);
              setStatusMessage(`Execution complete, but saving failed: ${error.message}`);
              setExecutionFailed(true);
              setIsExecutionComplete(false);
            }
          } else {
            setStatusMessage("Execution finished, but backend did not send a result.");
          }
        },

        // onError
        (error: string) => {
          console.error('[CLIENT] WebSocket Error:', error);
          setStatusMessage(`Unexpected error: ${error}`);
          setExecutionFailed(true);
          setIsExecuting(false);
          setIsExecutionComplete(false);
        }
      );

      wsRef.current = ws;
    } catch (error: any) {
      console.error("[CLIENT] Failed to start execution:", error);
      setStatusMessage(`Error: ${error.message}`);
      setExecutionFailed(true);
      setIsExecuting(false);
    }
  };

  return (
    <DashboardLayout>

      {/* Only show this when credentials are missing */}
      {hasCredentials === false && <CredentialsNotifier />}

      <div className="space-y-6 mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Script Generator</h1>
            <p className="text-muted-foreground mt-1">Generate and execute infrastructure scripts using AI</p>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Status alert */}
        <div className={`border rounded-lg p-4 text-sm font-medium flex items-center gap-2 ${
          executionFailed
            ? "bg-red-50 border-red-200 text-red-800"
            : isExecutionComplete
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          {executionFailed ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {statusMessage}
        </div>

        {/* Chat */}
        <Card className="flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-2xl ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-lg rounded-tr-none"
                      : "bg-muted text-foreground rounded-lg rounded-tl-none"
                  } p-4`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg rounded-tl-none p-4">
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input box */}
          <div className="border-t border-border p-6 bg-card">
            <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
              <Input
                placeholder="Describe the infrastructure task..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading || isExecuting || status !== 'authenticated'}
                className="flex-1"
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={dryRunMode}
                  onChange={(e) => setDryRunMode(e.target.checked)}
                  className="w-4 h-4"
                />
                Dry Run
              </label>

              <Button
                type="submit"
                disabled={loading || isExecuting || !input.trim() || status !== 'authenticated'}
                className="gap-2"
              >
                <Send className="w-4 h-4" /> Send
              </Button>
            </form>
          </div>
        </Card>

        {/* Execution Plan */}
        {showResponse && aiResponse && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Execution Plan {dryRunMode && "(Dry Run)"}</h2>
            </div>

            <div className="space-y-3">
              {aiResponse.executionPlan.map((step, i) => (
                <div key={step.stepId} className="border rounded-xl overflow-hidden shadow-sm">
                  <div
                    onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                    className="p-4 bg-card hover:bg-muted/50 cursor-pointer flex items-start gap-4 border-l-4 border-l-primary"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{step.stepName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>

                      <div className="flex items-center gap-2 mt-2 text-xs font-medium capitalize">
                        <span
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                            step.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : step.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : step.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              step.status === "pending"
                                ? "bg-yellow-500"
                                : step.status === "completed"
                                ? "bg-green-500"
                                : step.status === "failed"
                                ? "bg-red-500"
                                : "bg-blue-500 animate-pulse"
                            }`}
                          />
                          {step.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        expandedStep === i ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {expandedStep === i && (
                    <div className="border-t p-4 bg-muted/30">
                      <h4 className="font-bold text-sm mb-2">Parameters</h4>

                      {step.details && Object.keys(step.details).length > 0 ? (
                        <div className="p-3 bg-background rounded-md border text-sm font-mono space-y-1">
                          {Object.entries(step.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-primary font-semibold">{key}:</span>{" "}
                              <span>{JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No parameters for this step.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Execution Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleConfirmExecute}
                disabled={(isExecuting || (isExecutionComplete && !executionFailed)) || status !== 'authenticated'}
                className={`gap-2 ${executionFailed ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}`}
              >
                {isExecuting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : executionFailed ? (
                  <RotateCcw className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}

                {isExecuting
                  ? "Executing..."
                  : executionFailed
                  ? "Retry"
                  : isExecutionComplete
                  ? "Completed"
                  : "Confirm & Execute"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowResponse(false);
                  setAIResponse(null);
                  setIsExecutionComplete(false);
                  setExecutionFailed(false);
                  setCurrentPrompt("");
                  setStatusMessage("Ready to process your request");
                }}
                disabled={isExecuting}
                className="gap-2"
              >
                <Repeat className="w-4 h-4" /> Restart
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
