// File: app/api/auth/delete/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const client = await pool.connect();
    try {
      const result = await client.query(
        "DELETE FROM users WHERE id = $1 RETURNING id",
        [userId]
      );

      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: "User not found or already deleted." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: "Account successfully deleted.",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
