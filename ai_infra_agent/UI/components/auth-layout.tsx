import type React from "react"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="fixed inset-0 gradient-subtle pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </main>
  )
}
