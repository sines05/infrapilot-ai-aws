// File: app/dashboard/settings/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronRight, Lock, Users, Loader2 } from "lucide-react";
import Link from "next/link";

const settingsSections = [
  {
    icon: Users,
    title: "Profile Settings",
    description: "Update your personal information and profile",
    href: "/dashboard/settings/profile",
  },
  {
    icon: Lock,
    title: "Security",
    description: "Manage passwords, API keys, and authentication",
    href: "/dashboard/settings/security",
  },
];

const CONFIRMATION_TEXT = "delete";

export default function SettingsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (confirmationInput.toLowerCase() !== CONFIRMATION_TEXT) {
      toast({
        title: "Error",
        description: "Confirmation text is incorrect.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Gọi đến đúng API endpoint đã được sửa
      const response = await fetch('/api/auth/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account.');
      }

      toast({
        title: "Success",
        description: "Your account has been successfully deleted.",
      });

      // Đăng xuất và chuyển hướng về trang chủ
      await signOut({ redirect: false });
      router.push('/'); 

    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setConfirmationInput("");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and application preferences
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="p-6 hover:border-accent transition-colors cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <section.icon className="w-5 h-5 text-accent" />
                      </div>
                      <h3 className="font-semibold">{section.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Danger Zone */}
        <Card className="p-6 border-destructive/20">
          <h2 className="text-lg font-semibold mb-4 text-destructive">
            Danger Zone
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="mb-4 sm:mb-0">
                <h3 className="font-medium">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action is irreversible.
                </p>
              </div>

              <AlertDialog onOpenChange={(open) => !open && setConfirmationInput('')}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. To proceed, please type
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold mx-1">
                        {CONFIRMATION_TEXT}
                      </code>
                      in the box below.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4">
                    <Label htmlFor="confirmation" className="sr-only">
                      Confirmation
                    </Label>
                    <Input
                      id="confirmation"
                      value={confirmationInput}
                      onChange={(e) => setConfirmationInput(e.target.value)}
                      placeholder={CONFIRMATION_TEXT}
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || confirmationInput.toLowerCase() !== CONFIRMATION_TEXT}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      I understand, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}