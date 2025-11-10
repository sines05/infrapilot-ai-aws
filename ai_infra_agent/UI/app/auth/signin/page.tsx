// File: app/auth/signin/page.tsx

"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Zap, ArrowRight } from "lucide-react"

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Gọi hàm signIn của NextAuth với provider 'credentials'
      const result = await signIn('credentials', {
        redirect: false, // Tự xử lý redirect để hiển thị lỗi
        email: email,
        password: password,
      });

      if (result?.ok) {
        // Đăng nhập thành công, chuyển hướng đến dashboard
        router.replace("/dashboard");
      } else {
        // Đăng nhập thất bại, hiển thị lỗi chung
        setError("Email hoặc mật khẩu không hợp lệ.");
      }
    } catch (err) {
      console.error("Lỗi đăng nhập không mong muốn:", err);
      setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="fixed inset-0 gradient-subtle pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">InfraPilot AI</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your InfraPilot AI account</p>
        </div>

        {/* Sign In Form */}
        <Card className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" disabled={loading}>
              Google
            </Button>
            <Button variant="outline" disabled={loading}>
              GitHub
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-accent font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}