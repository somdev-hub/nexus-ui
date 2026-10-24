import { NextRequest, NextResponse } from "next/server";
import {
  refreshSession,
  getSession,
  deleteSession,
  createSession
} from "@/lib/better-auth";
import { COOKIE_NAMES } from "@/lib/better-auth";
import { randomUUID } from "crypto";
import { getSpringBootClient } from "@/lib/spring-boot-client";

const SESSION_COOKIE_NAME = COOKIE_NAMES.SESSION;
const REFRESH_TOKEN_COOKIE_NAME = COOKIE_NAMES.REFRESH;
const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Missing refresh token" },
        { status: 401 }
      );
    }

    let session = null;
    if (sessionToken) {
      session = getSession(sessionToken);
    }

    try {
      const springBootClient = getSpringBootClient();
      const refreshResponse = await springBootClient.post(`/iam/auth/refresh`, {
        refreshToken
      });

      const {
        accessToken: newAccessToken,
        expiresIn,
        refreshToken: newRefreshToken,
        userId,
        email,
        name,
        role
      } = refreshResponse.data;

      let finalSessionToken = sessionToken;
      if (!finalSessionToken) {
        finalSessionToken = randomUUID();
      }

      if (session) {
        refreshSession(
          finalSessionToken,
          newAccessToken,
          expiresIn,
          newRefreshToken
        );
      } else {
        const user = {
          id: userId.toString(),
          email,
          name,
          role,
          avatar: `/avatars/${name}.jpg`
        };
        createSession(
          finalSessionToken,
          userId.toString(),
          user,
          newAccessToken,
          newRefreshToken,
          expiresIn
        );
      }

      const response = NextResponse.json({
        success: true,
        user: session?.user || {
          id: userId.toString(),
          email,
          name,
          role
        }
      });

      response.cookies.set(SESSION_COOKIE_NAME, finalSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: expiresIn,
        path: "/"
      });

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
      if (sessionToken) {
        deleteSession(sessionToken);
      }

      const response = NextResponse.json(
        { error: "Token refresh failed" },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);

      return response;
    }
  } catch (error) {
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}