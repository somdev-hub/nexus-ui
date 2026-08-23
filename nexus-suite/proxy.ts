import { createAuthMiddleware } from '@nexus/auth-nextjs/middleware';
import { authConfig } from './auth.config';

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};

export default createAuthMiddleware({
    protectedPaths: ['/dashboard', '/admin', '/profile', '/settings', '/hr', '/cms', '/pms'],
    publicPaths: [
        '/login',
        '/register',
        '/callback',
        '/logout',
        '/api/auth',
        '/_next',
        '/favicon.ico',
        '/public',
    ],
    loginPath: authConfig.loginPath,
    callbackPath: authConfig.callbackPath,
    logoutPath: authConfig.logoutPath,
    refreshSession: true,
});