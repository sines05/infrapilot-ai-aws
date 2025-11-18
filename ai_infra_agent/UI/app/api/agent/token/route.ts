import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * API Route để lấy Supabase JWT token cho WebSocket connection
 * Token này sẽ được dùng trong WebSocket query parameter
 */
export async function GET() {
  try {
    // Lấy NextAuth session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: User not authenticated" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email || "";
    
    // Tạo Supabase JWT token từ user_id
    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
    
    // Always return user_id as fallback
    const response: { token?: string; userId: string } = { userId };
    
    if (supabaseJwtSecret) {
      try {
        // Tạo Supabase JWT token
        const token = createSupabaseToken(userId, userEmail, supabaseJwtSecret);
        response.token = token;
      } catch (error) {
        console.warn("Failed to create Supabase token, using user_id only:", error);
      }
    }
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Tạo Supabase JWT token từ user_id và email
 */
function createSupabaseToken(userId: string, email: string, jwtSecret: string): string {
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

