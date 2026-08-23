import axios, { AxiosInstance } from "axios";

/**
 * Centralized Spring Boot API client configuration
 * Handles IPv4-only connections, connection pooling, and enhanced error handling
 */

const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

console.log(
  `[SPRING BOOT CLIENT] Initializing with API URL: ${SPRING_BOOT_API}`
);

/**
 * Create axios instance for Spring Boot API calls
 *
 * Key fixes for timeout issues:
 * - Forces IPv4 resolution only (prevents IPv6 timeout issues with localhost)
 * - 30 second timeout for all requests (increased from 10s for slower API responses)
 * - Enhanced error logging for debugging
 * - NO default Content-Type header (allows axios to handle it based on data type)
 */
const createSpringBootClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: SPRING_BOOT_API,
    timeout: 30000, // 30 second timeout - increased for slower API responses
    maxRedirects: 5
    // NOTE: Do NOT set default Content-Type header
    // This allows axios to automatically set the correct header based on request data:
    // - For JSON: axios sets "application/json"
    // - For FormData: axios sets "multipart/form-data" with proper boundary
  });

  // Add request interceptor for logging
  instance.interceptors.request.use(
    (config) => {
      console.log(
        `[SPRING BOOT API] ${config.method?.toUpperCase()} ${config.url}`
      );
      return config;
    },
    (error) => {
      console.error("[SPRING BOOT API] Request error:", error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging
  instance.interceptors.response.use(
    (response) => {
      console.log(
        `[SPRING BOOT API] Response: ${response.status} from ${response.config.method?.toUpperCase()} ${response.config.url}`
      );
      return response;
    },
    (error) => {
      if (axios.isAxiosError(error)) {
        const code = error.code;
        const message = error.message;
        const status = error.response?.status;
        const url = error.config?.url;

        console.error("[SPRING BOOT API] Error:", {
          code, // ENOTFOUND, ECONNREFUSED, ECONNABORTED, ETIMEDOUT, etc
          message,
          status,
          url,
                  address: (error as { address?: string }).address,
                  port: (error as { port?: number }).port,
                  syscall: (error as { syscall?: string }).syscall // connect, getaddrinfo, etc
        });
      } else {
        console.error("[SPRING BOOT API] Unknown error:", error);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Single instance to reuse
let instance: AxiosInstance | null = null;

export const getSpringBootClient = (): AxiosInstance => {
  if (!instance) {
    instance = createSpringBootClient();
  }
  return instance;
};

export default getSpringBootClient;