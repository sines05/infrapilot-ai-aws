// agent/websocket/agent-websocket.ts

import { AIResponse, ExecutionResult, UserCredentials, ExecuteStep } from "@/types/data";
// getDependsOn có thể không cần nữa nếu backend không dùng, nhưng giữ lại để tham khảo
import { getDependsOn, getMcpTool } from "../helper-function/agent-helper-function"; 

export function executePlan(
  aiResponse: AIResponse,
  credentials: UserCredentials,
  onProgress: (msg: any) => void,
  onStatus: (status: string) => void,
  onComplete: (result?: ExecutionResult) => void,
  onError: (error: string) => void
): WebSocket {
  const ws = new WebSocket("ws://localhost:8000/ws/v1/agent/execute");
  const executionId = `exec-${Date.now()}`;
  
  let isClosedProperly = false;
  let lastMessageWasInformalSuccess = false;

  ws.onopen = () => {
    onStatus("WebSocket connected, sending plan and credentials...");

    // Chuyển đổi cấu trúc từ ExecutionPlanStep sang ExecuteStep mà backend cần
    const planForBackend: ExecuteStep[] = aiResponse.executionPlan.map((step) => ({
      id: step.stepId,
      mcpTool: step.mcpTool || getMcpTool(step.stepName), // Dùng getMcpTool nếu mcpTool không có sẵn
      toolParameters: step.details, // Map 'details' -> 'toolParameters'
      dependsOn: [], // Lấy từ `step.dependsOn` nếu có trong ExecutionPlanStep, nếu không để rỗng
    }));
    
    ws.send(
      JSON.stringify({
        executionId,
        credentials,
        executionPlan: planForBackend,
      })
    );
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onProgress(msg);
      
      lastMessageWasInformalSuccess = false;
      
      if (msg.message === "All plan steps executed successfully.") {
        // Đây là cách nhận biết thông điệp thành công không chính thức từ log backend
        lastMessageWasInformalSuccess = true;
      }

      if (msg.type === "execution_completed") {
        isClosedProperly = true; 
        onStatus("Execution completed successfully!");
        // Tạo đối tượng ExecutionResult khớp với interface
        const result: ExecutionResult = {
          executionId: msg.executionId || executionId,
          status: "success",
          architecture: msg.architecture || msg.result?.architecture,
          outputs: msg.outputs || msg.result?.outputs,
          message: msg.message,
          timestamp: new Date().toISOString(),
        };
        onComplete(result);
        ws.close();
      } else if (msg.type === "error") {
        isClosedProperly = true;
        onError(msg.message);
        ws.close();
      }
    } catch (e) {
      isClosedProperly = true;
      onError("Failed to parse WebSocket message");
      ws.close();
    }
  };

  ws.onerror = (event) => {
    isClosedProperly = true;
    console.error("WebSocket Error Event:", event);
    onError("WebSocket connection failed. Is the agent server running?");
  };

  ws.onclose = () => {
    if (isClosedProperly) {
      onStatus("Execution session closed");
      return;
    }

    if (lastMessageWasInformalSuccess) {
      console.warn("PATCH: Connection closed after a success message. Treating as successful completion without final data.");
      isClosedProperly = true;
      onStatus("Execution session closed");
      onComplete(); // Gọi onComplete không có dữ liệu
    } else {
      onError("Connection closed unexpectedly.");
    }
  };

  return ws;
}