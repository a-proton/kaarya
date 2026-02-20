"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faEllipsisVertical,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faEye,
  faPenToSquare,
  faTrash,
  faCheckCircle,
  faCheck,
  faTimes,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* ─────────────────────────────────────────── */
/* Types                                        */
/* ─────────────────────────────────────────── */
interface Client {
  id: number;
  full_name: string;
  user_email: string;
  user_phone: string;
  profile_image: string | null;
}

interface ServiceProvider {
  id: number;
  full_name: string;
  business_name: string;
  user_email: string;
  profile_image: string | null;
}

interface Project {
  id: number;
  project_name: string;
  description: string;
  site_address: string;
  status: "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled";
  status_display: string;
  start_date: string;
  expected_end_date: string;
  actual_end_date: string | null;
  total_cost: string;
  advance_payment: string;
  balance_payment: string;
  client: Client | null;
  service_provider: ServiceProvider;
  milestone_count: number;
  created_at: string;
  updated_at: string;
}

interface ProjectsResponse {
  count: number;
  results: Project[];
}

type TabFilter = "all" | "active" | "completed" | "archived";

/* ─────────────────────────────────────────── */
/* Status helpers                              */
/* ─────────────────────────────────────────── */
const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; bar: string }
> = {
  in_progress: {
    bg: "#eff6ff",
    color: "#1d4ed8",
    bar: "#3b82f6",
  },
  completed: {
    bg: "var(--color-primary-light)",
    color: "var(--color-primary)",
    bar: "var(--color-primary)",
  },
  not_started: {
    bg: "#fefce8",
    color: "#a16207",
    bar: "#eab308",
  },
  on_hold: {
    bg: "#fff7ed",
    color: "#c2410c",
    bar: "#f97316",
  },
  cancelled: {
    bg: "#fef2f2",
    color: "#b91c1c",
    bar: "#ef4444",
  },
};

const getStatusStyle = (status: string) =>
  STATUS_STYLES[status] || {
    bg: "var(--color-neutral-100)",
    color: "var(--color-neutral-600)",
    bar: "var(--color-neutral-400)",
  };

/* ─────────────────────────────────────────── */
/* Helpers                                     */
/* ─────────────────────────────────────────── */
const formatCurrency = (amount: string | number) => {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
};

const getClientInitials = (fullName: string) => {
  const names = fullName.split(" ");
  return names.length > 1
    ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    : fullName.substring(0, 2).toUpperCase();
};

const calculateProgress = (project: Project): number => {
  if (project.status === "completed") return 100;
  if (project.status === "not_started") return 0;
  const start = new Date(project.start_date).getTime();
  const end = new Date(project.expected_end_date).getTime();
  const now = Date.now();
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
};

/* ─────────────────────────────────────────── */
/* Sub-components                              */
/* ─────────────────────────────────────────── */

/** Inline select with chevron */
function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          paddingLeft: "0.875rem",
          paddingRight: "2.25rem",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
          fontSize: "0.8125rem",
          fontFamily: "var(--font-sans)",
          color: "var(--color-neutral-700)",
          backgroundColor: "var(--color-neutral-0)",
          border: "1px solid var(--color-neutral-200)",
          borderRadius: "0.625rem",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
      <FontAwesomeIcon
        icon={faChevronDown}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ fontSize: "0.6rem", color: "var(--color-neutral-400)" }}
      />
    </div>
  );
}

