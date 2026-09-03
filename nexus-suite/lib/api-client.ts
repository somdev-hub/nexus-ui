import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

// Use the Next.js API proxy which adds the accessToken from server-side session
// ALL Spring Boot requests MUST go through this proxy
// On server (SSR / Server Components), axios needs an absolute URL otherwise
// it throws `ERR_INVALID_URL: Invalid URL input '/api/proxy/?path=...'`.
// This helper returns an absolute URL on server and relative on client.
function getAppBaseUrl(): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    `http://localhost:${process.env.PORT || "3000"}`;
  return appUrl.replace(/\/$/, "");
}

function getProxyBaseUrl(): string {
  if (typeof window !== "undefined") return "/api/proxy";
  return `${getAppBaseUrl()}/api/proxy`;
}

function getRefreshUrl(): string {
  if (typeof window !== "undefined") return "/api/auth/refresh";
  return `${getAppBaseUrl()}/api/auth/refresh`;
}

const PROXY_BASE = getProxyBaseUrl();

/**
 * REQUEST FLOW:
 *
 * Client Code: apiClient.get("/iam/users/profile")
 *           ↓
 * Request Interceptor: Converts to ?path=/iam/users/profile
 *           ↓
 * Proxy Route (/api/proxy): Gets accessToken from server-side session
 *           ↓
 * Spring Boot: GET http://localhost:8080/iam/users/profile
 *            (with Authorization: Bearer {accessToken} header)
 *
 * This ensures:
 * ✓ AccessToken NEVER exposed to browser
 * ✓ AccessToken kept in HttpOnly cookies
 * ✓ All requests include valid auth header
 * ✓ Token refresh happens automatically on 401
 */

// Create request interceptor - convert Spring Boot paths to proxy calls
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  const path = config.url || "";

  if (!path.startsWith("?")) {
    config.url = `?path=${encodeURIComponent(path)}`;
  }

  // On server, ensure baseURL is absolute so axios doesn't throw ERR_INVALID_URL
  // withCredentials doesn't forward cookies server-side; primary fix is the
  // dashboard now being a client component (like hr). This fallback ensures
  // any future server usage doesn't crash with Invalid URL.
  if (typeof window === "undefined") {
    if (config.baseURL && config.baseURL.startsWith("/")) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.BETTER_AUTH_URL ||
        `http://localhost:${process.env.PORT || "3000"}`;
      config.baseURL = `${appUrl.replace(/\/$/, "")}${config.baseURL}`;
    }
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  console.log(
    "[API CLIENT] Request:",
    config.method?.toUpperCase(),
    config.baseURL ? `${config.baseURL}${config.url}` : config.url,
  );

  return config;
};

const requestErrorHandler = (error: AxiosError) => Promise.reject(error);

const responseInterceptor = (response: AxiosResponse) => response;

const responseErrorHandler = async (error: AxiosError) => {
  const originalRequest = error.config as InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    try {
      console.log("[API CLIENT] Token expired (401), attempting refresh...");
      console.log(
        "[API CLIENT] Original request method:",
        originalRequest.method?.toUpperCase(),
      );
      console.log("[API CLIENT] Original request URL:", originalRequest.url);

      // Use absolute URL on server to avoid ERR_INVALID_URL (axios needs absolute URL in Node)
      const refreshUrl = getRefreshUrl();
      // Forward cookies when on server (required for session refresh)
      let refreshHeaders: Record<string, string> | undefined;
      if (typeof window === "undefined") {
        try {
          // Next 15 cookies() is async, but try sync fallback
          const mod = await import("next/headers").catch(() => null);
          if (mod) {
            const cookieStore = await (mod as any).cookies();
            const cookieHeader = cookieStore?.toString?.() || "";
            if (cookieHeader) refreshHeaders = { Cookie: cookieHeader };
          }
        } catch {
          // ignore - not in request scope
        }
      }
      const refreshResult = await axios.post(
        refreshUrl,
        {},
        {
          withCredentials: true,
          ...(refreshHeaders ? { headers: refreshHeaders } : {}),
        },
      );

      console.log(
        "[API CLIENT] Token refresh successful, status:",
        refreshResult.status,
      );
      console.log(
        "[API CLIENT] Retrying original request with refreshed token",
      );

      return apiClient(originalRequest);
    } catch (refreshError) {
      console.error("[API CLIENT] Token refresh failed:", refreshError);

      if (axios.isAxiosError(refreshError)) {
        console.error(
          "[API CLIENT] Refresh error status:",
          refreshError.response?.status,
        );
        console.error(
          "[API CLIENT] Refresh error data:",
          refreshError.response?.data,
        );
      }

      if (typeof window !== "undefined") {
        console.log(
          "[API CLIENT] Dispatching auth:logout event and redirecting to login",
        );
        window.dispatchEvent(new Event("auth:logout"));
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
};

const apiClient = axios.create({
  baseURL: PROXY_BASE,
  withCredentials: true,
  timeout: 30000,
});

const apiClientMultipart = axios.create({
  baseURL: PROXY_BASE,
  withCredentials: true,
  timeout: 30000,
});

apiClient.interceptors.request.use(requestInterceptor, requestErrorHandler);
apiClient.interceptors.response.use(responseInterceptor, responseErrorHandler);

apiClientMultipart.interceptors.request.use(
  requestInterceptor,
  requestErrorHandler,
);
apiClientMultipart.interceptors.response.use(
  responseInterceptor,
  responseErrorHandler,
);

/**
 * @deprecated Use the session-based approach instead
 * Tokens are now managed server-side in encrypted cookies
 */
export function setAccessToken() {
  // No-op
}

/**
 * @deprecated Use the session-based approach instead
 * Tokens are now managed server-side in encrypted cookies
 */
export function clearAccessToken() {
  // No-op
}

export { apiClientMultipart };
export default apiClient;
