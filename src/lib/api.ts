// lib/api.ts - Fixed with correct token refresh response parsing
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
  storeTokens,
  silentTokenRefresh,
} from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
  _retry?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Authenticated fetch wrapper with automatic token refresh.
 * Uses silentTokenRefresh() from auth.ts which correctly parses
 * your backend's response format: { success: true, data: { access: "..." } }
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    requireAuth = true,
    headers = {},
    _retry = false,
    body,
    ...fetchOptions
  } = options;

  const requestHeaders: HeadersInit = { ...headers };
  const isFormData = body instanceof FormData;

  if (
    !isFormData &&
    !(requestHeaders as Record<string, string>)["Content-Type"]
  ) {
    (requestHeaders as Record<string, string>)["Content-Type"] =
      "application/json";
  }

  if (requireAuth) {
    const token = getAccessToken();

    if (!token) {
      // No access token — try to refresh before giving up
      if (!_retry) {
        const refreshed = await silentTokenRefresh();
        if (refreshed) {
          return apiFetch<T>(endpoint, { ...options, _retry: true });
        }
      }

      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login?type=provider&session=expired";
      }
      throw new ApiError("No authentication token found", 401);
    }

    (requestHeaders as Record<string, string>)["Authorization"] =
      `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...fetchOptions,
    headers: requestHeaders,
    body,
    credentials: "include",
  });

  if (!response.ok) {
    let errorData: any;

    try {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        errorData = await response.json();
      } else {
        errorData = await response.text();
      }
    } catch {
      errorData = {
        message: `HTTP ${response.status} Error`,
        detail: response.statusText,
      };
    }

    // 401 — try to refresh once
    if (response.status === 401 && requireAuth && !_retry) {
      console.log("🔑 Access token expired, attempting refresh...");

      const newToken = await silentTokenRefresh();

      if (newToken) {
        console.log("♻️ Retrying request with refreshed token...");
        return apiFetch<T>(endpoint, { ...options, _retry: true });
      } else {
        console.log("❌ Token refresh failed, logging out...");
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login?type=provider&session=expired";
        }
        throw new ApiError(
          "Session expired. Please login again.",
          401,
          errorData,
        );
      }
    }

    const errorMessage =
      errorData?.detail ||
      errorData?.message ||
      errorData?.error ||
      (typeof errorData === "string" ? errorData : null) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(errorMessage, response.status, errorData);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text() as any;
}

export const api = {
  get: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, data?: any, options?: FetchOptions) => {
    const isFormData = data instanceof FormData;
    return apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T = any>(endpoint: string, data?: any, options?: FetchOptions) => {
    const isFormData = data instanceof FormData;
    return apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    });
  },

  patch: <T = any>(endpoint: string, data?: any, options?: FetchOptions) => {
    const isFormData = data instanceof FormData;
    return apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "DELETE" }),
};
