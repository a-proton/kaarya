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
  faIndustry,
  faArchive,
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
  { icon: faMessage, label: "Messages", href: "/provider/messages", badge: 8 },
  { icon: faDollarSign, label: "Earnings", href: "/provider/earnings" },
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

  // Get user initials
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

  const getDisplayName = () => {
    if (!user) return "User";

    // Prioritize full_name, then business_name, then email
    return user.full_name || user.business_name || user.email || "User";
  };

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-0 border-r border-neutral-200 flex flex-col z-40">
        {/* Logo Section */}
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-2xl font-bold text-neutral-900">Karya</h1>
          <p className="text-xs text-neutral-600 mt-1">
            WHERE SKILLS MEET OPPORTUNITY
          </p>
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
                      <span className="w-6 h-6 bg-primary-600 text-neutral-0 rounded-full flex items-center justify-center text-xs font-semibold">
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
            disabled={userLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors disabled:opacity-50"
          >
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={getDisplayName()}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-neutral-0 font-semibold text-sm">
                {getUserInitials()}
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {userLoading ? "Loading..." : getDisplayName()}
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
