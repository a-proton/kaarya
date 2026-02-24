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
  faArrowUp,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1.25rem",
      }}
    >
      <h2
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: "var(--color-neutral-900)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      <Link
        href={href}
        style={{
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "#1ab189",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.opacity = "0.7";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
        }}
      >
        {hrefLabel}
      </Link>
    </div>
  );
}

// ─── Loading / Error screens ──────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-neutral-50)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <FontAwesomeIcon
          icon={faSpinner}
          className="animate-spin"
          style={{ fontSize: "2rem", color: "#1ab189", marginBottom: "1rem" }}
        />
        <p
          style={{
            fontSize: "0.9rem",
            fontWeight: 500,
            color: "var(--color-neutral-500)",
          }}
        >
          Loading your dashboard…
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-neutral-50)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #fecaca",
          borderRadius: "1.25rem",
          padding: "2.5rem",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            background: "#fef2f2",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}
        >
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            style={{ color: "#ef4444", fontSize: "1.25rem" }}
          />
        </div>
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--color-neutral-900)",
            marginBottom: "0.5rem",
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-neutral-500)",
            marginBottom: "1.5rem",
          }}
        >
          {message}
        </p>
        <button
          onClick={onRetry}
          className="btn btn-primary btn-md"
          style={{ margin: "0 auto" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  icon: typeof faFolder;
  valueColor?: string;
  sublabel?: string;
  growth?: number;
  href: string;
  hrefLabel: string;
}

function StatCard({
  label,
  value,
  iconBg,
  iconColor,
  icon,
  valueColor,
  sublabel,
  growth,
  href,
  hrefLabel,
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
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "0.625rem",
          backgroundColor: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.875rem",
        }}
      >
        <FontAwesomeIcon
          icon={icon}
          style={{ color: iconColor, fontSize: "0.9rem" }}
        />
      </div>
      <p
        style={{
          fontSize: "0.6rem",
          fontWeight: 600,
          color: "var(--color-neutral-400)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "0.375rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "1.875rem",
          fontWeight: 700,
          color: valueColor || "var(--color-neutral-900)",
          lineHeight: 1,
          marginBottom: "0.5rem",
        }}
      >
        {value}
      </p>
      {growth !== undefined && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#065f46",
            marginBottom: "0.375rem",
          }}
        >
          <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: "0.625rem" }} />+
          {growth}%
        </div>
      )}
      {sublabel && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-neutral-500)",
            marginBottom: "0.5rem",
          }}
        >
          {sublabel}
        </p>
      )}
      <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
        <Link
          href={href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#1ab189",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "0.7";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
          }}
        >
          {hrefLabel}
          <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "0.6rem" }} />
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientDashboard() {
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardData>({
    queryKey: ["client-dashboard"],
    queryFn: () => api.get<DashboardData>("/api/v1/client/dashboard/"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <LoadingScreen />;
  if (isError)
    return (
      <ErrorScreen
        message={
          error instanceof Error ? error.message : "Failed to load dashboard"
        }
        onRetry={refetch}
      />
    );
  if (!dashboardData)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <p style={{ color: "var(--color-neutral-500)" }}>
          No dashboard data available
        </p>
      </div>
    );

  const {
    project_stats,
    active_projects,
    recent_updates,
    upcoming_milestones,
    recent_messages,
    unread_messages_count,
  } = dashboardData;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-neutral-50)",
        padding: "1.75rem 2rem",
      }}
    >
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .update-row:hover { background: var(--color-neutral-100) !important; }
        .message-row:hover { background: var(--color-neutral-50) !important; }
        .project-card:hover { border-color: var(--color-neutral-300) !important; box-shadow: 0 6px 20px rgba(0,0,0,0.07) !important; }
      `}</style>

      {/* Welcome Banner */}
      {showWelcomeBanner && (
        <div
          className="rounded-2xl mb-6 overflow-hidden"
          style={{
            backgroundColor: "var(--color-neutral-0)",
            border: "1px solid var(--color-neutral-200)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ height: 4, backgroundColor: "#1ab189" }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              padding: "1rem 1.5rem",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "0.875rem",
                backgroundColor: "rgba(26,177,137,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FontAwesomeIcon
                icon={faFolder}
                style={{ color: "#1ab189", fontSize: "1.1rem" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--color-neutral-900)",
                  margin: "0 0 0.2rem",
                }}
              >
                Welcome to your project dashboard
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-neutral-500)",
                  margin: 0,
                }}
              >
                Track progress, view updates, and communicate with your service
                providers.
              </p>
            </div>
            <Link
              href="/client/project-updates"
              className="hidden md:flex items-center gap-2 rounded-xl font-semibold flex-shrink-0"
              style={{
                padding: "0.55rem 1.1rem",
                fontSize: "0.8rem",
                backgroundColor: "#1ab189",
                color: "white",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
              }}
            >
              View Updates
              <FontAwesomeIcon
                icon={faArrowRight}
                style={{ fontSize: "0.65rem" }}
              />
            </Link>
            <button
              onClick={() => setShowWelcomeBanner(false)}
              style={{
                width: "1.875rem",
                height: "1.875rem",
                background: "transparent",
                border: "1px solid var(--color-neutral-200)",
                borderRadius: "0.5rem",
                cursor: "pointer",
                color: "var(--color-neutral-400)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "var(--color-neutral-100)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "transparent";
              }}
              aria-label="Dismiss"
            >
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: "0.75rem" }} />
            </button>
          </div>
        </div>
      )}

      {/* Page heading */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p
          style={{
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "var(--color-neutral-500)",
            marginBottom: "0.25rem",
          }}
        >
          Overview
        </p>
        <h1
          style={{
            fontSize: "1.625rem",
            fontWeight: 700,
            color: "var(--color-neutral-900)",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {project_stats.active_projects} active project
          {project_stats.active_projects !== 1 ? "s" : ""}
          {project_stats.pending_payments > 0 && (
            <span style={{ color: "var(--color-neutral-400)" }}>
              {" · "}$
              {project_stats.pending_payments.toLocaleString(undefined, {
                minimumFractionDigits: 0,
              })}{" "}
              pending
            </span>
          )}
        </h1>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <StatCard
          label="Total Projects"
          value={project_stats.total_projects}
          icon={faFolder}
          iconBg="rgba(26,177,137,0.1)"
          iconColor="#1ab189"
          href="/client/project-updates"
          hrefLabel="View all"
        />
        <StatCard
          label="Active"
          value={project_stats.active_projects}
          icon={faChartLine}
          iconBg="rgba(59,130,246,0.1)"
          iconColor="#3b82f6"
          href="/client/project-updates"
          hrefLabel="View active"
        />
        <StatCard
          label="Completed"
          value={project_stats.completed_projects}
          icon={faCheckCircle}
          iconBg="rgba(16,185,129,0.1)"
          iconColor="#10b981"
          href="/client/project-updates"
          hrefLabel="View history"
        />
        <StatCard
          label="Total Spent"
          value={`$${project_stats.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={faDollarSign}
          iconBg="rgba(139,92,246,0.1)"
          iconColor="#8b5cf6"
          href="/client/payments"
          hrefLabel="Payments"
        />
        <StatCard
          label="Pending"
          value={`$${project_stats.pending_payments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={faClock}
          iconBg="rgba(245,158,11,0.1)"
          iconColor="#f59e0b"
          valueColor="#d97706"
          href="/client/payments"
          hrefLabel="Pay now"
        />
      </div>

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1.25rem",
        }}
      >
        {/* Recent Updates — col-span 2 */}
        <div
          style={{
            gridColumn: "span 2",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Recent Updates card */}
          <div
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              borderRadius: "1rem",
              padding: "1.375rem 1.5rem",
            }}
          >
            <SectionHeader
              title="Recent Updates"
              href="/client/project-updates"
            />
            {recent_updates.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
                <FontAwesomeIcon
                  icon={faNewspaper}
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
                  No recent updates
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {recent_updates.map((update) => (
                  <Link
                    key={update.id}
                    href={`/client/project-updates/${update.id}`}
                    className="update-row"
                    style={{
                      display: "block",
                      padding: "0.875rem 1rem",
                      background: "var(--color-neutral-50)",
                      borderRadius: "0.75rem",
                      border: "1px solid var(--color-neutral-200)",
                      textDecoration: "none",
                      transition: "background 150ms",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: "0.375rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.625rem",
                            borderRadius: 9999,
                            background: "rgba(26,177,137,0.1)",
                            color: "#065f46",
                            border: "1px solid rgba(26,177,137,0.2)",
                          }}
                        >
                          {update.project}
                        </span>
                        {update.status === "unread" && (
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              backgroundColor: "#1ab189",
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-neutral-400)",
                        }}
                      >
                        {update.date}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--color-neutral-900)",
                        margin: 0,
                      }}
                    >
                      {update.title}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Milestones */}
          <div
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              borderRadius: "1rem",
              padding: "1.375rem 1.5rem",
            }}
          >
            <SectionHeader
              title="Upcoming Milestones"
              href="/client/milestones"
            />
            {upcoming_milestones.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
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
                  No upcoming milestones
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {upcoming_milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    style={{
                      padding: "0.875rem 1rem",
                      background: "var(--color-neutral-50)",
                      borderRadius: "0.75rem",
                      border: "1px solid var(--color-neutral-200)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.625rem",
                            borderRadius: 9999,
                            background: "rgba(59,130,246,0.1)",
                            color: "#1d4ed8",
                            border: "1px solid rgba(59,130,246,0.2)",
                          }}
                        >
                          {milestone.project}
                        </span>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--color-neutral-900)",
                            margin: "0.375rem 0 0",
                          }}
                        >
                          {milestone.title}
                        </p>
                      </div>
                      {milestone.status === "at-risk" && (
                        <FontAwesomeIcon
                          icon={faExclamationTriangle}
                          style={{
                            color: "#f59e0b",
                            fontSize: "0.875rem",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          fontSize: "0.8125rem",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faCalendar}
                          style={{ fontSize: "0.625rem" }}
                        />
                        Due: {milestone.due_date}
                      </div>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          color:
                            milestone.status === "on-track"
                              ? "#1ab189"
                              : "#d97706",
                        }}
                      >
                        {milestone.days_left} days left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — 1 col */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Active Projects */}
          <div
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              borderRadius: "1rem",
              padding: "1.375rem 1.25rem",
            }}
          >
            <SectionHeader
              title="Active Projects"
              href="/client/project-updates"
              hrefLabel="View all"
            />
            {active_projects.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <FontAwesomeIcon
                  icon={faFolder}
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
                  No active projects
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                {active_projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/client/projects/${project.id}`}
                    className="project-card"
                    style={{
                      display: "block",
                      padding: "0.875rem 1rem",
                      border: "1px solid var(--color-neutral-200)",
                      borderRadius: "0.75rem",
                      textDecoration: "none",
                      transition: "border-color 150ms, box-shadow 150ms",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "var(--color-neutral-900)",
                        margin: "0 0 0.2rem",
                      }}
                    >
                      {project.name}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-neutral-500)",
                        margin: "0 0 0.625rem",
                      }}
                    >
                      Provider: {project.provider}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        Progress
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color:
                            project.progress >= 75
                              ? "#1ab189"
                              : project.progress >= 50
                                ? "#3b82f6"
                                : "#f59e0b",
                        }}
                      >
                        {project.progress}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: "var(--color-neutral-150)",
                        borderRadius: 9999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${project.progress}%`,
                          backgroundColor:
                            project.progress >= 75
                              ? "#1ab189"
                              : project.progress >= 50
                                ? "#3b82f6"
                                : "#f59e0b",
                          borderRadius: 9999,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              borderRadius: "1rem",
              padding: "1.375rem 1.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <h2
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--color-neutral-900)",
                    margin: 0,
                  }}
                >
                  Messages
                </h2>
                {unread_messages_count > 0 && (
                  <span
                    style={{
                      padding: "0.15rem 0.5rem",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      backgroundColor: "#ef4444",
                      color: "white",
                      borderRadius: 9999,
                    }}
                  >
                    {unread_messages_count} new
                  </span>
                )}
              </div>
              <Link
                href="/client/messages"
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#1ab189",
                  textDecoration: "none",
                }}
              >
                View all
              </Link>
            </div>
            {recent_messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <FontAwesomeIcon
                  icon={faMessage}
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
                  No messages yet
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recent_messages.map((message, idx) => (
                  <Link
                    key={message.id}
                    href="/client/messages"
                    className="message-row"
                    style={{
                      display: "block",
                      padding: "0.75rem 0.5rem",
                      borderBottom:
                        idx < recent_messages.length - 1
                          ? "1px solid var(--color-neutral-100)"
                          : "none",
                      textDecoration: "none",
                      transition: "background 150ms",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          color: "var(--color-neutral-900)",
                          margin: 0,
                        }}
                      >
                        {message.from}
                      </p>
                      {message.unread && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            backgroundColor: "#1ab189",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-neutral-600)",
                        margin: "0 0 0.25rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {message.preview}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.75rem",
                        color: "var(--color-neutral-400)",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faClock}
                        style={{ fontSize: "0.6rem" }}
                      />
                      {message.time}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              borderRadius: "1rem",
              padding: "1.375rem 1.25rem",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-neutral-900)",
                margin: "0 0 1rem",
              }}
            >
              Quick Actions
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <Link
                href="/client/messages"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.7rem 1rem",
                  backgroundColor: "#1ab189",
                  color: "white",
                  borderRadius: "0.75rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  transition: "opacity 150ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
                }}
              >
                <FontAwesomeIcon
                  icon={faMessage}
                  style={{ fontSize: "0.8rem" }}
                />
                Send Message
              </Link>
              <Link
                href="/client/documents"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.7rem 1rem",
                  backgroundColor: "transparent",
                  color: "#1ab189",
                  border: "1.5px solid #1ab189",
                  borderRadius: "0.75rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  transition: "background 150ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "rgba(26,177,137,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "transparent";
                }}
              >
                <FontAwesomeIcon
                  icon={faFolder}
                  style={{ fontSize: "0.8rem" }}
                />
                View Documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
