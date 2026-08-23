import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  getSessionConfig,
  getAuthClient,
} from "@nexus/auth-nextjs/server";

/**
 * POST /api/auth/login
 * Login with email/password (ROPC flow via IAM service)
 * Delegates to @nexus/auth-nextjs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Get auth client
    const authClient = getAuthClient();

    // Call IAM service login endpoint (uses Keycloak Direct Access Grant internally)
    const loginResponse = await authClient.login({
      username: email,
      password,
      rememberMe: rememberMe ?? false,
    });

    // Create session with the tokens
    const sessionConfig = getSessionConfig();
    const response = NextResponse.json({
      success: true,
      user: loginResponse.user,
    });
    await createSession(response, {
      accessToken: loginResponse.tokens.accessToken,
      refreshToken: loginResponse.tokens.refreshToken,
      expiresIn: loginResponse.tokens.expiresIn,
      user: loginResponse.user,
      userAgent: request.headers.get("user-agent") || undefined,
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    response.cookies.set(
      sessionConfig.cookieName,
      JSON.stringify({
        isAuthenticated: true,
        accessToken: loginResponse.tokens.accessToken,
        refreshToken: loginResponse.tokens.refreshToken,
        expiresAt: Date.now() + loginResponse.tokens.expiresIn * 1000,
        user: loginResponse.user,
      }),
      {
        ...sessionConfig.cookieOptions,
        maxAge: loginResponse.tokens.expiresIn,
      },
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized") ||
        error.message.includes("Invalid credentials")
      ) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }
      if (
        error.message.includes("403") ||
        error.message.includes("Forbidden")
      ) {
        return NextResponse.json(
          { error: "Account disabled or access denied" },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 },
    );
  }
}
