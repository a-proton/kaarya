"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faFilter,
  faSearch,
  faCalendar,
  faComment,
  faPaperPlane,
  faChevronDown,
  faChevronUp,
  faExclamationTriangle,
  faCheck,
  faClock,
  faFolder,
  faUser,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

// ========== INTERFACES ==========
interface Milestone {
  id: number;
  project?: number; // Make optional since backend might not include it
  title: string;
  description: string;
  target_date: string | null;
  completion_date: string | null;
  status: "pending" | "in_progress" | "completed";
  milestone_order: number | null;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: number;
  project_name: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "on_hold";
  status_display: string;
  service_provider: {
    id: number;
    full_name: string;
    business_name?: string;
    profile_image?: string;
    initials: string;
  };
  created_at: string;
}

interface MilestoneComment {
  id: string;
  author: string;
  authorInitials: string;
  isClient: boolean;
  text: string;
  timeAgo: string;
}

interface EnrichedMilestone extends Milestone {
  projectId: number; // Add explicit projectId from the enrichment
  projectName: string;
  postedBy: string;
  providerInitials: string;
  comments: MilestoneComment[];
}

// ========== HELPER FUNCTIONS ==========
const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60)
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const isOverdue = (dueDate: string | null, status: string): boolean => {
  if (!dueDate || status === "completed") return false;
  return new Date(dueDate) < new Date();
};

