// contexts/UserContext.tsx - FIXED VERSION
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearTokens,
  clearUserProfile,
  getRefreshToken,
  storeUserProfile,
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadUser = () => {
    // Check if localStorage is available
    if (typeof window === "undefined") {
      console.log("Window is undefined - SSR");
      setIsLoading(false);
      return;
    }

    // Try to get the profile
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
      setUser(null);
    }

    setIsLoading(false);
    console.log("=== END USER LOADING ===");
  };

  useEffect(() => {
    loadUser();
  }, []);

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        // Call logout API
        await api.post("/api/v1/auth/logout/", {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with logout even if API fails
    } finally {
      // Clear tokens and user state
      clearTokens();
      clearUserProfile();
      setUser(null);

      // Redirect to login
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
