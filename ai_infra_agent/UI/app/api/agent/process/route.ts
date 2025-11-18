import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * API Route proxy để gọi backend agent API với authentication token
 * Lấy user_id từ NextAuth session và tạo Supabase JWT token
 */
export async function POST(request: NextRequest) {
  console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  // --- DEBUGGING: Read body as text first ---
  const bodyAsText = await request.text();
  console.log("Request body as text:", bodyAsText);
  // --- END DEBUGGING ---

  try {
    const body = bodyAsText ? JSON.parse(bodyAsText) : null;
    
    if (!body) {
      return NextResponse.json({ detail: "Request body is empty or invalid" }, { status: 400 });
    }

    // Lấy NextAuth session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { detail: "Unauthorized: User not authenticated" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email || "";
    
    // Tạo Supabase JWT token từ user_id
    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    
    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-User-Id": userId, // Always send user_id as fallback
    };
    
    // Try to create and send token if JWT secret is available
    if (supabaseJwtSecret && supabaseUrl) {
      try {
        const token = createSupabaseToken(userId, userEmail, supabaseJwtSecret);
        headers["Authorization"] = `Bearer ${token}`;
      } catch (error) {
        console.warn("Failed to create Supabase token, using X-User-Id header only:", error);
      }
    }
    
    // Gọi backend API với Bearer token (nếu có) hoặc X-User-Id header
    const response = await fetch(`${backendUrl}/api/v1/agent/process`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown server error" }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in agent process proxy:", error);
    return NextResponse.json(
      { detail: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Tạo Supabase JWT token từ user_id và email
 * Token này sẽ được backend verify bằng Supabase client
 */
function createSupabaseToken(userId: string, email: string, jwtSecret: string): string {
  // Tạo JWT token với payload giống Supabase
  const payload = {
    aud: "authenticated",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    sub: userId,
    email: email,
    app_metadata: {},
    user_metadata: {},
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, jwtSecret, { algorithm: "HS256" });
}

