"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface NotificationSetting {
  id: string
  title: string
  description: string
  email: boolean
  inApp: boolean
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "execution",
      title: "Script Executions",
      description: "Notify me when scripts complete or fail",
      email: true,
      inApp: true,
    },
    {
      id: "scheduled",
      title: "Scheduled Tasks",
      description: "Notify me about upcoming scheduled tasks",
      email: true,
      inApp: false,
    },
    {
      id: "errors",
      title: "Critical Errors",
      description: "Alert me immediately for critical errors",
      email: true,
      inApp: true,
    },
    {
      id: "updates",
      title: "Product Updates",
      description: "Get notified about new features and updates",
      email: false,
      inApp: true,
    },
    {
      id: "security",
      title: "Security Alerts",
      description: "Notify me of suspicious account activity",
      email: true,
      inApp: true,
    },
  ])

  const toggleSetting = (id: string, key: "email" | "inApp") => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: !s[key] } : s)))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Notification Preferences</h1>
            <p className="text-muted-foreground">Choose how you receive notifications</p>
          </div>
        </div>

        {/* Notification Settings */}
        <Card className="p-6">
          <div className="space-y-6">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between pb-6 border-b border-border last:border-b-0 last:pb-0"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{setting.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                </div>
                <div className="flex items-center gap-4 ml-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setting.email}
                      onChange={() => toggleSetting(setting.id, "email")}
                      className="rounded"
                    />
                    <span className="text-sm text-muted-foreground">Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setting.inApp}
                      onChange={() => toggleSetting(setting.id, "inApp")}
                      className="rounded"
                    />
                    <span className="text-sm text-muted-foreground">In-app</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Save Button */}
        <Button className="w-full md:w-auto">Save Preferences</Button>
      </div>
    </DashboardLayout>
  )
}
