import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// This is a proxy route to call the backend's /resources endpoint.
// It attaches the necessary authentication headers.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email || "";
    
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
    
    const headers: Record<string, string> = {
      "X-User-Id": userId,
    };
    
    if (supabaseJwtSecret) {
      try {
        const token = jwt.sign({ sub: userId, email: userEmail, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 }, supabaseJwtSecret);
        headers["Authorization"] = `Bearer ${token}`;
      } catch (error) {
        console.warn("Failed to create Supabase token for resources proxy:", error);
      }
    }
    
    const response = await fetch(`${backendUrl}/api/v1/agent/resources`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Backend server error" }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error in resources proxy route:", error);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
