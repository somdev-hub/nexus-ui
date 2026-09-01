import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

// Use the Next.js public API proxy which does NOT require authentication
// This is for public endpoints that don't need JWT tokens
const PUBLIC_PROXY_BASE = "/api/public/proxy";

/**
 * PUBLIC REQUEST FLOW:
 *
 * Client Code: apiClientPublic.get("/iam/recruitment/applicant-view/123")
 *           ↓
 * Request Interceptor: Converts to ?path=/iam/recruitment/applicant-view/123
 *           ↓
 * Proxy Route (/api/public/proxy): Makes direct call to Spring Boot
 *           ↓
 * Spring Boot: GET http://localhost:8080/iam/recruitment/applicant-view/123
 *            (WITHOUT Authorization header - public endpoint)
 *
 * This is for PUBLIC endpoints only - no authentication required
 */

const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  const path = config.url || "";

  if (!path.startsWith("?")) {
    config.url = `?path=${encodeURIComponent(path)}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  console.log(
    "[PUBLIC API CLIENT] Request:",
    config.method?.toUpperCase(),
    config.url,
  );

  return config;
};

const requestErrorHandler = (error: AxiosError) => Promise.reject(error);

const responseInterceptor = (response: AxiosResponse) => response;

const responseErrorHandler = async (error: AxiosError) => {
  return Promise.reject(error);
};

const apiClientPublic = axios.create({
  baseURL: PUBLIC_PROXY_BASE,
  withCredentials: true,
  timeout: 30000,
});

apiClientPublic.interceptors.request.use(
  requestInterceptor,
  requestErrorHandler,
);
apiClientPublic.interceptors.response.use(
  responseInterceptor,
  responseErrorHandler,
);

export default apiClientPublic;
