// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  } as any,
});

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin." }, { status: 400 });
    }

    // validate email cơ bản
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // check email đã tồn tại chưa
      const { rows: existing } = await client.query(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        [email]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Email này đã được sử dụng." },
          { status: 409 }
        );
      }

      // INSERT trực tiếp password (KHÔNG HASH)
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, name, email`,
        [name, email, password]
      );

      return NextResponse.json({ user: rows[0] }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("/api/auth/signup error:", err?.message ?? err);
    if (err?.stack) console.error(err.stack);
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ." },
      { status: 500 }
    );
  }
}
