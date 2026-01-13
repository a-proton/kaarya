// lib/auth.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export interface LoginResponse {
  success?: boolean;
  message?: string;
  data?: {
    user?: {
      id: number;
      email: string;
      full_name?: string;
      user_type?: string;
    };
    profile?: any;
    tokens?: {
      access?: string;
      refresh?: string;
    };
  };
  access_token?: string;
  refresh_token?: string;
  access?: string;
  refresh?: string;
  token?: string;
  tokens?: {
    access?: string;
    refresh?: string;
  };
  user?: {
    id: number;
    email: string;
    full_name?: string;
    user_type?: string;
  };
  [key: string]: any; // Allow for other response structures
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

// Login API call
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || "Login failed");
  }

  const data = await response.json();

  // Log the full response for debugging
  console.log("Login response:", data);

  return data;
}

// Logout API call
export async function logout(refreshToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Logout failed");
  }
}

// Refresh token API call
export async function refreshToken(
  refresh: string
): Promise<{ access_token: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  return response.json();
}

// Extract access token from various response formats
export function extractAccessToken(response: LoginResponse): string | null {
  // Check for nested data.tokens structure (your backend format)
  if (response.data?.tokens?.access) {
    return response.data.tokens.access;
  }

  // Try all possible token field names
  return (
    response.access_token ||
    response.access ||
    response.token ||
    response.tokens?.access ||
    null
  );
}

// Extract refresh token from various response formats
export function extractRefreshToken(response: LoginResponse): string | null {
  // Check for nested data.tokens structure (your backend format)
  if (response.data?.tokens?.refresh) {
    return response.data.tokens.refresh;
  }

  return (
    response.refresh_token ||
    response.refresh ||
    response.tokens?.refresh ||
    null
  );
}

// Store tokens in localStorage
export function storeTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
}

// Get access token from localStorage
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

// Get refresh token from localStorage
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

// Clear tokens from localStorage
export function clearTokens(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("authToken"); // Clear old token if exists
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
