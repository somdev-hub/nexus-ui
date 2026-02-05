import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse
} from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Store access token in memory (not localStorage for security)
let accessToken: string | null = null;

// Create request interceptor
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  // For FormData requests, remove Content-Type header to let axios set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
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
      const response = await axios.post(
        `${API_BASE}/iam/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { accessToken: newToken } = response.data;
      accessToken = newToken;

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      accessToken = null;
      window.dispatchEvent(new Event("auth:logout"));

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
};

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

const apiClientMultipart = axios.create({
  baseURL: API_BASE,
  withCredentials: true
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

export function setAccessToken(token: string) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export { apiClientMultipart };
export default apiClient;
