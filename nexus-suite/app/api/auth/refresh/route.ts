import { NextRequest, NextResponse } from "next/server";
import {
  refreshSession,
  getSession,
  deleteSession,
  createSession,
} from "@/lib/better-auth";
import { COOKIE_NAMES } from "@/lib/better-auth";
import { randomUUID } from "crypto";
import axios from "axios";
import { getSpringBootClient } from "@/lib/spring-boot-client";

const SESSION_COOKIE_NAME = COOKIE_NAMES.SESSION;
const REFRESH_TOKEN_COOKIE_NAME = COOKIE_NAMES.REFRESH;
const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    console.log("[AUTH REFRESH] Refresh token request received");

    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    console.log("[AUTH REFRESH] Session token from cookies:", !!sessionToken);
    console.log("[AUTH REFRESH] Refresh token from cookies:", !!refreshToken);

    if (!refreshToken) {
      console.error("[AUTH REFRESH] Missing refresh token");
      return NextResponse.json(
        { error: "Missing refresh token" },
        { status: 401 },
      );
    }

    let session = null;
    if (sessionToken) {
      session = getSession(sessionToken);
      if (!session) {
        console.log(
          "[AUTH REFRESH] Session token provided but not found in memory",
        );
      }
    }

    try {
      console.log("[AUTH REFRESH] Calling Spring Boot refresh endpoint");

      const springBootClient = getSpringBootClient();
      const refreshResponse = await springBootClient.post(`/iam/auth/refresh`, {
        refreshToken,
      });

      console.log(
        "[AUTH REFRESH] Spring Boot response status:",
        refreshResponse.status,
      );

      const {
        accessToken: newAccessToken,
        expiresIn,
        refreshToken: newRefreshToken,
        userId,
        email,
        name,
        role,
        orgId,
      } = refreshResponse.data;

      console.log("[AUTH REFRESH] New token expiry (seconds):", expiresIn);

      let finalSessionToken = sessionToken;

      if (!finalSessionToken) {
        console.log(
          "[AUTH REFRESH] No session token in cookies, generating new one for recovery",
        );
        finalSessionToken = randomUUID();
      }

      if (session) {
        console.log("[AUTH REFRESH] Updating existing session");
        refreshSession(
          finalSessionToken,
          newAccessToken,
          expiresIn,
          newRefreshToken,
        );
      } else {
        console.log(
          "[AUTH REFRESH] Creating new session from refresh response",
        );

        const user = {
          id: userId.toString(),
          email,
          name,
          role,
          orgId: orgId.toString(),
          avatar: `/avatars/${name}.jpg`,
        };

        createSession(
          finalSessionToken,
          userId.toString(),
          user,
          newAccessToken,
          newRefreshToken,
          expiresIn,
        );
      }

      const response = NextResponse.json({
        success: true,
        user: session?.user || {
          id: userId.toString(),
          email,
          name,
          role,
          orgId: orgId.toString(),
        },
      });

      response.cookies.set(SESSION_COOKIE_NAME, finalSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: expiresIn,
        path: "/",
      });

      if (newRefreshToken) {
        response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        });
      }

      console.log("[AUTH REFRESH] Session refresh completed successfully");
      return response;
    } catch (refreshError: unknown) {
      console.error("[AUTH REFRESH] Refresh failed:", refreshError);

      if (axios.isAxiosError(refreshError)) {
        console.error(
          "[AUTH REFRESH] Axios error status:",
          refreshError.response?.status,
        );
        console.error(
          "[AUTH REFRESH] Axios error data:",
          refreshError.response?.data,
        );
      }

      if (sessionToken) {
        deleteSession(sessionToken);
      }

      const response = NextResponse.json(
        { error: "Token refresh failed" },
        { status: 401 },
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);

      return response;
    }
  } catch (error) {
    console.error("[AUTH REFRESH] Unexpected error:", error);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
