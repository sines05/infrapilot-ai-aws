"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Eye, EyeOff, Copy, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import supabase from "@/lib/supabase/client";
// import toast from "react-hot-toast"; // Bỏ comment nếu bạn muốn dùng toast notifications

// Danh sách các AWS Regions
const awsRegions = [
  { code: "us-east-1", name: "US East (N. Virginia)" },
  { code: "us-east-2", name: "US East (Ohio)" },
  { code: "us-west-1", name: "US West (N. California)" },
  { code: "us-west-2", name: "US West (Oregon)" },
  { code: "af-south-1", name: "Africa (Cape Town)" },
  { code: "ap-east-1", name: "Asia Pacific (Hong Kong)" },
  { code: "ap-south-1", name: "Asia Pacific (Mumbai)" },
  { code: "ap-northeast-3", name: "Asia Pacific (Osaka)" },
  { code: "ap-northeast-2", name: "Asia Pacific (Seoul)" },
  { code: "ap-southeast-1", name: "Asia Pacific (Singapore)" },
  { code: "ap-southeast-2", name: "Asia Pacific (Sydney)" },
  { code: "ap-northeast-1", name: "Asia Pacific (Tokyo)" },
  { code: "ca-central-1", name: "Canada (Central)" },
  { code: "eu-central-1", name: "Europe (Frankfurt)" },
  { code: "eu-west-1", name: "Europe (Ireland)" },
  { code: "eu-west-2", name: "Europe (London)" },
  { code: "eu-south-1", name: "Europe (Milan)" },
  { code: "eu-west-3", name: "Europe (Paris)" },
  { code: "eu-north-1", name: "Europe (Stockholm)" },
  { code: "me-south-1", name: "Middle East (Bahrain)" },
  { code: "sa-east-1", name: "South America (São Paulo)" },
];

type CredentialFormState = {
  awsAccessKey: string;
  awsSecretKey: string;
  googleAiKey: string;
  awsRegion: string;
};

const emptyCredentials: CredentialFormState = {
  awsAccessKey: "",
  awsSecretKey: "",
  googleAiKey: "",
  awsRegion: "",
};

