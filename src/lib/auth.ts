// lib/auth.ts - Fixed for ROTATE_REFRESH_TOKENS = True
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || "Login failed");
  }

  return response.json();
}

// Decode JWT token (client-side, no verification)
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
  } catch {
    return null;
  }
}

// Check if token is expired or expiring within bufferSeconds
export function isTokenExpired(
  token: string,
  bufferSeconds: number = 60,
): boolean {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= payload.exp - bufferSeconds;
}

// Get token expiration as Date
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeToken(token);
  if (!payload?.exp) return null;
  return new Date(payload.exp * 1000);
}

// Extract access token from login response
export function extractAccessToken(response: LoginResponse): string | null {
  return (
    response.data?.tokens?.access ||
    response.access_token ||
    response.access ||
    response.token ||
    response.tokens?.access ||
    null
  );
}

// Extract refresh token from login response
export function extractRefreshToken(response: LoginResponse): string | null {
  return (
    response.data?.tokens?.refresh ||
    response.refresh_token ||
    response.refresh ||
    response.tokens?.refresh ||
    null
  );
}

// Store BOTH tokens — critical when ROTATE_REFRESH_TOKENS = True
export function storeTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("tokenStoredAt", Date.now().toString());

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }

  // Set cookie so Next.js middleware can read it
  const tokenExp = getTokenExpiration(accessToken);
  const expires = tokenExp ? `; expires=${tokenExp.toUTCString()}` : "";
  document.cookie = `accessToken=${accessToken}; path=/; SameSite=Lax${expires}`;

  if (tokenExp) {
    console.log("🔑 Access token expires at:", tokenExp.toLocaleString());
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

export function storeUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    if (!profile.id || !profile.email) return;
    localStorage.setItem("userProfile", JSON.stringify(profile));
  } catch (error) {
    console.error("❌ Error storing user profile:", error);
  }
}

export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const profile = localStorage.getItem("userProfile");
    return profile ? JSON.parse(profile) : null;
  } catch {
    return null;
  }
}

export function clearUserProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("userProfile");
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tokenStoredAt");
  localStorage.removeItem("authToken");
  clearUserProfile();

  // Clear cookies
  document.cookie =
    "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  document.cookie =
    "userType=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

/**
 * Silently refresh the access token.
 *
 * ⚠️  ROTATE_REFRESH_TOKENS = True means Django blacklists the old refresh
 * token and issues a NEW one on every refresh call. We MUST store the new
 * refresh token or the next refresh will get a 401 (old token blacklisted).
 */
export async function silentTokenRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.log("No refresh token stored — cannot refresh");
    return null;
  }

  try {
    console.log("🔄 Refreshing tokens...");

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      console.error("❌ Token refresh HTTP error:", response.status);
      return null;
    }

    const data = await response.json();

    const newAccessToken =
      data?.data?.access || data?.access || data?.access_token || null;

    const newRefreshToken =
      data?.data?.refresh || data?.refresh || data?.refresh_token || null;

    if (!newAccessToken) {
      console.error("❌ No access token in refresh response:", data);
      return null;
    }

    storeTokens(newAccessToken, newRefreshToken || refreshToken);

    if (newRefreshToken) {
      console.log("✅ Tokens refreshed — new refresh token stored (rotation)");
    } else {
      console.log("✅ Access token refreshed");
    }

    return newAccessToken;
  } catch (error) {
    console.error("❌ Error during token refresh:", error);
    return null;
  }
}

export function hasSession(): boolean {
  if (typeof window === "undefined") return false;
  const refreshToken = getRefreshToken();
  const profile = getUserProfile();
  return !!(refreshToken && profile);
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

export async function refreshToken(
  refresh: string,
): Promise<{ access_token: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  return response.json();
}

export async function forgotPassword(email: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/password/forgot/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send reset email");
  }
  return response.json();
}

export async function verifyResetToken(token: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/auth/password/verify-token/?token=${token}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  if (!response.ok) throw new Error("Invalid or expired token");
  return response.json();
}

export async function resetPassword(
  token: string,
  newPassword: string,
  newPasswordConfirm: string,
) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/password/reset/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
