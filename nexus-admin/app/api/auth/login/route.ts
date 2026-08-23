import { NextRequest, NextResponse } from "next/server";
import { getSpringBootClient } from "@/lib/spring-boot-client";
import { createSession } from "@/lib/better-auth";
import { COOKIE_NAMES } from "@/lib/better-auth";
import { randomUUID } from "crypto";

const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Use module-specific cookie names
const SESSION_COOKIE_NAME = COOKIE_NAMES.SESSION;
const REFRESH_TOKEN_COOKIE_NAME = COOKIE_NAMES.REFRESH;

export async function POST(request: NextRequest) {
  try {
    console.log("[AUTH LOGIN ADMIN] Received login request");

    const { email, password } = await request.json();
    console.log("[AUTH LOGIN ADMIN] Email:", email);

    if (!email || !password) {
      console.log("[AUTH LOGIN ADMIN] Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("[AUTH LOGIN ADMIN] Calling Spring Boot API:", SPRING_BOOT_API);

    // Call Spring Boot backend for authentication using centralized client
    const springBootClient = getSpringBootClient();
    const response = await springBootClient.post(
      `/iam/auth/login/admin`,
      { email, password },
      {
        timeout: 30000 // 30 second timeout for debugging
      }
    );

    console.log("[AUTH LOGIN ADMIN] Spring Boot response status:", response.status);
    console.log("[AUTH LOGIN ADMIN] Spring Boot response data:", response.data);

    const {
      accessToken,
      refreshToken,
      expiresIn,
      email: userEmail,
      userId,
      name,
      role,
      profilePhoto
    } = response.data;

    // Create user object
    const user = {
      id: userId.toString(),
      email: userEmail,
      name,
      role,
      avatar: profilePhoto
    };

    // Generate session token
    const sessionToken = randomUUID();

    console.log("[AUTH LOGIN ADMIN] Generated sessionToken:", sessionToken);

    // Create session (stored in memory with encryption)
    createSession(
      sessionToken,
      userId.toString(),
      user,
      accessToken,
      refreshToken,
      expiresIn
    );

    console.log(
      "[AUTH LOGIN ADMIN] Session created, preparing response with cookies"
    );

    // Create response with user data
    const responseData = NextResponse.json({
      success: true,
      user
    });

    // Set secure session cookie (HttpOnly, Secure, SameSite)
    responseData.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn,
      path: "/"
    });

    console.log("[AUTH LOGIN ADMIN] Session cookie set with token:", sessionToken);
    console.log("[AUTH LOGIN ADMIN] Cookie name:", SESSION_COOKIE_NAME);
    console.log("[AUTH LOGIN ADMIN] Cookie options:", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn,
      path: "/"
    });

    // Set refresh token in separate HttpOnly cookie
    responseData.cookies.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/"
    });

    console.log("[AUTH LOGIN ADMIN] Refresh cookie set");
    console.log("[AUTH LOGIN ADMIN] Refresh cookie name:", REFRESH_TOKEN_COOKIE_NAME);

    console.log("[AUTH LOGIN ADMIN] Returning successful response");
    return responseData;
  } catch (error: unknown) {
    console.error("[AUTH LOGIN ADMIN] Error:", error);

    if (error instanceof Error && "response" in error) {
      const axiosError = error as { response?: { status?: number; data?: unknown }; code?: string };
      console.error("[AUTH LOGIN ADMIN] Axios error:", {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: error.message,
        code: axiosError.code
      });

      // Handle timeout specifically
      if (axiosError.code === "ECONNABORTED") {
        console.error(
          `[AUTH LOGIN ADMIN] Request timeout - Spring Boot at ${SPRING_BOOT_API} is not responding`
        );
        return NextResponse.json(
          {
            error: `Spring Boot API timeout. Make sure Spring Boot is running at ${SPRING_BOOT_API}`
          },
          { status: 503 }
        );
      }

      // Handle connection refused
      if (axiosError.code === "ECONNREFUSED") {
        console.error(
          `[AUTH LOGIN ADMIN] Connection refused - Spring Boot at ${SPRING_BOOT_API} is not reachable`
        );
        return NextResponse.json(
          {
            error: `Cannot connect to Spring Boot at ${SPRING_BOOT_API}. Make sure it's running.`
          },
          { status: 503 }
        );
      }

      if (axiosError.response?.status === 401) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: (axiosError.response?.data as { message?: string })?.message || "Login failed" },
        { status: axiosError.response?.status || 500 }
      );
    }

    console.error(
      "[AUTH LOGIN ADMIN] Non-axios error:",
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}