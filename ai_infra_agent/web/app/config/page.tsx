"use client"

import { Save, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

interface Config {
  id: string
  key: string
  value: string
}

export default function ConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([
    { id: "1", key: "REGION", value: "us-east-1" },
    { id: "2", key: "INSTANCE_TYPE", value: "t3.medium" },
    { id: "3", key: "ENVIRONMENT", value: "production" },
  ])
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")

  const handleAddConfig = () => {
    if (newKey && newValue) {
      setConfigs([...configs, { id: Date.now().toString(), key: newKey, value: newValue }])
      setNewKey("")
      setNewValue("")
    }
  }

  const handleDeleteConfig = (id: string) => {
    setConfigs(configs.filter((c) => c.id !== id))
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border p-6">
        <h1 className="text-2xl font-bold text-foreground">Configuration</h1>
        <p className="text-muted-foreground mt-1">Manage your infrastructure configuration settings</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl">
          {/* Add New Config */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Add New Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                placeholder="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={handleAddConfig}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={18} />
                Add
              </button>
            </div>
          </div>

          {/* Config List */}
          <div className="space-y-3">
            {configs.map((config) => (
              <div
                key={config.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-mono text-sm font-semibold text-accent">{config.key}</p>
                  <p className="font-mono text-sm text-muted-foreground mt-1">{config.value}</p>
                </div>
                <button
                  onClick={() => handleDeleteConfig(config.id)}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium">
              <Save size={18} />
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