/** Status badge pill */
function StatusBadge({ status, label }: { status: string; label: string }) {
  const s = getStatusStyle(status);
  return (
    <span
      className="inline-flex items-center rounded-full font-semibold whitespace-nowrap"
      style={{
        fontSize: "0.65rem",
        padding: "0.25rem 0.65rem",
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {label}
    </span>
  );
}

/** Progress bar */
function ProgressBar({
  progress,
  status,
}: {
  progress: number;
  status: string;
}) {
  const s = getStatusStyle(status);
  return (
    <div>
      <span
        className="block mb-1.5"
        style={{ fontSize: "0.7rem", color: "var(--color-neutral-500)" }}
      >
        {progress}%
      </span>
      <div
        className="rounded-full overflow-hidden"
        style={{
          height: "0.3rem",
          backgroundColor: "var(--color-neutral-150)",
          width: "100%",
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: s.bar,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Main page                                   */
/* ─────────────────────────────────────────── */
export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [clientFilter, setClientFilter] = useState("All Clients");
  const [dateRangeFilter, setDateRangeFilter] = useState("Date Range");
  const [sortBy, setSortBy] = useState("Due Date");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    data: projectsData,
    isLoading,
    isError,
    error,
  } = useQuery<ProjectsResponse>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await api.get<ProjectsResponse>("/api/v1/projects/");
      return response;
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleAction = (
    action: string,
    projectId: number,
    projectName: string,
  ) => {
    setOpenDropdown(null);
    if (action === "view") {
      router.push(`/provider/projects/${projectId}`);
    } else if (action === "update") {
      router.push(`/provider/projects/${projectId}/edit`);
    } else if (action === "milestones") {
      router.push(`/provider/projects/${projectId}/milestones`);
    } else if (
      action === "delete" &&
      confirm(`Are you sure you want to delete "${projectName}"?`)
    ) {
      showSuccessNotification(`Project "${projectName}" has been deleted`);
    }
  };

  const projects = projectsData?.results || [];

  const filteredProjects = projects.filter((project) => {
    if (
      activeTab === "active" &&
      project.status !== "in_progress" &&
      project.status !== "not_started"
    )
      return false;
    if (activeTab === "completed" && project.status !== "completed")
      return false;
    if (
      activeTab === "archived" &&
      project.status !== "on_hold" &&
      project.status !== "cancelled"
    )
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        project.project_name.toLowerCase().includes(q) ||
        (project.client?.full_name || "").toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const activeProjectsCount = projects.filter(
    (p) => p.status === "in_progress" || p.status === "not_started",
  ).length;

  const clientOptions = [
    "All Clients",
    ...Array.from(
      new Set(
        projects
          .filter((p) => p.client !== null)
          .map((p) => p.client!.full_name),
      ),
    ),
  ];

  /* Loading */
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="animate-spin mb-4"
            style={{ fontSize: "2rem", color: "var(--color-primary)" }}
          />
          <p
            className="font-medium"
            style={{ fontSize: "0.9rem", color: "var(--color-neutral-500)" }}
          >
            Loading projects…
          </p>
        </div>
      </div>
    );
  }

  /* Error */
  if (isError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div
          className="rounded-2xl p-8 text-center max-w-md w-full"
          style={{
            backgroundColor: "var(--color-neutral-0)",
            border: "1px solid #fecaca",
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#fef2f2" }}
          >
            <FontAwesomeIcon
              icon={faTimes}
              style={{ color: "#ef4444", width: "1.1rem" }}
            />
          </div>
          <h3
            className="font-semibold mb-2"
            style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
          >
            Error Loading Projects
          </h3>
          <p
            className="mb-5"
            style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}
          >
            {error instanceof Error ? error.message : "Failed to load projects"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-neutral-50)" }}
    >
      {/* Toast */}
      {showSuccessMessage && (
        <div className="fixed top-6 right-6 z-[60]">
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-3.5"
            style={{
              backgroundColor: "var(--color-neutral-900)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              minWidth: "18rem",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <FontAwesomeIcon
                icon={faCheck}
                style={{ color: "white", width: "0.6rem" }}
              />
            </div>
            <p
              className="flex-1 font-medium"
              style={{ fontSize: "0.875rem", color: "white" }}
            >
              {successMessage}
            </p>
            <button
              onClick={() => setShowSuccessMessage(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                padding: 0,
              }}
            >
              <FontAwesomeIcon icon={faTimes} style={{ width: "0.75rem" }} />
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.5rem 2rem 0",
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1
              className="font-bold leading-tight"
              style={{
                fontSize: "1.5rem",
                color: "var(--color-neutral-900)",
              }}
            >
              Projects
            </h1>
            <p
              className="mt-1"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-500)",
              }}
            >
              Manage all your projects and track milestones
            </p>
          </div>
          <Link
            href="/provider/projects/create"
            className="btn btn-primary btn-md"
          >
            <FontAwesomeIcon icon={faPlus} style={{ width: "0.75rem" }} />
            Create New Project
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {(["all", "active", "completed", "archived"] as TabFilter[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className="relative flex items-center gap-2 px-4 py-3 font-medium transition-colors"
                style={{
                  fontSize: "0.875rem",
                  color:
                    activeTab === tab
                      ? "var(--color-primary)"
                      : "var(--color-neutral-500)",
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid var(--color-primary)"
                      : "2px solid transparent",
                  cursor: "pointer",
                  fontWeight: activeTab === tab ? 600 : 400,
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "active" && activeProjectsCount > 0 && (
                  <span
                    className="rounded-full font-bold text-white"
                    style={{
                      fontSize: "0.6rem",
                      padding: "0.15rem 0.5rem",
                      backgroundColor: "var(--color-primary)",
                    }}
                  >
                    {activeProjectsCount}
                  </span>
                )}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "0.875rem 2rem",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            {/* Search */}
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-neutral-400)",
                }}
              />
              <input
                type="text"
                placeholder="Search projects or clients…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  paddingLeft: "2.25rem",
                  paddingRight: "1rem",
                  paddingTop: "0.5rem",
                  paddingBottom: "0.5rem",
                  width: "17rem",
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-neutral-900)",
                  backgroundColor: "var(--color-neutral-0)",
                  border: "1px solid var(--color-neutral-200)",
                  borderRadius: "0.625rem",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-primary)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(26,177,137,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-neutral-200)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                "All Statuses",
                "In Progress",
                "Not Started",
                "Completed",
                "On Hold",
              ]}
            />
            <FilterSelect
              value={clientFilter}
              onChange={setClientFilter}
              options={clientOptions}
            />
            <FilterSelect
              value={dateRangeFilter}
              onChange={setDateRangeFilter}
              options={["Date Range", "This Week", "This Month", "Next Month"]}
            />
          </div>

          <FilterSelect
            value={sortBy}
            onChange={setSortBy}
            options={["Due Date", "Name", "Progress", "Client", "Budget"].map(
              (o) => `Sort by: ${o}`,
            )}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "1.75rem 2rem" }}>
        {paginatedProjects.length === 0 ? (
          /* Empty state */
          <div
            className="rounded-2xl text-center"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              padding: "4rem 2rem",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--color-neutral-100)" }}
            >
              <FontAwesomeIcon
                icon={faCheckCircle}
                style={{
                  fontSize: "1.5rem",
                  color: "var(--color-neutral-300)",
                }}
              />
            </div>
            <h3
              className="font-semibold mb-1"
              style={{
                fontSize: "1rem",
                color: "var(--color-neutral-900)",
              }}
            >
              No projects found
            </h3>
            <p
              className="mb-5"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-500)",
              }}
            >
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Get started by creating your first project"}
            </p>
            {!searchQuery && (
              <Link
                href="/provider/projects/create"
                className="btn btn-primary btn-md"
              >
                <FontAwesomeIcon icon={faPlus} style={{ width: "0.75rem" }} />
                Create New Project
              </Link>
            )}
          </div>
        ) : (
          /* Table */
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
            }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-12 gap-4 px-6 py-3"
              style={{
                backgroundColor: "var(--color-neutral-50)",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              {[
                { label: "Project", span: "col-span-3" },
                { label: "Client", span: "col-span-2" },
                { label: "Progress", span: "col-span-2" },
                { label: "Status", span: "col-span-2" },
                { label: "Value", span: "col-span-2" },
                { label: "", span: "col-span-1" },
              ].map(({ label, span }) => (
                <div
                  key={label}
                  className={span}
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "var(--color-neutral-400)",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Rows */}
            <div>
              {paginatedProjects.map((project, idx) => {
                const progress = calculateProgress(project);
                const isOpen = openDropdown === project.id.toString();

                return (
                  <div
                    key={project.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors"
                    style={{
                      borderBottom:
                        idx < paginatedProjects.length - 1
                          ? "1px solid var(--color-neutral-100)"
                          : "none",
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLDivElement
                      ).style.backgroundColor = "var(--color-neutral-50)";
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLDivElement
                      ).style.backgroundColor = "transparent";
                    }}
                  >
                    {/* Project name */}
                    <div className="col-span-3 flex items-center gap-3 min-w-0">
                      <div
                        className="rounded-xl flex items-center justify-center flex-shrink-0 font-bold"
                        style={{
                          width: "2.75rem",
                          height: "2.75rem",
                          backgroundColor: "var(--color-primary-light)",
                          color: "var(--color-primary)",
                          fontSize: "1rem",
                          overflow: "hidden",
                        }}
                      >
                        {project.service_provider.profile_image ? (
                          <img
                            src={project.service_provider.profile_image}
                            alt={project.project_name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          project.project_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="font-semibold truncate leading-tight"
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--color-neutral-900)",
                          }}
                        >
                          {project.project_name}
                        </p>
                        <p
                          className="truncate mt-0.5"
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-neutral-400)",
                          }}
                        >
                          {project.site_address}
                        </p>
                      </div>
                    </div>

                    {/* Client */}
                    <div className="col-span-2 flex items-center gap-2.5 min-w-0">
                      {project.client ? (
                        <>
                          <div
                            className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                            style={{
                              width: "2rem",
                              height: "2rem",
                              backgroundColor: "var(--color-primary)",
                              color: "white",
                              fontSize: "0.65rem",
                            }}
                          >
                            {getClientInitials(project.client.full_name)}
                          </div>
                          <span
                            className="truncate font-medium"
                            style={{
                              fontSize: "0.8125rem",
                              color: "var(--color-neutral-700)",
                            }}
                          >
                            {project.client.full_name}
                          </span>
                        </>
                      ) : (
                        <>
                          <div
                            className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                            style={{
                              width: "2rem",
                              height: "2rem",
                              backgroundColor: "var(--color-neutral-200)",
                              color: "var(--color-neutral-500)",
                              fontSize: "0.65rem",
                            }}
                          >
                            ?
                          </div>
                          <span
                            className="truncate italic"
                            style={{
                              fontSize: "0.8125rem",
                              color: "var(--color-neutral-400)",
                            }}
                          >
                            Unassigned
                          </span>
                        </>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="col-span-2">
                      <ProgressBar
                        progress={progress}
                        status={project.status}
                      />
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <StatusBadge
                        status={project.status}
                        label={project.status_display}
                      />
                    </div>

                    {/* Value */}
                    <div className="col-span-2">
                      <p
                        className="font-semibold leading-tight"
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-neutral-900)",
                        }}
                      >
                        {formatCurrency(project.total_cost)}
                      </p>
                      <p
                        className="mt-0.5"
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--color-neutral-400)",
                        }}
                      >
                        {project.milestone_count} milestone
                        {project.milestone_count !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Actions */}
                    <div
                      className="col-span-1 flex justify-center"
                      ref={isOpen ? dropdownRef : null}
                    >
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenDropdown(
                              isOpen ? null : project.id.toString(),
                            )
                          }
                          className="flex items-center justify-center rounded-lg transition-colors"
                          aria-label="Actions"
                          style={{
                            width: "2rem",
                            height: "2rem",
                            backgroundColor: isOpen
                              ? "var(--color-neutral-100)"
                              : "transparent",
                            border: "1px solid",
                            borderColor: isOpen
                              ? "var(--color-neutral-200)"
                              : "transparent",
                            cursor: "pointer",
                            color: "var(--color-neutral-500)",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor =
                              "var(--color-neutral-100)";
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.borderColor = "var(--color-neutral-200)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isOpen) {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.backgroundColor = "transparent";
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.borderColor = "transparent";
                            }
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faEllipsisVertical}
                            style={{ fontSize: "0.85rem" }}
                          />
                        </button>

                        {isOpen && (
                          <div
                            className="absolute right-0 mt-1.5 rounded-xl overflow-hidden z-10"
                            style={{
                              width: "11rem",
                              backgroundColor: "var(--color-neutral-0)",
                              border: "1px solid var(--color-neutral-200)",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                            }}
                          >
                            {[
                              {
                                action: "view",
                                icon: faEye,
                                label: "View Details",
                                color: "#3b82f6",
                                hoverBg: "#eff6ff",
                              },
                              {
                                action: "update",
                                icon: faPenToSquare,
                                label: "Edit Project",
                                color: "var(--color-primary)",
                                hoverBg: "var(--color-primary-light)",
                              },
                              {
                                action: "delete",
                                icon: faTrash,
                                label: "Delete",
                                color: "#ef4444",
                                hoverBg: "#fef2f2",
                              },
                            ].map(({ action, icon, label, color, hoverBg }) => (
                              <button
                                key={action}
                                onClick={() =>
                                  handleAction(
                                    action,
                                    project.id,
                                    project.project_name,
                                  )
                                }
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                                style={{
                                  fontSize: "0.8125rem",
                                  color:
                                    action === "delete"
                                      ? color
                                      : "var(--color-neutral-700)",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontFamily: "var(--font-sans)",
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.backgroundColor = hoverBg;
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.backgroundColor = "transparent";
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={icon}
                                  style={{ width: "0.8rem", color }}
                                />
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderTop: "1px solid var(--color-neutral-200)" }}
            >
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                Showing{" "}
                <span
                  className="font-semibold"
                  style={{ color: "var(--color-neutral-900)" }}
                >
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filteredProjects.length)}
                </span>{" "}
                of{" "}
                <span
                  className="font-semibold"
                  style={{ color: "var(--color-neutral-900)" }}
                >
                  {filteredProjects.length}
                </span>{" "}
                projects
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                  style={{
                    width: "2rem",
                    height: "2rem",
                    border: "1px solid var(--color-neutral-200)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    color: "var(--color-neutral-500)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    style={{ fontSize: "0.65rem" }}
                  />
                </button>

                {[...Array(totalPages)].map((_, i) => {
                  const pg = i + 1;
                  const isCurrent = currentPage === pg;
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className="flex items-center justify-center rounded-lg transition-colors font-semibold"
                      style={{
                        width: "2rem",
                        height: "2rem",
                        fontSize: "0.8rem",
                        border: isCurrent
                          ? "none"
                          : "1px solid var(--color-neutral-200)",
                        backgroundColor: isCurrent
                          ? "var(--color-primary)"
                          : "transparent",
                        color: isCurrent ? "white" : "var(--color-neutral-600)",
                        cursor: "pointer",
                      }}
                    >
                      {pg}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                  style={{
                    width: "2rem",
                    height: "2rem",
                    border: "1px solid var(--color-neutral-200)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    color: "var(--color-neutral-500)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    style={{ fontSize: "0.65rem" }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
