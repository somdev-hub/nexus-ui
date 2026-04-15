import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSpringBootClient } from "@/lib/spring-boot-client";
import { createSession } from "@/lib/better-auth";
import { randomUUID } from "crypto";

const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const SESSION_COOKIE_NAME = "auth-session";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";

export async function POST(request: NextRequest) {
  try {
    console.log("[AUTH SIGNUP] Received signup request");

    const contentType = request.headers.get("content-type");
    const formData = await request.formData();

    console.log("[AUTH SIGNUP] Content-Type:", contentType);
    console.log("[AUTH SIGNUP] Calling Spring Boot API:", SPRING_BOOT_API);

    // Create FormData for Spring Boot
    const springBootFormData = new FormData();

    // Copy all form fields from request to spring boot form
    for (const [key, value] of formData.entries()) {
      springBootFormData.append(key, value);
    }

    // Call Spring Boot backend for registration using centralized client
    const springBootClient = getSpringBootClient();
    const response = await springBootClient.post(
      `/iam/auth/register`,
      springBootFormData,
      {
        headers: {
          // Let axios set Content-Type with proper boundary for FormData
          "Content-Type": "multipart/form-data"
        },
        timeout: 90000 // 90 second timeout for file uploads and processing
      }
    );

    console.log("[AUTH SIGNUP] Spring Boot response status:", response.status);
    console.log("[AUTH SIGNUP] Spring Boot response data:", response.data);

    const {
      accessToken,
      refreshToken,
      expiresIn,
      userId,
      orgId,
      name,
      role,
      email: userEmail
    } = response.data;

    // Create user object
    const user = {
      id: userId.toString(),
      email: userEmail,
      name,
      role,
      orgId: orgId.toString(),
      avatar: `/avatars/${name}.jpg`
    };

    // Generate session token
    const sessionToken = randomUUID();

    console.log("[AUTH SIGNUP] Generated sessionToken:", sessionToken);

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
      "[AUTH SIGNUP] Session created, preparing response with cookies"
    );

    // Create response with user data
    const responseData = NextResponse.json({
      success: true,
      user,
      tokenType: "Bearer",
      expiresIn
    });

    // Set secure session cookie (HttpOnly, Secure, SameSite)
    responseData.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn,
      path: "/"
    });

    console.log("[AUTH SIGNUP] Session cookie set with token:", sessionToken);

    // Set refresh token in separate HttpOnly cookie
    responseData.cookies.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/"
    });

    console.log("[AUTH SIGNUP] Returning successful response");
    return responseData;
  } catch (error: unknown) {
    console.error("[AUTH SIGNUP] Error:", error);

    if (axios.isAxiosError(error)) {
      console.error("[AUTH SIGNUP] Axios error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });

      // Return Spring Boot error response
      return NextResponse.json(
        error.response?.data || { error: "Signup failed" },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Signup failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}
