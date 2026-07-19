import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/better-auth";

const SESSION_COOKIE_NAME = "auth-session";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";

export async function POST(request: NextRequest) {
  try {
    console.log("[AUTH LOGOUT] Received logout request");

    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      // Delete session from server-side storage
      deleteSession(sessionToken);
      console.log("[AUTH LOGOUT] Session deleted for token:", sessionToken);
    }

    // Create response
    const response = NextResponse.json({ success: true });

    // Clear session cookie
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/"
    });

    // Clear refresh token cookie
    response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/"
    });

    console.log("[AUTH LOGOUT] Cookies cleared, returning success");
    return response;
  } catch (error: unknown) {
    console.error("[AUTH LOGOUT] Error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}