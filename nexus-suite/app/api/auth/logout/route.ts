import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@nexus/auth-nextjs/server";

/**
 * POST /api/auth/logout
 * Logout and destroy session
 * Delegates to @nexus/auth-nextjs
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    await destroySession(response);
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
