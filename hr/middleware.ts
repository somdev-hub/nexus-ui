import { NextRequest, NextResponse } from "next/server";
import { getSession, refreshSession } from "@/lib/better-auth";
import axios from "axios";

const publicPaths = ["/login", "/signup", "/"];
const SESSION_COOKIE_NAME = "auth-session";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";
const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Middleware to handle:
 * - Session validation
 * - Token refresh when expired
 * - Redirecting authenticated users from auth pages
 * - Redirecting unauthenticated users from protected pages
 * - Allowing all routes in dummy mode (when auth is disabled)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // Check if dummy mode is enabled (auth disabled)
  // In dummy mode, allow all routes without authentication
  const isDummyMode =
    process.env.NEXT_PUBLIC_WOWO_AUTH === "false" ||
    !process.env.NEXT_PUBLIC_WOWO_AUTH;

  if (isDummyMode) {
    console.log("[MIDDLEWARE] Dummy mode enabled - allowing all routes");
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  // Check if path is public
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // No session token
  if (!sessionToken) {
    // Redirect to login if accessing protected route
    if (!isPublicPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Get session
  const session = getSession(sessionToken);

  // Session expired or invalid
  if (!session) {
    // Try to refresh if we have a refresh token
    if (refreshToken) {
      try {
        const response = await axios.post(
          `${SPRING_BOOT_API}/iam/auth/refresh`,
          { refreshToken },
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        const {
          accessToken: newAccessToken,
          expiresIn,
          refreshToken: newRefreshToken
        } = response.data;

        // Update session with new tokens
        refreshSession(sessionToken, newAccessToken);

        // Create response with updated cookies
        const res = NextResponse.next();
        res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: expiresIn || 3600,
          path: "/"
        });

        if (newRefreshToken) {
          res.cookies.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60,
            path: "/"
          });
        }

        return res;
      } catch (error) {
        console.error("Token refresh failed in middleware:", error);
        // Fall through to clear session
      }
    }

    // Clear invalid session
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(SESSION_COOKIE_NAME);
    res.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
    return res;
  }

  // Session is valid
  // Redirect authenticated users away from auth pages
  if (isPublicPath && pathname !== "/") {
    return NextResponse.redirect(new URL("/hr", request.url));
  }

  // Add session to request headers for use in server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.user.id);
  requestHeaders.set("x-user-email", session.user.email);
  requestHeaders.set("x-user-role", session.user.role);
  requestHeaders.set("x-org-id", session.user.orgId);

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
};
