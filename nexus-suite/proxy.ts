import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/better-auth";
import { COOKIE_NAMES } from "@/lib/better-auth";
import GlobalConfig from "@/global.config";

const publicPaths = ["/login", "/"];

const SESSION_COOKIE_NAME = COOKIE_NAMES.SESSION;
const REFRESH_TOKEN_COOKIE_NAME = COOKIE_NAMES.REFRESH;

/**
 * Proxy to handle:
 * - Session validation
 * - Token refresh when expired
 * - Redirecting authenticated users from auth pages
 * - Redirecting unauthenticated users from protected pages
 * - Allowing all routes in dummy mode (when auth is disabled)
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const isDummyMode = !GlobalConfig.wowoFeatures.auth;

  if (isDummyMode) {
    console.log("[MIDDLEWARE] Dummy mode enabled - allowing all routes");
    return NextResponse.next();
  }

  console.log("[MIDDLEWARE] Real auth mode - enforcing authentication");

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  console.log("[PROXY] Request path:", pathname);
  console.log("[PROXY] Session cookie name:", SESSION_COOKIE_NAME);
  console.log("[PROXY] Session token from cookies:", !!sessionToken);
  console.log("[PROXY] Refresh token from cookies:", !!refreshToken);
  console.log(
    "[PROXY] All cookies:",
    request.cookies.getAll().map((c) => c.name),
  );

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );

  if (!sessionToken) {
    if (refreshToken && !isPublicPath) {
      console.log(
        "[MIDDLEWARE] Session missing but refresh token available - allowing request for recovery",
      );
      return NextResponse.next();
    }

    if (!isPublicPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  const session = getSession(sessionToken);

  if (!session) {
    if (!refreshToken) {
      console.log(
        "[MIDDLEWARE] No session and no refresh token - redirecting to login",
      );
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete(SESSION_COOKIE_NAME);
      res.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
      return res;
    }

    console.log(
      "[MIDDLEWARE] Session missing but refresh token exists - allowing request for recovery",
    );
    return NextResponse.next();
  }

  const orgType = (session.user as any)?.orgType as string | undefined;
  const resolvedOrgType = orgType ? String(orgType).toUpperCase() : undefined;

  function dashboardForOrgType(t?: string): string {
    switch (t) {
      case "SUPPLIER": return "/supplier/dashboard";
      case "LOGISTICS": return "/logistics/dashboard";
      case "RETAILER":
      default: return "/retailer/dashboard";
    }
  }

  function isAllowedForOrg(path: string, t?: string): boolean {
    if (!t) return true;
    if (path.startsWith("/retailer")) return t === "RETAILER";
    if (path.startsWith("/supplier")) return t === "SUPPLIER";
    if (path.startsWith("/logistics")) return t === "LOGISTICS";
    if (path.startsWith("/profile") || path.startsWith("/unauthorized") || path === "/") return true;
    return true;
  }

  if (isPublicPath && pathname !== "/") {
    // Only redirect if we know orgType; otherwise let client handle (prevents supplier→retailer mis-redirect on stale session)
    if (resolvedOrgType) {
      return NextResponse.redirect(new URL(dashboardForOrgType(resolvedOrgType), request.url));
    }
    // No orgType yet (stale session) – let request through, client will enrich and redirect
    return NextResponse.next();
  }

  // Org-type based access control: prevent cross-org URL typing — only enforce when orgType known
  if (resolvedOrgType && !isAllowedForOrg(pathname, resolvedOrgType)) {
    console.log(`[PROXY] Blocked ${pathname} for orgType ${resolvedOrgType} -> redirect to ${dashboardForOrgType(resolvedOrgType)}`);
    if (pathname.startsWith("/retailer") || pathname.startsWith("/supplier") || pathname.startsWith("/logistics")) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Root "/" should redirect to org-appropriate dashboard only when orgType known; otherwise let client (app/page.tsx) decide after enrichment
  if (pathname === "/") {
    if (resolvedOrgType) {
      return NextResponse.redirect(new URL(dashboardForOrgType(resolvedOrgType), request.url));
    }
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.user.id);
  requestHeaders.set("x-user-email", session.user.email);
  requestHeaders.set("x-user-role", session.user.role);
  requestHeaders.set("x-org-id", session.user.orgId);
  if (resolvedOrgType) requestHeaders.set("x-org-type", resolvedOrgType);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
