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
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch projects from API
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
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleAction = (
    action: string,
    projectId: number,
    projectName: string
  ) => {
    setOpenDropdown(null);
    if (action === "view") {
      // Navigate to project details page
      window.location.href = `/provider/projects/${projectId}`;
    } else if (action === "update") {
      // Navigate to project edit page
      window.location.href = `/provider/projects/${projectId}/edit`;
    } else if (action === "milestones") {
      // Navigate to milestones page
      window.location.href = `/provider/projects/${projectId}/milestones`;
    } else if (
      action === "delete" &&
      confirm(`Are you sure you want to delete "${projectName}"?`)
    ) {
      // TODO: Implement delete functionality with API call
      showSuccessNotification(`Project "${projectName}" has been deleted`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_progress: "bg-blue-600",
      completed: "bg-green-600",
      not_started: "bg-yellow-600",
      on_hold: "bg-orange-600",
      cancelled: "bg-red-600",
    };
    return colors[status] || "bg-neutral-400";
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      in_progress: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      not_started: "bg-yellow-100 text-yellow-700 border-yellow-200",
      on_hold: "bg-orange-100 text-orange-700 border-orange-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      colors[status] || "bg-neutral-100 text-neutral-600 border-neutral-200"
    );
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getClientInitials = (fullName: string) => {
    const names = fullName.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const calculateProgress = (project: Project) => {
    // Calculate progress based on dates
    const start = new Date(project.start_date).getTime();
    const end = new Date(project.expected_end_date).getTime();
    const now = Date.now();

    if (project.status === "completed") return 100;
    if (project.status === "not_started") return 0;
    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  // Filter and process projects
  const projects = projectsData?.results || [];

  const filteredProjects = projects.filter((project) => {
    // Tab filtering
    if (
      activeTab === "active" &&
      project.status !== "in_progress" &&
      project.status !== "not_started"
    ) {
      return false;
    }
    if (
      activeTab === "completed" &&
      project.status.toLowerCase() !== "completed"
    ) {
      return false;
    }
    if (
      activeTab === "archived" &&
      project.status !== "on_hold" &&
      project.status !== "cancelled"
    ) {
      return false;
    }

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const clientName = project.client?.full_name || "";
      return (
        project.project_name.toLowerCase().includes(query) ||
        clientName.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const totalPages = Math.ceil(filteredProjects.length / 5);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * 5,
    currentPage * 5
  );

  const activeProjectsCount = projects.filter(
    (p) => p.status === "in_progress" || p.status === "not_started"
  ).length;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTimes} className="text-red-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Projects
          </h3>
          <p className="text-red-700 mb-4">
            {error instanceof Error ? error.message : "Failed to load projects"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed top-8 right-8 z-[60] animate-slide-in-right">
          <div className="bg-green-600 text-neutral-0 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faCheck} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-neutral-0 hover:text-neutral-200 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="heading-2 text-neutral-900">Projects</h1>
            <p className="text-neutral-600 body-regular mt-1">
              Manage all your projects and track milestones
            </p>
          </div>
          <Link
            href="/provider/projects/create"
            className="btn-primary flex items-center gap-2 shadow-lg"
          >
            <FontAwesomeIcon icon={faPlus} />
            Create New Project
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8">
        <div className="flex items-center gap-6">
          {(["all", "active", "completed", "archived"] as TabFilter[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`py-4 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "active" && (
                  <span className="px-2 py-0.5 bg-primary-600 text-neutral-0 rounded-full text-xs font-semibold">
                    {activeProjectsCount}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-neutral-0 px-8 py-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"
              />
              <input
                type="text"
                placeholder="Search projects or clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-neutral-0 border border-neutral-200 rounded-lg w-64 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small"
              />
            </div>
            {[
              {
                value: statusFilter,
                setValue: setStatusFilter,
                options: [
                  "All Statuses",
                  "In Progress",
                  "Not Started",
                  "Completed",
                  "On Hold",
                ],
              },
              {
                value: clientFilter,
                setValue: setClientFilter,
                options: [
                  "All Clients",
                  ...Array.from(
                    new Set(
                      projects
                        .filter((p) => p.client !== null)
                        .map((p) => p.client!.full_name)
                    )
                  ),
                ],
              },
              {
                value: dateRangeFilter,
                setValue: setDateRangeFilter,
                options: [
                  "Date Range",
                  "This Week",
                  "This Month",
                  "Next Month",
                ],
              },
            ].map((filter, idx) => (
              <div key={idx} className="relative">
                <select
                  value={filter.value}
                  onChange={(e) => filter.setValue(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer"
                >
                  {filter.options.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer"
              >
                {["Due Date", "Name", "Progress", "Client", "Budget"].map(
                  (opt) => (
                    <option key={opt}>Sort by: {opt}</option>
                  )
                )}
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      <div className="p-8">
        {paginatedProjects.length === 0 ? (
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-neutral-400 text-2xl"
              />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No Projects Found
            </h3>
            <p className="text-neutral-600 mb-6">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Get started by creating your first project"}
            </p>
            {!searchQuery && (
              <Link href="/provider/projects/create" className="btn-primary">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create New Project
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold text-sm">
              <div className="col-span-3">PROJECT NAME</div>
              <div className="col-span-2">CLIENT</div>
              <div className="col-span-2">PROGRESS</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-2">VALUE</div>
              <div className="col-span-1 text-center">ACTIONS</div>
            </div>
            <div className="divide-y divide-neutral-100">
              {paginatedProjects.map((project) => {
                const progress = calculateProgress(project);
                return (
                  <div
                    key={project.id}
                    className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="col-span-3 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {project.service_provider.profile_image ? (
                          <img
                            src={project.service_provider.profile_image}
                            alt={project.project_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-neutral-0 text-xl font-bold">
                            {project.project_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors truncate">
                          {project.project_name}
                        </h4>
                        <p className="text-neutral-500 text-sm truncate">
                          {project.site_address}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-3 min-w-0">
                      {project.client ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {getClientInitials(project.client.full_name)}
                          </div>
                          <span className="text-neutral-700 truncate">
                            {project.client.full_name}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-neutral-300 text-neutral-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            ?
                          </div>
                          <span className="text-neutral-500 truncate italic">
                            No client assigned
                          </span>
                        </>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div className="flex-1">
                        <span className="text-sm text-neutral-600 block mb-1">
                          {progress}% Complete
                        </span>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getStatusColor(
                              project.status
                            )} rounded-full transition-all`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${getStatusBadgeColor(
                          project.status
                        )}`}
                      >
                        {project.status_display}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div>
                        <div className="font-semibold text-neutral-900">
                          {formatCurrency(project.total_cost)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {project.milestone_count} milestones
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <div
                        className="relative"
                        ref={
                          openDropdown === project.id.toString()
                            ? dropdownRef
                            : null
                        }
                      >
                        <button
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === project.id.toString()
                                ? null
                                : project.id.toString()
                            )
                          }
                          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                          aria-label="Actions"
                        >
                          <FontAwesomeIcon
                            icon={faEllipsisVertical}
                            className="text-neutral-600"
                          />
                        </button>
                        {openDropdown === project.id.toString() && (
                          <div className="absolute right-0 mt-2 w-48 bg-neutral-0 rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                            <button
                              onClick={() =>
                                handleAction(
                                  "view",
                                  project.id,
                                  project.project_name
                                )
                              }
                              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                            >
                              <FontAwesomeIcon
                                icon={faEye}
                                className="text-blue-600 w-4"
                              />
                              View Details
                            </button>
                            <button
                              onClick={() =>
                                handleAction(
                                  "update",
                                  project.id,
                                  project.project_name
                                )
                              }
                              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                            >
                              <FontAwesomeIcon
                                icon={faPenToSquare}
                                className="text-green-600 w-4"
                              />
                              Edit Project
                            </button>

                            <button
                              onClick={() =>
                                handleAction(
                                  "delete",
                                  project.id,
                                  project.project_name
                                )
                              }
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-4" />
                              Delete Project
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Pagination */}
            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
              <p className="text-neutral-600 text-sm">
                Showing {(currentPage - 1) * 5 + 1}-
                {Math.min(currentPage * 5, filteredProjects.length)} of{" "}
                {filteredProjects.length} projects
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    className="text-neutral-600"
                  />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors ${
                      currentPage === i + 1
                        ? "bg-primary-600 text-neutral-0 border-primary-600"
                        : "text-neutral-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="text-neutral-600"
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
