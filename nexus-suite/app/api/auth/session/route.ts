import { COOKIE_NAMES, createSession, getSession } from "@/lib/better-auth";
import axios from "axios";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = COOKIE_NAMES.SESSION;
const REFRESH_TOKEN_COOKIE_NAME = COOKIE_NAMES.REFRESH;
const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = getSession(sessionToken);

    if (session) {
      console.log("[AUTH SESSION] Session found in memory");
      return NextResponse.json({
        success: true,
        user: session.user,
        sessionExpiry: session.expiresAt,
        expiresAt: session.expiresAt,
      });
    }

    console.log(
      "[AUTH SESSION] Session not in memory, attempting recovery with refresh token",
    );

    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!refreshToken) {
      console.log("[AUTH SESSION] No refresh token available, session is lost");
      const response = NextResponse.json(
        { error: "Session expired and cannot be recovered" },
        { status: 401 },
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    try {
      console.log(
        "[AUTH SESSION] Calling Spring Boot to validate and refresh token",
      );
      const refreshResponse = await axios.post(
        `${SPRING_BOOT_API}/iam/auth/refresh`,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 5000,
        },
      );

      console.log(
        "[AUTH SESSION] Refresh response received:",
        JSON.stringify(refreshResponse.data, null, 2),
      );

      const {
        accessToken: newAccessToken,
        expiresIn,
        refreshToken: newRefreshToken,
        userId,
        orgId,
        email,
        phone,
        name,
        role,
      } = refreshResponse.data;

      if (!newAccessToken || !expiresIn) {
        throw new Error("Invalid refresh response from Spring Boot");
      }

      if (!userId || !email || !name || !role) {
        console.error(
          "[AUTH SESSION] Missing required user data from refresh response:",
          {
            hasUserId: !!userId,
            hasEmail: !!email,
            hasName: !!name,
            hasRole: !!role,
            hasOrgId: !!orgId,
          },
        );
        throw new Error("Refresh response missing required user data");
      }

      const user = {
        id: userId.toString(),
        email,
        name,
        role,
        orgId: orgId.toString(),
        avatar: `/avatars/${name}.jpg`,
        phone,
      };

      const newSessionToken = randomUUID();

      console.log(
        "[AUTH SESSION] Session recovered, creating new in-memory session",
      );

      createSession(
        newSessionToken,
        userId.toString(),
        user,
        newAccessToken,
        newRefreshToken,
        expiresIn,
      );

      const response = NextResponse.json({
        success: true,
        user,
        recovered: true,
        sessionExpiry: new Date(Date.now() + expiresIn * 1000),
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      });

      response.cookies.set(SESSION_COOKIE_NAME, newSessionToken, {
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

      console.log("[AUTH SESSION] Session successfully recovered");
      return response;
    } catch (recoveryError: unknown) {
      console.error("[AUTH SESSION] Session recovery failed:", recoveryError);

      if (axios.isAxiosError(recoveryError)) {
        console.error(
          "[AUTH SESSION] Recovery error status:",
          recoveryError.response?.status,
        );
      }

      const response = NextResponse.json(
        { error: "Session expired" },
        { status: 401 },
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
      return response;
    }
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Session check failed" },
      { status: 500 },
    );
  }
}
