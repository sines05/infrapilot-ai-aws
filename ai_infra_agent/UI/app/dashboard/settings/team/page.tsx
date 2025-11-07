"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Trash2, CreditCard } from "lucide-react"
import Link from "next/link"

export default function TeamBillingPage() {
  const teamMembers = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", joined: "Jan 15, 2025" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Editor", joined: "Jan 20, 2025" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Viewer", joined: "Jan 25, 2025" },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Team & Billing</h1>
            <p className="text-muted-foreground">Manage team members and subscription</p>
          </div>
        </div>

        {/* Team Members */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Team Members</h2>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Invite Member
            </Button>
          </div>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <Card key={member.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {member.role} • Joined {member.joined}
                    </p>
                  </div>
                  <Button variant="outline" size="icon" className="hover:text-destructive bg-transparent">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Billing</h2>
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Current Plan</h3>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <p className="font-semibold">Pro Plan</p>
                    <p className="text-sm text-muted-foreground">$99/month</p>
                  </div>
                  <Button>Manage Subscription</Button>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="font-semibold mb-4">Billing Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next billing date</span>
                    <span className="font-medium">February 15, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment method</span>
                    <span className="font-medium">Visa ending in 4242</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2 bg-transparent">
                <CreditCard className="w-4 h-4" />
                Update Payment Method
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
