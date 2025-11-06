"use client"

import { Save, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useState } from "react"

export default function CredentialsPage() {
  const [accessKey, setAccessKey] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (accessKey && secretKey) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border p-6">
        <h1 className="text-2xl font-bold text-foreground">AWS Credentials</h1>
        <p className="text-muted-foreground mt-1">Configure your AWS authentication</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          {/* Warning */}
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle size={20} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Keep your credentials secure</p>
              <p className="text-sm text-muted-foreground mt-1">
                Never share your AWS credentials. They will be encrypted and stored securely.
              </p>
            </div>
          </div>

          {/* Success Message */}
          {saved && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6">
              <p className="text-success font-medium">Credentials saved successfully!</p>
            </div>
          )}

          {/* Form */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            {/* Access Key */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">AWS Access Key ID</label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="AKIA..."
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">Your AWS Access Key ID from IAM console</p>
            </div>

            {/* Secret Key */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">AWS Secret Access Key</label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Your AWS Secret Access Key from IAM console</p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={!accessKey || !secretKey}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2 font-medium"
              >
                <Save size={18} />
                Save Credentials
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm font-semibold text-foreground mb-2">How to get your credentials:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to AWS IAM Console</li>
              <li>Create a new IAM user or use existing one</li>
              <li>Generate Access Key and Secret Key</li>
              <li>Paste them here securely</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
