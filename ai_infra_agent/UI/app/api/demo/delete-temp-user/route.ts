// app/api/demo/delete-temp-user/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Ép kiểu để truy cập các thuộc tính tùy chỉnh
    const user = session?.user as { id?: string; is_demo?: boolean };

    // Yêu cầu phải đăng nhập, phải là user demo
    if (!user || !user.id || user.is_demo !== true) {
      return NextResponse.json({ error: "Unauthorized or not a demo user" }, { status: 403 });
    }
    
    const { userId } = await req.json();

    // ID từ body phải khớp với ID trong session để tránh giả mạo
    if (!userId || userId !== user.id) {
       return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Xóa user khỏi CSDL
    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId)
      .eq("is_demo", true); // Thêm một lớp bảo vệ

    if (error) {
      console.error("Error deleting temp user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Internal server error in delete-temp-user:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}