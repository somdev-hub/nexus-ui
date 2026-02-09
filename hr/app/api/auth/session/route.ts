import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/better-auth";

const SESSION_COOKIE_NAME = "auth-session";

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = getSession(sessionToken);

    if (!session) {
      // Clear invalid session cookie
      const response = NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    // Return user data and session info (but not tokens)
    return NextResponse.json({
      success: true,
      user: session.user,
      sessionExpiry: session.expiresAt
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Session check failed" },
      { status: 500 }
    );
  }
}
