"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Bell, Lock, Database, Zap, Users } from "lucide-react";
import Link from "next/link";

const settingsSections = [
  {
    icon: User,
    title: "Profile Settings",
    description: "Update your personal information and profile",
    href: "/dashboard/settings/profile",
  },
  {
    icon: Lock,
    title: "Security",
    description: "Manage passwords, API keys, and authentication",
    href: "/dashboard/settings/security",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure notification preferences",
    href: "/dashboard/settings/notifications",
  },
  {
    icon: Users,
    title: "Team & Billing",
    description: "Manage team members and billing settings",
    href: "/dashboard/settings/team",
  },
];

function User(props: any) {
  return <Users {...props} />;
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and application preferences
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="p-6 hover:border-accent transition-colors cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <section.icon className="w-5 h-5 text-accent" />
                      </div>
                      <h3 className="font-semibold">{section.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Danger Zone */}
        <Card className="p-6 border-destructive/20">
          <h2 className="text-lg font-semibold mb-4 text-destructive">
            Danger Zone
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
