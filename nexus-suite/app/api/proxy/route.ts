import { NextRequest, NextResponse } from "next/server";
import {
  getAuthClient,
  getSessionFromRequest,
} from "@nexus/auth-nextjs/server";

/**
 * SECURITY CRITICAL: API Proxy Route (Migrated to @nexus/auth-nextjs/server)
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
 * │ 1. Get session from cookies (nexus-auth-session)        │
 * │ 2. Retrieve session using getSessionFromRequest         │
 * │ 3. Add Authorization header:                            │
 * │    Authorization: Bearer {accessToken}                  │
 * │ 4. Proxy request to Spring Boot via AuthClient HTTP:    │
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
 * ✓ accessToken NEVER leaves the server (stored in HttpOnly cookies)
 * ✓ accessToken NEVER exposed to browser/JavaScript
 * ✓ accessToken NEVER transmitted over insecure channels
 * ✓ Cookies are HttpOnly (cannot be accessed by JS)
 * ✓ Token refresh happens server-side transparently
 * ✓ Frontend cannot bypass authentication
 *
 * INTEGRATION POINTS:
 * - Frontend: Use apiClient from @/lib/api-client.ts (configured for proxy)
 * - Auth routes: /api/auth/login, /api/auth/refresh
 * - Session management: @nexus/auth-nextjs/server
 *
 * ERROR HANDLING:
 * - 401: Token expired, client should call /api/auth/refresh
 * - 403: Forbidden (authorization error)
 * - 5xx: Backend error, proxy returns as-is
 *
 * @requires session cookie (nexus-auth-session) to be present
 * @returns proxied response from Spring Boot or error response
 */

// GET requests
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' query parameter" },
      { status: 400 },
    );
  }

  const session = await getSessionFromRequest(request);

  console.log("[API PROXY GET] Path:", path);
  console.log("[API PROXY GET] Session found:", !!session);
  if (session) {
    console.log("[API PROXY GET] Session user:", session.user?.email);
  }

  if (!session || !session.accessToken) {
    console.error("[API PROXY GET] Session not found or no access token");
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const authClient = getAuthClient();
    const httpClient = authClient.getHttpClient();
    const response = await httpClient.get(path, {
      Authorization: `Bearer ${session.accessToken}`,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("[API PROXY GET] Error:", error);

    if (error instanceof Error && error.message.includes("401")) {
      console.log("[API PROXY GET] Got 401, returning error");
      return NextResponse.json(
        { error: "Authorization expired" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
      { status: 400 },
    );
  }

  const session = await getSessionFromRequest(request);

  console.log("[API PROXY POST] Path:", path);
  console.log("[API PROXY POST] Session found:", !!session);
  if (session) {
    console.log("[API PROXY POST] Session user:", session.user?.email);
  }

  if (!session || !session.accessToken) {
    console.error("[API PROXY POST] Session not found or no access token");
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;
    const authClient = getAuthClient();
    const httpClient = authClient.getHttpClient();

    // Handle multipart/form-data separately
    if (contentType.includes("multipart/form-data")) {
      console.log("[API PROXY POST] Handling as multipart/form-data");
      body = await request.formData();
    } else {
      console.log("[API PROXY POST] Handling as application/json");
      body = await request.json().catch(() => ({}));
    }

    const response = await httpClient.post(path, body, {
      Authorization: `Bearer ${session.accessToken}`,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("[API PROXY POST] Error:", error);

    if (error instanceof Error && error.message.includes("401")) {
      console.log("[API PROXY POST] Got 401, returning error");
      return NextResponse.json(
        { error: "Authorization expired" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
      { status: 400 },
    );
  }

  const session = await getSessionFromRequest(request);

  console.log("[API PROXY PUT] Path:", path);
  console.log("[API PROXY PUT] Session found:", !!session);
  if (session) {
    console.log("[API PROXY PUT] Session user:", session.user?.email);
  }

  if (!session || !session.accessToken) {
    console.error("[API PROXY PUT] Session not found or no access token");
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;
    const authClient = getAuthClient();
    const httpClient = authClient.getHttpClient();

    // Handle multipart/form-data separately
    if (contentType.includes("multipart/form-data")) {
      console.log("[API PROXY PUT] Handling as multipart/form-data");
      body = await request.formData();
    } else {
      console.log("[API PROXY PUT] Handling as application/json");
      body = await request.json().catch(() => ({}));
    }

    const response = await httpClient.put(path, body, {
      Authorization: `Bearer ${session.accessToken}`,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("[API PROXY PUT] Error:", error);

    if (error instanceof Error && error.message.includes("401")) {
      console.log("[API PROXY PUT] Got 401, returning error");
      return NextResponse.json(
        { error: "Authorization expired" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
      { status: 400 },
    );
  }

  const session = await getSessionFromRequest(request);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const authClient = getAuthClient();
    const httpClient = authClient.getHttpClient();
    const response = await httpClient.delete(path, {
      Authorization: `Bearer ${session.accessToken}`,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("[API PROXY DELETE] Error:", error);

    if (error instanceof Error && error.message.includes("401")) {
      return NextResponse.json(
        { error: "Authorization expired" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