export default function CredentialsPage() {
  const [showAwsSecret, setShowAwsSecret] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [credentials, setCredentials] = useState<CredentialFormState>(emptyCredentials);
  const [persistedCredentials, setPersistedCredentials] = useState<CredentialFormState>(emptyCredentials);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy session, status và hàm update từ NextAuth
  const { data: session, status, update } = useSession();
  const userId = session?.user?.id;

  // Effect để tải credentials từ CSDL khi component mount hoặc user thay đổi
  useEffect(() => {
    if (status === "loading") return;

    let isMounted = true;

    const loadCredentials = async () => {
      if (status !== "authenticated" || !userId) {
        if (isMounted) {
          setCredentials(emptyCredentials);
          setPersistedCredentials(emptyCredentials);
          setIsEditing(false);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("aws_access_key, aws_secret_key, google_api_key, aws_region")
          .eq("id", userId)
          .single();

        if (!isMounted) return;

        // Mã PGRST116 chỉ có nghĩa là không tìm thấy dòng nào, đây không phải là lỗi
        if (error && error.code !== "PGRST116") {
          console.error("Failed to load credentials:", error.message);
          // toast.error("Failed to load credentials.");
          return;
        }

        const mapped: CredentialFormState = {
          awsAccessKey: data?.aws_access_key ?? "",
          awsSecretKey: data?.aws_secret_key ?? "",
          googleAiKey: data?.google_api_key ?? "",
          awsRegion: data?.aws_region ?? "",
        };

        setCredentials(mapped);
        setPersistedCredentials(mapped);
        setIsEditing(false); // Bắt đầu ở chế độ read-only
      } catch (fetchError) {
        if (isMounted) {
          console.error("Unexpected error loading credentials:", fetchError);
          // toast.error("An unexpected error occurred.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCredentials();

    return () => {
      isMounted = false; // Cleanup để tránh cập nhật state trên component đã unmount
    };
  }, [status, userId]);

  // Kiểm tra xem có thay đổi nào chưa được lưu không
  const hasChanges =
    credentials.awsAccessKey !== persistedCredentials.awsAccessKey ||
    credentials.awsSecretKey !== persistedCredentials.awsSecretKey ||
    credentials.googleAiKey !== persistedCredentials.googleAiKey ||
    credentials.awsRegion !== persistedCredentials.awsRegion;

  const handleInputChange = (field: keyof Omit<CredentialFormState, "awsRegion">, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleRegionChange = (value: string) => {
    setCredentials((prev) => ({ ...prev, awsRegion: value }));
  };

  const handleEditClick = () => setIsEditing(true);

  const handleCancelClick = () => {
    setCredentials(persistedCredentials); // Hoàn tác lại các thay đổi
    setIsEditing(false);
  };
  
  const handleSave = async () => {
    if (!hasChanges || isSaving || !userId) return;

    setIsSaving(true);
    try {
      const sanitized = {
        aws_access_key: credentials.awsAccessKey.trim() || null,
        aws_secret_key: credentials.awsSecretKey.trim() || null,
        google_api_key: credentials.googleAiKey.trim() || null,
        aws_region: credentials.awsRegion || null,
      };

      const { error } = await supabase
        .from("users")
        .update(sanitized)
        .eq("id", userId);

      if (error) {
        console.error("Failed to save credentials:", error.message);
        // toast.error(`Save failed: ${error.message}`);
        return;
      }

      // toast.success("Credentials saved successfully!");
      const newPersistedState = {
        awsAccessKey: sanitized.aws_access_key ?? "",
        awsSecretKey: sanitized.aws_secret_key ?? "",
        googleAiKey: sanitized.google_api_key ?? "",
        awsRegion: sanitized.aws_region ?? "",
      };
      setCredentials(newPersistedState);
      setPersistedCredentials(newPersistedState);
      setIsEditing(false);

      // --- 🎯 QUAN TRỌNG: CẬP NHẬT SESSION ---
      // Báo cho NextAuth biết người dùng hiện đã có credentials.
      // Điều này sẽ kích hoạt logic mở khóa sidebar trong DashboardLayout.
      await update({ hasCredentials: true });

    } catch (saveError) {
      console.error("Unexpected error saving credentials:", saveError);
      // toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
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
              Enter and manage the API keys for required services. Your keys are stored securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* AWS Access Key ID */}
              <div>
                <label htmlFor="aws-access-key" className="text-sm font-medium text-muted-foreground">
                  AWS Access Key ID
                </label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="aws-access-key"
                    value={credentials.awsAccessKey}
                    readOnly={!isEditing}
                    disabled={isLoading || status !== "authenticated"}
                    onChange={(e) => handleInputChange("awsAccessKey", e.target.value)}
                    className="flex-1 font-mono text-sm"
                    placeholder={isLoading ? "Loading..." : "AKIA..."}
                  />
                  <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(credentials.awsAccessKey)} disabled={!credentials.awsAccessKey}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* AWS Secret Access Key */}
              <div>
                <label htmlFor="aws-secret-key" className="text-sm font-medium text-muted-foreground">
                  AWS Secret Access Key
                </label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="aws-secret-key"
                    type={showAwsSecret ? "text" : "password"}
                    value={credentials.awsSecretKey}
                    readOnly={!isEditing}
                    disabled={isLoading || status !== "authenticated"}
                    onChange={(e) => handleInputChange("awsSecretKey", e.target.value)}
                    className="flex-1 font-mono text-sm"
                    placeholder="****************************************"
                  />
                  <Button size="icon" variant="outline" onClick={() => setShowAwsSecret((prev) => !prev)}>
                    {showAwsSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* AWS Region */}
              <div>
                <label htmlFor="aws-region" className="text-sm font-medium text-muted-foreground">
                  AWS Region
                </label>
                <Select
                  value={credentials.awsRegion}
                  onValueChange={handleRegionChange}
                  disabled={!isEditing || isLoading || status !== "authenticated"}
                >
                  <SelectTrigger id="aws-region" className="mt-2 w-full">
                    <SelectValue placeholder="Select an AWS region" />
                  </SelectTrigger>
                  <SelectContent>
                    {awsRegions.map((region) => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name} ({region.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Google AI Key */}
              <div>
                <label htmlFor="google-ai-key" className="text-sm font-medium text-muted-foreground">
                  Google AI API Key
                </label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="google-ai-key"
                    type={showGoogleKey ? "text" : "password"}
                    value={credentials.googleAiKey}
                    readOnly={!isEditing}
                    disabled={isLoading || status !== "authenticated"}
                    onChange={(e) => handleInputChange("googleAiKey", e.target.value)}
                    className="flex-1 font-mono text-sm"
                    placeholder="***************************************"
                  />
                  <Button size="icon" variant="outline" onClick={() => setShowGoogleKey((prev) => !prev)}>
                    {showGoogleKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                 {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancelClick} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={handleEditClick} disabled={status !== "authenticated" || isLoading || isSaving}>
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}