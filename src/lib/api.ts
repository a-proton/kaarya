// lib/api.ts
import { getAccessToken, clearTokens } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Authenticated fetch wrapper
 * Automatically adds auth token and handles common errors
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requireAuth = true, headers = {}, ...fetchOptions } = options;

  // Prepare headers
  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Add auth token if required
  if (requireAuth) {
    const token = getAccessToken();

    if (!token) {
      clearTokens();
      throw new ApiError("No authentication token found", 401);
    }

    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Make the request
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...fetchOptions,
    headers: requestHeaders,
    credentials: "include",
  });

  // Handle non-OK responses
  if (!response.ok) {
    let errorData;

    try {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        errorData = await response.json();
      } else {
        errorData = await response.text();
      }
    } catch (parseError) {
      // If we can't parse the error, create a generic one
      errorData = {
        message: `HTTP ${response.status} Error`,
        detail: response.statusText,
      };
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      clearTokens();
      throw new ApiError(
        "Session expired. Please login again.",
        401,
        errorData
      );
    }

    // Handle other errors
    const errorMessage =
      errorData?.detail ||
      errorData?.message ||
      errorData?.error ||
      (typeof errorData === "string" ? errorData : null) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Parse and return response
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text() as any;
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, data?: any, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "DELETE" }),
};
