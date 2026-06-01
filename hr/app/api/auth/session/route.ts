import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/better-auth";
import axios from "axios";
import { createSession, deleteSession } from "@/lib/better-auth";
import { randomUUID } from "crypto";

const SESSION_COOKIE_NAME = "auth-session";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";
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
      // Session exists in memory - return it
      console.log("[AUTH SESSION] Session found in memory");
      return NextResponse.json({
        success: true,
        user: session.user,
        sessionExpiry: session.expiresAt
      });
    }

    // Session not in memory - try to recover using refresh token
    console.log(
      "[AUTH SESSION] Session not in memory, attempting recovery with refresh token"
    );

    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!refreshToken) {
      console.log("[AUTH SESSION] No refresh token available, session is lost");
      // Clear invalid session cookie
      const response = NextResponse.json(
        { error: "Session expired and cannot be recovered" },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    // Attempt to recover the session
    try {
      console.log(
        "[AUTH SESSION] Calling Spring Boot to validate and refresh token"
      );
      const refreshResponse = await axios.post(
        `${SPRING_BOOT_API}/iam/auth/refresh`,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 5000
        }
      );

      console.log(
        "[AUTH SESSION] Refresh response received:",
        JSON.stringify(refreshResponse.data, null, 2)
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
        role
      } = refreshResponse.data;

      // Validate required fields from refresh response
      if (!newAccessToken || !expiresIn) {
        console.log(
          "[AUTH SESSION] Refresh response missing accessToken or expiresIn"
        );
        console.log(
          "[AUTH SESSION] Response data keys:",
          Object.keys(refreshResponse.data)
        );
        throw new Error("Invalid refresh response from Spring Boot");
      }

      // Validate that all required user fields are present
      if (!userId || !email || !name || !role) {
        console.error(
          "[AUTH SESSION] Missing required user data from refresh response:",
          {
            hasUserId: !!userId,
            hasEmail: !!email,
            hasName: !!name,
            hasRole: !!role,
            hasOrgId: !!orgId
          }
        );
        throw new Error("Refresh response missing required user data");
      }

      const finalUserId = userId;
      const finalEmail = email;
      const finalName = name;
      const finalRole = role;
      const finalOrgId = orgId;
      const finalPhone = phone;
      // Create user object
      const user = {
        id: finalUserId.toString(),
        email: finalEmail,
        name: finalName,
        role: finalRole,
        orgId: finalOrgId.toString(),
        avatar: `/avatars/${finalName}.jpg`,
        phone: finalPhone
      };

      // Generate new session token
      const newSessionToken = randomUUID();

      console.log(
        "[AUTH SESSION] Session recovered, creating new in-memory session"
      );
      console.log("[AUTH SESSION] Recovered user:", {
        id: finalUserId,
        email: finalEmail,
        name: finalName,
        role: finalRole,
        orgId: finalOrgId,
        phone: finalPhone
      });

      // Create session in memory
      createSession(
        newSessionToken,
        finalUserId.toString(),
        user,
        newAccessToken,
        newRefreshToken,
        expiresIn
      );

      // Return the recovered session
      const response = NextResponse.json({
        success: true,
        user,
        recovered: true,
        sessionExpiry: new Date(Date.now() + expiresIn * 1000)
      });

      // Set new session cookie
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

      console.log("[AUTH SESSION] Session successfully recovered");
      return response;
    } catch (recoveryError: unknown) {
      console.error("[AUTH SESSION] Session recovery failed:", recoveryError);

      if (axios.isAxiosError(recoveryError)) {
        console.error(
          "[AUTH SESSION] Recovery error status:",
          recoveryError.response?.status
        );
      }

      // Recovery failed - session is lost
      const response = NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
      return response;
    }
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Session check failed" },
      { status: 500 }
    );
  }
}
