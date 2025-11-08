import type React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <aside className="w-64 border-r border-border bg-card flex flex-col h-screen"></aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
