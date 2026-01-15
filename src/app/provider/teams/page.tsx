"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faEllipsisVertical,
  faChevronDown,
  faEnvelope,
  faPhone,
  faChevronLeft,
  faChevronRight,
  faUserGroup,
  faEye,
  faPenToSquare,
  faTrash,
  faSpinner,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface TeamMember {
  id: number;
  full_name: string;
  initials: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employee_id: string;
  status: "active" | "inactive" | "on_leave";
  projects_count: number;
  join_date: string;
  photo: string | null;
  is_active: boolean;
  skills: string[];
}

interface TeamMembersResponse {
  count?: number;
  results?: TeamMember[];
}

type TabFilter = "all" | "active" | "inactive" | "onleave";

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [sortBy, setSortBy] = useState("Name");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch team members from API
  const {
    data: teamData,
    isLoading,
    isError,
    error,
  } = useQuery<TeamMember[]>({
    queryKey: [
      "team-members",
      activeTab,
      searchQuery,
      roleFilter,
      departmentFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Add filters
      if (searchQuery) params.append("search", searchQuery);
      if (roleFilter !== "All Roles") params.append("role", roleFilter);
      if (departmentFilter !== "All Departments")
        params.append("department", departmentFilter);

      // Status filtering
      if (activeTab === "active") params.append("status", "active");
      else if (activeTab === "inactive") params.append("status", "inactive");
      else if (activeTab === "onleave") params.append("status", "on_leave");

      const response = await api.get<TeamMember[] | TeamMembersResponse>(
        `/api/v1/employees/?${params.toString()}`
      );

      // Handle both array and paginated response
      return Array.isArray(response) ? response : response.results || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      await api.delete(`/api/v1/employees/${employeeId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      showSuccessNotification("Team member deleted successfully");
    },
    onError: (error: any) => {
      alert(`Failed to delete team member: ${error.message}`);
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
    memberId: number,
    memberName: string
  ) => {
    setOpenDropdown(null);
    if (action === "view") {
      window.location.href = `/provider/teams/${memberId}`;
    } else if (action === "update") {
      window.location.href = `/provider/teams/${memberId}/edit`;
    } else if (
      action === "delete" &&
      confirm(`Are you sure you want to delete "${memberName}"?`)
    ) {
      deleteMutation.mutate(memberId);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-700 border-green-200",
      inactive: "bg-neutral-100 text-neutral-600 border-neutral-200",
      on_leave: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const getSkillColor = (skill: string) => {
    const colors: { [key: string]: string } = {
      Electrical: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Plumbing: "bg-blue-100 text-blue-700 border-blue-200",
      HVAC: "bg-orange-100 text-orange-700 border-orange-200",
      Carpentry: "bg-amber-100 text-amber-700 border-amber-200",
      "Project Management": "bg-primary-50 text-primary-700 border-primary-200",
      Supervision: "bg-purple-100 text-purple-700 border-purple-200",
      Design: "bg-pink-100 text-pink-700 border-pink-200",
      Landscaping: "bg-green-100 text-green-700 border-green-200",
    };
    return (
      colors[skill] || "bg-neutral-100 text-neutral-600 border-neutral-200"
    );
  };

  const formatStatusDisplay = (status: string) => {
    const displays: { [key: string]: string } = {
      active: "Active",
      inactive: "Inactive",
      on_leave: "On Leave",
    };
    return displays[status] || status;
  };

  // Process data
  const teamMembers = teamData || [];

  const activeCount = teamMembers.filter((m) => m.status === "active").length;
  const inactiveCount = teamMembers.filter(
    (m) => m.status === "inactive"
  ).length;
  const onLeaveCount = teamMembers.filter(
    (m) => m.status === "on_leave"
  ).length;

  // Pagination
  const itemsPerPage = 6;
  const totalPages = Math.ceil(teamMembers.length / itemsPerPage);
  const paginatedMembers = teamMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique roles and departments for filters
  const uniqueRoles = Array.from(
    new Set(teamMembers.map((m) => m.role).filter(Boolean))
  );
  const uniqueDepartments = Array.from(
    new Set(teamMembers.map((m) => m.department).filter(Boolean))
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading team members...</p>
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
            Error Loading Team Members
          </h3>
          <p className="text-red-700 mb-4">
            {error instanceof Error
              ? error.message
              : "Failed to load team members"}
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
    <div className="flex-1 bg-neutral-50">
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="heading-2 text-neutral-900">Team Members</h2>
            <p className="text-neutral-600 body-regular mt-1">
              Manage your team and their assignments
            </p>
          </div>
          <Link
            href="/provider/teams/create"
            className="btn-primary flex items-center gap-2 shadow-lg"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Team Member
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8">
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={`py-4 border-b-2 font-medium transition-colors ${
              activeTab === "all"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            All Members
          </button>
          <button
            onClick={() => {
              setActiveTab("active");
              setCurrentPage(1);
            }}
            className={`py-4 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === "active"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Active
            <span className="px-2 py-0.5 bg-green-600 text-neutral-0 rounded-full text-xs font-semibold">
              {activeCount}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("onleave");
              setCurrentPage(1);
            }}
            className={`py-4 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === "onleave"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            On Leave
            <span className="px-2 py-0.5 bg-yellow-600 text-neutral-0 rounded-full text-xs font-semibold">
              {onLeaveCount}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("inactive");
              setCurrentPage(1);
            }}
            className={`py-4 border-b-2 font-medium transition-colors ${
              activeTab === "inactive"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Filters */}
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
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-neutral-0 border border-neutral-200 rounded-lg w-64 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small"
              />
            </div>

            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer"
              >
                <option>All Roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
              />
            </div>

            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer"
              >
                <option>All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer"
              >
                <option>Sort by: Name</option>
                <option>Sort by: Role</option>
                <option>Sort by: Projects</option>
                <option>Sort by: Join Date</option>
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
              />
            </div>

            <button
              className="p-2 bg-neutral-0 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              aria-label="More options"
            >
              <FontAwesomeIcon
                icon={faEllipsisVertical}
                className="text-neutral-600"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="p-8">
        {paginatedMembers.length === 0 ? (
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon
                icon={faUserGroup}
                className="text-neutral-400 text-2xl"
              />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No Team Members Found
            </h3>
            <p className="text-neutral-600 mb-6">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Get started by adding your first team member"}
            </p>
            {!searchQuery && (
              <Link href="/provider/teams/create" className="btn-primary">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Team Member
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold text-sm">
              <div className="col-span-3">TEAM MEMBER</div>
              <div className="col-span-2">ROLE</div>
              <div className="col-span-3">CONTACT</div>
              <div className="col-span-1">STATUS</div>
              <div className="col-span-1">PROJECTS</div>
              <div className="col-span-1">JOIN DATE</div>
              <div className="col-span-1 text-center">ACTIONS</div>
            </div>

            <div className="divide-y divide-neutral-100">
              {paginatedMembers.map((member) => (
                <div
                  key={member.id}
                  className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-neutral-50 transition-colors group"
                >
                  <div className="col-span-3 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center font-semibold text-base flex-shrink-0">
                      {member.initials}
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                        {member.full_name}
                      </h4>
                      <p className="text-neutral-500 text-sm">
                        {member.department || "No Department"}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <span className="text-neutral-700">
                      {member.role || "N/A"}
                    </span>
                  </div>

                  <div className="col-span-3 flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-2 text-neutral-600 text-sm">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-neutral-400 text-xs"
                      />
                      <span>{member.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600 text-sm">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="text-neutral-400 text-xs"
                      />
                      <span>{member.phone || "N/A"}</span>
                    </div>
                  </div>

                  <div className="col-span-1 flex items-center">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getStatusBadgeColor(
                        member.status
                      )}`}
                    >
                      {formatStatusDisplay(member.status)}
                    </span>
                  </div>

                  <div className="col-span-1 flex items-center">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faUserGroup}
                        className="text-neutral-400 text-sm"
                      />
                      <span className="font-semibold text-neutral-900">
                        {member.projects_count}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-1 flex items-center text-neutral-700">
                    <span>
                      {member.join_date
                        ? new Date(member.join_date).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "N/A"}
                    </span>
                  </div>

                  <div className="col-span-1 flex items-center justify-center">
                    <div
                      className="relative"
                      ref={
                        openDropdown === member.id.toString()
                          ? dropdownRef
                          : null
                      }
                    >
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === member.id.toString()
                              ? null
                              : member.id.toString()
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

                      {openDropdown === member.id.toString() && (
                        <div className="absolute right-0 mt-2 w-48 bg-neutral-0 rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                          <button
                            onClick={() =>
                              handleAction("view", member.id, member.full_name)
                            }
                            className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                          >
                            <FontAwesomeIcon
                              icon={faEye}
                              className="text-blue-600 w-4"
                            />
                            View
                          </button>
                          <button
                            onClick={() =>
                              handleAction(
                                "update",
                                member.id,
                                member.full_name
                              )
                            }
                            className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                          >
                            <FontAwesomeIcon
                              icon={faPenToSquare}
                              className="text-green-600 w-4"
                            />
                            Update
                          </button>
                          <button
                            onClick={() =>
                              handleAction(
                                "delete",
                                member.id,
                                member.full_name
                              )
                            }
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-4" />
                            Delete
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
                Showing {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, teamMembers.length)} of{" "}
                {teamMembers.length} team members
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
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === i + 1
                        ? "bg-primary-600 text-neutral-0"
                        : "bg-neutral-0 text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
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
