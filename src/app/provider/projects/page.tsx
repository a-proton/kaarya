"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faEllipsisVertical,
  faList,
  faTableCells,
  faChevronDown,
  faCalendar,
  faChevronLeft,
  faChevronRight,
  faEye,
  faPenToSquare,
  faTrash,
  faMapMarkerAlt,
  faUser,
  faMoneyBill,
  faBriefcase,
  faCheckCircle,
  faDollarSign,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  amount: number;
  status: "pending" | "in-progress" | "completed";
}

interface Project {
  id: string;
  name: string;
  category: string;
  location: string;
  client: {
    name: string;
    initials: string;
    avatar?: string;
  };
  progress: number;
  status: "On Track" | "Needs Attention" | "Completed" | "Archived";
  startDate: string;
  dueDate: string;
  estimatedBudget: number;
  initialPayment: number;
  milestones: Milestone[];
  totalProjectValue: number;
  description?: string;
  team: Array<{
    initials: string;
    color: string;
  }>;
  image?: string;
}

type ViewMode = "list" | "grid";
type TabFilter = "all" | "active" | "completed" | "archived";

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeTab, setActiveTab] = useState<TabFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [clientFilter, setClientFilter] = useState("All Clients");
  const [dateRangeFilter, setDateRangeFilter] = useState("Date Range");
  const [sortBy, setSortBy] = useState("Due Date");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const projects: Project[] = [
    {
      id: "1",
      name: "Kitchen Renovation",
      category: "Renovation",
      location: "123 Main Street, New York, NY",
      client: { name: "Sarah Johnson", initials: "SJ" },
      progress: 65,
      status: "On Track",
      startDate: "Jan 15, 2024",
      dueDate: "Feb 28, 2024",
      estimatedBudget: 50000,
      initialPayment: 10000,
      milestones: [
        {
          id: "m1",
          title: "Demolition Complete",
          description: "Remove old cabinets and fixtures",
          dueDate: "2024-01-25",
          amount: 5000,
          status: "completed",
        },
        {
          id: "m2",
          title: "Electrical & Plumbing",
          description: "Install new wiring and plumbing lines",
          dueDate: "2024-02-05",
          amount: 8000,
          status: "in-progress",
        },
        {
          id: "m3",
          title: "Cabinet Installation",
          description: "Install custom kitchen cabinets",
          dueDate: "2024-02-15",
          amount: 12000,
          status: "pending",
        },
        {
          id: "m4",
          title: "Final Touches",
          description: "Paint, fixtures, and cleanup",
          dueDate: "2024-02-28",
          amount: 5000,
          status: "pending",
        },
      ],
      totalProjectValue: 40000,
      description:
        "Complete kitchen renovation including new cabinets, countertops, and appliances.",
      team: [
        { initials: "SJ", color: "bg-primary-600" },
        { initials: "MR", color: "bg-secondary-600" },
        { initials: "JD", color: "bg-yellow-600" },
      ],
      image: "/project-kitchen.jpg",
    },
    {
      id: "2",
      name: "Bathroom Upgrade",
      category: "Plumbing",
      location: "456 Oak Avenue, Brooklyn, NY",
      client: { name: "David Martinez", initials: "DM" },
      progress: 30,
      status: "Needs Attention",
      startDate: "Feb 01, 2024",
      dueDate: "Mar 15, 2024",
      estimatedBudget: 25000,
      initialPayment: 5000,
      milestones: [
        {
          id: "m5",
          title: "Plumbing Updates",
          description: "Replace all plumbing fixtures",
          dueDate: "2024-02-10",
          amount: 6000,
          status: "in-progress",
        },
        {
          id: "m6",
          title: "Tile Installation",
          description: "Install new floor and wall tiles",
          dueDate: "2024-02-25",
          amount: 8000,
          status: "pending",
        },
        {
          id: "m7",
          title: "Final Installation",
          description: "Install vanity, mirror, and fixtures",
          dueDate: "2024-03-15",
          amount: 6000,
          status: "pending",
        },
      ],
      totalProjectValue: 25000,
      description:
        "Modern bathroom renovation with new fixtures and tile work.",
      team: [
        { initials: "DM", color: "bg-primary-600" },
        { initials: "MR", color: "bg-secondary-600" },
      ],
      image: "/project-bathroom.jpg",
    },
    {
      id: "3",
      name: "Electrical Panel Upgrade",
      category: "Electrical",
      location: "789 Pine Road, Manhattan, NY",
      client: { name: "Jennifer White", initials: "JW" },
      progress: 90,
      status: "On Track",
      startDate: "Jan 20, 2024",
      dueDate: "Feb 10, 2024",
      estimatedBudget: 15000,
      initialPayment: 3000,
      milestones: [
        {
          id: "m8",
          title: "Panel Installation",
          description: "Install new 200A electrical panel",
          dueDate: "2024-02-01",
          amount: 8000,
          status: "completed",
        },
        {
          id: "m9",
          title: "Circuit Updates",
          description: "Update all circuits and breakers",
          dueDate: "2024-02-10",
          amount: 4000,
          status: "in-progress",
        },
      ],
      totalProjectValue: 15000,
      description:
        "Upgrade main electrical panel to meet modern code requirements.",
      team: [
        { initials: "JW", color: "bg-primary-600" },
        { initials: "TK", color: "bg-secondary-600" },
      ],
      image: "/project-electrical.jpg",
    },
    {
      id: "4",
      name: "HVAC System Installation",
      category: "HVAC",
      location: "321 Elm Street, Queens, NY",
      client: { name: "Michael Brown", initials: "MB" },
      progress: 100,
      status: "Completed",
      startDate: "Dec 15, 2023",
      dueDate: "Jan 20, 2024",
      estimatedBudget: 35000,
      initialPayment: 7000,
      milestones: [
        {
          id: "m10",
          title: "System Removal",
          description: "Remove old HVAC system",
          dueDate: "2023-12-20",
          amount: 3000,
          status: "completed",
        },
        {
          id: "m11",
          title: "New Installation",
          description: "Install new HVAC system",
          dueDate: "2024-01-10",
          amount: 20000,
          status: "completed",
        },
        {
          id: "m12",
          title: "Testing & Commissioning",
          description: "Test and certify system",
          dueDate: "2024-01-20",
          amount: 5000,
          status: "completed",
        },
      ],
      totalProjectValue: 35000,
      description:
        "Complete HVAC system replacement with high-efficiency units.",
      team: [
        { initials: "MB", color: "bg-primary-600" },
        { initials: "SJ", color: "bg-secondary-600" },
        { initials: "MR", color: "bg-yellow-600" },
      ],
      image: "/project-hvac.jpg",
    },
    {
      id: "5",
      name: "Garden & Landscape Design",
      category: "Landscaping",
      location: "555 Garden Lane, Staten Island, NY",
      client: { name: "Robert Anderson", initials: "RA" },
      progress: 45,
      status: "On Track",
      startDate: "Feb 15, 2024",
      dueDate: "Mar 30, 2024",
      estimatedBudget: 20000,
      initialPayment: 4000,
      milestones: [
        {
          id: "m13",
          title: "Site Preparation",
          description: "Clear and prepare landscape area",
          dueDate: "2024-02-25",
          amount: 3000,
          status: "completed",
        },
        {
          id: "m14",
          title: "Hardscape Installation",
          description: "Install patios and walkways",
          dueDate: "2024-03-10",
          amount: 7000,
          status: "in-progress",
        },
        {
          id: "m15",
          title: "Planting & Final Touches",
          description: "Plant gardens and install lighting",
          dueDate: "2024-03-30",
          amount: 6000,
          status: "pending",
        },
      ],
      totalProjectValue: 20000,
      description:
        "Complete landscape redesign with patio, walkways, and gardens.",
      team: [
        { initials: "RA", color: "bg-primary-600" },
        { initials: "MR", color: "bg-secondary-600" },
      ],
      image: "/project-garden.jpg",
    },
  ];

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
    projectId: string,
    projectName: string
  ) => {
    setOpenDropdown(null);
    if (action === "view") {
      const project = projects.find((p) => p.id === projectId);
      if (project) setViewingProject(project);
    } else if (action === "update") {
      showSuccessNotification(`Opening editor for: ${projectName}`);
    } else if (action === "milestones") {
      showSuccessNotification(`Opening milestone manager for: ${projectName}`);
    } else if (
      action === "delete" &&
      confirm(`Are you sure you want to delete "${projectName}"?`)
    ) {
      showSuccessNotification(`Project "${projectName}" has been deleted`);
    }
  };

  const getStatusColor = (status: Project["status"]) => {
    const colors = {
      "On Track": "bg-green-600",
      "Needs Attention": "bg-yellow-600",
      Completed: "bg-primary-600",
      Archived: "bg-neutral-400",
    };
    return colors[status] || "bg-neutral-400";
  };

  const getStatusBadgeColor = (status: Project["status"]) => {
    const colors = {
      "On Track": "bg-green-100 text-green-700 border-green-200",
      "Needs Attention": "bg-yellow-100 text-yellow-700 border-yellow-200",
      Completed: "bg-primary-50 text-primary-700 border-primary-200",
      Archived: "bg-neutral-100 text-neutral-600 border-neutral-200",
    };
    return (
      colors[status] || "bg-neutral-100 text-neutral-600 border-neutral-200"
    );
  };

  const getMilestoneStatusBadgeColor = (status: Milestone["status"]) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[status];
  };

  const getMilestoneStatusIcon = (status: Milestone["status"]) => {
    const icons = {
      pending: faExclamationTriangle,
      "in-progress": faCheckCircle,
      completed: faCheck,
    };
    return icons[status];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const filteredProjects = projects.filter((project) => {
    if (
      activeTab === "active" &&
      project.status !== "On Track" &&
      project.status !== "Needs Attention"
    )
      return false;
    if (activeTab === "completed" && project.status !== "Completed")
      return false;
    if (activeTab === "archived" && project.status !== "Archived") return false;
    if (
      searchQuery &&
      !project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !project.client.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const totalPages = Math.ceil(filteredProjects.length / 5);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * 5,
    currentPage * 5
  );

  const activeProjectsCount = projects.filter(
    (p) => p.status === "On Track" || p.status === "Needs Attention"
  ).length;

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
                  "On Track",
                  "Needs Attention",
                  "Completed",
                ],
              },
              {
                value: clientFilter,
                setValue: setClientFilter,
                options: [
                  "All Clients",
                  "Sarah Johnson",
                  "David Martinez",
                  "Jennifer White",
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
            <div className="flex items-center bg-neutral-50 rounded-lg p-1">
              {(["list", "grid"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded transition-colors ${
                    viewMode === mode
                      ? "bg-neutral-0 text-primary-600 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={mode === "list" ? faList : faTableCells}
                  />
                </button>
              ))}
            </div>
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
        {viewMode === "list" ? (
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
              {paginatedProjects.map((project) => (
                <div
                  key={project.id}
                  className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-neutral-50 transition-colors group"
                >
                  <div className="col-span-3 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <span className="text-neutral-0 text-xl font-bold">
                        {project.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors truncate">
                        {project.name}
                      </h4>
                      <p className="text-neutral-500 text-sm truncate">
                        {project.category}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {project.client.initials}
                    </div>
                    <span className="text-neutral-700 truncate">
                      {project.client.name}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className="flex-1">
                      <span className="text-sm text-neutral-600 block mb-1">
                        {project.progress}% Complete
                      </span>
                      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getStatusColor(
                            project.status
                          )} rounded-full transition-all`}
                          style={{ width: `${project.progress}%` }}
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
                      {project.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div>
                      <div className="font-semibold text-neutral-900">
                        {formatCurrency(project.totalProjectValue)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {project.milestones.length} milestones
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <div
                      className="relative"
                      ref={openDropdown === project.id ? dropdownRef : null}
                    >
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === project.id ? null : project.id
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
                      {openDropdown === project.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-neutral-0 rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                          <button
                            onClick={() =>
                              handleAction("view", project.id, project.name)
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
                              handleAction("update", project.id, project.name)
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
                              handleAction("delete", project.id, project.name)
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
              ))}
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProjects.map((project) => (
              <div
                key={project.id}
                className="bg-neutral-0 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="h-32 bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden">
                  <span className="text-neutral-0 text-3xl font-bold">
                    {project.name.charAt(0)}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-neutral-900 text-lg mb-1 group-hover:text-primary-600 transition-colors">
                    {project.name}
                  </h4>
                  <p className="text-neutral-500 text-sm mb-3">
                    {project.category}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {project.client.initials}
                      </div>
                      <span className="text-neutral-700">
                        {project.client.name}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${getStatusBadgeColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-sm text-neutral-600 block mb-1">
                      {project.progress}% Complete
                    </span>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStatusColor(
                          project.status
                        )} rounded-full transition-all`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-neutral-900">
                        {formatCurrency(project.totalProjectValue)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {project.milestones.length} milestones
                      </div>
                    </div>
                    <div
                      className="relative"
                      ref={openDropdown === project.id ? dropdownRef : null}
                    >
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === project.id ? null : project.id
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

                      {openDropdown === project.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-neutral-0 rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                          <button
                            onClick={() =>
                              handleAction("view", project.id, project.name)
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
                              handleAction("update", project.id, project.name)
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
                                "milestones",
                                project.id,
                                project.name
                              )
                            }
                            className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                          >
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="text-primary-600 w-4"
                            />
                            Manage Milestones
                          </button>
                          <button
                            onClick={() =>
                              handleAction("delete", project.id, project.name)
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
