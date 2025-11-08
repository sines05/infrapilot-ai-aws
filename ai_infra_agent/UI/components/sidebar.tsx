"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MessageSquare, BarChart3, Lightbulb, Settings, Key, LayoutDashboard, LogOut, ChevronRight } from "lucide-react"

const navigation = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Projects" },
  { href: "/dashboard/chat", icon: MessageSquare, label: "AI Chat" },
  { href: "/dashboard/progress", icon: BarChart3, label: "Progress" },
  { href: "/dashboard/suggestions", icon: Lightbulb, label: "Architecture" },
  { href: "/dashboard/config", icon: Settings, label: "Configuration" },
  { href: "/dashboard/credentials", icon: Key, label: "AWS Credentials" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">IP</span>
          </div>
          <div>
            <p className="font-semibold text-sm">InfraPilot</p>
            <p className="text-xs text-muted-foreground">AI Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === item.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
            )}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1">{item.label}</span>
            {pathname === item.href && <ChevronRight className="w-4 h-4" />}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Link href="/dashboard/settings">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
        </Link>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
