import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSpringBootClient } from "@/lib/spring-boot-client";
import { createSession } from "@/lib/better-auth";
import { COOKIE_NAMES } from "@/lib/better-auth";
import { randomUUID } from "crypto";

const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const SESSION_COOKIE_NAME = COOKIE_NAMES.SESSION;
const REFRESH_TOKEN_COOKIE_NAME = COOKIE_NAMES.REFRESH;

export async function POST(request: NextRequest) {
  try {
    console.log("[AUTH LOGIN] Received login request");

    const { email, password } = await request.json();
    console.log("[AUTH LOGIN] Email:", email);

    if (!email || !password) {
      console.log("[AUTH LOGIN] Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    console.log("[AUTH LOGIN] Calling Spring Boot API:", SPRING_BOOT_API);

    const springBootClient = getSpringBootClient();
    const response = await springBootClient.post(
      `/iam/auth/login`,
      { email, password },
      {
        timeout: 30000,
      },
    );

    console.log("[AUTH LOGIN] Spring Boot response status:", response.status);

    const {
      accessToken,
      refreshToken,
      expiresIn,
      userId,
      orgId,
      name,
      role,
      email: userEmail,
    } = response.data;

    const user = {
      id: userId.toString(),
      email: userEmail,
      name,
      role,
      orgId: orgId.toString(),
      avatar: `/avatars/${name}.jpg`,
    };

    const sessionToken = randomUUID();

    console.log("[AUTH LOGIN] Generated sessionToken:", sessionToken);

    createSession(
      sessionToken,
      userId.toString(),
      user,
      accessToken,
      refreshToken,
      expiresIn,
    );

    console.log(
      "[AUTH LOGIN] Session created, preparing response with cookies",
    );

    const responseData = NextResponse.json({
      success: true,
      user,
    });

    responseData.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn,
      path: "/",
    });

    responseData.cookies.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    console.log("[AUTH LOGIN] Returning successful response");
    return responseData;
  } catch (error: unknown) {
    console.error("[AUTH LOGIN] Error:", error);

    if (axios.isAxiosError(error)) {
      console.error("[AUTH LOGIN] Axios error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });

      if (error.code === "ECONNABORTED") {
        return NextResponse.json(
          {
            error: `Spring Boot API timeout. Make sure Spring Boot is running at ${SPRING_BOOT_API}`,
          },
          { status: 503 },
        );
      }

      if (error.code === "ECONNREFUSED") {
        return NextResponse.json(
          {
            error: `Cannot connect to Spring Boot at ${SPRING_BOOT_API}. Make sure it's running.`,
          },
          { status: 503 },
        );
      }

      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { error: error.response?.data?.message || "Login failed" },
        { status: error.response?.status || 500 },
      );
    }

    console.error(
      "[AUTH LOGIN] Non-axios error:",
      error instanceof Error ? error.message : String(error),
    );

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
