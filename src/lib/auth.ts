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

// src/lib/auth.ts
// Replace the storeUserProfile and getUserProfile functions with these:

// Store user profile in localStorage
export function storeUserProfile(profile: UserProfile): void {
  console.log("=== storeUserProfile CALLED ===");
  console.log("typeof window:", typeof window);

  if (typeof window === "undefined") {
    console.error("❌ Window is undefined - cannot store profile (SSR)");
    return;
  }

  try {
    console.log("Profile to store:", profile);

    // Validate profile has required fields
    if (!profile.id || !profile.email) {
      console.error("❌ Invalid profile - missing required fields:", profile);
      return;
    }

    const profileString = JSON.stringify(profile);
    console.log(
      "Stringified profile length:",
      profileString.length,
      "characters"
    );

    localStorage.setItem("userProfile", profileString);
    console.log("✅ localStorage.setItem completed");

    // Immediate verification
    const verification = localStorage.getItem("userProfile");

    if (!verification) {
      console.error("❌ CRITICAL: Storage verification failed!");
      console.error("localStorage.setItem was called but getItem returns null");

      // Try to diagnose
      try {
        const test = "test_storage_" + Date.now();
        localStorage.setItem("test_key", test);
        const testResult = localStorage.getItem("test_key");
        if (testResult === test) {
          console.log("✅ localStorage is working (test passed)");
          console.error(
            "❌ But userProfile storage still failed - this is strange!"
          );
        } else {
          console.error(
            "❌ localStorage test also failed - localStorage might be blocked"
          );
        }
        localStorage.removeItem("test_key");
      } catch (testError) {
        console.error("❌ localStorage test error:", testError);
      }
    } else {
      console.log("✅ Storage verification successful");
      const parsed = JSON.parse(verification);
      console.log("Verified stored full_name:", parsed.full_name);
      console.log("Verified stored business_name:", parsed.business_name);
    }
  } catch (error) {
    console.error("❌ Error in storeUserProfile:", error);

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }

  console.log("=== storeUserProfile END ===");
}

// Get user profile from localStorage
export function getUserProfile(): UserProfile | null {
  console.log("=== getUserProfile CALLED ===");
  console.log("typeof window:", typeof window);

  if (typeof window === "undefined") {
    console.log("Window is undefined - returning null (SSR)");
    return null;
  }

  try {
    const profile = localStorage.getItem("userProfile");
    console.log(
      "Raw profile from storage:",
      profile ? `Found (${profile.length} chars)` : "null"
    );

    if (!profile) {
      console.log("No profile found in localStorage");

      // Debug: List all localStorage keys
      console.log("All localStorage keys:", Object.keys(localStorage));

      return null;
    }

    const parsed = JSON.parse(profile);
    console.log("Parsed profile successfully");
    console.log("Profile details:");
    console.log("  id:", parsed.id);
    console.log("  email:", parsed.email);
    console.log("  full_name:", parsed.full_name);
    console.log("  business_name:", parsed.business_name);
    console.log("  initials:", parsed.initials);
    console.log("✅ getUserProfile returning profile");

    return parsed;
  } catch (error) {
    console.error("❌ Error in getUserProfile:", error);

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
    }

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
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("authToken"); // Clear old token if exists
  clearUserProfile(); // Also clear user profile
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
