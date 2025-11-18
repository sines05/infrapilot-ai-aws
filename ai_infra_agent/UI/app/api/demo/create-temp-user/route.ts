// app/api/demo/create-temp-user/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

/** Tạo password ngẫu nhiên an toàn */
function generateRandomPassword(length = 16) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_+=<>?";
  let out = "";
  const cryptoObj = typeof globalThis?.crypto !== "undefined" ? globalThis.crypto : null;
  for (let i = 0; i < length; i++) {
    const rand = cryptoObj
      ? cryptoObj.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
      : Math.random();
    out += chars[Math.floor(rand * chars.length)];
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, any>));

    const timestamp = Date.now();
    const email = `temp-${timestamp}@demo.com`;
    const password = generateRandomPassword();

    // Insert user demo
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([
        {
          name: "Demo User",
          email,
          password, // Cảnh báo: Mật khẩu plain text, chỉ chấp nhận được cho user tạm thời
          aws_access_key: "",
          aws_secret_key: "",
          aws_region: "",
          google_api_key: "",
          is_demo: true, // Đánh dấu là user demo
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error (create-temp-user):", error);
      return NextResponse.json(
        { error: error.message || "Insert failed" },
        { status: 500 }
      );
    }

    // Trả về user và password để tự động đăng nhập ở client
    return NextResponse.json({ user: data, password });
  } catch (err) {
    console.error("create-temp-user error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}