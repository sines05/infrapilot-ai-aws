"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, Play, AlertCircle, Eye } from "lucide-react"

interface Script {
  id: string
  name: string
  description: string
  status: "active" | "archived" | "draft"
  language: string
  created: Date
  lastRun?: Date
  executions: number
  tags: string[]
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived" | "draft">("all")
  const [selectedScripts, setSelectedScripts] = useState<Set<string>>(new Set())

  const [scripts] = useState<Script[]>([
    {
      id: "1",
      name: "Deploy Kubernetes Cluster",
      description: "Automated K8s cluster setup with monitoring and logging",
      status: "active",
      language: "bash",
      created: new Date("2025-01-15"),
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      executions: 12,
      tags: ["kubernetes", "deployment", "infrastructure"],
    },
    {
      id: "2",
      name: "Database Backup Daily",
      description: "Scheduled daily backup of production database",
      status: "active",
      language: "python",
      created: new Date("2025-01-10"),
      lastRun: new Date(Date.now() - 30 * 60 * 1000),
      executions: 156,
      tags: ["database", "backup", "scheduled"],
    },
    {
      id: "3",
      name: "SSL Certificate Renewal",
      description: "Automated SSL certificate update and deployment",
      status: "active",
      language: "bash",
      created: new Date("2025-01-05"),
      lastRun: new Date("2025-01-30"),
      executions: 6,
      tags: ["security", "certificates", "ssl"],
    },
    {
      id: "4",
      name: "Cleanup Old Resources",
      description: "Remove unused EC2 instances and storage",
      status: "draft",
      language: "python",
      created: new Date("2025-01-20"),
      executions: 0,
      tags: ["cleanup", "cost-optimization"],
    },
    {
      id: "5",
      name: "Load Balancer Config",
      description: "Configure and update load balancer settings",
      status: "archived",
      language: "terraform",
      created: new Date("2024-12-15"),
      lastRun: new Date("2024-12-20"),
      executions: 8,
      tags: ["networking", "terraform"],
    },
  ])

  const filteredScripts = scripts.filter((script) => {
    const matchesSearch =
      script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = filterStatus === "all" || script.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const toggleScript = (id: string) => {
    const newSelected = new Set(selectedScripts)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedScripts(newSelected)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "draft":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      case "archived":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Scripts & Projects</h1>
            <p className="text-muted-foreground mt-1">Manage your infrastructure automation scripts</p>
          </div>
          <Button className="gap-2 w-full md:w-auto">
            <Plus className="w-4 h-4" />
            New Script
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search scripts by name or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "active", "draft", "archived"] as const).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Scripts Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={selectedScripts.size === filteredScripts.length && filteredScripts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedScripts(new Set(filteredScripts.map((s) => s.id)))
                        } else {
                          setSelectedScripts(new Set())
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Script Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium hidden lg:table-cell">Language</th>
                  <th className="px-6 py-4 text-left text-sm font-medium hidden md:table-cell">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium hidden lg:table-cell">Executions</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Last Run</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScripts.map((script) => (
                  <tr key={script.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedScripts.has(script.id)}
                        onChange={() => toggleScript(script.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-sm">{script.name}</p>
                        <p className="text-xs text-muted-foreground">{script.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {script.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm font-mono">{script.language}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(script.status)}`}>
                        {script.status.charAt(0).toUpperCase() + script.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm">{script.executions}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {script.lastRun ? formatDate(script.lastRun) : "Never"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="w-8 h-8" title="Run script">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-8 h-8" title="View details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-8 h-8" title="Edit script">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 hover:text-destructive"
                          title="Delete script"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredScripts.length === 0 && (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No scripts found</p>
              <Button>Create Your First Script</Button>
            </div>
          )}
        </Card>

        {/* Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Total Scripts</p>
            <p className="text-2xl font-bold">{scripts.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Active</p>
            <p className="text-2xl font-bold">{scripts.filter((s) => s.status === "active").length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Total Executions</p>
            <p className="text-2xl font-bold">{scripts.reduce((sum, s) => sum + s.executions, 0)}</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
