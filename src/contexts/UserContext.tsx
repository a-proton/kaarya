// contexts/UserContext.tsx - Fixed with persistent session support
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearTokens,
  clearUserProfile,
  getRefreshToken,
  getAccessToken,
  storeUserProfile,
  hasSession,
  silentTokenRefresh,
  isTokenExpired,
  getUserProfile,
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

// How often to proactively check if token needs refreshing (every 4 minutes)
const TOKEN_CHECK_INTERVAL = 4 * 60 * 1000;

// Refresh token when it has less than 5 minutes left
const REFRESH_BUFFER_SECONDS = 5 * 60;

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false); // prevent concurrent refresh calls

  /**
   * Attempt to refresh the access token.
   * Returns true if we have a valid session after the attempt.
   */
  const ensureValidToken = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) return true;

    const accessToken = getAccessToken();

    // Token is still valid — nothing to do
    if (accessToken && !isTokenExpired(accessToken, REFRESH_BUFFER_SECONDS)) {
      return true;
    }

    // Access token expired or missing — try refresh
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.log("No refresh token — session invalid");
      return false;
    }

    isRefreshingRef.current = true;
    try {
      const newToken = await silentTokenRefresh();
      return !!newToken;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  /**
   * Load user from localStorage and validate the session.
   * If access token is expired, try to refresh before giving up.
   */
  const loadUser = useCallback(async () => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    // Check if there's any session at all (refresh token + stored profile)
    if (!hasSession()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Try to ensure we have a valid access token
    const tokenValid = await ensureValidToken();

    if (!tokenValid) {
      // Refresh token is also invalid — clear everything
      console.log("❌ Session invalid, clearing tokens");
      clearTokens();
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Token is valid, load profile from storage
    const storedProfile = getUserProfile();
    if (storedProfile) {
      setUser(storedProfile);
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, [ensureValidToken]);

  // Start the proactive token refresh interval
  const startRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(async () => {
      console.log("⏰ Proactive token check...");
      const valid = await ensureValidToken();

      if (!valid) {
        console.log("❌ Could not refresh token — logging out");
        // Don't call logout() here (it would loop); just clean up
        clearInterval(refreshIntervalRef.current!);
        refreshIntervalRef.current = null;
        clearTokens();
        setUser(null);
        router.push("/login?type=provider&session=expired");
      }
    }, TOKEN_CHECK_INTERVAL);
  }, [ensureValidToken, router]);

  // Stop the refresh interval
  const stopRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // On mount, load user and start refresh loop if logged in
  useEffect(() => {
    loadUser().then(() => {
      // After loading, if we have a user, start the refresh interval
      const profile = getUserProfile();
      if (profile) {
        startRefreshInterval();
      }
    });

    return () => stopRefreshInterval();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When user state changes, manage the refresh interval
  useEffect(() => {
    if (user) {
      startRefreshInterval();
    } else {
      stopRefreshInterval();
    }
  }, [user, startRefreshInterval, stopRefreshInterval]);

  /**
   * Handle tab becoming visible again — refresh token if needed.
   * This prevents logout when user returns to a backgrounded tab.
   */
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && user) {
        console.log("👁️ Tab visible — checking token validity...");
        const valid = await ensureValidToken();
        if (!valid) {
          console.log("❌ Session expired while tab was hidden — logging out");
          clearTokens();
          setUser(null);
          router.push("/login?type=provider&session=expired");
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, ensureValidToken, router]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await api.post("/api/v1/auth/logout/", { refresh_token: refreshToken });
      }
    } catch (error) {
      // Logout errors are non-critical — continue cleanup
      console.error("Logout API error:", error);
    } finally {
      stopRefreshInterval();
      clearTokens();
      clearUserProfile();
      setUser(null);
      router.push("/login?type=provider");
    }
  }, [router, stopRefreshInterval]);

  const refreshUser = useCallback(() => {
    const storedProfile = getUserProfile();
    if (storedProfile) {
      setUser(storedProfile);
    }
  }, []);

  const updateUser = useCallback(
    (userData: Partial<User>) => {
      if (user) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        storeUserProfile(updatedUser);
      }
    },
    [user],
  );

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
