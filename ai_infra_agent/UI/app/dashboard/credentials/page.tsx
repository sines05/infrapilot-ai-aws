"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Eye, EyeOff, Copy } from "lucide-react";

export default function CredentialsPage() {
  const [showAwsSecret, setShowAwsSecret] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);

  const initialCredentials = {
    awsAccessKey: "AKIAIOSFODNN7EXAMPLE",
    awsSecretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    googleAiKey: "AIzaSyC...3_gM_Y",
  };

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Credentials</h1>
            <p className="text-muted-foreground mt-1">
              Manage Amazon Web Services and AI service credentials.
            </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>API Credentials</CardTitle>
            <CardDescription>
              Enter and manage the API keys for required services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* AWS Access Key ID */}
              <div>
                <label
                  htmlFor="aws-access-key"
                  className="text-sm font-medium text-muted-foreground"
                >
                  AWS Access Key ID
                </label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="aws-access-key"
                    value={initialCredentials.awsAccessKey}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        initialCredentials.awsAccessKey
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* AWS Secret Access Key */}
              <div>
                <label
                  htmlFor="aws-secret-key"
                  className="text-sm font-medium text-muted-foreground"
                >
                  AWS Secret Access Key
                </label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="aws-secret-key"
                    type={showAwsSecret ? "text" : "password"}
                    value={initialCredentials.awsSecretKey}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowAwsSecret((prev) => !prev)}
                  >
                    {showAwsSecret ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Google AI Key */}
              <div>
                <label
                  htmlFor="google-ai-key"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Google AI API Key
                </label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="google-ai-key"
                    type={showGoogleKey ? "text" : "password"}
                    value={initialCredentials.googleAiKey}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowGoogleKey((prev) => !prev)}
                  >
                    {showGoogleKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Edit</Button>
                <Button>Save Changes</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}