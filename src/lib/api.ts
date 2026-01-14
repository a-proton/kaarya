// lib/api.ts - UPDATED VERSION with FormData support
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
  storeTokens,
} from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
  _retry?: boolean; // Internal flag to prevent infinite loops
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    console.error("No refresh token available");
    return null;
  }

  try {
    console.log("🔄 Refreshing access token...");

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      console.error("❌ Token refresh failed:", response.status);
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access || data.access_token;

    if (newAccessToken) {
      console.log("✅ Token refreshed successfully");
      // Store the new access token (keep the same refresh token)
      storeTokens(newAccessToken, refreshToken);
      return newAccessToken;
    }

    return null;
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return null;
  }
}

/**
 * Authenticated fetch wrapper with automatic token refresh
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    requireAuth = true,
    headers = {},
    _retry = false,
    body,
    ...fetchOptions
  } = options;

  // Prepare headers
  const requestHeaders: HeadersInit = { ...headers };

  // Check if body is FormData
  const isFormData = body instanceof FormData;

  // Only set Content-Type for non-FormData requests
  if (!isFormData && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  // Add auth token if required
  if (requireAuth) {
    const token = getAccessToken();

    if (!token) {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login?type=provider&session=expired";
      }
      throw new ApiError("No authentication token found", 401);
    }

    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Make the request
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...fetchOptions,
    headers: requestHeaders,
    body: body,
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
      errorData = {
        message: `HTTP ${response.status} Error`,
        detail: response.statusText,
      };
    }

    // Handle 401 Unauthorized - Try to refresh token
    if (response.status === 401 && requireAuth && !_retry) {
      console.log("🔑 Access token expired, attempting refresh...");

      const newToken = await refreshAccessToken();

      if (newToken) {
        // Retry the original request with the new token
        console.log("♻️ Retrying original request with new token...");
        return apiFetch<T>(endpoint, {
          ...options,
          _retry: true, // Prevent infinite retry loops
        });
      } else {
        // Refresh failed, clear tokens and redirect to login
        console.log("❌ Token refresh failed, logging out...");
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login?type=provider&session=expired";
        }
        throw new ApiError(
          "Session expired. Please login again.",
          401,
          errorData
        );
      }
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

  post: <T = any>(endpoint: string, data?: any, options?: FetchOptions) => {
    // Check if data is FormData
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
