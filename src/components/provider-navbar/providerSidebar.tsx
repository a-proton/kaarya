"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableCellsLarge,
  faFolder,
  faUsers,
  faUserGroup,
  faCalendar,
  faMessage,
  faDollarSign,
  faGear,
  faNewspaper,
  faCheckCircle,
  faSignOut,
  faSpinner,
  faFileAlt,
  faArchive,
  faEllipsis,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";

const navigationItems = [
  { icon: faTableCellsLarge, label: "Dashboard", href: "/provider/dashboard" },
  { icon: faFolder, label: "Projects", href: "/provider/projects" },
  { icon: faCheckCircle, label: "Milestones", href: "/provider/milestones" },
  {
    icon: faNewspaper,
    label: "Daily Updates",
    href: "/provider/daily-updates",
  },
  { icon: faArchive, label: "Inventory", href: "/provider/inventory" },
  { icon: faUsers, label: "Clients", href: "/provider/clients" },
  { icon: faUserGroup, label: "Team", href: "/provider/teams" },
  {
    icon: faUsers,
    label: "Team Attendance",
    href: "/provider/team-attendance",
  },
  { icon: faCalendar, label: "Calendar", href: "/provider/calendar" },
  { icon: faMessage, label: "Messages", href: "/provider/messages" },
  { icon: faDollarSign, label: "Earnings", href: "/provider/earnings" },
  { icon: faFileAlt, label: "Reports", href: "/provider/reports" },
  { icon: faGear, label: "Settings", href: "/provider/settings" },
];

export default function ProviderSidebar() {
  const pathname = usePathname();
  const { user, isLoading: userLoading, logout } = useUser();
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

  const getDisplayName = () => {
    if (!user) return "User";
    return user.full_name || user.business_name || user.email || "User";
  };

  const getRole = () => {
    if (!user) return "";
    return user.business_name ? "Business Owner" : "Service Provider";
  };

  return (
    <>
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
            style={{ backgroundColor: "var(--color-primary)" }}
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
              Karya
            </h1>
            <p
              className="font-medium leading-none tracking-widest"
              style={{
                fontSize: "0.52rem",
                color: "var(--color-neutral-400)",
                letterSpacing: "0.09em",
              }}
            >
              WHERE SKILLS MEET OPPORTUNITY
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
          <ul className="space-y-px">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: isActive
                        ? "var(--color-primary-light)"
                        : "transparent",
                      color: isActive
                        ? "var(--color-primary)"
                        : "var(--color-neutral-600)",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: "0.875rem",
                      textDecoration: "none",
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 rounded-r-sm"
                        style={{
                          width: "3px",
                          height: "1.375rem",
                          backgroundColor: "var(--color-primary)",
                          transform: "translateY(-50%)",
                        }}
                      />
                    )}
                    <FontAwesomeIcon
                      icon={item.icon}
                      fixedWidth
                      style={{
                        color: isActive
                          ? "var(--color-primary)"
                          : "var(--color-neutral-400)",
                        fontSize: "0.9rem",
                      }}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
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
            disabled={userLoading}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            style={{ cursor: "pointer", backgroundColor: "transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--color-neutral-100)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
            }}
          >
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={getDisplayName()}
                className="rounded-full object-cover flex-shrink-0"
                style={{ width: "2.25rem", height: "2.25rem" }}
              />
            ) : (
              <div
                className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  backgroundColor: "var(--color-primary)",
                  color: "white",
                  fontSize: "0.75rem",
                }}
              >
                {getUserInitials()}
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p
                className="font-semibold truncate leading-tight"
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                {userLoading ? "Loading..." : getDisplayName()}
              </p>
              <p
                className="truncate leading-tight"
                style={{
                  fontSize: "0.7rem",
                  color: "var(--color-neutral-400)",
                }}
              >
                {getRole()}
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
