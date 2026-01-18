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
  faSpinner,
  faDollarSign,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ==================================================================================
// TYPE DEFINITIONS
// ==================================================================================

interface ProjectStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_spent: number;
  pending_payments: number;
}

interface ActiveProject {
  id: number;
  name: string;
  provider: string;
  progress: number;
  status: string;
}

interface RecentUpdate {
  id: number;
  project: string;
  title: string;
  date: string;
  status: "read" | "unread";
}

interface UpcomingMilestone {
  id: number;
  project: string;
  title: string;
  due_date: string;
  days_left: number;
  status: "on-track" | "at-risk";
}

interface RecentMessage {
  id: number;
  from: string;
  preview: string;
  time: string;
  unread: boolean;
}

interface DashboardData {
  project_stats: ProjectStats;
  active_projects: ActiveProject[];
  recent_updates: RecentUpdate[];
  upcoming_milestones: UpcomingMilestone[];
  recent_messages: RecentMessage[];
  unread_messages_count: number;
}

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================

export default function ClientDashboard() {
  // ==================================================================================
  // DATA FETCHING WITH TANSTACK QUERY
  // ==================================================================================

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardData>({
    queryKey: ["client-dashboard"],
    queryFn: async () => {
      return api.get<DashboardData>("/api/v1/client/dashboard/");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // ==================================================================================
  // LOADING STATE
  // ==================================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-primary-600 mb-4"
          />
          <p className="text-neutral-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // ERROR STATE
  // ==================================================================================

  if (isError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-red-600 text-2xl"
            />
          </div>
          <h2 className="heading-3 text-neutral-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-neutral-600 mb-4">
            {error instanceof Error
              ? error.message
              : "Failed to load dashboard data"}
          </p>
          <button onClick={() => refetch()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // NO DATA STATE
  // ==================================================================================

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">No dashboard data available</p>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // HELPER FUNCTIONS
  // ==================================================================================

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-600";
    if (progress >= 50) return "bg-primary-600";
    if (progress >= 25) return "bg-yellow-600";
    return "bg-orange-600";
  };

  const getProgressBgColor = (progress: number) => {
    if (progress >= 75) return "bg-green-50 border-green-200";
    if (progress >= 50) return "bg-primary-50 border-primary-200";
    if (progress >= 25) return "bg-yellow-50 border-yellow-200";
    return "bg-orange-50 border-orange-200";
  };

  // ==================================================================================
  // RENDER
  // ==================================================================================

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

      {/* Project Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Projects */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon
                icon={faFolder}
                className="text-primary-600 text-lg"
              />
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-1">Total Projects</p>
          <p className="text-2xl font-bold text-neutral-900">
            {dashboardData.project_stats.total_projects}
          </p>
        </div>

        {/* Active Projects */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon
                icon={faChartLine}
                className="text-blue-600 text-lg"
              />
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-1">Active</p>
          <p className="text-2xl font-bold text-neutral-900">
            {dashboardData.project_stats.active_projects}
          </p>
        </div>

        {/* Completed Projects */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-600 text-lg"
              />
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-neutral-900">
            {dashboardData.project_stats.completed_projects}
          </p>
        </div>

        {/* Total Spent */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon
                icon={faDollarSign}
                className="text-purple-600 text-lg"
              />
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-neutral-900">
            $
            {dashboardData.project_stats.total_spent.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Pending Payments */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon
                icon={faClock}
                className="text-orange-600 text-lg"
              />
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-600">
            $
            {dashboardData.project_stats.pending_payments.toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          </p>
        </div>
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
              {dashboardData.recent_updates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No recent updates</p>
                </div>
              ) : (
                dashboardData.recent_updates.map((update) => (
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
                ))
              )}
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
              {dashboardData.upcoming_milestones.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No upcoming milestones</p>
                </div>
              ) : (
                dashboardData.upcoming_milestones.map((milestone) => (
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
                        <FontAwesomeIcon
                          icon={faCalendar}
                          className="text-xs"
                        />
                        Due: {milestone.due_date}
                      </div>
                      <span
                        className={`font-semibold ${
                          milestone.status === "on-track"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {milestone.days_left} days left
                      </span>
                    </div>
                  </div>
                ))
              )}
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
              {dashboardData.active_projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500 text-sm">No active projects</p>
                </div>
              ) : (
                dashboardData.active_projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/client/projects/${project.id}`}
                    className={`block p-4 hover:opacity-90 rounded-lg border transition-all ${getProgressBgColor(
                      project.progress,
                    )}`}
                  >
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {project.name}
                    </h3>
                    <p className="text-xs text-neutral-600 mb-2">
                      Provider: {project.provider}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Progress</span>
                      <span
                        className={`font-semibold ${
                          project.progress >= 75
                            ? "text-green-600"
                            : project.progress >= 50
                              ? "text-primary-600"
                              : project.progress >= 25
                                ? "text-yellow-600"
                                : "text-orange-600"
                        }`}
                      >
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(
                          project.progress,
                        )}`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </Link>
                ))
              )}
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
                {dashboardData.unread_messages_count > 0 && (
                  <span className="ml-2 bg-primary-600 text-neutral-0 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {dashboardData.unread_messages_count}
                  </span>
                )}
              </h2>
              <Link
                href="/client/messages"
                className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {dashboardData.recent_messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500 text-sm">No messages</p>
                </div>
              ) : (
                dashboardData.recent_messages.map((message) => (
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
                        <span className="w-2 h-2 bg-primary-600 rounded-full mt-1"></span>
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
                ))
              )}
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
