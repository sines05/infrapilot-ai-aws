"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Link,
  Zap,
  User,
  BarChart3,
  MessageSquare,
  Key,
  Settings,
  LogOut,
} from "lucide-react";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: "AI Chat",
    href: "/dashboard/chat",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    label: "AWS Credentials",
    href: "/dashboard/credentials",
    icon: <Key className="w-5 h-5" />,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

const credentials = [
  {
    id: 1,
    name: "Production AWS",
    type: "AWS",
    accessKeyId: "AKIA...7V4D",
    added: "2 weeks ago",
  },
  {
    id: 2,
    name: "Dev AWS",
    type: "AWS",
    accessKeyId: "AKIA...2K8X",
    added: "1 month ago",
  },
];

export default function CredentialsPage() {
  const [showSecret, setShowSecret] = useState<Record<number, boolean>>({});

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AWS Credentials</h1>
            <p className="text-muted-foreground">
              Manage your cloud provider credentials
            </p>
          </div>
          <Button>Add Credentials</Button>
        </div>

        {/* Existing Credentials */}
        <div className="space-y-4">
          {credentials.map((cred) => (
            <Card key={cred.id} className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{cred.name}</CardTitle>
                    <CardDescription>Added {cred.added}</CardDescription>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {cred.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Access Key ID
                    </label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={cred.accessKeyId}
                        readOnly
                        className="flex-1"
                      />
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Secret Access Key
                    </label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type={showSecret[cred.id] ? "text" : "password"}
                        value="••••••••••••••••"
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setShowSecret((prev) => ({
                            ...prev,
                            [cred.id]: !prev[cred.id],
                          }))
                        }
                      >
                        {showSecret[cred.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive bg-transparent"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add New Credentials Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New AWS Credentials</CardTitle>
            <CardDescription>
              Enter your AWS credentials securely
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-2xl">
            <div>
              <label className="text-sm font-medium">Credential Name</label>
              <Input placeholder="e.g., Production AWS" className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Access Key ID</label>
              <Input placeholder="AKIA..." className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Secret Access Key</label>
              <Input type="password" placeholder="••••••••" className="mt-2" />
            </div>
            <Button>Save Credentials</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
