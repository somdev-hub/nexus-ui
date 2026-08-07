import { NextRequest, NextResponse } from "next/server";
import {
  getSessionFromRequest,
  updateSessionTokens,
  getAuthClient,
} from "@nexus/auth-nextjs/server";

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Delegates to @nexus/auth-nextjs
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[AUTH REFRESH] Refresh token request received");

    // Get session from request
    const session = await getSessionFromRequest(request);

    if (!session || !session.refreshToken) {
      console.error("[AUTH REFRESH] Missing session or refresh token");
      return NextResponse.json(
        { error: "Missing refresh token" },
        { status: 401 },
      );
    }

    // Get auth client
    const authClient = getAuthClient();

    // Call IAM service refresh endpoint
    const refreshResponse = await authClient.refreshToken(session.refreshToken);

    // Update session with new tokens
    const response = NextResponse.json({
      success: true,
      accessToken: refreshResponse.accessToken,
      expiresIn: refreshResponse.expiresIn,
    });

    await updateSessionTokens(response, {
      accessToken: refreshResponse.accessToken,
      refreshToken: refreshResponse.refreshToken,
      expiresIn: refreshResponse.expiresIn,
    });

    return response;
  } catch (error) {
    console.error("[AUTH REFRESH] Error:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized") ||
        error.message.includes("Invalid refresh token")
      ) {
        return NextResponse.json(
          { error: "Session expired. Please log in again." },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      { error: "Token refresh failed. Please log in again." },
      { status: 500 },
    );
  }
}
