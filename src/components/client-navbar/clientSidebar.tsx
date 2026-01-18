"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faClipboardList,
  faNewspaper,
  faFileAlt,
  faMessage,
  faCalendar,
  faCreditCard,
  faBell,
  faQuestionCircle,
  faSignOut,
  faCheckCircle,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getUserProfile, clearTokens, getRefreshToken } from "@/lib/auth";
import { api } from "@/lib/api";

const navigationItems = [
  { icon: faHome, label: "Dashboard", href: "/client/dashboard" },
  {
    icon: faClipboardList,
    label: "Project Updates",
    href: "/client/project-updates",
  },
  {
    icon: faCheckCircle,
    label: "Milestones",
    href: "/client/milestones",
  },
  {
    icon: faMessage,
    label: "Messages",
    href: "/client/messages",
    badge: 5,
  },
  {
    icon: faCreditCard,
    label: "Payments",
    href: "/client/payments",
  },
  {
    icon: faGear,
    label: "Settings",
    href: "/client/settings",
  },
  {
    icon: faQuestionCircle,
    label: "Help & Support",
    href: "/client/support",
  },
];

export default function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    full_name?: string;
    email?: string;
    initials?: string;
  } | null>(null);

  // Load user profile on mount
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

  // Generate initials from name
  const getInitials = (name: string): string => {
    if (!name) return "CL";
    const words = name.split(" ");
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const refreshToken = getRefreshToken();

      // Call logout API
      if (refreshToken) {
        try {
          await api.post("/api/v1/auth/logout/", {
            refresh_token: refreshToken,
          });
          console.log("✅ Logout API call successful");
        } catch (apiError) {
          console.error("❌ Logout API error (continuing anyway):", apiError);
          // Continue with logout even if API call fails
        }
      }

      // Clear all tokens and user data
      clearTokens();
      console.log("✅ Tokens cleared");

      // Close modal
      setShowLogoutModal(false);

      // Redirect to login page
      router.push("/login?type=client");
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Even if there's an error, still clear tokens and redirect
      clearTokens();
      router.push("/login?type=client");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-0 border-r border-neutral-200 flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-2xl font-bold text-neutral-900">Kaarya</h1>
          <p className="text-xs text-neutral-600 mt-1">CLIENT PORTAL</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full" />
                    )}
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`text-lg w-5 ${
                        isActive ? "text-primary-600" : "text-neutral-600"
                      }`}
                    />
                    <span
                      className={`font-medium flex-1 ${
                        isActive ? "text-primary-600" : ""
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-primary-600 text-neutral-0 rounded-full text-xs font-semibold min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-neutral-200">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-neutral-0 font-semibold">
              {userProfile?.initials || "CL"}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {userProfile?.full_name || "Client User"}
              </p>
              <p className="text-xs text-neutral-600">View Profile</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faSignOut}
                    className="text-red-600 text-xl"
                  />
                </div>
                <div>
                  <h3 className="heading-4 text-neutral-900">Logout</h3>
                  <p className="text-neutral-600 text-sm">
                    Are you sure you want to logout?
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-neutral-700 body-regular">
                You will be logged out of your client portal and redirected to
                the login page.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-5 py-2.5 bg-red-600 text-neutral-0 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-0 border-t-transparent" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSignOut} />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
