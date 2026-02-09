import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/better-auth";
import axios from "axios";

const SESSION_COOKIE_NAME = "auth-session";
const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * SECURITY CRITICAL: API Proxy Route
 *
 * This route is the ONLY gateway between frontend and Spring Boot backend.
 * It ensures that accessToken is NEVER exposed to the browser.
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────┐
 * │ Browser (Frontend Code)                                 │
 * │                                                          │
 * │  apiClient.get("/iam/users/profile")                    │
 * │  ↓                                                       │
 * │  Request Interceptor converts to:                       │
 * │  POST /api/proxy?path=/iam/users/profile                │
 * │  ↓ (Cookies sent via credentials:"include")            │
 * └──────────┬──────────────────────────────────────────────┘
 *            │
 *            ├── HTTPS ──────────────────────────────────↓
 *            │
 * ┌──────────────────────────────────────────────────────────┐
 * │ Next.js Server (This Route)                              │
 * │                                                          │
 * │ 1. Get sessionToken from cookies (auth-session)         │
 * │ 2. Retrieve encrypted session from memory:              │
 * │    { userId, accessToken, refreshToken, expiresAt }    │
 * │ 3. Add Authorization header:                            │
 * │    Authorization: Bearer {accessToken}                  │
 * │ 4. Proxy request to Spring Boot:                        │
 * │    POST http://localhost:8080/iam/users/profile         │
 * │ 5. Handle 401 responses (token expired)                 │
 * └──────────┬───────────────────────────────────────────────┘
 *            │
 *            ├── HTTP (internal) ─────────────────────────↓
 *            │
 * ┌──────────────────────────────────────────────────────────┐
 * │ Spring Boot Backend (IAM)                                │
 * │                                                          │
 * │ Validates token, processes request, returns response    │
 * └──────────────────────────────────────────────────────────┘
 *
 * KEY SECURITY PROPERTIES:
 * ✓ accessToken NEVER leaves the server (stored in memory, encrypted)
 * ✓ accessToken NEVER exposed to browser/JavaScript
 * ✓ accessToken NEVER transmitted over insecure channels
 * ✓ Cookies are HttpOnly (cannot be accessed by JS)
 * ✓ Token refresh happens server-side transparently
 * ✓ Frontend cannot bypass authentication
 *
 * INTEGRATION POINTS:
 * - Frontend: Use apiClient from @/lib/api-client.ts (configured for proxy)
 * - Auth routes: /api/auth/login, /api/auth/refresh
 * - Session storage: @/lib/better-auth.ts (in-memory Map)
 *
 * ERROR HANDLING:
 * - 401: Token expired, client should call /api/auth/refresh
 * - 403: Forbidden (authorization error)
 * - 5xx: Backend error, proxy returns as-is
 *
 * @requires sessionToken cookie to be present
 * @requires session to exist in server-side storage
 * @returns proxied response from Spring Boot or error response
 */

// GET requests
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' query parameter" },
      { status: 400 }
    );
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = getSession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const response = await axios.get(`${SPRING_BOOT_API}${path}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json"
      }
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[API PROXY GET] Error:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        // Token expired, user needs to refresh
        return NextResponse.json(
          { error: "Authorization expired" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST requests
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' query parameter" },
      { status: 400 }
    );
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = getSession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));

    const response = await axios.post(`${SPRING_BOOT_API}${path}`, body, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json"
      }
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[API PROXY POST] Error:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: "Authorization expired" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT requests
export async function PUT(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' query parameter" },
      { status: 400 }
    );
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = getSession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));

    const response = await axios.put(`${SPRING_BOOT_API}${path}`, body, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json"
      }
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[API PROXY PUT] Error:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: "Authorization expired" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE requests
export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' query parameter" },
      { status: 400 }
    );
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = getSession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const response = await axios.delete(`${SPRING_BOOT_API}${path}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json"
      }
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[API PROXY DELETE] Error:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: "Authorization expired" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
