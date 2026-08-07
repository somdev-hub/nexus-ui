import { NextRequest, NextResponse } from "next/server";
import {
  getSessionFromRequest,
  createSession,
  getAuthClient,
} from "@nexus/auth-nextjs/server";

/**
 * GET /api/auth/session
 * Get current session from cookies
 * Delegates to @nexus/auth-nextjs
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from request
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 },
      );
    }

    // If session exists but no access token, try to recover
    if (!session.accessToken && session.refreshToken) {
      console.log("[AUTH SESSION] No access token, attempting recovery...");

      try {
        const authClient = getAuthClient();
        const refreshResponse = await authClient.refreshToken(
          session.refreshToken,
        );

        // Create new session with refreshed tokens
        const response = NextResponse.json({
          authenticated: true,
          user: session.user,
        });

        await createSession(response, {
          accessToken: refreshResponse.accessToken,
          refreshToken: refreshResponse.refreshToken,
          expiresIn: refreshResponse.expiresIn,
          user: session.user,
        });

        return response;
      } catch (refreshError) {
        console.error("[AUTH SESSION] Token recovery failed:", refreshError);
        return NextResponse.json(
          { authenticated: false, user: null },
          { status: 200 },
        );
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
    });
  } catch (error) {
    console.error("[AUTH SESSION] Error:", error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 },
    );
  }
}
