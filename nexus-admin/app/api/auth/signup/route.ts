import { NextRequest, NextResponse } from "next/server";
import { getSpringBootClient } from "@/lib/spring-boot-client";
import { createSession } from "@/lib/better-auth";
import { randomUUID } from "crypto";

const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const SESSION_COOKIE_NAME = "auth-session";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";

export async function POST(request: NextRequest) {
  try {
    console.log("[AUTH SIGNUP ADMIN] Received signup request");

    const contentType = request.headers.get("content-type");
    let body: Record<string, unknown>;

    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {};
      for (const [key, value] of formData.entries()) {
        body[key] = value;
      }
    } else {
      body = await request.json();
    }

    console.log("[AUTH SIGNUP ADMIN] Content-Type:", contentType);
    console.log("[AUTH SIGNUP ADMIN] Calling Spring Boot API:", SPRING_BOOT_API);

    // Call Spring Boot backend for registration using centralized client
    const springBootClient = getSpringBootClient();
    const response = await springBootClient.post(
      `/iam/auth/register/admin`,
      {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        pincode: body.pincode,
        gender: body.gender,
        age: body.age,
        dateOfBirth: body.dateOfBirth,
        password: body.password,
      },
      {
        timeout: 30000 // 30 second timeout
      }
    );

    console.log("[AUTH SIGNUP ADMIN] Spring Boot response status:", response.status);
    console.log("[AUTH SIGNUP ADMIN] Spring Boot response data:", response.data);

    const {
      accessToken,
      refreshToken,
      expiresIn,
      email,
      userId,
      name,
      role,
      profilePhoto
    } = response.data;

    // Create user object
    const user = {
      id: userId.toString(),
      email,
      name,
      role,
      avatar: profilePhoto
    };

    // Generate session token
    const sessionToken = randomUUID();

    console.log("[AUTH SIGNUP ADMIN] Generated sessionToken:", sessionToken);

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
      "[AUTH SIGNUP ADMIN] Session created, preparing response with cookies"
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

    console.log("[AUTH SIGNUP ADMIN] Session cookie set with token:", sessionToken);

    // Set refresh token in separate HttpOnly cookie
    responseData.cookies.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/"
    });

    console.log("[AUTH SIGNUP ADMIN] Returning successful response");
    return responseData;
  } catch (error: unknown) {
    console.error("[AUTH SIGNUP ADMIN] Error:", error);

    if (error instanceof Error && "response" in error) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      console.error("[AUTH SIGNUP ADMIN] Axios error:", {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: error.message,
        code: (error as { code?: string }).code
      });

      // Return Spring Boot error response
      return NextResponse.json(
        axiosError.response?.data || { error: "Signup failed" },
        { status: axiosError.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Signup failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}