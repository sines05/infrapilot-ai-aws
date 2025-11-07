"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Download, Share2, MoreVertical, Clock, CheckCircle, AlertCircle, Copy } from "lucide-react"
import Link from "next/link"

export default function ScriptDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Deploy Kubernetes Cluster</h1>
            <p className="text-muted-foreground">Created on January 15, 2025</p>
          </div>
          <Button variant="outline" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Status and Actions */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="font-medium">Active</span>
              <span className="text-sm text-muted-foreground">• Last run 2 hours ago</span>
            </div>
            <div className="flex gap-2">
              <Button className="gap-2">
                <Play className="w-4 h-4" />
                Execute Now
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </Card>

        {/* Script Content */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Script Code</h2>
          <div className="bg-muted rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-background px-4 py-2 border-b border-border">
              <span className="text-sm font-mono text-muted-foreground">bash</span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`#!/bin/bash
set -e

echo "Starting Kubernetes cluster deployment..."

# Install dependencies
apt-get update
apt-get install -y docker.io kubelet kubeadm kubectl

# Initialize cluster
kubeadm init --pod-network-cidr=10.244.0.0/16

# Setup networking
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

echo "Kubernetes cluster deployed successfully!"`}</code>
            </pre>
          </div>
        </Card>

        {/* Execution History */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Execution History</h2>
          <div className="space-y-3">
            {[
              { time: "2 hours ago", status: "success", duration: "3m 42s" },
              { time: "1 day ago", status: "success", duration: "3m 38s" },
              { time: "3 days ago", status: "success", duration: "3m 45s" },
              { time: "7 days ago", status: "failed", duration: "1m 23s" },
            ].map((execution, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  {execution.status === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                  <span className="text-sm">{execution.time}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {execution.duration}
                  </span>
                  <Button variant="outline" size="sm">
                    View Logs
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Metadata */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="font-medium">Automated K8s cluster setup with monitoring and logging</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Language</p>
              <p className="font-medium font-mono">bash</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tags</p>
              <div className="flex flex-wrap gap-2">
                {["kubernetes", "deployment", "infrastructure"].map((tag) => (
                  <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Executions</p>
              <p className="font-medium">12</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
