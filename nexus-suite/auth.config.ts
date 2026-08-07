import { createAuthConfig } from '@nexus/auth-core/config';

export const authConfig = createAuthConfig({
    iamBaseUrl: process.env.NEXT_PUBLIC_IAM_BASE_URL || 'http://localhost:8080',
    iamAuthPath: '/iam/auth',
    appName: 'nexus-suite',
    appBaseUrl: process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000',
    loginPath: '/login',
    callbackPath: '/api/auth/callback',
    sessionCookieName: '__Host-nexus-nexus-suite-session',
    storage: 'memory',
    enableSSO: true,
    allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
    ],
    // Custom IAM endpoints for nexus-suite (default)
    iamEndpoints: {
        login: '/iam/auth/login',
        register: '/iam/auth/register',
        refresh: '/iam/auth/refresh',
        logout: '/iam/auth/logout',
        me: '/iam/auth/me',
        forgotPassword: '/iam/auth/forgot-password',
        resetPassword: '/iam/auth/reset-password',
        validateSession: '/iam/auth/session/{sessionId}',
        revokeSessions: '/iam/auth/revoke',
    },
});

export default authConfig;