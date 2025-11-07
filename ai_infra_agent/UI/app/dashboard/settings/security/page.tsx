"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Eye, EyeOff, Copy, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function SecuritySettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey] = useState("sk_live_abc123defg456hij789")

  const sessions = [
    { id: 1, device: "Chrome on macOS", location: "San Francisco, CA", lastActive: "Just now" },
    { id: 2, device: "Safari on iPhone", location: "San Francisco, CA", lastActive: "2 hours ago" },
    { id: 3, device: "Firefox on Windows", location: "New York, NY", lastActive: "1 day ago" },
  ]

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
            <h1 className="text-3xl font-bold">Security Settings</h1>
            <p className="text-muted-foreground">Manage your security and access settings</p>
          </div>
        </div>

        {/* Password */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Password</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Enter current password" />
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input type="password" placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input type="password" placeholder="Confirm new password" />
              </div>
            </div>

            <Button>Update Password</Button>
          </div>
        </Card>

        {/* API Keys */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">API Keys</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Use API keys to authenticate your applications and scripts</p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Production API Key</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input type={showApiKey ? "text" : "password"} value={apiKey} readOnly />
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button variant="outline" size="icon" className="flex-shrink-0 bg-transparent">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button variant="outline" className="gap-2 bg-transparent">
              <RefreshCw className="w-4 h-4" />
              Regenerate Key
            </Button>
          </div>
        </Card>

        {/* Active Sessions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex-1">
                  <p className="font-medium text-sm">{session.device}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.location} • Last active: {session.lastActive}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Logout
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security to your account</p>
            </div>
            <Button>Enable 2FA</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
