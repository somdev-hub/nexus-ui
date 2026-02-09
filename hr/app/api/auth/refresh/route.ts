import { NextRequest, NextResponse } from "next/server";
import { refreshSession, getSession, deleteSession } from "@/lib/better-auth";
import axios from "axios";

const SESSION_COOKIE_NAME = "auth-session";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";
const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!sessionToken || !refreshToken) {
      return NextResponse.json(
        { error: "Missing session or refresh token" },
        { status: 401 }
      );
    }

    const session = getSession(sessionToken);

    if (!session) {
      const response = NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    try {
      // Call Spring Boot to refresh tokens
      const refreshResponse = await axios.post(
        `${SPRING_BOOT_API}/iam/auth/refresh`,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const {
        accessToken: newAccessToken,
        expiresIn,
        refreshToken: newRefreshToken
      } = refreshResponse.data;

      // Update session with new access token
      refreshSession(sessionToken, newAccessToken);

      // Create response with updated user data
      const response = NextResponse.json({
        success: true,
        user: session.user
      });

      // Update session expiry cookie
      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: expiresIn || 3600,
        path: "/"
      });

      // Update refresh token cookie if provided
      if (newRefreshToken) {
        response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60,
          path: "/"
        });
      }

      return response;
    } catch (refreshError: unknown) {
      // Refresh failed, clear session
      deleteSession(sessionToken);
      const response = NextResponse.json(
        { error: "Token refresh failed" },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);

      if (axios.isAxiosError(refreshError)) {
        return response;
      }

      throw refreshError;
    }
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
