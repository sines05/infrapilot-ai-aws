import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Missing password fields" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // 1. Lấy mật khẩu hiện tại trong DB
      const result = await client.query(
        "SELECT password FROM users WHERE id = $1",
        [userId]
      );

      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      const storedPassword = result.rows[0].password;

      // 2. So sánh mật khẩu
      if (storedPassword !== currentPassword) {
        return NextResponse.json(
          { error: "Incorrect current password" },
          { status: 400 }
        );
      }

      // 3. Cập nhật mật khẩu mới
      await client.query(
        "UPDATE users SET password = $1 WHERE id = $2",
        [newPassword, userId]
      );

      return NextResponse.json(
        { message: "Password updated successfully" },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
