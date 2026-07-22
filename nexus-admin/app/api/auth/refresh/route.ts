import { NextRequest, NextResponse } from "next/server";
import { getSession, refreshSession } from "@/lib/better-auth";
import { getSpringBootClient } from "@/lib/spring-boot-client";

const SESSION_COOKIE_NAME = "auth-session";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";

export async function POST(request: NextRequest) {
  try {
    console.log("[AUTH REFRESH] Received refresh request");

    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!sessionToken) {
      console.log("[AUTH REFRESH] No session token in cookies");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!refreshToken) {
      console.log("[AUTH REFRESH] No refresh token in cookies");
      return NextResponse.json(
        { error: "Refresh token not available" },
        { status: 401 }
      );
    }

    // Get current session
    const session = getSession(sessionToken);
    if (!session) {
      console.log("[AUTH REFRESH] Session not found or expired");
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    console.log("[AUTH REFRESH] Calling Spring Boot to refresh tokens");

    // Call Spring Boot to refresh tokens
    const springBootClient = getSpringBootClient();
    const response = await springBootClient.post(`/iam/auth/refresh`, {
      refreshToken
    });

    const {
      accessToken: newAccessToken,
      expiresIn,
      refreshToken: newRefreshToken
    } = response.data;

    console.log(
      "[AUTH REFRESH] Token refresh successful, new expiry:",
      expiresIn
    );

    // Update session with new tokens
    refreshSession(sessionToken, newAccessToken, expiresIn, newRefreshToken);

    // Create response
    const responseData = NextResponse.json({
      success: true,
      expiresIn
    });

    // Update refresh token cookie if new one provided
    if (newRefreshToken) {
      responseData.cookies.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/"
      });
    }

    return responseData;
  } catch (error: unknown) {
    console.error("[AUTH REFRESH] Error:", error);

    if (error instanceof Error && "response" in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown }; message: string };
      console.error("[AUTH REFRESH] Axios error:", {
        status: axiosError.response?.status,
          data: axiosError.response?.data as Record<string, unknown> | undefined,
        message: axiosError.message
      });

      if (axiosError.response?.status === 401) {
        return NextResponse.json(
          { error: "Refresh token expired, please login again" },
          { status: 401 }
        );
      }
            const errorData = axiosError.response?.data as { message?: string } | undefined;
            return NextResponse.json(
              { error: errorData?.message || "Token refresh failed" },
              { status: axiosError.response?.status || 500 }
            );
    }

    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 });
  }
}