"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react"
import Link from "next/link"

export default function InfrastructureSettingsPage() {
  const connections = [
    {
      id: 1,
      name: "AWS Production",
      type: "AWS",
      status: "connected",
      region: "us-east-1",
      account: "123456789",
    },
    {
      id: 2,
      name: "GCP Staging",
      type: "Google Cloud",
      status: "connected",
      project: "my-project",
    },
    {
      id: 3,
      name: "DigitalOcean",
      type: "DigitalOcean",
      status: "pending",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Infrastructure Connections</h1>
              <p className="text-muted-foreground">Manage your cloud provider credentials</p>
            </div>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Connection
          </Button>
        </div>

        {/* Connections List */}
        <div className="space-y-4">
          {connections.map((connection) => (
            <Card key={connection.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{connection.name}</h3>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        connection.status === "connected"
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      }`}
                    >
                      {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{connection.type}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="hover:text-destructive bg-transparent">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
