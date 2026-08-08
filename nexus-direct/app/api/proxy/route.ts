import { NextRequest, NextResponse } from "next/server";
import { getSession, refreshSession } from "@/lib/better-auth";
import { COOKIE_NAMES } from "@/lib/better-auth";
import axios from "axios";
import { getSpringBootClient } from "@/lib/spring-boot-client";

// Use module-specific cookie names
const SESSION_COOKIE_NAME = COOKIE_NAMES.SESSION;
const REFRESH_TOKEN_COOKIE_NAME = COOKIE_NAMES.REFRESH;
const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Check if the path is a streaming endpoint that needs special handling
 */
function isStreamingEndpoint(path: string): boolean {
  return (
    path.includes("/stream") ||
    path.includes("/sse") ||
    path.includes("text/event-stream")
  );
}

/**
 * Helper function to extract body properties and convert them to query parameters
 * This allows the proxy to send parameters as both query params and body
 * @param body The JSON body object
 * @param url The URL to append parameters to
 * @returns Modified URL with query parameters
 */
function appendBodyAsQueryParams(
  body: Record<string, unknown>,
  url: string,
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
 * Helper function to build the full URL with all query parameters (except 'path')
 * @param path The base path from the 'path' query parameter
 * @param searchParams All search parameters from the request
 * @returns Full URL with query parameters
 */
function buildTargetUrl(path: string, searchParams: URLSearchParams): string {
  // Create a new URLSearchParams without the 'path' parameter
  const forwardParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key !== "path") {
      forwardParams.append(key, value);
    }
  }

  const queryString = forwardParams.toString();
  return queryString ? `${path}?${queryString}` : path;
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
 * │ 1. Get sessionToken from cookies (module-specific)      │
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

/**
 * Helper: Check if token is about to expire and refresh if needed
 * If token expires within 2 minutes, refresh it proactively
 */
async function ensureValidSession(
  sessionToken: string,
  refreshToken: string | undefined,
): Promise<{ valid: boolean; response?: NextResponse }> {
  const session = getSession(sessionToken);

  if (!session) {
    console.log("[API PROXY] Session not found in storage");
    return {
      valid: false,
      response: NextResponse.json(
        { error: "Session expired" },
        { status: 401 },
      ),
    };
  }

  // Check if token expires within 2 minutes
  const now = new Date();
  const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
  const twoMinutesInMs = 2 * 60 * 1000;

  console.log(
    `[API PROXY] Token expiry check: expires at ${session.expiresAt}, time until expiry: ${Math.round(timeUntilExpiry / 1000)}s`,
  );

  if (timeUntilExpiry < twoMinutesInMs) {
    console.log(
      "[API PROXY] Token expiring soon, attempting proactive refresh",
    );

    if (!refreshToken) {
      console.log("[API PROXY] No refresh token available");
      return {
        valid: false,
        response: NextResponse.json(
          { error: "Token expired, refresh failed - no refresh token" },
          { status: 401 },
        ),
      };
    }

    try {
      // Call Spring Boot to refresh tokens
      const springBootClient = getSpringBootClient();
      const refreshResponse = await springBootClient.post(
        `/iam/auth/refresh/applicant`,
        {
          refreshToken,
        },
      );

      const {
        accessToken: newAccessToken,
        expiresIn,
        refreshToken: newRefreshToken,
      } = refreshResponse.data;

      console.log(
        `[API PROXY] Proactive refresh successful, new expiry: ${expiresIn}s`,
      );

      // Update session with new tokens
      refreshSession(sessionToken, newAccessToken, expiresIn, newRefreshToken);

      return { valid: true };
    } catch (refreshError: unknown) {
      console.error("[API PROXY] Proactive refresh failed:");
      if (axios.isAxiosError(refreshError)) {
        console.error(
          `[API PROXY] Refresh error status: ${refreshError.response?.status}`,
        );
        console.error(
          `[API PROXY] Refresh error data:`,
          refreshError.response?.data,
        );
      } else {
        console.error("[API PROXY] Refresh error:", refreshError);
      }
      return {
        valid: false,
        response: NextResponse.json(
          { error: "Token refresh failed" },
          { status: 401 },
        ),
      };
    }
  }

  return { valid: true };
}

/**
 * Helper: Handle 401 response from Spring Boot by refreshing and retrying
 * If Spring Boot returns 401, it means our cached token is stale
 */
