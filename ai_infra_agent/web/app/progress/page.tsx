"use client"

import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"

interface Task {
  id: string
  title: string
  status: "pending" | "in-progress" | "completed" | "failed"
  description: string
  progress: number
}

export default function ProgressPage() {
  const tasks: Task[] = [
    {
      id: "1",
      title: "Create VPC",
      status: "completed",
      description: "Setting up Virtual Private Cloud",
      progress: 100,
    },
    {
      id: "2",
      title: "Configure Security Groups",
      status: "in-progress",
      description: "Setting up firewall rules",
      progress: 65,
    },
    {
      id: "3",
      title: "Launch EC2 Instance",
      status: "pending",
      description: "Creating new EC2 instance",
      progress: 0,
    },
    {
      id: "4",
      title: "Configure Networking",
      status: "pending",
      description: "Setting up network interfaces",
      progress: 0,
    },
  ]

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={24} className="text-success" />
      case "in-progress":
        return <Loader2 size={24} className="text-accent animate-spin" />
      case "failed":
        return <AlertCircle size={24} className="text-destructive" />
      default:
        return <Clock size={24} className="text-muted-foreground" />
    }
  }

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "bg-success/10 border-success/30"
      case "in-progress":
        return "bg-accent/10 border-accent/30"
      case "failed":
        return "bg-destructive/10 border-destructive/30"
      default:
        return "bg-muted/50 border-border"
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border p-6">
        <h1 className="text-2xl font-bold text-foreground">Infrastructure Progress</h1>
        <p className="text-muted-foreground mt-1">Monitor your ongoing infrastructure operations</p>
      </div>

      {/* Tasks Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <div key={task.id} className={`border rounded-lg p-6 transition-all ${getStatusColor(task.status)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                </div>
                {getStatusIcon(task.status)}
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Progress</span>
                  <span className="text-xs font-semibold text-foreground">{task.progress}%</span>
                </div>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      task.status === "completed"
                        ? "bg-success"
                        : task.status === "in-progress"
                          ? "bg-accent"
                          : task.status === "failed"
                            ? "bg-destructive"
                            : "bg-muted-foreground"
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    task.status === "completed"
                      ? "bg-success/20 text-success"
                      : task.status === "in-progress"
                        ? "bg-accent/20 text-accent"
                        : task.status === "failed"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace("-", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
