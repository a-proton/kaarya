"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getAccessToken, clearTokens } from "@/lib/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faBell,
  faPlus,
  faArrowUp,
  faArrowRight,
  faMessage,
  faStar,
  faCalendar,
  faCheckCircle,
  faFolder,
  faListCheck,
  faLightbulb,
  faCircle,
  faCalendarDays,
  faVideo,
  faSpinner,
  faExclamationTriangle,
  faArrowDown,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

// API fetch function
const fetchDashboardData = async () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const token = getAccessToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${baseUrl}/api/v1/provider/dashboard/`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid - clear tokens and will redirect via ProtectedRoute
      clearTokens();
      throw new Error("Session expired. Please login again.");
    }
    throw new Error(`Failed to fetch dashboard data: ${response.status}`);
  }

  return response.json();
};

export default function ProviderDashboard() {
  const router = useRouter();
  const [showOptimizationTip, setShowOptimizationTip] = useState(true);
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);

  // TanStack Query hook
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["providerDashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (
        error.message.includes("Session expired") ||
        error.message.includes("No authentication token")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-5xl text-primary-600 animate-spin mb-4"
          />
          <p className="text-xl text-neutral-600 font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    // Check if it's an auth error
    const isAuthError =
      error?.message?.includes("Session expired") ||
      error?.message?.includes("No authentication token");

    if (isAuthError) {
      // Let ProtectedRoute handle the redirect
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-lg">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-5xl text-yellow-600 mb-4"
            />
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">
              Session Expired
            </h2>
            <p className="text-yellow-700 mb-4">
              Your session has expired. Redirecting to login...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-lg">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="text-5xl text-red-600 mb-4"
          />
          <h2 className="text-2xl font-bold text-red-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-red-700 mb-4">
            {error?.message || "Something went wrong"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    profile_stats,
    leads,
    projects,
    earnings,
    recent_activity,
    todays_schedule,
    unread_messages,
  } = data;

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        {/* Success Banner - Dismissible */}
        {showSuccessBanner && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 md:p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 md:gap-4 flex-1">
                <div className="text-3xl md:text-4xl">🎉</div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-neutral-900 mb-1">
                    Congratulations! Your profile is now live.
                  </h3>
                  <p className="text-sm md:text-base text-neutral-600">
                    Start connecting with clients and grow your business on
                    Karya
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                <button className="hidden md:block px-6 py-2 bg-neutral-0 text-neutral-900 rounded-lg font-medium hover:bg-neutral-50 transition-colors">
                  Get Started
                </button>
                <button
                  onClick={() => setShowSuccessBanner(false)}
                  className="w-8 h-8 hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="Dismiss banner"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="text-neutral-600 hover:cursor-pointer"
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Left Column - 2/3 width */}
        <div className="xl:col-span-2 space-y-4 md:space-y-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 md:p-8 text-neutral-0 shadow-lg">
            <p className="text-sm md:text-base mb-2 opacity-90">
              Welcome back!
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Your dashboard is looking great
            </h2>
            <p className="text-sm md:text-base mb-6 opacity-90">
              You have {projects.active_count} active project
              {projects.active_count !== 1 ? "s" : ""} and {leads.total_new} new
              lead{leads.total_new !== 1 ? "s" : ""} waiting for your response.
              <br className="hidden md:block" />
              Keep up the excellent work!
            </p>
            <button className="px-4 md:px-6 py-2 md:py-3 bg-neutral-0 text-primary-600 rounded-lg font-semibold hover:bg-neutral-50 transition-colors text-sm md:text-base">
              Quick Start Guide
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Profile Views */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 text-neutral-600 text-xs md:text-sm mb-3">
                <FontAwesomeIcon icon={faCircle} className="text-xs" />
                Profile Views
              </div>
              <p className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
                {profile_stats.views.toLocaleString()}
              </p>
              <div
                className={`flex items-center gap-2 text-sm ${
                  profile_stats.views_growth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <FontAwesomeIcon
                  icon={
                    profile_stats.views_growth >= 0 ? faArrowUp : faArrowDown
                  }
                  className="text-xs"
                />
                <span>
                  {profile_stats.views_growth >= 0 ? "+" : ""}
                  {profile_stats.views_growth}%
                </span>
              </div>
              <Link
                href="/provider/analytics"
                className="text-primary-600 text-sm font-medium mt-4 hover:text-primary-700 flex items-center gap-1"
              >
                View Analytics{" "}
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
            </div>

            {/* New Leads */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <FontAwesomeIcon
                  icon={faFolder}
                  className="text-primary-600 text-xl"
                />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1">
                {leads.total_new}
              </p>
              <p className="text-neutral-600 text-sm md:text-base mb-2">
                New Leads
              </p>
              <p className="text-neutral-500 text-xs md:text-sm">
                {leads.responded} responded to
              </p>
              {leads.pending > 0 && (
                <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                  {leads.pending} pending
                </span>
              )}
              <Link
                href="/provider/leads"
                className="text-primary-600 text-sm font-medium mt-4 hover:text-primary-700 flex items-center gap-1"
              >
                View All{" "}
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
            </div>

            {/* Active Projects */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <FontAwesomeIcon
                  icon={faListCheck}
                  className="text-primary-600 text-xl"
                />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1">
                {projects.active_count}
              </p>
              <p className="text-neutral-600 text-sm md:text-base mb-2">
                Active Projects
              </p>
              <p className="text-neutral-500 text-xs md:text-sm">
                {projects.on_track} on track
                {projects.needs_attention > 0 &&
                  `, ${projects.needs_attention} needs attention`}
              </p>
              <Link
                href="/provider/projects"
                className="text-primary-600 text-sm font-medium mt-4 hover:text-primary-700 flex items-center gap-1"
              >
                Go to Projects{" "}
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
            </div>

            {/* This Month's Earnings */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4 md:p-6 hover:shadow-lg transition-shadow">
              <p className="text-neutral-600 text-xs md:text-sm mb-3">
                This Month&apos;s Earnings
              </p>
              <p className="text-2xl md:text-3xl font-bold text-primary-600 mb-2">
                ${earnings.this_month.toLocaleString()}
              </p>
              <div
                className={`flex items-center gap-2 text-sm mb-4 ${
                  earnings.growth_percentage >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <FontAwesomeIcon
                  icon={
                    earnings.growth_percentage >= 0 ? faArrowUp : faArrowDown
                  }
                  className="text-xs"
                />
                <span>
                  {earnings.growth_percentage >= 0 ? "+" : ""}
                  {earnings.growth_percentage}% vs last month
                </span>
              </div>
              {/* Mini Chart */}
              <div className="flex items-end gap-1 h-8 mb-2">
                {earnings.chart_data.map((value, i) => {
                  const maxValue = Math.max(...earnings.chart_data, 1);
                  const height = (value / maxValue) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary-600 rounded-t hover:bg-primary-700 transition-colors"
                      style={{ height: `${height || 10}%` }}
                      title={`$${value}`}
                    />
                  );
                })}
              </div>
              <Link
                href="/provider/earnings"
                className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1"
              >
                View Details{" "}
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-bold text-neutral-900">
                Recent Activity
              </h3>
              <Link
                href="/provider/activity"
                className="text-primary-600 text-sm font-medium hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            {recent_activity.length > 0 ? (
              <div className="space-y-4">
                {recent_activity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 md:gap-4 pb-4 border-b border-neutral-100 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="text-primary-600"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-900 font-medium mb-1 text-sm md:text-base">
                        {activity.title}
                      </p>
                      <p className="text-neutral-600 text-xs md:text-sm">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-neutral-500 text-xs md:text-sm flex-shrink-0">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-5xl text-neutral-300 mb-4"
                />
                <p className="text-neutral-500">
                  No recent activity to display
                </p>
              </div>
            )}
          </div>

          {/* Active Projects */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-bold text-neutral-900">
                Active Projects
              </h3>
              <Link
                href="/provider/projects"
                className="text-primary-600 text-sm font-medium hover:text-primary-700"
              >
                View All Projects
              </Link>
            </div>
            {projects.active_projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {projects.active_projects.map((project, index) => (
                  <div
                    key={index}
                    className="border border-neutral-200 rounded-lg p-4 md:p-6 hover:border-primary-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center font-semibold text-sm">
                        {project.client_initials ||
                          project.client?.substring(0, 2).toUpperCase()}
                      </div>
                      <p className="text-neutral-600 text-xs md:text-sm">
                        {project.client}
                      </p>
                    </div>
                    <h4 className="text-base md:text-lg font-bold text-neutral-900 mb-3">
                      {project.name}
                    </h4>
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-neutral-600 text-xs md:text-sm">
                          {project.progress}% Complete
                        </span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-3 py-1 text-neutral-0 rounded-full text-xs font-medium ${
                          project.status === "on-track"
                            ? "bg-green-600"
                            : "bg-yellow-600"
                        }`}
                      >
                        {project.status === "on-track"
                          ? "On Track"
                          : "Needs Attention"}
                      </span>
                    </div>
                    {project.due_date && (
                      <div className="flex items-center gap-2 text-neutral-600 text-xs md:text-sm mb-2">
                        <FontAwesomeIcon
                          icon={faCalendar}
                          className="text-xs"
                        />
                        <span>Due {project.due_date}</span>
                      </div>
                    )}
                    {project.next_task && (
                      <p className="text-neutral-600 text-xs md:text-sm mb-4">
                        Next: {project.next_task}
                      </p>
                    )}
                    <Link
                      href={`/provider/projects/${project.id}`}
                      className="text-primary-600 font-medium text-sm hover:text-primary-700 flex items-center gap-2"
                    >
                      View Project{" "}
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className="text-xs"
                      />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FontAwesomeIcon
                  icon={faFolder}
                  className="text-5xl text-neutral-300 mb-4"
                />
                <p className="text-neutral-600 mb-4">No active projects</p>
                <Link
                  href="/provider/leads"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  View Leads
                  <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-4 md:space-y-6">
          {/* Quick Actions */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-neutral-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/provider/projects/new"
                className="w-full px-4 md:px-6 py-2 md:py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <FontAwesomeIcon icon={faPlus} />
                Create New Project
              </Link>
              <Link
                href="/provider/availability"
                className="w-full px-4 md:px-6 py-2 md:py-3 bg-neutral-0 text-primary-600 border-2 border-primary-600 rounded-lg font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <FontAwesomeIcon icon={faCalendarDays} />
                Update Availability
              </Link>
              <Link
                href="/provider/leads"
                className="w-full px-4 md:px-6 py-2 md:py-3 bg-neutral-0 text-neutral-700 border border-neutral-200 rounded-lg font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <FontAwesomeIcon icon={faMessage} />
                Respond to Leads
                {leads.pending > 0 && (
                  <span className="ml-auto w-6 h-6 bg-primary-600 text-neutral-0 rounded-full flex items-center justify-center text-xs font-semibold">
                    {leads.pending}
                  </span>
                )}
              </Link>
              <Link
                href="/provider/portfolio"
                className="w-full px-4 md:px-6 py-2 md:py-3 bg-neutral-0 text-neutral-700 border border-neutral-200 rounded-lg font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <FontAwesomeIcon icon={faFolder} />
                Post Portfolio Update
              </Link>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-bold text-neutral-900">
                Today&apos;s Schedule
              </h3>
              <FontAwesomeIcon
                icon={faCalendarDays}
                className="text-primary-600"
              />
            </div>
            {todays_schedule.length > 0 ? (
              <>
                <div className="space-y-4">
                  {todays_schedule.map((item, index) => (
                    <div key={index} className="flex gap-3 md:gap-4">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <span className="text-neutral-900 font-semibold text-xs md:text-sm">
                          {item.time}
                        </span>
                      </div>
                      <div className="flex-1 bg-neutral-50 rounded-lg p-3 md:p-4 border-l-4 border-primary-600">
                        <p className="text-neutral-900 font-semibold mb-1 text-sm md:text-base">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 text-neutral-600 text-xs md:text-sm">
                          {item.location?.includes("Video") && (
                            <FontAwesomeIcon
                              icon={faVideo}
                              className="text-xs"
                            />
                          )}
                          <span>{item.location}</span>
                        </div>
                        {item.type && (
                          <button className="mt-3 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium bg-primary-600 text-neutral-0 hover:bg-primary-700 transition-colors">
                            {item.type}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/provider/calendar"
                  className="block w-full mt-4 text-center text-primary-600 font-medium text-sm hover:text-primary-700"
                >
                  View Full Calendar
                </Link>
              </>
            ) : (
              <div className="text-center py-8">
                <FontAwesomeIcon
                  icon={faCalendar}
                  className="text-4xl text-neutral-300 mb-3"
                />
                <p className="text-neutral-500 text-sm">
                  No events scheduled today
                </p>
              </div>
            )}
          </div>

          {/* Messages */}
          {unread_messages > 0 && (
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-bold text-neutral-900">
                  Messages
                </h3>
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {unread_messages}
                </span>
              </div>
              <p className="text-neutral-600 text-sm mb-4">
                You have {unread_messages} unread message
                {unread_messages !== 1 ? "s" : ""}
              </p>
              <Link
                href="/provider/messages"
                className="block w-full text-center px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm md:text-base"
              >
                View All Messages
              </Link>
            </div>
          )}

          {/* Optimization Tip */}
          {showOptimizationTip && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 md:p-6">
              <div className="flex items-start gap-3 mb-4">
                <FontAwesomeIcon
                  icon={faLightbulb}
                  className="text-yellow-600 text-xl md:text-2xl flex-shrink-0"
                />
                <div className="flex-1">
                  <h4 className="text-base md:text-lg font-bold text-neutral-900 mb-2">
                    Optimization Tip
                  </h4>
                  <p className="text-neutral-700 text-xs md:text-sm">
                    Your response rate is excellent! Consider adding weekend
                    availability to capture 15% more leads in your area.
                  </p>
                </div>
                <button
                  onClick={() => setShowOptimizationTip(false)}
                  className="text-neutral-600 hover:text-neutral-900 flex-shrink-0"
                  aria-label="Dismiss tip"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="hover:cursor-pointer"
                  />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Link
                  href="/provider/availability"
                  className="flex-1 px-3 md:px-4 py-2 bg-primary-600 text-neutral-0 rounded-lg text-xs md:text-sm font-medium hover:bg-primary-700 transition-colors text-center"
                >
                  Update Availability
                </Link>
                <button
                  onClick={() => setShowOptimizationTip(false)}
                  className="flex-1 px-3 md:px-4 py-2 bg-neutral-0 text-neutral-700 rounded-lg text-xs md:text-sm font-medium hover:bg-neutral-50 transition-colors border border-neutral-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
