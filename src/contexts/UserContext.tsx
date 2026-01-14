// contexts/UserContext.tsx - FIXED with automatic token refresh
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearTokens,
  clearUserProfile,
  getRefreshToken,
  getAccessToken,
  storeTokens,
  storeUserProfile,
  isTokenExpired,
} from "@/lib/auth";
import { api } from "@/lib/api";

interface User {
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

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Refresh token 2 minutes before it expires
const TOKEN_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadUser = () => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem("userProfile");

    if (!stored) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const storedUser = JSON.parse(stored);
      setUser(storedUser);
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
    }

    setIsLoading(false);
  };

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();

    if (!refreshToken) {
      console.log("No refresh token available");
      return false;
    }

    // Check if access token needs refresh
    if (accessToken && !isTokenExpired(accessToken, 120)) {
      // Token still valid for at least 2 minutes
      console.log("✅ Access token still valid");
      return true;
    }

    try {
      console.log("🔄 Proactively refreshing access token...");

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
        }/api/v1/auth/token/refresh/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        }
      );

      if (!response.ok) {
        console.error("❌ Token refresh failed:", response.status);
        return false;
      }

      const data = await response.json();
      const newAccessToken = data.access || data.access_token;

      if (newAccessToken) {
        console.log("✅ Token refreshed successfully");
        storeTokens(newAccessToken, refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error("❌ Error refreshing token:", error);
      return false;
    }
  };

  // Setup automatic token refresh interval
  useEffect(() => {
    if (!user) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Check token immediately on mount
    refreshAccessToken();

    // Set up interval to check and refresh token every 2 minutes
    refreshIntervalRef.current = setInterval(() => {
      console.log("⏰ Checking token expiration...");
      refreshAccessToken().then((success) => {
        if (!success) {
          console.log("❌ Token refresh failed, logging out...");
          logout();
        }
      });
    }, TOKEN_REFRESH_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user]);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        await api.post("/api/v1/auth/logout/", {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      clearTokens();
      clearUserProfile();
      setUser(null);
      router.push("/login?type=provider");
    }
  };

  const refreshUser = () => {
    loadUser();
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      storeUserProfile(updatedUser);
    }
  };

  return (
    <UserContext.Provider
      value={{ user, isLoading, logout, refreshUser, updateUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
