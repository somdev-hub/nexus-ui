import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse
} from "axios";

// Install axios if not already installed: npm install axios

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Store access token in memory (not localStorage for security)
let accessToken: string | null = null;

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Include HTTP-only cookies (refresh token)
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor: Add access token to every request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor: Handle token refresh on 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const response = await axios.post(
          `${API_BASE}/iam/auth/refresh`,
          {},
          {
            withCredentials: true // Send refresh token cookie
          }
        );

        const { accessToken: newToken } = response.data;
        accessToken = newToken;

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        accessToken = null;

        // Trigger logout event (handled in auth context)
        window.dispatchEvent(new Event("auth:logout"));

        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function setAccessToken(token: string) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export default apiClient;
