"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"

export default function ProfileSettingsPage() {
  const [formData, setFormData] = useState({
    fullName: "John Doe",
    email: "john@example.com",
    company: "Tech Company",
    role: "DevOps Engineer",
    bio: "Infrastructure automation specialist",
  })

  const [saved, setSaved] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your personal information</p>
          </div>
        </div>

        {/* Profile Picture */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">JD</span>
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Upload className="w-4 h-4" />
              Upload Photo
            </Button>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Personal Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input name="fullName" value={formData.fullName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Input name="company" value={formData.company} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Input name="role" value={formData.role} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
                rows={4}
              />
            </div>

            {saved && (
              <div className="p-3 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
                Changes saved successfully
              </div>
            )}

            <Button onClick={handleSave} className="w-full md:w-auto">
              Save Changes
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
