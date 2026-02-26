"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faClipboardList,
  faCheckCircle,
  faMessage,
  faCreditCard,
  faGear,
  faQuestionCircle,
  faSignOut,
  faSpinner,
  faEllipsis,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getUserProfile, clearTokens, getRefreshToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { useClientCounts } from "@/hooks/useNotificationCount"; // ← added

// ── Nav item type — badgeKey drives the live badge ──────────────────
interface NavItem {
  icon: Parameters<typeof FontAwesomeIcon>[0]["icon"];
  label: string;
  href: string;
  badgeKey?: "messages" | "notifications";
}

const navigationItems: NavItem[] = [
  { icon: faHome, label: "Dashboard", href: "/client/dashboard" },
  {
    icon: faClipboardList,
    label: "Project Updates",
    href: "/client/project-updates",
  },
  { icon: faCheckCircle, label: "Milestones", href: "/client/milestones" },
  {
    icon: faMessage,
    label: "Messages",
    href: "/client/messages",
    badgeKey: "messages", // ← triggers live badge
  },
  { icon: faCreditCard, label: "Payments", href: "/client/payments" },
  { icon: faGear, label: "Settings", href: "/client/settings" },
  { icon: faQuestionCircle, label: "Help & Support", href: "/client/support" },
];

interface ApiError {
  message?: string;
}

function getInitials(name: string): string {
  if (!name) return "CL";
  const words = name.trim().split(" ");
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return words[0].substring(0, 2).toUpperCase();
}

// ── Small badge shown next to nav label ─────────────────────────────
function SidebarBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center font-bold rounded-full"
      style={{
        minWidth: "1.1rem",
        height: "1.1rem",
        padding: "0 0.2rem",
        fontSize: "0.58rem",
        backgroundColor: "#1ab189",
        color: "white",
        flexShrink: 0,
        animation: "badge-pop 200ms ease-out",
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadMessages } = useClientCounts(); // ← added
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

  // Map badgeKey → live count
  const badgeCounts: Record<string, number> = {
    messages: unreadMessages,
    notifications: 0, // not used in sidebar but kept for extensibility
  };

  const displayName =
    userProfile?.full_name || userProfile?.email || "Client User";
  const initials = userProfile?.initials || "CL";

  return (
    <>
      {/* Badge pop animation */}
      <style>{`
        @keyframes badge-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <aside
        className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40"
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderRight: "1px solid var(--color-neutral-200)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 h-16 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--color-neutral-200)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#1ab189" }}
          >
            <span className="text-white font-bold" style={{ fontSize: "1rem" }}>
              K
            </span>
          </div>
          <div>
            <h1
              className="font-bold leading-tight"
              style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
            >
              Kaarya
            </h1>
            <p
              className="font-medium leading-none"
              style={{
                fontSize: "0.52rem",
                color: "var(--color-neutral-400)",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
              }}
            >
              Client Portal
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-2">
          <p
            className="px-3 mb-2 font-semibold"
            style={{
              fontSize: "0.58rem",
              color: "var(--color-neutral-400)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Main Menu
          </p>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const badgeCount = item.badgeKey
                ? (badgeCounts[item.badgeKey] ?? 0)
                : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: isActive
                        ? "rgba(26,177,137,0.1)"
                        : "transparent",
                      color: isActive ? "#1ab189" : "var(--color-neutral-600)",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: "0.875rem",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (
                          e.currentTarget as HTMLAnchorElement
                        ).style.backgroundColor = "var(--color-neutral-100)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (
                          e.currentTarget as HTMLAnchorElement
                        ).style.backgroundColor = "transparent";
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 rounded-r-sm"
                        style={{
                          width: 3,
                          height: "1.375rem",
                          backgroundColor: "#1ab189",
                          transform: "translateY(-50%)",
                        }}
                      />
                    )}
                    <FontAwesomeIcon
                      icon={item.icon}
                      fixedWidth
                      style={{
                        color: isActive
                          ? "#1ab189"
                          : "var(--color-neutral-400)",
                        fontSize: "0.9rem",
                      }}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {/* Live badge — only renders when count > 0 */}
                    <SidebarBadge count={badgeCount} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile */}
        <div
          className="p-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--color-neutral-200)" }}
        >
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
            style={{
              cursor: "pointer",
              backgroundColor: "transparent",
              border: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--color-neutral-100)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
            }}
          >
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{
                width: "2.25rem",
                height: "2.25rem",
                backgroundColor: "#1ab189",
                color: "white",
                fontSize: "0.75rem",
              }}
            >
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p
                className="font-semibold truncate leading-tight"
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                {displayName}
              </p>
              <p
                className="truncate leading-tight"
                style={{
                  fontSize: "0.7rem",
                  color: "var(--color-neutral-400)",
                }}
              >
                Client Account
              </p>
            </div>
            <FontAwesomeIcon
              icon={faEllipsis}
              style={{
                color: "var(--color-neutral-400)",
                fontSize: "0.875rem",
              }}
            />
          </button>
        </div>
      </aside>

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
