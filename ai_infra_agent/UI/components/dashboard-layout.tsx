"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Settings, Menu, X, LogOut, Bell, Key, Boxes,
} from "lucide-react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useAvatar } from "@/app/provider";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { label: "AI Chat", href: "/dashboard/chat", icon: <MessageSquare className="w-5 h-5" /> },
  { label: "Projects", href: "/dashboard/projects", icon: <Boxes className="w-5 h-5" /> },
  { label: "Credentials", href: "/dashboard/credentials", icon: <Key className="w-5 h-5" /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings className="w-5 h-5" /> },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { profileImage } = useAvatar();

  const user = session?.user;
  const isDemo = user?.is_demo === true;
  const demoHasCredentials = user?.hasCredentials === true;

  const handleSignOut = async () => {
    // Nếu là user demo, gọi API để xóa trước khi đăng xuất
    if (isDemo && user?.id) {
      try {
        await fetch("/api/demo/delete-temp-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (error) {
        console.error("Failed to delete demo user:", error);
        // Vẫn tiếp tục đăng xuất kể cả khi API xóa lỗi
      }
    }
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg hover:bg-muted md:hidden"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 md:translate-x-0 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 h-20 flex items-center justify-center border-b border-sidebar-border">
            <Image src="/logo.png" alt="Logo" width={400} height={50} priority />
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            {sidebarItems.map((item) => {
              // --- LOGIC VÔ HIỆU HÓA ---
              let disabled = false;
              if (isDemo) {
                // Luôn khóa Settings cho user demo
                if (item.href === "/dashboard/settings") {
                  disabled = true;
                } 
                // Nếu chưa có credentials, khóa tất cả trừ 'Credentials'
                else if (!demoHasCredentials && item.href !== "/dashboard/credentials") {
                  disabled = true;
                }
              }

              return (
                <Link
                  key={item.href}
                  href={disabled ? "#" : item.href}
                  onClick={() => !disabled && setSidebarOpen(false)}
                  aria-disabled={disabled}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors 
                    ${
                      disabled
                        ? "opacity-40 cursor-not-allowed pointer-events-none"
                        : pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }
                  `}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-sidebar-foreground bg-transparent"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
      
      {/* ... Phần Header và Main giữ nguyên ... */}
       <main className="p-6">{children}</main>
    </div>
  );
}