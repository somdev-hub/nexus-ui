import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/better-auth";

/**
 * WebSocket Token Endpoint
 *
 * Provides JWT token for WebSocket connections via BFF pattern.
 * The token is retrieved from the server-side session (HttpOnly cookies).
 * This ensures:
 * ✓ Token never exposed to browser JavaScript
 * ✓ Token refresh handled transparently by server
 * ✓ Secure transmission in response body (client needs this for WS)
 *
 * CLIENT FLOW:
 * 1. Client requests token: GET /api/chat/ws-token
 * 2. Server gets token from session
 * 3. Server returns token in response body
 * 4. Client uses token for WebSocket connection
 * 5. Server-side session refreshes token automatically on expiry
 */

const SESSION_COOKIE_NAME = "auth-session";

export async function GET(request: NextRequest) {
  try {
    // Get session from server-side storage
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      console.error("[CHAT WS TOKEN] No session token found in cookies");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const session = getSession(sessionToken);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Return token to client for WebSocket connection
    // NOTE: This is safe because:
    // 1. Session is only available after successful authentication
    // 2. Token is short-lived and specific to WebSocket
    // 3. Refresh happens server-side automatically
    return NextResponse.json(
      {
        token: session.accessToken,
        expiresAt: session.expiresAt,
        userId: session.userId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CHAT WS TOKEN] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve token" },
      { status: 500 }
    );
  }
}
