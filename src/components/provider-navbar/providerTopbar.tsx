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

    // Use stored initials if available
    if (user.initials) {
      return user.initials;
    }

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

    if (user.full_name) {
      return user.full_name.split(" ")[0];
    }

    if (user.business_name) {
      return user.business_name.split(" ")[0];
    }

    return user.email?.split("@")[0] || "there";
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-neutral-0 border-b border-neutral-200 px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-neutral-900">
            {userLoading ? "Loading..." : `${getGreeting()}, ${getFirstName()}`}
          </h1>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Search projects, clients, or tasks..."
                className="pl-12 pr-4 py-2.5 bg-neutral-0 border border-neutral-200 rounded-lg w-80 focus:outline-none focus:border-primary-500 transition-colors"
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
              disabled={userLoading}
              className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-neutral-0 font-semibold cursor-pointer hover:bg-primary-700 transition-colors disabled:opacity-50"
              title={user?.full_name || user?.email || "Profile"}
            >
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm">{getUserInitials()}</span>
              )}
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
                  <h3 className="text-lg font-bold text-neutral-900">Logout</h3>
                  <p className="text-neutral-600 text-sm">
                    Are you sure you want to logout?
                  </p>
                </div>
              </div>
            </div>
            {/* Modal Content */}
            <div className="p-6">
              <p className="text-neutral-700">
                You will be logged out of your account and redirected to the
                login page.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-5 py-2.5 bg-red-600 text-neutral-0 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
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
