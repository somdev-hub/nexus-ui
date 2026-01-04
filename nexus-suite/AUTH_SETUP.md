# Authentication Flow Setup

## Overview

This is a secure, production-ready authentication flow for your Next.js frontend that integrates with your Spring Boot backend using JWT tokens.

## Architecture

### Token Management

- **Access Token**: Short-lived (15-30 min), stored in **memory only** (never in localStorage)
- **Refresh Token**: Long-lived (7 days), stored in **HTTP-only, Secure cookie** (backend sets via Set-Cookie)
- **Automatic Refresh**: Axios interceptors handle token refresh on 401 errors

### Security Features

✅ Access token in memory (XSS protection)
✅ Refresh token in HTTP-only cookie (CSRF protection via SameSite)
✅ Automatic token refresh before expiry
✅ Seamless retry of failed requests with new token
✅ Role-based access control (RBAC)
✅ Protected routes with redirects

## Files Created

### 1. **lib/api-client.ts**

Axios instance with request/response interceptors

- Adds access token to all requests
- Handles 401 responses with token refresh
- Retries failed requests with new token
- Logs out user on refresh failure

### 2. **lib/auth-service.ts**

Authentication API calls

- `login()` - User login
- `logout()` - User logout
- `refreshToken()` - Manual token refresh
- `getCurrentUser()` - Get stored user from localStorage

### 3. **lib/auth-context.tsx**

React Context for auth state management

- Provides `useAuth()` hook
- Manages user state, loading, and authentication
- Handles login/logout operations
- Listens for logout events from interceptors

### 4. **lib/protected-route.tsx**

Route protection component

- Redirects unauthenticated users to /login
- Redirects unauthorized users to /unauthorized
- Shows loading state while checking auth

### 5. **app/login/page.tsx**

Login form page

- Email/password input
- Error handling
- Links to signup and forgot password

### 6. **app/unauthorized/page.tsx**

Unauthorized access page

- Shown when user role doesn't have access

## Backend Requirements

Your Spring Boot backend must implement these endpoints:

### POST `/api/auth/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "retailer",
    "avatar": "/avatars/user.jpg"
  }
}
```

**Headers:** Set refresh token as HTTP-only cookie

```
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
```

### POST `/api/auth/refresh`

**Request:** (includes refresh_token cookie automatically via withCredentials)

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST `/api/auth/logout`

**Request:** (includes refresh_token cookie)

**Response:** 200 OK

- Clear the refresh_token cookie on backend

### GET `/api/auth/me` (Optional)

For validating tokens or getting current user info

## Setup Instructions

### 1. Install Dependencies (if not already installed)

```bash
npm install axios
```

### 2. Environment Configuration

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Update this URL to your Spring Boot backend URL.

### 3. Wrap App with AuthProvider

✅ Already done in `app/layout.tsx`

### 4. Use Protected Routes

Wrap protected pages with `ProtectedRoute` component:

```tsx
import { ProtectedRoute } from "@/lib/protected-route";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">{/* Admin content */}</ProtectedRoute>
  );
}
```

### 5. Use Auth Hook in Components

```tsx
"use client";

import { useAuth } from "@/lib/auth-context";

export function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Role-Based Access

The sidebar automatically filters sections based on user role:

```typescript
const roleAccess: Record<string, string[]> = {
  retailer: ["main", "Products", "materials", "partnerships"],
  hr: ["main", "hr"],
  supplier: ["main", "partnerships"],
  admin: ["main", "Products", "materials", "partnerships", "hr"]
};
```

Add your role to this mapping to control which sidebar sections they see.

## Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User Login                                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ POST /api/auth/login     │
        │ - Email & Password       │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Backend Response         │
        │ - Access Token (memory)  │
        │ - User Data              │
        │ - Refresh Token (cookie) │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Store in State           │
        │ - User → localStorage    │
        │ - Token → memory         │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Redirect to Dashboard    │
        └──────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ API Request Flow                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ Axios Request            │
        │ Interceptor adds token   │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Backend Validates        │
        │ Authorization header     │
        └──────────┬───────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
      Valid              401 Unauthorized
         │                   │
         │                   ▼
         │         ┌──────────────────────────┐
         │         │ POST /api/auth/refresh   │
         │         │ (with refresh cookie)    │
         │         └──────────┬───────────────┘
         │                    │
         │                    ▼
         │         ┌──────────────────────────┐
         │         │ Get new access token     │
         │         └──────────┬───────────────┘
         │                    │
         │         ┌──────────┴───────────┐
         │         │                      │
         │         ▼                      ▼
         │      Success              Refresh Failed
         │         │                      │
         │         ▼                      ▼
         │   Retry request          Logout User
         │         │                 Redirect
         │         │                /login
         └────────┬┘
                  │
                  ▼
         ┌──────────────────┐
         │ Return Response   │
         └───────────────────┘
```

## Troubleshooting

### Issue: "useAuth must be used within AuthProvider"

**Solution:** Make sure your component uses `'use client'` at the top and that it's wrapped with AuthProvider (which is in root layout).

### Issue: Token not being sent in requests

**Solution:** Check that `withCredentials: true` is set in axios config. Also ensure your backend is setting CORS headers properly:

```java
response.setHeader("Access-Control-Allow-Credentials", "true");
response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
```

### Issue: Redirect to login keeps happening

**Solution:** Check that your backend is correctly setting the HTTP-only cookie with the refresh token. Verify with network tab in DevTools.

### Issue: CORS errors

**Solution:** Configure CORS on your Spring Boot backend:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000")
            .allowedMethods("*")
            .allowCredentials(true);
    }
}
```

## Testing the Auth Flow

1. **Login:**

   - Navigate to `/login`
   - Enter credentials
   - Should redirect to `/retailer/dashboard`

2. **Role-based access:**

   - Login as different roles
   - Sidebar should show different sections

3. **Token refresh:**

   - Login and check DevTools Network tab
   - Make an API request
   - Token should be in Authorization header
   - Wait for access token to expire
   - Next API request should refresh token automatically

4. **Logout:**
   - Click logout in sidebar user menu
   - Should redirect to `/login`

## Security Checklist

- ✅ Access tokens never stored in localStorage
- ✅ Refresh tokens in HTTP-only cookies
- ✅ CORS configured properly
- ✅ SameSite=Strict on cookies
- ✅ Automatic token refresh on 401
- ✅ Role-based access control
- ✅ Protected routes redirect to login
- ✅ Logout invalidates tokens on backend
