import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getSession } from "@/lib/better-auth";

const SESSION_COOKIE_NAME = "auth-session";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      deleteSession(sessionToken);
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });

    // Clear cookies
    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}