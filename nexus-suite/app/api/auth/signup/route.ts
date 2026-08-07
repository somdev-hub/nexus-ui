import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  getSessionConfig,
  getApplicantAuthClient,
} from "@nexus/auth-nextjs/server";

/**
 * POST /api/auth/signup
 * Register new applicant (via IAM service)
 * Delegates to @nexus/auth-nextjs
 */
export async function POST(request: NextRequest) {
  try {
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

    // Get auth client for applicant registration
    const authClient = getApplicantAuthClient();

    // Extract name parts
    const fullName = (body.name as string) || "";
    const firstName = fullName.split(" ")[0] || fullName;
    const lastName = fullName.split(" ").slice(1).join(" ") || "";

    // Call IAM service register endpoint for applicants
    const registerResponse = await authClient.registerApplicant({
      username: body.email as string,
      email: body.email as string,
      password: body.password as string,
      firstName,
      lastName,
      // Forward additional fields matching ApplicantRegisterDto
      phone: body.phone as string,
      address: body.address as string,
      city: body.city as string,
      state: body.state as string,
      country: body.country as string,
      pincode: body.pincode as string,
      gender: body.gender as "MALE" | "FEMALE" | "OTHER",
      age: body.age as number,
      dateOfBirth: body.dateOfBirth as string,
      personalEmail: body.personalEmail as string,
    });

    // Create session with the tokens
    const sessionConfig = getSessionConfig();
    const response = NextResponse.json({
      success: true,
      user: registerResponse.user,
    });
    await createSession(response, {
      accessToken: registerResponse.tokens.accessToken,
      refreshToken: registerResponse.tokens.refreshToken,
      expiresIn: registerResponse.tokens.expiresIn,
      user: registerResponse.user,
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
        accessToken: registerResponse.tokens.accessToken,
        refreshToken: registerResponse.tokens.refreshToken,
        expiresAt: Date.now() + registerResponse.tokens.expiresIn * 1000,
        user: registerResponse.user,
      }),
      {
        ...sessionConfig.cookieOptions,
        maxAge: registerResponse.tokens.expiresIn,
      },
    );

    return response;
  } catch (error) {
    console.error("Signup error:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("409") ||
        error.message.includes("Conflict") ||
        error.message.includes("already exists")
      ) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 },
        );
      }
      if (
        error.message.includes("400") ||
        error.message.includes("Bad Request")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
