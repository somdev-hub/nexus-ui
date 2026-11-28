import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/better-auth';
import { COOKIE_NAMES } from '@/lib/better-auth';

export async function GET(request: NextRequest) {
    try {
        const sessionToken = request.cookies.get(COOKIE_NAMES.SESSION)?.value;

        if (!sessionToken) {
            console.error('[CHAT WS TOKEN] No session token found in cookies');
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

        return NextResponse.json(
            {
                token: session.accessToken,
                expiresAt: session.expiresAt,
                userId: session.userId,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[CHAT WS TOKEN] Error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve token' },
            { status: 500 }
        );
    }
}
