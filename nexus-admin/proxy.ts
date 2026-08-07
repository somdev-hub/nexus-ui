import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/better-auth";
import GlobalConfig from "@/global.config";

const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];
const SESSION_COOKIE_NAME = "auth-session";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";

/**
 * Middleware to handle:
 * - Session validation
 * - Token refresh when expired
 * - Redirecting authenticated users from auth pages
 * - Redirecting unauthenticated users from protected pages
 * - Allowing all routes in dummy mode (when auth is disabled)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // Check if dummy mode is enabled (auth disabled)
  // In dummy mode, allow all routes without authentication
  // Use GlobalConfig.wowoFeatures.auth to determine mode
  const isDummyMode = !GlobalConfig.wowoFeatures.auth;

  if (isDummyMode) {
    console.log("[MIDDLEWARE] Dummy mode enabled - allowing all routes");
    return NextResponse.next();
  }

  console.log("[MIDDLEWARE] Real auth mode - enforcing authentication");

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  // Check if path is public
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // No session token
  if (!sessionToken) {
    // If we have a refresh token, allow the request to proceed
    // The API proxy or auth endpoints will attempt session recovery
    if (refreshToken && !isPublicPath) {
      console.log(
        "[MIDDLEWARE] Session missing but refresh token available - allowing request for recovery"
      );
      return NextResponse.next();
    }

    // Redirect to login if accessing protected route
    if (!isPublicPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Get session
  const session = getSession(sessionToken);

  // Session missing from memory (could be hot reload)
  if (!session) {
    // If we don't have a refresh token, we're definitely logged out
    if (!refreshToken) {
      console.log(
        "[MIDDLEWARE] No session and no refresh token - redirecting to login"
      );
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete(SESSION_COOKIE_NAME);
      res.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
      return res;
    }

    // We have refresh token but session is missing from memory
    // This can happen due to hot reload or server restart
    // Allow the request to proceed - the auth context and proxy will attempt recovery
    console.log(
      "[MIDDLEWARE] Session missing but refresh token exists - allowing request for recovery"
    );
    return NextResponse.next();
  }

  // Session is valid
  // Redirect authenticated users away from auth pages
  if (isPublicPath && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Add session to request headers for use in server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.user.id);
  requestHeaders.set("x-user-email", session.user.email);
  requestHeaders.set("x-user-role", session.user.role);

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