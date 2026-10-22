import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/better-auth';
import { COOKIE_NAMES } from '@/lib/better-auth';

/**
 * WebSocket Token Endpoint for notifications.
 *
 * Provides a JWT for the STOMP CONNECT frame via the BFF pattern. The token
 * is retrieved from the server-side session (HttpOnly cookies), so it is never
 * exposed to browser JavaScript except transiently for the WebSocket handshake.
 *
 * This mirrors the chat ws-token route in nexus-ui/hr. The browser uses the
 * token in the CONNECT frame's Authorization header; the CMS STOMP interceptor
 * validates it against IAM.
 */
const SESSION_COOKIE_NAME = COOKIE_NAMES.SESSION;

export async function GET(request: NextRequest) {
    try {
        const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

        if (!sessionToken) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const session = getSession(sessionToken);

        if (!session) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const orgId =
            (session as any).user?.orgId ||
            (session as any).user?.organizationId ||
            (session as any).user?.org_id;

        return NextResponse.json(
            {
                token: session.accessToken,
                expiresAt: session.expiresAt,
                userId: session.userId,
                orgId: orgId ? String(orgId) : undefined,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[NOTIFICATION WS TOKEN] Error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve token' },
            { status: 500 }
        );
    }
}