export default function ClientMilestonesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ========== STATE ==========
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
    null,
  );
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ========== API QUERIES ==========

  // Fetch only client's associated projects
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => {
      if (!isAuthenticated()) {
        router.push("/login?type=client&session=expired");
        throw new Error("Not authenticated");
      }
      // This endpoint returns only projects where the client is associated
      const data = await api.get<{ results: Project[] }>("/api/v1/projects/");
      return data.results || [];
    },
  });

  // Fetch milestones for client's projects only
  const {
    data: allMilestones,
    isLoading: milestonesLoading,
    error: milestonesError,
  } = useQuery({
    queryKey: ["client-milestones", projectsData],
    queryFn: async () => {
      if (!projectsData || projectsData.length === 0) {
        console.log("No projects found for client");
        return [];
      }

      console.log(
        "Fetching milestones for projects:",
        projectsData.map((p) => ({ id: p.id, name: p.project_name })),
      );

      // Fetch milestones only for projects the client is associated with
      const milestonesPromises = projectsData.map(async (project) => {
        try {
          console.log(`Fetching milestones for project ${project.id}...`);
          const data = await api.get<{ results: Milestone[] }>(
            `/api/v1/projects/${project.id}/milestones/`,
          );
          console.log(`Milestones for project ${project.id}:`, data);

          const enrichedMilestones = (data.results || []).map((milestone) => ({
            ...milestone,
            projectId: project.id, // Explicitly add projectId for filtering
            projectName: project.project_name,
            postedBy: project.service_provider.full_name,
            providerInitials: project.service_provider.initials,
            comments: [] as MilestoneComment[],
          }));

          console.log(
            `Enriched milestones for project ${project.id}:`,
            enrichedMilestones,
          );
          return enrichedMilestones;
        } catch (err) {
          console.error(
            `Error fetching milestones for project ${project.id}:`,
            err,
          );
          return [];
        }
      });

      const milestonesArrays = await Promise.all(milestonesPromises);
      const flatMilestones = milestonesArrays.flat();
      console.log("All milestones (flat):", flatMilestones);
      return flatMilestones;
    },
    enabled: !!projectsData && projectsData.length > 0,
  });

  // ========== MUTATIONS ==========

  // Add comment mutation (placeholder - backend doesn't support this yet)
  const addCommentMutation = useMutation({
    mutationFn: async ({
      milestoneId,
      comment,
    }: {
      milestoneId: string;
      comment: string;
    }) => {
      // TODO: Implement when backend supports milestone comments
      // await api.post(`/api/v1/milestones/${milestoneId}/comments/`, { text: comment });
      throw new Error("Comment functionality coming soon!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-milestones"] });
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    },
    onError: (error: any) => {
      alert(error.message || "Failed to add comment. Please try again.");
    },
  });

  // ========== EVENT HANDLERS ==========

  const handleAddComment = async (milestoneId: string) => {
    const comment = commentText[milestoneId];
    if (!comment || comment.trim() === "") {
      alert("Please enter a comment");
      return;
    }

    try {
      await addCommentMutation.mutateAsync({ milestoneId, comment });
      setCommentText({ ...commentText, [milestoneId]: "" });
    } catch (err) {
      // Error already handled in mutation
    }
  };

  // ========== FILTERING ==========

  const filteredMilestones = (allMilestones || []).filter((milestone) => {
    // Use projectId that we added during enrichment
    const matchesProject =
      selectedProject === "all" ||
      milestone.projectId.toString() === selectedProject;
    const matchesStatus =
      selectedStatus === "all" || milestone.status === selectedStatus;
    const matchesSearch =
      searchQuery === "" ||
      milestone.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      milestone.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      milestone.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesStatus && matchesSearch;
  });

  console.log("Filtered milestones:", filteredMilestones);
  console.log("Selected project:", selectedProject);
  console.log("Selected status:", selectedStatus);
  console.log("Search query:", searchQuery);

  // Group milestones by project
  const groupedMilestones = filteredMilestones.reduce(
    (acc, milestone) => {
      // Use projectId that we added during enrichment
      const projectId = milestone.projectId.toString();

      if (!acc[projectId]) {
        acc[projectId] = [];
      }
      acc[projectId].push(milestone);
      return acc;
    },
    {} as { [key: string]: EnrichedMilestone[] },
  );

  // ========== HELPER FUNCTIONS ==========

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[status as keyof typeof colors];
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: faExclamationTriangle,
      in_progress: faClock,
      completed: faCheck,
    };
    return icons[status as keyof typeof icons];
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
    };
    return texts[status as keyof typeof texts];
  };

  const getProjectProgress = (projectId: string) => {
    const projectMilestones = (allMilestones || []).filter(
      (m) => m.projectId.toString() === projectId,
    );
    const completed = projectMilestones.filter(
      (m) => m.status === "completed",
    ).length;
    return projectMilestones.length > 0
      ? Math.round((completed / projectMilestones.length) * 100)
      : 0;
  };

  // ========== LOADING & ERROR STATES ==========

  const isLoading = projectsLoading || milestonesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading milestones...</p>
        </div>
      </div>
    );
  }

  if (projectsError || milestonesError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">
            Error Loading Milestones
          </h3>
          <p className="text-red-600">
            {(projectsError as any)?.message ||
              (milestonesError as any)?.message ||
              "Unknown error"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ========== RENDER ==========

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed top-8 right-8 z-50 animate-slide-in-right">
          <div className="bg-green-600 text-neutral-0 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faCheck} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Comment posted successfully!</p>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-neutral-900 mb-1">
              Project Milestones
            </h1>
            <p className="text-neutral-600 body-regular">
              Track progress and milestones for your projects
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Filters and Search */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Project Filter */}
            <div>
              <label className="block text-neutral-700 font-semibold mb-2 body-small">
                <FontAwesomeIcon
                  icon={faFolder}
                  className="mr-2 text-primary-600"
                />
                Filter by Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
              >
                <option value="all">
                  All Projects ({projectsData?.length || 0})
                </option>
                {projectsData?.map((project) => (
                  <option key={project.id} value={project.id.toString()}>
                    {project.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-neutral-700 font-semibold mb-2 body-small">
                <FontAwesomeIcon
                  icon={faFilter}
                  className="mr-2 text-primary-600"
                />
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-neutral-700 font-semibold mb-2 body-small">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="mr-2 text-primary-600"
                />
                Search Milestones
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedProject !== "all" ||
            selectedStatus !== "all" ||
            searchQuery) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200 flex-wrap">
              <span className="text-neutral-600 text-sm font-medium">
                Active Filters:
              </span>
              {selectedProject !== "all" && (
                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium border border-primary-200">
                  {
                    projectsData?.find(
                      (p) => p.id.toString() === selectedProject,
                    )?.project_name
                  }
                </span>
              )}
              {selectedStatus !== "all" && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                  {getStatusText(selectedStatus)}
                </span>
              )}
              {searchQuery && (
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                  Search: "{searchQuery}"
                </span>
              )}
            </div>
          )}
        </div>

        {/* Milestones List */}
        {filteredMilestones.length === 0 ? (
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="text-6xl text-neutral-300 mb-4"
            />
            <h3 className="heading-4 text-neutral-900 mb-2">
              No Milestones Found
            </h3>
            <p className="text-neutral-600">
              {searchQuery ||
              selectedProject !== "all" ||
              selectedStatus !== "all"
                ? "Try adjusting your filters or search query"
                : "Your service providers haven't created any milestones yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMilestones).map(
              ([projectId, projectMilestones]) => {
                const project = projectsData?.find(
                  (p) => p.id.toString() === projectId,
                );
                const progress = getProjectProgress(projectId);

                return (
                  <div
                    key={projectId}
                    className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden"
                  >
                    {/* Project Header */}
                    <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 border-b border-neutral-200">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="heading-4 text-neutral-900">
                          {project?.project_name}
                        </h2>
                        <span className="text-sm font-semibold text-neutral-600">
                          {
                            projectMilestones.filter(
                              (m) => m.status === "completed",
                            ).length
                          }{" "}
                          / {projectMilestones.length} Completed
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="divide-y divide-neutral-200">
                      {projectMilestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="p-6 hover:bg-neutral-50 transition-colors"
                        >
                          {/* Milestone Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="heading-4 text-neutral-900">
                                  {milestone.title}
                                </h3>
                                <span
                                  className={`text-xs font-semibold px-2 py-1 border rounded flex items-center gap-1 ${getStatusBadgeColor(
                                    milestone.status,
                                  )}`}
                                >
                                  <FontAwesomeIcon
                                    icon={getStatusIcon(milestone.status)}
                                  />
                                  {getStatusText(milestone.status)}
                                </span>
                                {isOverdue(
                                  milestone.target_date,
                                  milestone.status,
                                ) && (
                                  <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 border border-red-200 rounded">
                                    Overdue
                                  </span>
                                )}
                              </div>
                              <p className="text-neutral-700 mb-3">
                                {milestone.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-neutral-600">
                                <span className="flex items-center gap-1">
                                  <FontAwesomeIcon
                                    icon={faUser}
                                    className="text-xs"
                                  />
                                  <span className="font-medium">
                                    Created by:
                                  </span>{" "}
                                  {milestone.postedBy}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FontAwesomeIcon
                                    icon={faCalendar}
                                    className="text-xs"
                                  />
                                  <span className="font-medium">Due:</span>{" "}
                                  {formatDate(milestone.target_date)}
                                </span>
                                {milestone.completion_date && (
                                  <span className="flex items-center gap-1">
                                    <FontAwesomeIcon
                                      icon={faCheck}
                                      className="text-xs"
                                    />
                                    <span className="font-medium">
                                      Completed:
                                    </span>{" "}
                                    {formatDate(milestone.completion_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Comments Section */}
                          <div className="mt-4 pt-4 border-t border-neutral-200">
                            <button
                              onClick={() =>
                                setExpandedMilestone(
                                  expandedMilestone === milestone.id.toString()
                                    ? null
                                    : milestone.id.toString(),
                                )
                              }
                              className="flex items-center gap-2 text-neutral-700 hover:text-primary-600 font-semibold mb-4 transition-colors"
                            >
                              <FontAwesomeIcon icon={faComment} />
                              <span>
                                Comments ({milestone.comments.length})
                              </span>
                              <FontAwesomeIcon
                                icon={
                                  expandedMilestone === milestone.id.toString()
                                    ? faChevronUp
                                    : faChevronDown
                                }
                                className="text-sm"
                              />
                            </button>

                            {expandedMilestone === milestone.id.toString() && (
                              <div className="space-y-4">
                                {/* Existing Comments */}
                                {milestone.comments.length > 0 ? (
                                  milestone.comments.map((comment) => (
                                    <div
                                      key={comment.id}
                                      className={`flex gap-3 p-4 rounded-lg ${
                                        comment.isClient
                                          ? "bg-primary-50"
                                          : "bg-neutral-100"
                                      }`}
                                    >
                                      <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-neutral-0 font-semibold flex-shrink-0 ${
                                          comment.isClient
                                            ? "bg-blue-600"
                                            : "bg-primary-600"
                                        }`}
                                      >
                                        {comment.authorInitials}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-semibold text-neutral-900">
                                            {comment.author}
                                          </span>
                                          {comment.isClient && (
                                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                              You
                                            </span>
                                          )}
                                          <span className="text-xs text-neutral-500">
                                            {comment.timeAgo}
                                          </span>
                                        </div>
                                        <p className="text-neutral-700">
                                          {comment.text}
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-neutral-500 text-sm text-center py-4">
                                    No comments yet. Be the first to comment!
                                  </p>
                                )}

                                {/* Add Comment */}
                                <div className="flex gap-3 pt-4 border-t border-neutral-200">
                                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-neutral-0 font-semibold flex-shrink-0">
                                    CL
                                  </div>
                                  <div className="flex-1">
                                    <textarea
                                      value={
                                        commentText[milestone.id.toString()] ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        setCommentText({
                                          ...commentText,
                                          [milestone.id.toString()]:
                                            e.target.value,
                                        })
                                      }
                                      placeholder="Add a comment or ask a question about this milestone..."
                                      rows={3}
                                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                                    />
                                    <div className="flex justify-end mt-2">
                                      <button
                                        onClick={() =>
                                          handleAddComment(
                                            milestone.id.toString(),
                                          )
                                        }
                                        disabled={addCommentMutation.isPending}
                                        className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
                                      >
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                        {addCommentMutation.isPending
                                          ? "Posting..."
                                          : "Post Comment"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
