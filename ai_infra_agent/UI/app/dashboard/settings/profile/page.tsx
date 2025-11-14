"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAvatar } from "@/app/provider";

export default function ProfileSettingsPage() {
  const { profileImage, setProfileImage } = useAvatar();

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "John Doe",
    email: "john@example.com",
    company: "Tech Company",
    role: "DevOps Engineer",
    bio: "Infrastructure automation specialist",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string); // chỉ preview
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    // Lưu form và ảnh
    if (previewImage) setProfileImage(previewImage);

    setSaved(true);
    setIsEditing(false);
    setPreviewImage(null);

    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPreviewImage(null); // bỏ preview
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your personal information
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <Card className="p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleSave}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center">
            <div className="relative">
              <Image
                className="w-20 h-20 rounded-full border border-primary shadow-md"
                src={previewImage || profileImage || "/favicon.ico"}
                alt="Avatar"
                width={80}
                height={80}
                priority
              />
            </div>

            {isEditing && (
              <div>
                <input
                  id="avatarUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent"
                  onClick={() =>
                    document.getElementById("avatarUpload")?.click()
                  }
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </Button>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["fullName", "email", "company", "role"].map((field) => (
                <div className="space-y-2" key={field}>
                  <label className="text-sm font-medium">
                    {field === "fullName"
                      ? "Full Name"
                      : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <Input
                    name={field}
                    value={(formData as any)[field]}
                    onChange={handleChange}
                    readOnly={!isEditing}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                readOnly={!isEditing}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
                rows={4}
              />
            </div>

            {saved && (
              <div className="p-3 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
                Changes saved successfully
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
