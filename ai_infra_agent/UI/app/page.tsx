"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Gauge } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 gradient-subtle pointer-events-none" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="InfraPilot AI Logo"
              width={300}
              height={50}
              priority
            />
          </div>
          <div className="flex gap-3">
            <Link href="/auth/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="px-6 py-20 md:py-32 max-w-6xl mx-auto">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight">
              Automate Your Infrastructure with AI
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              InfraPilot AI generates, executes, and manages infrastructure
              automation scripts. Let AI handle the complexity while you focus
              on innovation.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="gap-2">
                  Start Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div
            className="grid md:grid-cols-3 gap-6 mt-20"
            onMouseMove={handleMouseMove}
          >
            {[
              {
                icon: Brain,
                title: "AI-Powered Generation",
                description:
                  "Generate infrastructure scripts using natural language prompts",
              },
              {
                icon: Gauge,
                title: "Dry-Run Mode",
                description:
                  "Preview changes before execution to ensure safety",
              },
              {
                icon: Zap,
                title: "Instant Deployment",
                description:
                  "Execute scripts directly to your infrastructure with one click",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-lg border border-border bg-card hover:border-accent transition-colors"
              >
                <feature.icon className="w-8 h-8 text-accent mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-16 border-t border-border">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to automate?</h2>
            <p className="text-muted-foreground">
              Join teams already using AI to manage their infrastructure
              efficiently and securely.
            </p>
            <Link href="/auth/signup">
              <Button size="lg">Create Your Account</Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 InfraPilot AI. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
