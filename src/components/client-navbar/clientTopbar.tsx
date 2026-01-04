"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faBell,
  faSignOut,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

export default function ClientTopbar() {
  const [notificationCount] = useState(7);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    console.log("Client logging out...");
    // Add your logout logic here
    alert("Logged out successfully!");
    setShowLogoutModal(false);
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
            <h1 className="heading-2 text-neutral-900">Welcome back, John</h1>
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
            >
              JS
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <p className="text-primary-600 text-sm font-medium mb-1">
              Active Projects
            </p>
            <p className="text-2xl font-bold text-primary-700">2</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-600 text-sm font-medium mb-1">
              Pending Updates
            </p>
            <p className="text-2xl font-bold text-blue-700">3</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-600 text-sm font-medium mb-1">
              Upcoming Milestones
            </p>
            <p className="text-2xl font-bold text-yellow-700">4</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600 text-sm font-medium mb-1">
              Unread Messages
            </p>
            <p className="text-2xl font-bold text-green-700">5</p>
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
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-red-600 text-neutral-0 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faSignOut} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
