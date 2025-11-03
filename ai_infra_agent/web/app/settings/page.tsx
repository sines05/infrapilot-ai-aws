"use client"

import { Save, Moon, Sun } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState("30")

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border p-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your InfraPilot experience</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* Appearance */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Appearance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon size={20} className="text-accent" /> : <Sun size={20} className="text-warning" />}
                  <div>
                    <p className="font-medium text-foreground">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-muted"}`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      darkMode ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">Get alerts for infrastructure changes</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifications ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      notifications ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Auto Refresh */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Auto Refresh</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Enable Auto Refresh</p>
                  <p className="text-sm text-muted-foreground">Automatically refresh infrastructure status</p>
                </div>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    autoRefresh ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      autoRefresh ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              {autoRefresh && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Refresh Interval (seconds)</label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(e.target.value)}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="10">10 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                    <option value="300">5 minutes</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium">
              <Save size={18} />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
