"use client"

import { useState, useEffect } from "react"

export default function HealthStatus() {
  const [status, setStatus] = useState<"ok" | "failed" | "loading">("loading")

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/health")
        if (!res.ok) throw new Error("Bad response")
        const data = await res.json()
        setStatus(data.status === "ok" ? "ok" : "failed")
      } catch {
        setStatus("failed")
      }
    }

    fetchHealth()
    const interval = setInterval(fetchHealth, 5000) // refresh mỗi 5s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium">System Health:</span>
      {status === "loading" && <span className="text-muted-foreground">Checking...</span>}
      {status === "ok" && <span className="text-green-600 font-semibold">OK</span>}
      {status === "failed" && <span className="text-red-600 font-semibold">Failed</span>}
    </div>
  )
}
