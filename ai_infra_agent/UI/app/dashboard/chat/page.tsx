"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  Loader2,
  Repeat,
} from "lucide-react";
// Giả định file data/data.ts định nghĩa AIResponse
import { AIResponse } from "@/data/data"; 
import { processAgentRequest } from "@/agent/progress/agent-progress";
// Import hàm executePlan bạn đã cung cấp
import { executePlan } from "@/agent/websocket/agent-websocket";

// --- Định nghĩa kiểu dữ liệu cho tin nhắn Chat ---
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Định nghĩa kiểu dữ liệu cho tin nhắn từ WebSocket (đơn giản hơn)
interface WebSocketProgressMessage {
  type: string;
  stepId?: string;
  status?: "in_progress" | "completed" | "failed";
  message?: string;
  executionId?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm InfraPilot AI, your infrastructure automation assistant. What would you like to automate today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [dryRunMode, setDryRunMode] = useState(true);
  const [showResponse, setShowResponse] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [aiResponse, setAIResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Ready to process your request"
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExecutionComplete, setIsExecutionComplete] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  // --- Hàm gửi yêu cầu ban đầu (gọi API process) ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || isExecuting) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = input;
    setInput("");
    setLoading(true);
    setShowResponse(false);
    setExpandedStep(null);
    setStatusMessage("Processing request...");

    try {
      const data = await processAgentRequest(currentInput, dryRunMode);
      setAIResponse(data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reasoning,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setShowResponse(true);
      setStatusMessage("Plan ready. Click Confirm & Execute.");
    } catch (error: any) {
      setStatusMessage(`Error: ${error.message}`);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I encountered an error: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // --- Hàm xác nhận và thực thi kế hoạch (gọi WebSocket) ---
  const handleConfirmExecute = async () => {
    if (!aiResponse?.executionPlan.length || isExecuting) return;

    setIsExecuting(true);
    setIsExecutionComplete(false);
    setStatusMessage("Starting execution...");
    
    // Sử dụng hàm executePlan đã được import
    const ws = executePlan(
      aiResponse,
      (msg: WebSocketProgressMessage) => {
        // Callback onProgress: Chỉ cập nhật trạng thái của bước
        if (msg.type === "execution_progress" && msg.stepId) {
          setAIResponse((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              executionPlan: prev.executionPlan.map((step) =>
                step.stepId === msg.stepId
                  ? { ...step, status: msg.status || step.status }
                  : step
              ),
            };
          });
        }
      },
      (status: string) => {
        // Callback onStatus: Cập nhật thanh trạng thái chính
        setStatusMessage(status);
      },
      () => {
        // Callback onComplete: Khi thực thi hoàn tất thành công
        setIsExecuting(false);
        setIsExecutionComplete(true);
      },
      (error: string) => {
        // Callback onError: Khi có lỗi xảy ra
        setStatusMessage(`Error: ${error}`);
        setIsExecuting(false);
      }
    );

    wsRef.current = ws;
  };

  // Dọn dẹp WebSocket khi component unmount
  useEffect(() => () => wsRef.current?.close(), []);

  // --- JSX Giao diện ---
  return (
    <DashboardLayout>
      <div className="space-y-6 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Script Generator</h1>
            <p className="text-muted-foreground mt-1">
              Generate and execute infrastructure scripts using AI
            </p>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Status Bar */}
        <div
          className={`border rounded-lg p-4 text-sm font-medium flex items-center gap-2 ${
            statusMessage.includes("Error")
              ? "bg-red-50 border-red-200 text-red-800"
              : isExecutionComplete
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {statusMessage.includes("Error") ? (
             <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {statusMessage}
        </div>

        {/* Chat UI */}
        <Card className="flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-2xl ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-lg rounded-tr-none"
                      : "bg-muted text-foreground rounded-lg rounded-tl-none"
                  } p-4`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg rounded-tl-none p-4">
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "0.1s" }}/>
                    <div
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "0.2s" }}/>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-6 bg-card">
            <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
              <Input
                placeholder="Describe the infrastructure task..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading || isExecuting}
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
                disabled={loading || isExecuting || !input.trim()}
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
              <h2 className="text-xl font-bold">
                Execution Plan {dryRunMode && "(Dry Run)"}
              </h2>
            </div>
            <div className="space-y-3">
              {aiResponse.executionPlan.map((step, i) => (
                <div
                  key={step.stepId}
                  className="border rounded-xl overflow-hidden shadow-sm"
                >
                  <div
                    onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                    className="p-4 bg-card hover:bg-muted/50 cursor-pointer flex items-start gap-4 border-l-4 border-l-primary"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{step.stepName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
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
                      {/* Giả định `step.toolParameters` tồn tại */}
                      {step.toolParameters &&
                      Object.keys(step.toolParameters).length > 0 ? (
                        <div className="p-3 bg-background rounded-md border text-sm font-mono space-y-1">
                          {Object.entries(step.toolParameters).map(
                            ([key, value]) => (
                              <div key={key}>
                                <span className="text-primary font-semibold">{key}:</span>{" "}
                                <span>{String(value)}</span>
                              </div>
                            )
                          )}
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
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleConfirmExecute}
                disabled={isExecuting || isExecutionComplete}
                className="gap-2"
              >
                {isExecuting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isExecuting ? "Executing..." : isExecutionComplete ? "Completed" : "Confirm & Execute"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResponse(false);
                  setAIResponse(null);
                  setIsExecutionComplete(false);
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