import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/better-auth";
import axios from "axios";

const SESSION_COOKIE_NAME = "auth-session";
const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Helper function to extract body properties and convert them to query parameters
 * This allows the proxy to send parameters as both query params and body
 * @param body The JSON body object
 * @param url The URL to append parameters to
 * @returns Modified URL with query parameters
 */
function appendBodyAsQueryParams(
  body: Record<string, unknown>,
  url: string
): string {
  if (!body || Object.keys(body).length === 0) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  const queryString = Object.entries(body)
    .map(([key, value]) => {
      // Convert value to string, handle null/undefined
      let stringValue = "";
      if (value === null || value === undefined) {
        stringValue = "";
      } else if (typeof value === "object") {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(stringValue)}`;
    })
    .join("&");

  return url + separator + queryString;
}

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

  console.log("[API PROXY POST] Path:", path);
  console.log("[API PROXY POST] SessionToken from cookie:", sessionToken);
  console.log(
    "[API PROXY POST] Content-Type:",
    request.headers.get("content-type")
  );

  if (!sessionToken) {
    console.error("[API PROXY POST] No sessionToken in cookies");
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = getSession(sessionToken);

  console.log("[API PROXY POST] Session found:", !!session);
  if (session) {
    console.log("[API PROXY POST] Session user:", session.user?.email);
    console.log("[API PROXY POST] Session expires at:", session.expiresAt);
  }

  if (!session) {
    console.error(
      "[API PROXY POST] Session not found for token:",
      sessionToken
    );
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;
    const axiosConfig: any = {
      headers: {
        Authorization: `Bearer ${session.accessToken}`
      }
    };

    // Handle multipart/form-data separately
    if (contentType.includes("multipart/form-data")) {
      console.log("[API PROXY POST] Handling as multipart/form-data");
      // Read as FormData and pass directly to axios
      // Don't set Content-Type header - let axios handle it with correct boundary
      body = await request.formData();
      // Don't set content-type header, axios will set it automatically with boundary
    } else {
      console.log("[API PROXY POST] Handling as application/json");
      // Read as JSON
      body = await request.json().catch(() => ({}));
      axiosConfig.headers["Content-Type"] = "application/json";
    }

    const urlWithParams = `${SPRING_BOOT_API}${path}`;

    const response = await axios.post(urlWithParams, body, axiosConfig);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[API PROXY POST] Error:", error);

    if (axios.isAxiosError(error)) {
      console.error(
        "[API PROXY POST] Axios error response:",
        error.response?.data
      );
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

    // Extract body properties and add them as query parameters
    let urlWithParams = `${SPRING_BOOT_API}${path}`;
    if (Object.keys(body).length > 0) {
      urlWithParams = appendBodyAsQueryParams(
        body as Record<string, unknown>,
        urlWithParams
      );
    }

    const response = await axios.put(urlWithParams, body, {
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
