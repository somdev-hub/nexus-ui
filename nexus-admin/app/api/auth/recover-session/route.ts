import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createSession, getSession } from "@/lib/better-auth";
import { randomUUID } from "crypto";

const SESSION_COOKIE_NAME = "auth-session";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";
const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    console.log("[AUTH RECOVER ADMIN] Session recovery request received");

    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // Check if session already exists in memory
    if (sessionToken) {
      const existingSession = getSession(sessionToken);
      if (existingSession) {
        console.log("[AUTH RECOVER ADMIN] Session already exists in memory");
        return NextResponse.json({
          success: true,
          user: existingSession.user,
          recovered: false
        });
      }
    }

    if (!refreshToken) {
      console.error("[AUTH RECOVER ADMIN] No refresh token found");
      return NextResponse.json(
        { error: "No refresh token available" },
        { status: 401 }
      );
    }

    console.log("[AUTH RECOVER ADMIN] Attempting to recover session using refresh token");

    try {
      // Call Spring Boot to validate and refresh the token
      const refreshResponse = await axios.post(
        `${SPRING_BOOT_API}/iam/auth/refresh`,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      console.log(
        "[AUTH RECOVER ADMIN] Spring Boot refresh response status:",
        refreshResponse.status
      );

      const {
        accessToken: newAccessToken,
        expiresIn,
        refreshToken: newRefreshToken,
        userId,
        email,
        name,
        role
      } = refreshResponse.data;

      // Create user object
      const user = {
        id: userId.toString(),
        email,
        name,
        role,
        avatar: `/avatars/${name}.jpg`
      };

      // Generate new session token
      const newSessionToken = randomUUID();

      console.log("[AUTH RECOVER ADMIN] Creating recovered session with new token");

      // Create session in memory
      createSession(
        newSessionToken,
        userId.toString(),
        user,
        newAccessToken,
        newRefreshToken,
        expiresIn
      );

      // Create response with user data
      const response = NextResponse.json({
        success: true,
        user,
        recovered: true
      });

      // Set session cookie with new token
      response.cookies.set(SESSION_COOKIE_NAME, newSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: expiresIn,
        path: "/"
      });

      // Update refresh token if provided
      if (newRefreshToken) {
        response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60,
          path: "/"
        });
      }

      console.log("[AUTH RECOVER ADMIN] Session successfully recovered");
      return response;
    } catch (refreshError: unknown) {
      console.error("[AUTH RECOVER ADMIN] Recovery failed:", refreshError);

      if (axios.isAxiosError(refreshError)) {
        console.error(
          "[AUTH RECOVER ADMIN] Axios error status:",
          refreshError.response?.status
        );
        console.error(
          "[AUTH RECOVER ADMIN] Axios error data:",
          refreshError.response?.data
        );
      }

      // Clear invalid cookies
      const response = NextResponse.json(
        { error: "Session recovery failed" },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
      return response;
    }
  } catch (error) {
    console.error("[AUTH RECOVER ADMIN] Unexpected error:", error);
    return NextResponse.json(
      { error: "Session recovery error" },
      { status: 500 }
    );
  }
}