"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faBell,
  faSignOut,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";

export default function ProviderTopbar() {
  const { user, isLoading: userLoading, logout } = useUser();
  const [notificationCount] = useState(3);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.initials) return user.initials;
    if (user.full_name) {
      const names = user.full_name.split(" ");
      return names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0].substring(0, 2).toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getFirstName = () => {
    if (!user) return "there";
    if (user.full_name) return user.full_name.split(" ")[0];
    if (user.business_name) return user.business_name.split(" ")[0];
    return user.email?.split("@")[0] || "there";
  };

  const today = new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();

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
            style={{
              fontSize: "1.2rem",
              color: "var(--color-neutral-900)",
            }}
          >
            {userLoading ? "Loading…" : `${getGreeting()}, ${getFirstName()}`}
          </h1>
          <p
            className="font-semibold tracking-widest leading-none truncate mt-0.5"
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
              style={{
                color: "var(--color-neutral-400)",
                fontSize: "0.8rem",
              }}
            />
            <input
              type="text"
              placeholder="Search..."
              style={{
                paddingLeft: "2.25rem",
                paddingRight: "1rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                width: "16rem",
                fontSize: "0.875rem",
                fontFamily: "var(--font-sans)",
                color: "var(--color-neutral-900)",
                backgroundColor: "var(--color-neutral-0)",
                border: "1px solid var(--color-neutral-200)",
                borderRadius: "0.625rem",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--color-primary)";
                e.target.style.boxShadow = "0 0 0 3px rgba(26, 177, 137, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--color-neutral-200)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Notifications */}
          <Link
            href="/provider/notifications"
            className="relative flex items-center justify-center rounded-xl transition-colors"
            aria-label="Notifications"
            style={{
              width: "2.5rem",
              height: "2.5rem",
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
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
                color: "var(--color-neutral-500)",
                fontSize: "0.9rem",
              }}
            />
            {notificationCount > 0 && (
              <span
                className="absolute flex items-center justify-center font-bold text-white rounded-full"
                style={{
                  top: "-5px",
                  right: "-5px",
                  width: "1.1rem",
                  height: "1.1rem",
                  fontSize: "0.55rem",
                  backgroundColor: "var(--color-primary)",
                }}
              >
                {notificationCount}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={userLoading}
            className="rounded-full flex items-center justify-center font-bold transition-opacity disabled:opacity-50"
            style={{
              width: "2.5rem",
              height: "2.5rem",
              backgroundColor: "var(--color-primary)",
              color: "white",
              fontSize: "0.8125rem",
              cursor: "pointer",
              border: "none",
              overflow: "hidden",
            }}
            title={user?.full_name || user?.email || "Profile"}
          >
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              getUserInitials()
            )}
          </button>
        </div>
      </header>

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
                  className="btn btn-ghost btn-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="btn btn-danger btn-md"
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
