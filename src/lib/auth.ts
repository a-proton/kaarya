// lib/auth.ts - Enhanced version with token expiration checking
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export interface LoginResponse {
  success?: boolean;
  message?: string;
  data?: {
    user?: {
      id: number;
      email: string;
      phone?: string;
      full_name?: string;
      user_type?: string;
    };
    profile?: {
      id: number;
      full_name?: string;
      business_name?: string;
      profile_image?: string;
      initials?: string;
      slug?: string;
      category_name?: string;
      [key: string]: any;
    };
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
  [key: string]: any;
}

export interface UserProfile {
  id: number;
  email: string;
  phone?: string;
  full_name?: string;
  business_name?: string;
  profile_image?: string;
  initials?: string;
  user_type?: string;
  category_name?: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

interface TokenPayload {
  exp: number;
  user_id: number;
  [key: string]: any;
}

// Login API call
export async function login(
  email: string,
  password: string,
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
  refresh: string,
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

// Decode JWT token without verification (client-side only)
function decodeToken(token: string): TokenPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

// Check if token is expired or will expire soon
export function isTokenExpired(
  token: string,
  bufferSeconds: number = 60,
): boolean {
  const payload = decodeToken(token);

  if (!payload || !payload.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = payload.exp;

  // Return true if token is expired or will expire within buffer time
  return currentTime >= expirationTime - bufferSeconds;
}

// Get token expiration time
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeToken(token);

  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

// Extract access token from various response formats
export function extractAccessToken(response: LoginResponse): string | null {
  if (response.data?.tokens?.access) {
    return response.data.tokens.access;
  }

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

// Store tokens in localStorage with timestamp
export function storeTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("tokenStoredAt", Date.now().toString());

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }

  // Log token expiration for debugging
  const expiration = getTokenExpiration(accessToken);
  if (expiration) {
    console.log("🔑 Token will expire at:", expiration.toLocaleString());
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

// Store user profile in localStorage
export function storeUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") {
    console.error("❌ Window is undefined - cannot store profile (SSR)");
    return;
  }

  try {
    if (!profile.id || !profile.email) {
      console.error("❌ Invalid profile - missing required fields:", profile);
      return;
    }

    const profileString = JSON.stringify(profile);
    localStorage.setItem("userProfile", profileString);
    console.log("✅ User profile stored successfully");
  } catch (error) {
    console.error("❌ Error in storeUserProfile:", error);
  }
}

// Get user profile from localStorage
export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const profile = localStorage.getItem("userProfile");

    if (!profile) {
      return null;
    }

    return JSON.parse(profile);
  } catch (error) {
    console.error("❌ Error in getUserProfile:", error);
    return null;
  }
}

// Clear user profile from localStorage
export function clearUserProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("userProfile");
}

// Clear tokens from localStorage
export function clearTokens(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tokenStoredAt");
  localStorage.removeItem("authToken");
  clearUserProfile();
}

// Check if user is authenticated with valid token
export function isAuthenticated(): boolean {
  const token = getAccessToken();

  if (!token) {
    return false;
  }

  // Check if token is expired
  if (isTokenExpired(token)) {
    console.log("⚠️ Access token is expired");
    return false;
  }

  return true;
}
// Replace the forgot password functions in your lib/auth.ts with these corrected versions
// They now use API_BASE_URL to match your existing login/logout functions

/**
 * Request password reset link
 */
export async function forgotPassword(email: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/password/forgot/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send reset email");
  }

  return response.json();
}

/**
 * Verify reset token validity
 */
export async function verifyResetToken(token: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/auth/password/verify-token/?token=${token}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Invalid or expired token");
  }

  return response.json();
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string,
  newPasswordConfirm: string,
) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/password/reset/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reset password");
  }

  return response.json();
}
