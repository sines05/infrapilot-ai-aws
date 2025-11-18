"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  MessageSquare,
  Settings,
  Zap,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  Key,
  Boxes,
  Server,
} from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useAvatar } from "@/app/provider";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    label: "AI Chat",
    href: "/dashboard/chat",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: "Infrastructure",
    href: "/dashboard/infrastructure",
    icon: <Server className="w-5 h-5" />,
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: <Boxes className="w-5 h-5" />,
  },
  {
    label: "Credentials",
    href: "/dashboard/credentials",
    icon: <Key className="w-5 h-5" />,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isSidebarItemActive = (href: string) => {
    return pathname === href;
  };

  const { profileImage } = useAvatar();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg hover:bg-muted"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 md:translate-x-0 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 h-20 flex items-center justify-center border-b border-sidebar-border">
            <Image
              src="/logo.png"
              alt="InfraPilot AI Logo"
              width={450}
              height={40}
              priority
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isSidebarItemActive(item.href)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="border-t border-sidebar-border p-4 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-sidebar-foreground bg-transparent"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div />
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <div />
            <Image
              className="w-8 h-8 rounded-full border-1 border-primary shadow-md"
              src={profileImage || "/favicon.ico"}
              alt="InfraPilot AI Logo"
              width={450}
              height={40}
              priority
            />
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}
