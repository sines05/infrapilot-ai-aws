"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // <-- Import authOptions của bạn

/**
 * Lấy thông tin credentials của người dùng đang đăng nhập.
 * Dành cho NextAuth.js v4.
 */
export async function getUserCredentials() {
  // Lấy session phía server
  const session = await getServerSession(authOptions);
  
  // Trong NextAuth v4, user id thường nằm trong session.user.id nếu bạn đã cấu hình callback
  // Giả sử bạn đã thêm 'id' vào session trong callbacks của NextAuth
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    throw new Error("User not authenticated or session missing user ID. Cannot fetch credentials.");
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('users')
    .select('aws_access_key, aws_secret_key, google_api_key')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Supabase error fetching user credentials:", error.message);
    throw new Error("Failed to fetch user credentials from the database.");
  }

  if (!data) {
    console.warn(`No credentials found for user ID: ${userId}`);
    return null;
  }

  // TODO: Giải mã credentials ở đây nếu bạn đã mã hóa chúng trong DB

  return {
    awsAccessKey: data.aws_access_key,
    awsSecretKey: data.aws_secret_key,
    googleApiKey: data.google_api_key,
  };
}