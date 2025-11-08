"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ConfigPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configuration</h1>
        <p className="text-muted-foreground">Manage your infrastructure automation settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Cloud Provider Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cloud Provider</CardTitle>
            <CardDescription>Configure your primary cloud infrastructure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Provider</label>
              <select className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background">
                <option>Amazon Web Services (AWS)</option>
                <option>Microsoft Azure</option>
                <option>Google Cloud Platform</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Default Region</label>
              <Input placeholder="us-east-1" className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Automation Settings</CardTitle>
            <CardDescription>Control how scripts are generated and executed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Require Approval Before Execution</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Dry-Run by Default</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div>
              <label className="text-sm font-medium">Script Timeout (seconds)</label>
              <Input type="number" defaultValue="600" className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Get alerts about your deployments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Email on Deployment Complete</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Email on Deployment Failure</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div>
              <label className="text-sm font-medium">Notification Email</label>
              <Input type="email" placeholder="you@example.com" className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full">Save Changes</Button>
      </div>
    </div>
  )
}
