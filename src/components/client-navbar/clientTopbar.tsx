"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faBell,
  faSignOut,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearTokens, getRefreshToken } from "@/lib/auth";
import { api } from "@/lib/api";

export default function ClientTopbar() {
  const router = useRouter();
  const [notificationCount] = useState(7);
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

  // Get first name from full name
  const getFirstName = (fullName?: string): string => {
    if (!fullName) return "Client";
    return fullName.split(" ")[0];
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

  // Mock data for active projects
  const activeProjects = [
    { name: "Kitchen Remodel", status: "In Progress", color: "text-blue-600" },
    {
      name: "Bathroom Renovation",
      status: "Pending Review",
      color: "text-yellow-600",
    },
  ];

  return (
    <>
      <div className="sticky top-0 z-50 bg-neutral-0 border-b border-neutral-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-2 text-neutral-900">
              Welcome back, {getFirstName(userProfile?.full_name)}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              {activeProjects.map((project, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <FontAwesomeIcon
                    icon={faCircle}
                    className={`text-xs ${project.color}`}
                  />
                  <span className="text-neutral-700">
                    <strong>{project.name}</strong> - {project.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Search updates, messages, documents..."
                className="pl-12 pr-4 py-2.5 bg-neutral-0 border border-neutral-200 rounded-lg w-96 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* Notifications */}
            <button className="relative w-10 h-10 bg-neutral-0 border border-neutral-200 rounded-lg flex items-center justify-center hover:bg-neutral-50 transition-colors">
              <FontAwesomeIcon icon={faBell} className="text-neutral-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-neutral-0 rounded-full text-xs flex items-center justify-center font-semibold">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-neutral-0 font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
              title={userProfile?.full_name || "Client User"}
            >
              {userProfile?.initials || "CL"}
            </button>
          </div>
        </div>
      </div>

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
