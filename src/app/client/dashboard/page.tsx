"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faNewspaper,
  faCheckCircle,
  faMessage,
  faClock,
  faArrowRight,
  faExclamationTriangle,
  faCalendar,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

export default function ClientDashboard() {
  // Mock data
  const recentUpdates = [
    {
      id: 1,
      project: "Kitchen Remodel",
      title: "Foundation work completed",
      date: "2 hours ago",
      status: "unread",
    },
    {
      id: 2,
      project: "Bathroom Renovation",
      title: "Plumbing installation in progress",
      date: "5 hours ago",
      status: "unread",
    },
    {
      id: 3,
      project: "Kitchen Remodel",
      title: "Material delivery confirmed",
      date: "1 day ago",
      status: "read",
    },
  ];

  const upcomingMilestones = [
    {
      id: 1,
      project: "Kitchen Remodel",
      title: "Electrical Work Completion",
      dueDate: "Jan 15, 2025",
      daysLeft: 3,
      status: "on-track",
    },
    {
      id: 2,
      project: "Bathroom Renovation",
      title: "Tile Installation",
      dueDate: "Jan 18, 2025",
      daysLeft: 6,
      status: "at-risk",
    },
  ];

  const recentMessages = [
    {
      id: 1,
      from: "Michael Rodriguez",
      preview: "The electrical inspection is scheduled for...",
      time: "30 min ago",
      unread: true,
    },
    {
      id: 2,
      from: "Sarah Johnson",
      preview: "I've updated the project timeline. Please review...",
      time: "2 hours ago",
      unread: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-neutral-0">
        <h1 className="heading-2 mb-2">Your Projects Dashboard</h1>
        <p className="text-neutral-100">
          Track progress, view updates, and communicate with your service
          providers all in one place.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Updates - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Daily Updates */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-3 text-neutral-900 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faNewspaper}
                  className="text-primary-600"
                />
                Recent Updates
              </h2>
              <Link
                href="/client/daily-updates"
                className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-2"
              >
                View All
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentUpdates.map((update) => (
                <Link
                  key={update.id}
                  href={`/client/daily-updates/${update.id}`}
                  className="block p-4 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        {update.project}
                      </span>
                      {update.status === "unread" && (
                        <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500">
                      {update.date}
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900">
                    {update.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-3 text-neutral-900 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-primary-600"
                />
                Upcoming Milestones
              </h2>
              <Link
                href="/client/milestones"
                className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-2"
              >
                View All
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {milestone.project}
                      </span>
                      <h3 className="font-semibold text-neutral-900 mt-2">
                        {milestone.title}
                      </h3>
                    </div>
                    {milestone.status === "at-risk" && (
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        className="text-yellow-500"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                      Due: {milestone.dueDate}
                    </div>
                    <span
                      className={`font-semibold ${
                        milestone.status === "on-track"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {milestone.daysLeft} days left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Takes 1 column */}
        <div className="space-y-6">
          {/* Active Projects */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <h2 className="heading-4 text-neutral-900 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faFolder} className="text-primary-600" />
              Active Projects
            </h2>
            <div className="space-y-3">
              <Link
                href="/client/projects/1"
                className="block p-4 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200 transition-colors"
              >
                <h3 className="font-semibold text-neutral-900 mb-1">
                  Kitchen Remodel
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Progress</span>
                  <span className="font-semibold text-primary-600">65%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </Link>

              <Link
                href="/client/projects/2"
                className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              >
                <h3 className="font-semibold text-neutral-900 mb-1">
                  Bathroom Renovation
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Progress</span>
                  <span className="font-semibold text-blue-600">30%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: "30%" }}
                  ></div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-4 text-neutral-900 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faMessage}
                  className="text-primary-600"
                />
                Messages
              </h2>
              <Link
                href="/client/messages"
                className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {recentMessages.map((message) => (
                <Link
                  key={message.id}
                  href="/client/messages"
                  className="block p-3 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-neutral-900 text-sm">
                      {message.from}
                    </p>
                    {message.unread && (
                      <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-neutral-600 text-sm line-clamp-1 mb-1">
                    {message.preview}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <FontAwesomeIcon icon={faClock} />
                    {message.time}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <h2 className="heading-4 text-neutral-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/client/messages"
                className="w-full btn-primary text-sm justify-center"
              >
                <FontAwesomeIcon icon={faMessage} />
                Send Message
              </Link>
              <Link
                href="/client/documents"
                className="w-full btn-secondary text-sm justify-center"
              >
                <FontAwesomeIcon icon={faFolder} />
                View Documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
