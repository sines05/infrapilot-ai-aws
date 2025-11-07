"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

const deploymentData = [
  { month: "Jan", successful: 12, failed: 2 },
  { month: "Feb", successful: 15, failed: 1 },
  { month: "Mar", successful: 18, failed: 2 },
  { month: "Apr", successful: 22, failed: 1 },
  { month: "May", successful: 20, failed: 0 },
  { month: "Jun", successful: 24, failed: 2 },
]

const executionData = [
  { time: "00:00", duration: 45 },
  { time: "04:00", duration: 38 },
  { time: "08:00", duration: 52 },
  { time: "12:00", duration: 48 },
  { time: "16:00", duration: 41 },
  { time: "20:00", duration: 35 },
]

export default function ProgressPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Progress & Analytics</h1>
        <p className="text-muted-foreground">Track your infrastructure automation metrics</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Total Deployments", value: "128" },
          { label: "Success Rate", value: "98.4%" },
          { label: "Avg Execution Time", value: "3.2m" },
          { label: "Cost Saved", value: "$12.4k" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Deployments Trend</CardTitle>
            <CardDescription>Monthly successful and failed deployments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deploymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successful" fill="var(--primary)" />
                <Bar dataKey="failed" fill="var(--destructive)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution Time</CardTitle>
            <CardDescription>Average script execution time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={executionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="duration" stroke="var(--accent)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
