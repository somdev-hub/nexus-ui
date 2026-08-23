import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse
} from "axios";

// Use the Next.js API proxy which adds the accessToken from server-side session
// ALL Spring Boot requests MUST go through this proxy
const PROXY_BASE = "/api/proxy";

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
 *            (with Authorization: Bearer <token> header)
 *
 * This ensures:
 * ✓ AccessToken NEVER exposed to browser
 * ✓ AccessToken kept in HttpOnly cookies
 * ✓ All requests include valid auth header
 * ✓ Token refresh happens automatically on 401
 */

// Create request interceptor - convert Spring Boot paths to proxy calls
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  // Convert baseURL + url to use proxy with path query param
  // e.g., /iam/users/profile -> ?path=/iam/users/profile (baseURL=/api/proxy)
  const path = config.url || "";

  if (!path.startsWith("?")) {
    config.url = `?path=${encodeURIComponent(path)}`;
  }

  // For FormData requests, remove Content-Type header to let axios set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  console.log(
    "[API CLIENT] Request:",
    config.method?.toUpperCase(),
    config.url
  );

  return config;
};

const requestErrorHandler = (error: AxiosError) => Promise.reject(error);

// Create response interceptor
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
        originalRequest.method?.toUpperCase()
      );
      console.log("[API CLIENT] Original request URL:", originalRequest.url);

      // Call Next.js refresh endpoint (server-side)
      // This will refresh the accessToken in the server-side session
      const refreshResult = await axios.post(
        `/api/auth/refresh`,
        {},
        { withCredentials: true }
      );

      console.log(
        "[API CLIENT] Token refresh successful, status:",
        refreshResult.status
      );
      console.log(
        "[API CLIENT] Retrying original request with refreshed token"
      );

      // Session cookies are automatically updated by the refresh endpoint
      // Retry the original request with new token from server-side session
      return apiClient(originalRequest);
    } catch (refreshError) {
      console.error("[API CLIENT] Token refresh failed:", refreshError);

      if (axios.isAxiosError(refreshError)) {
        console.error(
          "[API CLIENT] Refresh error status:",
          refreshError.response?.status
        );
        console.error(
          "[API CLIENT] Refresh error data:",
          refreshError.response?.data
        );
      }

      // Refresh failed, redirect to login
      if (typeof window !== "undefined") {
        console.log(
          "[API CLIENT] Dispatching auth:logout event and redirecting to login"
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
  withCredentials: true, // Include cookies in requests
  // NOTE: Do NOT set default Content-Type header
  // This allows axios to automatically set the correct header:
  // - For JSON: axios sets "application/json"
  // - For FormData: axios sets "multipart/form-data" with proper boundary
  timeout: 30000 // 30 seconds - increased from default 10s for slower API responses
});

const apiClientMultipart = axios.create({
  baseURL: PROXY_BASE,
  withCredentials: true,
  timeout: 30000 // 30 seconds
});

// Apply interceptors to both clients
apiClient.interceptors.request.use(requestInterceptor, requestErrorHandler);
apiClient.interceptors.response.use(responseInterceptor, responseErrorHandler);

apiClientMultipart.interceptors.request.use(
  requestInterceptor,
  requestErrorHandler
);
apiClientMultipart.interceptors.response.use(
  responseInterceptor,
  responseErrorHandler
);

/**
 * @deprecated Use the session-based approach instead
 * Tokens are now managed server-side in encrypted cookies
 */
export function setAccessToken() {
  // No-op: tokens are now handled by the server
}

/**
 * @deprecated Use the session-based approach instead
 * Tokens are now managed server-side in encrypted cookies
 */
export function clearAccessToken() {
  // No-op: tokens are now handled by the server
}

export { apiClientMultipart };
export default apiClient;