"use client"

import { Copy, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  codeBlock?: {
    language: string
    code: string
  }
  onCopyCode?: (code: string) => void
  copied?: boolean
}

export function ChatMessage({ role, content, timestamp, codeBlock, onCopyCode, copied }: ChatMessageProps) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-2xl ${
          role === "user"
            ? "bg-primary text-primary-foreground rounded-lg rounded-tr-none"
            : "bg-muted text-foreground rounded-lg rounded-tl-none"
        } p-4`}
      >
        <p className="text-sm leading-relaxed mb-2">{content}</p>

        {codeBlock && (
          <div className="mt-4 bg-background/50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-muted px-4 py-2 border-b border-border">
              <span className="text-xs font-mono text-muted-foreground">{codeBlock.language}</span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onCopyCode?.(codeBlock.code)}>
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code className="text-xs font-mono text-foreground">{codeBlock.code}</code>
            </pre>
          </div>
        )}

        <p className="text-xs opacity-70 mt-2">
          {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  )
}
