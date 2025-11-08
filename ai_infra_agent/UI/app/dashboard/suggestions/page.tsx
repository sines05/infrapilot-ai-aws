"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, ArrowRight } from "lucide-react"

const suggestions = [
  {
    id: 1,
    title: "Implement Container Orchestration",
    description:
      "Your current infrastructure could benefit from Kubernetes. This would improve scalability and reduce costs.",
    savings: "~$2400/month",
    complexity: "Medium",
  },
  {
    id: 2,
    title: "Add Auto-Scaling Policies",
    description: "Set up automatic scaling based on CPU and memory usage to optimize resource allocation.",
    savings: "~$800/month",
    complexity: "Low",
  },
  {
    id: 3,
    title: "Implement CI/CD Pipeline",
    description: "Automate your deployment process with a full CI/CD pipeline for faster and safer releases.",
    savings: "~60 hours/month",
    complexity: "High",
  },
  {
    id: 4,
    title: "Add Database Replication",
    description: "Set up multi-region database replication for disaster recovery and high availability.",
    savings: "Increases reliability",
    complexity: "Medium",
  },
]

export default function SuggestionsPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Architecture Suggestions</h1>
        <p className="text-muted-foreground">AI-recommended improvements for your infrastructure</p>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="border-border hover:border-accent transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="p-2 rounded-lg bg-accent/10 h-fit">
                    <Lightbulb className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>{suggestion.title}</CardTitle>
                    <CardDescription>{suggestion.description}</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                  Learn More <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Savings</p>
                  <p className="text-sm font-semibold">{suggestion.savings}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Complexity</p>
                  <p
                    className={`text-sm font-semibold ${
                      suggestion.complexity === "Low"
                        ? "text-green-600"
                        : suggestion.complexity === "Medium"
                          ? "text-yellow-600"
                          : "text-orange-600"
                    }`}
                  >
                    {suggestion.complexity}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
