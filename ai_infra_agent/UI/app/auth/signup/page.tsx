"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Zap, ArrowRight } from "lucide-react"

export default function SignUp() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Client-side validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Vui lòng điền đầy đủ các trường")
      setLoading(false); return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp")
      setLoading(false); return
    }
    if (formData.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự")
      setLoading(false); return
    }

    try {
      // 1. GỌI API ĐỂ TẠO TÀI KHOẢN
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Đăng ký thất bại.");
      }

      // 2. NẾU TẠO THÀNH CÔNG, TỰ ĐỘNG ĐĂNG NHẬP
      const signInResult = await signIn('credentials', {
        redirect: false, // Rất quan trọng: không chuyển hướng tự động
        email: formData.email,
        password: formData.password,
      });

      if (signInResult?.error) {
        throw new Error("Tài khoản đã được tạo, nhưng tự động đăng nhập thất bại. Vui lòng đăng nhập thủ công.");
      }

      // 3. NẾU ĐĂNG NHẬP THÀNH CÔNG, CHUYỂN HƯỚNG ĐẾN AI CHAT
      if (signInResult?.ok) {
        router.replace("/dashboard/chat");
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // ... JSX của bạn không thay đổi ...
  const passwordStrength =
    formData.password.length >= 8 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password)
      ? "strong"
      : "weak"

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="fixed inset-0 gradient-subtle pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
          {/* ... Header ... */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">InfraPilot AI</span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">Join InfraPilot AI and start automating</p>
          </div>

          <Card className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ... All your <Input> fields ... */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input id="name" name="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} disabled={loading} required />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} disabled={loading} required />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input id="password" name="password" type="password" placeholder="Create a strong password" value={formData.password} onChange={handleChange} disabled={loading} required />
                <p className="text-xs text-muted-foreground">
                  At least 8 characters, one uppercase letter, and one number
                </p>
                {formData.password && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${passwordStrength === "strong" ? "bg-accent" : "bg-border"}`} />
                    <span className={passwordStrength === "strong" ? "text-accent" : "text-muted-foreground"}>
                      {passwordStrength === "strong" ? "Strong password" : "Weak password"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} disabled={loading} required />
              </div>

              {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>
            {/* ... Terms, Divider, Socials ... */}
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
      </div>
    </main>
  )
}