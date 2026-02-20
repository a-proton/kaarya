"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAccessToken, clearTokens } from "@/lib/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowUp,
  faArrowRight,
  faMessage,
  faCalendar,
  faCheckCircle,
  faFolder,
  faLightbulb,
  faCalendarDays,
  faVideo,
  faSpinner,
  faExclamationTriangle,
  faArrowDown,
  faXmark,
  faChartLine,
  faCircleCheck,
  faRocket,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

/* ─────────────────────────────────────────── */
/* API                                         */
/* ─────────────────────────────────────────── */
const fetchDashboardData = async () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const token = getAccessToken();

  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`${baseUrl}/api/v1/provider/dashboard/`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearTokens();
      throw new Error("Session expired. Please login again.");
    }
    throw new Error(`Failed to fetch dashboard data: ${response.status}`);
  }

  return response.json();
};

/* ─────────────────────────────────────────── */
/* Mini bar chart                              */
/* ─────────────────────────────────────────── */
function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height: "2.25rem" }}>
      {data.map((value, i) => {
        const pct = (value / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${Math.max(pct, 10)}%`,
              backgroundColor: isLast
                ? "var(--color-primary)"
                : "var(--color-primary-light)",
              transition: "height 0.4s ease",
            }}
            title={`$${value}`}
          />
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Stat card                                   */
/* ─────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  growth?: number;
  sublabel?: string;
  pendingCount?: number;
  href: string;
  hrefLabel: string;
  chart?: number[];
}

function StatCard({
  label,
  value,
  growth,
  sublabel,
  pendingCount,
  href,
  hrefLabel,
  chart,
}: StatCardProps) {
  return (
    <div
      className="rounded-2xl flex flex-col transition-shadow"
      style={{
        backgroundColor: "var(--color-neutral-0)",
        border: "1px solid var(--color-neutral-200)",
        padding: "1.25rem 1.375rem 1.125rem",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 8px 24px rgba(0,0,0,0.07)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Label */}
      <p
        className="font-semibold tracking-widest mb-3"
        style={{
          fontSize: "0.6rem",
          color: "var(--color-neutral-400)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>

      {/* Value */}
      <p
        className="font-bold leading-none mb-2"
        style={{ fontSize: "1.875rem", color: "var(--color-neutral-900)" }}
      >
        {value}
      </p>

      {/* Growth */}
      {growth !== undefined && (
        <div
          className="flex items-center gap-1.5 font-semibold mb-2"
          style={{
            fontSize: "0.75rem",
            color:
              growth >= 0
                ? "var(--color-accent-green-dark)"
                : "var(--color-accent-red)",
          }}
        >
          <FontAwesomeIcon
            icon={growth >= 0 ? faArrowUp : faArrowDown}
            style={{ width: "0.6rem" }}
          />
          {growth >= 0 ? "+" : ""}
          {growth}%
        </div>
      )}

      {/* Sublabel */}
      {sublabel && (
        <p
          className="mb-2"
          style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}
        >
          {sublabel}
        </p>
      )}

      {/* Pending badge */}
      {pendingCount !== undefined && pendingCount > 0 && (
        <span
          className="self-start rounded-full font-semibold mb-2"
          style={{
            fontSize: "0.65rem",
            padding: "0.2rem 0.6rem",
            backgroundColor: "#fef2f2",
            color: "#ef4444",
          }}
        >
          {pendingCount} pending
        </span>
      )}

      {/* Chart */}
      {chart && (
        <div className="mb-2">
          <MiniBarChart data={chart} />
        </div>
      )}

      {/* Link */}
      <div className="mt-auto pt-2">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 font-semibold transition-opacity hover:opacity-70"
          style={{
            fontSize: "0.8rem",
            color: "var(--color-primary)",
            textDecoration: "none",
          }}
        >
          {hrefLabel}
          <FontAwesomeIcon icon={faArrowRight} style={{ width: "0.6rem" }} />
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Section header                              */
/* ─────────────────────────────────────────── */
function SectionHeader({
  title,
  href,
  hrefLabel = "View all",
}: {
  title: string;
  href: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2
        className="font-semibold"
        style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
      >
        {title}
      </h2>
      <Link
        href={href}
        className="font-semibold transition-opacity hover:opacity-70"
        style={{
          fontSize: "0.8rem",
          color: "var(--color-primary)",
          textDecoration: "none",
        }}
      >
        {hrefLabel}
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Loading                                     */
/* ─────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--color-neutral-50)" }}
    >
      <div className="text-center">
        <FontAwesomeIcon
          icon={faSpinner}
          className="animate-spin mb-4"
          style={{
            fontSize: "2rem",
            color: "var(--color-primary)",
          }}
        />
        <p
          className="font-medium"
          style={{ fontSize: "0.9rem", color: "var(--color-neutral-500)" }}
        >
          Loading your dashboard…
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Error                                       */
/* ─────────────────────────────────────────── */
function ErrorScreen({
  isAuth,
  message,
  onRetry,
}: {
  isAuth: boolean;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div
        className="rounded-2xl p-8 text-center max-w-md w-full"
        style={{
          backgroundColor: "var(--color-neutral-0)",
          border: `1px solid ${isAuth ? "#fde68a" : "#fecaca"}`,
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: isAuth ? "#fef3c7" : "#fef2f2" }}
        >
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            style={{
              width: "1.25rem",
              color: isAuth ? "#f59e0b" : "#ef4444",
            }}
          />
        </div>
        <h2
          className="font-semibold mb-2"
          style={{ fontSize: "1.1rem", color: "var(--color-neutral-900)" }}
        >
          {isAuth ? "Session Expired" : "Something went wrong"}
        </h2>
        <p
          className="mb-5"
          style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}
        >
          {message}
        </p>
        {!isAuth && (
          <button onClick={onRetry} className="btn btn-primary btn-md mx-auto">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Types                                       */
/* ─────────────────────────────────────────── */
interface Activity {
  title: string;
  description: string;
  time: string;
}

interface Project {
  client_initials?: string;
  client?: string;
  name: string;
  progress: number;
  status: string;
  due_date?: string;
  next_task?: string;
  id: string;
}

interface ScheduleItem {
  time: string;
  title: string;
  location?: string;
  type?: string;
}

/* ─────────────────────────────────────────── */
/* Dashboard                                   */
/* ─────────────────────────────────────────── */
export default function ProviderDashboard() {
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);
  const [showOptimizationTip, setShowOptimizationTip] = useState(true);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["providerDashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
    staleTime: 10000,
    retry: (failureCount, err: Error) => {
      if (
        err.message.includes("Session expired") ||
        err.message.includes("No authentication token")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  if (isLoading) return <LoadingScreen />;

  if (isError) {
    const isAuthError =
      (error as Error)?.message?.includes("Session expired") ||
      (error as Error)?.message?.includes("No authentication token");
    return (
      <ErrorScreen
        isAuth={isAuthError}
        message={
          isAuthError
            ? "Your session has expired. Redirecting to login…"
            : ((error as Error)?.message ?? "Something went wrong")
        }
        onRetry={refetch}
      />
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
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--color-neutral-50)",
        padding: "1.75rem 2rem",
      }}
    >
      {/* ── Success Banner ── */}
      {showSuccessBanner && (
        <div
          className="rounded-2xl mb-6 overflow-hidden"
          style={{
            backgroundColor: "var(--color-neutral-0)",
            border: "1px solid var(--color-neutral-200)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="h-1 w-full"
            style={{ backgroundColor: "var(--color-primary)" }}
          />
          <div className="flex items-center gap-5 px-6 py-4">
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary-light)" }}
            >
              <FontAwesomeIcon
                icon={faRocket}
                style={{
                  color: "var(--color-primary)",
                  width: "1.1rem",
                }}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold leading-tight"
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                🎉 Congratulations! Your profile is now live.
              </p>
              <p
                className="mt-0.5 leading-tight"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                Clients can now discover and contact you. Start connecting and
                grow your business on Karya.
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/provider/leads"
              className="hidden md:flex items-center gap-2 rounded-xl font-semibold flex-shrink-0 transition-colors"
              style={{
                padding: "0.55rem 1.1rem",
                fontSize: "0.8rem",
                backgroundColor: "var(--color-primary)",
                color: "white",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  "var(--color-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  "var(--color-primary)";
              }}
            >
              Get Started
              <FontAwesomeIcon
                icon={faArrowRight}
                style={{ width: "0.65rem" }}
              />
            </Link>

            {/* Dismiss */}
            <button
              onClick={() => setShowSuccessBanner(false)}
              aria-label="Dismiss"
              className="flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
              style={{
                width: "1.875rem",
                height: "1.875rem",
                backgroundColor: "transparent",
                color: "var(--color-neutral-400)",
                border: "1px solid var(--color-neutral-200)",
                cursor: "pointer",
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
              <FontAwesomeIcon icon={faXmark} style={{ width: "0.75rem" }} />
            </button>
          </div>
        </div>
      )}

      {/* ── Page heading ── */}
      <div className="mb-6">
        <p
          className="font-medium mb-0.5"
          style={{ fontSize: "0.8rem", color: "var(--color-neutral-500)" }}
        >
          Overview
        </p>
        <h1
          className="font-bold leading-tight"
          style={{ fontSize: "1.625rem", color: "var(--color-neutral-900)" }}
        >
          {projects.active_count} active project
          {projects.active_count !== 1 ? "s" : ""}
          {leads.total_new > 0 && (
            <span style={{ color: "var(--color-neutral-400)" }}>
              {" · "}
              {leads.total_new} new lead{leads.total_new !== 1 ? "s" : ""}
            </span>
          )}
        </h1>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: 2/3 */}
        <div className="xl:col-span-2 space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Profile Views"
              value={profile_stats.views.toLocaleString()}
              growth={profile_stats.views_growth}
              href="/provider/analytics"
              hrefLabel="Analytics"
            />
            <StatCard
              label="New Leads"
              value={leads.total_new}
              sublabel={`${leads.responded} responded`}
              pendingCount={leads.pending}
              href="/provider/leads"
              hrefLabel="View leads"
            />
            <StatCard
              label="Active Projects"
              value={projects.active_count}
              sublabel={`${projects.on_track} on track${projects.needs_attention > 0 ? `, ${projects.needs_attention} needs attention` : ""}`}
              href="/provider/projects"
              hrefLabel="View projects"
            />
            <StatCard
              label="This Month"
              value={`$${earnings.this_month.toLocaleString()}`}
              growth={earnings.growth_percentage}
              chart={earnings.chart_data}
              href="/provider/earnings"
              hrefLabel="Earnings"
            />
          </div>

          {/* Recent Activity */}
          <div
            className="rounded-2xl"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              padding: "1.375rem 1.5rem",
            }}
          >
            <SectionHeader title="Recent Activity" href="/provider/activity" />
            {recent_activity.length > 0 ? (
              <div>
                {recent_activity.map((activity: Activity, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 py-3"
                    style={{
                      borderBottom:
                        index < recent_activity.length - 1
                          ? "1px solid var(--color-neutral-100)"
                          : "none",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: "var(--color-primary-light)" }}
                    >
                      <FontAwesomeIcon
                        icon={faCircleCheck}
                        style={{
                          width: "0.75rem",
                          color: "var(--color-primary)",
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-medium leading-snug"
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-neutral-900)",
                        }}
                      >
                        {activity.title}
                      </p>
                      <p
                        className="mt-0.5"
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        {activity.description}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0 mt-0.5"
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-neutral-400)",
                      }}
                    >
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  style={{
                    fontSize: "2rem",
                    color: "var(--color-neutral-300)",
                    marginBottom: "0.75rem",
                  }}
                />
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-400)",
                  }}
                >
                  No recent activity
                </p>
              </div>
            )}
          </div>

          {/* Active Projects */}
          <div
            className="rounded-2xl"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              padding: "1.375rem 1.5rem",
            }}
          >
            <SectionHeader
              title="Active Projects"
              href="/provider/projects"
              hrefLabel="View all projects"
            />
            {projects.active_projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.active_projects.map(
                  (project: Project, index: number) => (
                    <div
                      key={index}
                      className="rounded-xl p-4 flex flex-col transition-shadow"
                      style={{
                        border: "1px solid var(--color-neutral-200)",
                        backgroundColor: "var(--color-neutral-0)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "0 6px 20px rgba(0,0,0,0.07)";
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          "var(--color-neutral-300)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "none";
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          "var(--color-neutral-200)";
                      }}
                    >
                      {/* Client */}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                          style={{
                            width: "1.875rem",
                            height: "1.875rem",
                            backgroundColor: "var(--color-primary)",
                            color: "white",
                            fontSize: "0.65rem",
                          }}
                        >
                          {project.client_initials ||
                            project.client?.substring(0, 2).toUpperCase()}
                        </div>
                        <p
                          className="truncate"
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-neutral-500)",
                          }}
                        >
                          {project.client}
                        </p>
                      </div>

                      {/* Name */}
                      <h3
                        className="font-semibold leading-snug mb-3"
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-neutral-900)",
                        }}
                      >
                        {project.name}
                      </h3>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between mb-1.5">
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--color-neutral-500)",
                            }}
                          >
                            Progress
                          </span>
                          <span
                            className="font-semibold"
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--color-neutral-700)",
                            }}
                          >
                            {project.progress}%
                          </span>
                        </div>
                        <div
                          className="rounded-full overflow-hidden"
                          style={{
                            height: "0.3rem",
                            backgroundColor: "var(--color-neutral-150)",
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${project.progress}%`,
                              backgroundColor: "var(--color-primary)",
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className="self-start rounded-full font-semibold mb-3"
                        style={{
                          fontSize: "0.65rem",
                          padding: "0.2rem 0.6rem",
                          backgroundColor:
                            project.status === "on-track"
                              ? "#f0fdf4"
                              : "#fef3c7",
                          color:
                            project.status === "on-track"
                              ? "#166534"
                              : "#92400e",
                        }}
                      >
                        {project.status === "on-track"
                          ? "On track"
                          : "Needs attention"}
                      </span>

                      {/* Due date */}
                      {project.due_date && (
                        <div
                          className="flex items-center gap-1.5 mb-1"
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-neutral-400)",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faCalendar}
                            style={{ width: "0.7rem" }}
                          />
                          Due {project.due_date}
                        </div>
                      )}

                      {/* Next task */}
                      {project.next_task && (
                        <p
                          className="mb-3"
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-neutral-500)",
                          }}
                        >
                          Next: {project.next_task}
                        </p>
                      )}

                      <div className="mt-auto pt-2">
                        <Link
                          href={`/provider/projects/${project.id}`}
                          className="inline-flex items-center gap-1.5 font-semibold hover:opacity-70 transition-opacity"
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-primary)",
                            textDecoration: "none",
                          }}
                        >
                          Open project
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            style={{ width: "0.6rem" }}
                          />
                        </Link>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <FontAwesomeIcon
                  icon={faFolder}
                  style={{
                    fontSize: "2rem",
                    color: "var(--color-neutral-300)",
                    marginBottom: "0.75rem",
                  }}
                />
                <p
                  className="mb-4"
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-400)",
                  }}
                >
                  No active projects yet
                </p>
                <Link href="/provider/leads" className="btn btn-primary btn-sm">
                  Browse leads
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    style={{ width: "0.65rem" }}
                  />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: 1/3 */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div
            className="rounded-2xl"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              padding: "1.375rem 1.25rem",
            }}
          >
            <h2
              className="font-semibold mb-4"
              style={{
                fontSize: "1rem",
                color: "var(--color-neutral-900)",
              }}
            >
              Quick actions
            </h2>
            <div className="space-y-2">
              {/* Primary CTA */}
              <Link
                href="/provider/projects/new"
                className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold transition-colors"
                style={{
                  padding: "0.7rem 1rem",
                  backgroundColor: "var(--color-primary)",
                  color: "white",
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "var(--color-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "var(--color-primary)";
                }}
              >
                <FontAwesomeIcon icon={faPlus} style={{ width: "0.8rem" }} />
                Create New Project
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/provider/availability"
                className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold transition-colors"
                style={{
                  padding: "0.7rem 1rem",
                  backgroundColor: "transparent",
                  color: "var(--color-primary)",
                  border: "1.5px solid var(--color-primary)",
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "var(--color-primary-light)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "transparent";
                }}
              >
                <FontAwesomeIcon
                  icon={faCalendarDays}
                  style={{ width: "0.8rem" }}
                />
                Update Availability
              </Link>

              {/* Ghost actions */}
              {[
                {
                  href: "/provider/leads",
                  icon: faMessage,
                  label: "Respond to Leads",
                  badge: leads.pending > 0 ? leads.pending : null,
                },
                {
                  href: "/provider/portfolio",
                  icon: faFolder,
                  label: "Portfolio Update",
                  badge: null,
                },
                {
                  href: "/provider/analytics",
                  icon: faChartLine,
                  label: "View Analytics",
                  badge: null,
                },
              ].map(({ href, icon, label, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 w-full rounded-xl font-medium transition-colors"
                  style={{
                    padding: "0.6rem 0.875rem",
                    backgroundColor: "transparent",
                    color: "var(--color-neutral-700)",
                    border: "1px solid var(--color-neutral-200)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = "var(--color-neutral-100)";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLAnchorElement
                    ).style.backgroundColor = "transparent";
                  }}
                >
                  <FontAwesomeIcon
                    icon={icon}
                    style={{
                      width: "0.85rem",
                      color: "var(--color-neutral-400)",
                    }}
                  />
                  {label}
                  {badge !== null && (
                    <span
                      className="ml-auto rounded-full font-bold text-white flex items-center justify-center"
                      style={{
                        width: "1.25rem",
                        height: "1.25rem",
                        fontSize: "0.6rem",
                        backgroundColor: "var(--color-primary)",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Today's Schedule */}
          <div
            className="rounded-2xl"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              padding: "1.375rem 1.25rem",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-semibold"
                style={{
                  fontSize: "1rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                Today&apos;s Schedule
              </h2>
              <FontAwesomeIcon
                icon={faCalendarDays}
                style={{
                  color: "var(--color-neutral-300)",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            {todays_schedule.length > 0 ? (
              <>
                <div className="space-y-3">
                  {todays_schedule.map((item: ScheduleItem, index: number) => (
                    <div key={index} className="flex gap-3">
                      <span
                        className="font-semibold flex-shrink-0 pt-1 leading-none"
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--color-neutral-400)",
                          width: "2.5rem",
                        }}
                      >
                        {item.time}
                      </span>
                      <div
                        className="flex-1 rounded-lg p-3"
                        style={{
                          backgroundColor: "var(--color-neutral-50)",
                          borderLeft: "3px solid var(--color-primary)",
                        }}
                      >
                        <p
                          className="font-semibold leading-snug mb-1"
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-neutral-900)",
                          }}
                        >
                          {item.title}
                        </p>
                        {item.location && (
                          <div
                            className="flex items-center gap-1.5"
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--color-neutral-500)",
                            }}
                          >
                            {item.location.includes("Video") && (
                              <FontAwesomeIcon
                                icon={faVideo}
                                style={{ width: "0.65rem" }}
                              />
                            )}
                            {item.location}
                          </div>
                        )}
                        {item.type && (
                          <span
                            className="inline-block mt-2 rounded-full font-semibold"
                            style={{
                              fontSize: "0.65rem",
                              padding: "0.2rem 0.6rem",
                              backgroundColor: "var(--color-primary-light)",
                              color: "var(--color-primary)",
                            }}
                          >
                            {item.type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/provider/calendar"
                  className="block text-center font-semibold mt-4 hover:opacity-70 transition-opacity"
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-primary)",
                    textDecoration: "none",
                  }}
                >
                  Full calendar →
                </Link>
              </>
            ) : (
              <div className="text-center py-8">
                <FontAwesomeIcon
                  icon={faCalendar}
                  style={{
                    fontSize: "1.75rem",
                    color: "var(--color-neutral-300)",
                    marginBottom: "0.625rem",
                  }}
                />
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-neutral-400)",
                  }}
                >
                  No events scheduled today
                </p>
              </div>
            )}
          </div>

          {/* Unread Messages */}
          {unread_messages > 0 && (
            <div
              className="rounded-2xl"
              style={{
                backgroundColor: "var(--color-neutral-0)",
                border: "1px solid var(--color-neutral-200)",
                padding: "1.375rem 1.25rem",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="font-semibold"
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  Messages
                </h2>
                <span
                  className="rounded-full font-bold text-white flex items-center justify-center"
                  style={{
                    padding: "0.2rem 0.6rem",
                    fontSize: "0.65rem",
                    backgroundColor: "#ef4444",
                  }}
                >
                  {unread_messages} new
                </span>
              </div>
              <p
                className="mb-4"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                You have {unread_messages} unread message
                {unread_messages !== 1 ? "s" : ""}.
              </p>
              <Link
                href="/provider/messages"
                className="btn btn-primary btn-md w-full justify-center"
              >
                <FontAwesomeIcon icon={faMessage} style={{ width: "0.8rem" }} />
                Open Messages
              </Link>
            </div>
          )}

          {/* Optimization Tip */}
          {showOptimizationTip && (
            <div
              className="rounded-2xl"
              style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
                padding: "1.125rem 1.25rem",
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <FontAwesomeIcon
                  icon={faLightbulb}
                  className="flex-shrink-0 mt-0.5"
                  style={{
                    color: "#f59e0b",
                    width: "0.9rem",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold mb-1"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    Optimization tip
                  </p>
                  <p
                    className="leading-relaxed"
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--color-neutral-600)",
                    }}
                  >
                    Your response rate is excellent! Adding weekend availability
                    could capture 15% more leads.
                  </p>
                </div>
                <button
                  onClick={() => setShowOptimizationTip(false)}
                  aria-label="Dismiss tip"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-neutral-400)",
                    flexShrink: 0,
                    padding: "0.1rem",
                  }}
                >
                  <FontAwesomeIcon icon={faXmark} style={{ width: "0.8rem" }} />
                </button>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/provider/availability"
                  className="flex-1 flex items-center justify-center rounded-lg font-semibold transition-opacity hover:opacity-80"
                  style={{
                    padding: "0.5rem",
                    fontSize: "0.78rem",
                    backgroundColor: "#f59e0b",
                    color: "white",
                    textDecoration: "none",
                  }}
                >
                  Update
                </Link>
                <button
                  onClick={() => setShowOptimizationTip(false)}
                  className="flex-1 rounded-lg font-semibold transition-colors"
                  style={{
                    padding: "0.5rem",
                    fontSize: "0.78rem",
                    backgroundColor: "white",
                    color: "var(--color-neutral-600)",
                    border: "1px solid var(--color-neutral-200)",
                    cursor: "pointer",
                  }}
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