async function handleUnauthorizedWithRetry(
  sessionToken: string,
  refreshToken: string | undefined,
  retryFn: (accessToken: string) => Promise<any>,
): Promise<{ success: boolean; data?: any; response?: NextResponse }> {
  if (!refreshToken) {
    console.log("[API PROXY] No refresh token available to retry");
    return {
      success: false,
      response: NextResponse.json(
        { error: "Authorization expired, cannot refresh" },
        { status: 401 },
      ),
    };
  }

  try {
    console.log(
      "[API PROXY] Received 401, attempting token refresh and retry...",
    );
    // Call Spring Boot to refresh tokens
    const springBootClient = getSpringBootClient();
    const refreshResponse = await springBootClient.post(
      `/iam/auth/refresh/applicant`,
      {
        refreshToken,
      },
    );

    const {
      accessToken: newAccessToken,
      expiresIn,
      refreshToken: newRefreshToken,
    } = refreshResponse.data;

    console.log(
      `[API PROXY] Token refresh successful during retry, new expiry: ${expiresIn}s`,
    );

    // Update session with new tokens
    refreshSession(sessionToken, newAccessToken, expiresIn, newRefreshToken);

    // Retry the original request with new token
    try {
      const data = await retryFn(newAccessToken);
      console.log("[API PROXY] Retry after refresh succeeded");
      return { success: true, data };
    } catch (retryError: unknown) {
      console.error("[API PROXY] Retry failed after refresh:", retryError);
      if (
        axios.isAxiosError(retryError) &&
        retryError.response?.status === 401
      ) {
        return {
          success: false,
          response: NextResponse.json(
            { error: "Authorization still invalid after refresh" },
            { status: 401 },
          ),
        };
      }
      throw retryError;
    }
  } catch (refreshError: unknown) {
    console.error("[API PROXY] Refresh during retry failed:");
    if (axios.isAxiosError(refreshError)) {
      console.error(
        `[API PROXY] Refresh error status: ${refreshError.response?.status}`,
      );
      console.error(
        `[API PROXY] Refresh error data:`,
        refreshError.response?.data,
      );
    } else {
      console.error("[API PROXY] Refresh error:", refreshError);
    }
    return {
      success: false,
      response: NextResponse.json(
        { error: "Token refresh failed during retry" },
        { status: 401 },
      ),
    };
  }
}

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

  // Build the full target URL with all query parameters (except 'path')
  const targetUrl = buildTargetUrl(path, searchParams);

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Ensure session is valid and refresh if needed
  const validation = await ensureValidSession(sessionToken, refreshToken);
  if (!validation.valid) {
    return validation.response!;
  }

  const session = getSession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  // Check if this is a streaming endpoint
  const isStreaming = isStreamingEndpoint(path);

  try {
    console.log(
      "[API PROXY GET] Making request with token:",
      !!session.accessToken,
    );
    console.log("[API PROXY GET] Target URL:", targetUrl);
    const springBootClient = getSpringBootClient();

    if (isStreaming) {
      console.log(
        "[API PROXY GET] Streaming endpoint detected, using stream response",
      );
      // For streaming endpoints, use axios with responseType: 'stream'
      const streamResponse = await springBootClient.get(targetUrl, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        responseType: "stream",
      });

      // Create a readable stream to pipe the response
      // axios stream response is a Node.js Readable stream
      const stream = new ReadableStream({
        start(controller) {
          streamResponse.data.on("data", (chunk: Buffer) => {
            controller.enqueue(chunk);
          });
          streamResponse.data.on("end", () => {
            controller.close();
          });
          streamResponse.data.on("error", (error: Error) => {
            controller.error(error);
          });
        },
      });

      // Return the stream with appropriate headers
      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const response = await springBootClient.get(targetUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    console.log("[API PROXY GET] Request successful");
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[API PROXY GET] Request failed");

    if (axios.isAxiosError(error)) {
      console.error(`[API PROXY GET] Error status: ${error.response?.status}`);
      console.error("[API PROXY GET] Error data:", error.response?.data);

      if (error.response?.status === 401) {
        console.log(
          "[API PROXY GET] Got 401, session token valid, token might be rejected by backend",
        );
        // Token might be stale, try to refresh and retry
        const retryResult = await handleUnauthorizedWithRetry(
          sessionToken,
          refreshToken,
          (accessToken: string) => {
            const springBootClient = getSpringBootClient();
            return springBootClient.get(targetUrl, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
          },
        );

        if (retryResult.success) {
          return NextResponse.json(retryResult.data);
        }
        return retryResult.response!;
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 },
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

  // Build the full target URL with all query parameters (except 'path')
  const targetUrl = buildTargetUrl(path, searchParams);

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  console.log("[API PROXY POST] Path:", path);
  console.log("[API PROXY POST] Target URL:", targetUrl);
  console.log("[API PROXY POST] SessionToken from cookie:", sessionToken);
  console.log(
    "[API PROXY POST] Content-Type:",
    request.headers.get("content-type"),
  );

  if (!sessionToken) {
    console.error("[API PROXY POST] No sessionToken in cookies");
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Ensure session is valid and refresh if needed
  const validation = await ensureValidSession(sessionToken, refreshToken);
  if (!validation.valid) {
    return validation.response!;
  }

  const session = getSession(sessionToken);

  console.log("[API PROXY POST] Session found:", !!session);
  if (session) {
    console.log("[API PROXY POST] Session user:", session.user?.personalEmail);
    console.log("[API PROXY POST] Session expires at:", session.expiresAt);
  }

  if (!session) {
    console.error(
      "[API PROXY POST] Session not found for token:",
      sessionToken,
    );
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  // Check if this is a streaming endpoint
  const isStreaming = isStreamingEndpoint(path);

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;
    const axiosConfig: any = {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
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

    const springBootClient = getSpringBootClient();

    if (isStreaming) {
      console.log(
        "[API PROXY POST] Streaming endpoint detected, using stream response",
      );
      // For streaming endpoints, use axios with responseType: 'stream'
      const streamResponse = await springBootClient.post(targetUrl, body, {
        ...axiosConfig,
        responseType: "stream",
      });

      // Create a readable stream to pipe the response
      // axios stream response is a Node.js Readable stream
      const stream = new ReadableStream({
        start(controller) {
          streamResponse.data.on("data", (chunk: Buffer) => {
            controller.enqueue(chunk);
          });
          streamResponse.data.on("end", () => {
            controller.close();
          });
          streamResponse.data.on("error", (error: Error) => {
            controller.error(error);
          });
        },
      });

      // Return the stream with appropriate headers
      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const response = await springBootClient.post(targetUrl, body, axiosConfig);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[API PROXY POST] Error:", error);

    if (axios.isAxiosError(error)) {
      console.error(
        "[API PROXY POST] Axios error response:",
        error.response?.data,
      );
      if (error.response?.status === 401) {
        // Token might be stale, try to refresh and retry
        const contentType = request.headers.get("content-type") || "";
        let body: any;

        // We need to read the body again for retry, but since it was already read,
        // we can't. So we'll just return the error for 401 on POST/PUT/DELETE
        // The client's api-client interceptor will handle the refresh and retry
        console.log(
          "[API PROXY POST] Got 401 on POST, body already consumed, returning error",
        );
        return NextResponse.json(
          { error: "Authorization expired" },
          { status: 401 },
        );
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 },
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

  // Build the full target URL with all query parameters (except 'path')
  const targetUrl = buildTargetUrl(path, searchParams);

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  console.log("[API PROXY PUT] Path:", path);
  console.log("[API PROXY PUT] Target URL:", targetUrl);
  console.log("[API PROXY PUT] SessionToken from cookie:", sessionToken);
  console.log(
    "[API PROXY PUT] Content-Type:",
    request.headers.get("content-type"),
  );

  if (!sessionToken) {
    console.error("[API PROXY PUT] No sessionToken in cookies");
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Ensure session is valid and refresh if needed
  const validation = await ensureValidSession(sessionToken, refreshToken);
  if (!validation.valid) {
    return validation.response!;
  }

  const session = getSession(sessionToken);

  console.log("[API PROXY PUT] Session found:", !!session);
  if (session) {
    console.log("[API PROXY PUT] Session user:", session.user?.personalEmail);
    console.log("[API PROXY PUT] Session expires at:", session.expiresAt);
  }

  if (!session) {
    console.error("[API PROXY PUT] Session not found for token:", sessionToken);
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;
    const axiosConfig: any = {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    };

    // Handle multipart/form-data separately
    if (contentType.includes("multipart/form-data")) {
      console.log("[API PROXY PUT] Handling as multipart/form-data");
      body = await request.formData();
      // Don't set content-type header, axios will set it automatically with boundary
    } else {
      console.log("[API PROXY PUT] Handling as application/json");
      body = await request.json().catch(() => ({}));
      axiosConfig.headers["Content-Type"] = "application/json";
    }

    const springBootClient = getSpringBootClient();
    const response = await springBootClient.put(targetUrl, body, axiosConfig);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[API PROXY PUT] Error:", error);

    if (axios.isAxiosError(error)) {
      console.error(
        "[API PROXY PUT] Axios error response:",
        error.response?.data,
      );
      if (error.response?.status === 401) {
        console.log(
          "[API PROXY PUT] Got 401 on PUT, body already consumed, returning error",
        );
        return NextResponse.json(
          { error: "Authorization expired" },
          { status: 401 },
        );
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 },
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

  // Build the full target URL with all query parameters (except 'path')
  const targetUrl = buildTargetUrl(path, searchParams);

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Ensure session is valid and refresh if needed
  const validation = await ensureValidSession(sessionToken, refreshToken);
  if (!validation.valid) {
    return validation.response!;
  }

  const session = getSession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  try {
    const springBootClient = getSpringBootClient();
    const response = await springBootClient.delete(targetUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[API PROXY DELETE] Error:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: "Authorization expired" },
          { status: 401 },
        );
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
