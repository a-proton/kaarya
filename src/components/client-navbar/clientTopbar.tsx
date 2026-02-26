"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faBell,
  faSignOut,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearTokens, getRefreshToken } from "@/lib/auth";
import { api } from "@/lib/api";
import Link from "next/link";
import { useClientCounts } from "@/hooks/useNotificationCount"; // ← added

interface ApiError {
  message?: string;
}

function getInitials(name: string): string {
  if (!name) return "CL";
  const words = name.trim().split(" ");
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return words[0].substring(0, 2).toUpperCase();
}

function getFirstName(fullName?: string): string {
  if (!fullName) return "there";
  return fullName.trim().split(" ")[0];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function ClientTopbar() {
  const router = useRouter();
  const { unreadNotifications } = useClientCounts(); // ← replaced useState(7)
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    full_name?: string;
    email?: string;
    initials?: string;
  } | null>(null);

  useEffect(() => {
    const profile = getUserProfile();
    if (profile) {
      setUserProfile({
        full_name: profile.full_name,
        email: profile.email,
        initials:
          profile.initials ||
          getInitials(profile.full_name || profile.email || ""),
      });
    }
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          await api.post("/api/v1/auth/logout/", {
            refresh_token: refreshToken,
          });
        } catch (e) {
          console.error("Logout API error:", e);
        }
      }
      clearTokens();
      setShowLogoutModal(false);
      router.push("/login?type=client");
    } catch (e) {
      const err = e as ApiError;
      console.error("Logout error:", err.message);
      clearTokens();
      router.push("/login?type=client");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const today = new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();

  const initials = userProfile?.initials || "CL";
  const badgeCount = unreadNotifications > 99 ? "99+" : unreadNotifications;

  return (
    <>
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-8 h-16"
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
        }}
      >
        {/* Left: Greeting */}
        <div className="flex-1 min-w-0">
          <h1
            className="font-bold leading-tight truncate"
            style={{ fontSize: "1.2rem", color: "var(--color-neutral-900)" }}
          >
            {`${getGreeting()}, ${getFirstName(userProfile?.full_name)}`}
          </h1>
          <p
            className="font-semibold leading-none truncate mt-0.5"
            style={{
              fontSize: "0.6rem",
              color: "var(--color-neutral-400)",
              letterSpacing: "0.1em",
            }}
          >
            {today}
          </p>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--color-neutral-400)", fontSize: "0.8rem" }}
            />
            <input
              type="text"
              placeholder="Search updates, milestones…"
              style={{
                paddingLeft: "2.25rem",
                paddingRight: "1rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                width: "18rem",
                fontSize: "0.875rem",
                fontFamily: "var(--font-sans)",
                color: "var(--color-neutral-900)",
                backgroundColor: "var(--color-neutral-0)",
                border: "1px solid var(--color-neutral-200)",
                borderRadius: "0.625rem",
                outline: "none",
                transition: "border-color 150ms, box-shadow 150ms",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#1ab189";
                e.target.style.boxShadow = "0 0 0 3px rgba(26,177,137,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--color-neutral-200)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Notifications bell */}
          <Link
            href="/client/notifications"
            className="relative flex items-center justify-center rounded-xl transition-colors"
            aria-label={
              unreadNotifications > 0
                ? `Notifications — ${unreadNotifications} unread`
                : "Notifications"
            }
            style={{
              width: "2.5rem",
              height: "2.5rem",
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                "var(--color-neutral-100)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                "var(--color-neutral-0)";
            }}
          >
            <FontAwesomeIcon
              icon={faBell}
              style={{
                color:
                  unreadNotifications > 0
                    ? "#1ab189"
                    : "var(--color-neutral-500)",
                fontSize: "0.9rem",
              }}
            />
            {unreadNotifications > 0 && (
              <span
                aria-hidden="true"
                className="absolute flex items-center justify-center font-bold text-white rounded-full"
                style={{
                  top: "-5px",
                  right: "-5px",
                  minWidth: "1.1rem",
                  height: "1.1rem",
                  padding: "0 0.2rem",
                  fontSize: "0.55rem",
                  backgroundColor: "#1ab189",
                  border: "2px solid var(--color-neutral-0)",
                  animation: "badge-pop 200ms ease-out",
                }}
              >
                {badgeCount}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="rounded-full flex items-center justify-center font-bold transition-opacity"
            style={{
              width: "2.5rem",
              height: "2.5rem",
              backgroundColor: "#1ab189",
              color: "white",
              fontSize: "0.8125rem",
              cursor: "pointer",
              border: "none",
              flexShrink: 0,
            }}
            title={userProfile?.full_name || "Client"}
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Badge pop animation */}
      <style>{`
        @keyframes badge-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              border: "1px solid var(--color-neutral-200)",
            }}
          >
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#fef2f2" }}
                >
                  <FontAwesomeIcon
                    icon={faSignOut}
                    style={{ color: "#ef4444", width: "1rem" }}
                  />
                </div>
                <div>
                  <h3
                    className="font-semibold mb-1"
                    style={{
                      fontSize: "1rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    Sign out
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    You&apos;ll be redirected to the login page.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--color-neutral-600)",
                    backgroundColor: "transparent",
                    border: "1px solid var(--color-neutral-200)",
                    borderRadius: "0.5rem",
                    cursor: isLoggingOut ? "not-allowed" : "pointer",
                    opacity: isLoggingOut ? 0.5 : 1,
                    transition: "background-color 150ms",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoggingOut)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "var(--color-neutral-100)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoggingOut)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "transparent";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    backgroundColor: isLoggingOut ? "#f87171" : "#ef4444",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: isLoggingOut ? "not-allowed" : "pointer",
                    opacity: isLoggingOut ? 0.75 : 1,
                    transition: "background-color 150ms",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoggingOut)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoggingOut)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "#ef4444";
                  }}
                >
                  {isLoggingOut ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                        style={{ width: "0.875rem" }}
                      />
                      Signing out…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faSignOut}
                        style={{ width: "0.875rem" }}
                      />
                      Sign out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
