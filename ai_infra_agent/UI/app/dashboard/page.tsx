// File: app/dashboard/page.tsx (hoặc nơi bạn đặt file này)

"use client"

// 1. Import các hook cần thiết
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, BarChart3, Clock, CheckCircle, TrendingUp, Plus, ArrowRight } from "lucide-react"

export default function Dashboard() {
  // 2. Lấy thông tin session và router
  const { data: session, status } = useSession()
  const router = useRouter()

  // 3. Logic bảo vệ route (quan trọng nhất)
  useEffect(() => {
    // Nếu chưa kiểm tra xong và trạng thái là "unauthenticated" (chưa đăng nhập)
    if (status === "unauthenticated") {
      // Chuyển hướng người dùng về trang đăng nhập
      router.push("/auth/signin")
    }
  }, [status, router]) // useEffect sẽ chạy lại khi status hoặc router thay đổi

  const [stats] = useState([
    // ... (dữ liệu state của bạn không thay đổi)
    { icon: Zap, label: "Active Scripts", value: "12", change: "+2 this week", color: "text-accent" },
    { icon: CheckCircle, label: "Successful Executions", value: "847", change: "+142 this month", color: "text-green-500" },
    { icon: Clock, label: "Avg. Execution Time", value: "2.3s", change: "-0.5s improvement", color: "text-blue-500" },
    { icon: TrendingUp, label: "Cost Saved", value: "$4.2k", change: "+$1.2k this month", color: "text-purple-500" },
  ])

  const [recentScripts] = useState([
    // ... (dữ liệu state của bạn không thay đổi)
    { id: 1, name: "Deploy Kubernetes Cluster", status: "completed", lastRun: "2 hours ago", executions: 12 },
    { id: 2, name: "Update SSL Certificates", status: "scheduled", lastRun: "Tomorrow at 2:00 AM", executions: 3 },
    { id: 3, name: "Database Backup Daily", status: "active", lastRun: "30 minutes ago", executions: 156 },
    { id: 4, name: "Cleanup Unused Resources", status: "failed", lastRun: "Yesterday at 3:00 PM", executions: 5 },
  ])

  const getStatusColor = (status: string) => {
    // ... (hàm của bạn không thay đổi)
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "active": return "bg-accent/10 text-accent";
      case "scheduled": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "failed": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  }

  // 4. Xử lý trạng thái loading và khi đã đăng nhập
  // Nếu đang trong quá trình kiểm tra session, hiển thị thông báo loading
  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <p>Loading your dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  // Nếu đã xác thực thành công, hiển thị nội dung dashboard
  if (session) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              {/* 5. Cá nhân hóa lời chào */}
              <p className="text-muted-foreground mt-1">
                Welcome back, {session.user?.name}! Here's your infrastructure overview.
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Script
            </Button>
          </div>

          {/* ... (Toàn bộ phần còn lại của JSX của bạn giữ nguyên) ... */}
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Scripts */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recent Scripts</h2>
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {recentScripts.map((script) => (
                  <div
                    key={script.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{script.name}</h3>
                      <p className="text-sm text-muted-foreground">{script.lastRun}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{script.executions}</p>
                        <p className="text-xs text-muted-foreground">executions</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(script.status)}`}>
                        {script.status.charAt(0).toUpperCase() + script.status.slice(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Plus className="w-4 h-4 mr-2" />
                Create Script
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Reports
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Zap className="w-4 h-4 mr-2" />
                API Documentation
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Clock className="w-4 h-4 mr-2" />
                Scheduled Tasks
              </Button>
            </div>

            {/* Upgrade Banner */}
            <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <h3 className="font-semibold text-sm mb-1">Upgrade to Pro</h3>
              <p className="text-xs text-muted-foreground mb-3">Unlock advanced features and priority support.</p>
              <Button size="sm" className="w-full">
                Learn More
              </Button>
            </div>
          </Card>
        </div>
        </div>
      </DashboardLayout>
    )
  }

  // Nếu không loading, cũng không có session, thì trả về null (vì useEffect đã xử lý redirect)
  return null
}