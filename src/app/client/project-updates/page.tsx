"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faNewspaper,
  faFilter,
  faSearch,
  faImage,
  faVideo,
  faFileAlt,
  faComment,
  faPaperPlane,
  faClock,
  faCheckCircle,
  faExclamationCircle,
  faChevronDown,
  faChevronUp,
  faCalendar,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

// ========== INTERFACES ==========
interface UpdateMedia {
  id: number;
  media_type: "image" | "video";
  media_url: string;
  thumbnail_url: string;
  caption?: string;
  file_size: number;
  created_at: string;
}

interface ProjectUpdate {
  id: number;
  update_text: string;
  work_hours?: number;
  posted_by_name: string;
  milestone?: number;
  milestone_title?: string;
  media: UpdateMedia[];
  created_at: string;
}

interface Project {
  id: number;
  project_name: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "on_hold";
  status_display: string;
  service_provider: {
    id: number;
    full_name: string;
    business_name?: string;
    profile_image?: string;
  };
  created_at: string;
}

interface DailyUpdate {
  id: string;
  projectId: string;
  projectName: string;
  postedBy: string;
  providerName: string;
  providerInitials: string;
  date: string;
  timeAgo: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "blocked";
  images: string[];
  videos: string[];
  documents: string[];
  comments: Comment[];
}

interface Comment {
  id: string;
  author: string;
  authorInitials: string;
  isClient: boolean;
  text: string;
  timeAgo: string;
}

// ========== HELPER FUNCTIONS ==========
const getInitials = (name: string): string => {
  if (!name) return "?";
  const words = name.split(" ");
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return words[0][0].toUpperCase();
};

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

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Transform backend data to frontend format
const transformUpdateToFrontend = (
  update: ProjectUpdate,
  project: Project,
): DailyUpdate => {
  const providerInitials = project.service_provider.profile_image
    ? ""
    : getInitials(project.service_provider.full_name);

  return {
    id: update.id.toString(),
    projectId: project.id.toString(),
    projectName: project.project_name,
    postedBy: update.posted_by_name,
    providerName: update.posted_by_name,
    providerInitials: providerInitials,
    date: formatDate(update.created_at),
    timeAgo: getTimeAgo(update.created_at),
    title: update.milestone_title || "Daily Progress Update",
    description: update.update_text,
    status:
      project.status === "completed"
        ? "completed"
        : project.status === "in_progress"
          ? "in-progress"
          : "blocked",
    images: update.media
      .filter((m) => m.media_type === "image")
      .map((m) => m.media_url),
    videos: update.media
      .filter((m) => m.media_type === "video")
      .map((m) => m.media_url),
    documents: [],
    comments: [],
  };
};

export default function ClientProjectUpdatesPage() {
  const router = useRouter();

  // ========== STATE ==========
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUpdates, setAllUpdates] = useState<DailyUpdate[]>([]);
  const [selectedProject, setSelectedProject] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUpdate, setExpandedUpdate] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========== API CALLS ==========

  // Fetch all client projects
  const fetchProjects = async () => {
    try {
      const data = await api.get<{ results: Project[] }>("/api/v1/projects/");
      return data.results || [];
    } catch (err) {
      console.error("Error fetching projects:", err);
      throw err;
    }
  };

  // Fetch updates for a specific project
  const fetchProjectUpdates = async (
    projectId: number,
  ): Promise<ProjectUpdate[]> => {
    try {
      const data = await api.get<{ results: ProjectUpdate[] }>(
        `/api/v1/projects/${projectId}/updates/`,
      );
      return data.results || [];
    } catch (err) {
      console.error(`Error fetching updates for project ${projectId}:`, err);
      return [];
    }
  };

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      // Check authentication first
      if (!isAuthenticated()) {
        console.log("❌ User not authenticated, redirecting to login...");
        router.push("/login?type=client&session=expired");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all projects
        const projectsData = await fetchProjects();
        setProjects(projectsData);

        // Fetch updates for each project
        const allUpdatesPromises = projectsData.map(
          async (project: Project) => {
            const updates = await fetchProjectUpdates(project.id);
            return updates.map((update) =>
              transformUpdateToFrontend(update, project),
            );
          },
        );

        const updatesArrays = await Promise.all(allUpdatesPromises);
        const flattenedUpdates = updatesArrays.flat();

        // Sort by date (newest first)
        flattenedUpdates.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        setAllUpdates(flattenedUpdates);
      } catch (err: any) {
        // The api utility will handle 401 errors and redirect automatically
        // But we can still set error state for other types of errors
        if (err.status !== 401) {
          setError(err.message || "Failed to load updates");
        }
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // ========== FILTERING ==========
  const filteredUpdates = allUpdates.filter((update) => {
    const matchesProject =
      selectedProject === "all" || update.projectId === selectedProject;
    const matchesSearch =
      searchQuery === "" ||
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesSearch;
  });

  // ========== EVENT HANDLERS ==========
  const handleAddComment = async (updateId: string) => {
    const comment = commentText[updateId];
    if (!comment || comment.trim() === "") {
      alert("Please enter a comment");
      return;
    }

    try {
      // TODO: Implement API call to add comment when backend supports it
      // await api.post(`/api/v1/updates/${updateId}/comments/`, { text: comment });
      console.log("Adding comment to update:", updateId, comment);
      alert("Comment functionality coming soon!");
      setCommentText({ ...commentText, [updateId]: "" });
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "in-progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "blocked":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return faCheckCircle;
      case "in-progress":
        return faClock;
      case "blocked":
        return faExclamationCircle;
      default:
        return faClock;
    }
  };

  // ========== LOADING & ERROR STATES ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your project updates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">
            Error Loading Updates
          </h3>
          <p className="text-red-600">{error}</p>
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
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-neutral-900 mb-1">Daily Updates</h1>
            <p className="text-neutral-600 body-regular">
              View daily progress updates posted by your service providers
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Filters and Search */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Project Filter */}
            <div className="flex-1">
              <label className="block text-neutral-700 font-semibold mb-2 body-small">
                <FontAwesomeIcon
                  icon={faFilter}
                  className="mr-2 text-primary-600"
                />
                Filter by Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
              >
                <option value="all">All Projects ({projects.length})</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id.toString()}>
                    {project.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-neutral-700 font-semibold mb-2 body-small">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="mr-2 text-primary-600"
                />
                Search Updates
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, or project..."
                className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedProject !== "all" || searchQuery) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200">
              <span className="text-neutral-600 text-sm font-medium">
                Active Filters:
              </span>
              {selectedProject !== "all" && (
                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium border border-primary-200">
                  {
                    projects.find((p) => p.id.toString() === selectedProject)
                      ?.project_name
                  }
                </span>
              )}
              {searchQuery && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                  Search: "{searchQuery}"
                </span>
              )}
            </div>
          )}
        </div>

        {/* Updates List */}
        {filteredUpdates.length === 0 ? (
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
            <FontAwesomeIcon
              icon={faNewspaper}
              className="text-6xl text-neutral-300 mb-4"
            />
            <h3 className="heading-4 text-neutral-900 mb-2">
              No Daily Updates Found
            </h3>
            <p className="text-neutral-600">
              {searchQuery || selectedProject !== "all"
                ? "Try adjusting your filters or search query"
                : "Your service providers haven't posted any daily updates yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredUpdates.map((update) => (
              <div
                key={update.id}
                className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Update Header */}
                <div className="p-6 border-b border-neutral-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-neutral-0 font-semibold flex-shrink-0">
                        {update.providerInitials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded">
                            {update.projectName}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-1 border rounded flex items-center gap-1 ${getStatusColor(
                              update.status,
                            )}`}
                          >
                            <FontAwesomeIcon
                              icon={getStatusIcon(update.status)}
                            />
                            {update.status.replace("-", " ").toUpperCase()}
                          </span>
                        </div>
                        <h2 className="heading-4 text-neutral-900 mb-1">
                          {update.title}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faUser}
                              className="text-xs"
                            />
                            <span className="font-medium">Posted by:</span>{" "}
                            {update.postedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faCalendar}
                              className="text-xs"
                            />
                            {update.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faClock}
                              className="text-xs"
                            />
                            {update.timeAgo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {update.description}
                  </p>
                </div>

                {/* Media Section */}
                {(update.images.length > 0 ||
                  update.videos.length > 0 ||
                  update.documents.length > 0) && (
                  <div className="p-6 bg-neutral-50 border-b border-neutral-200">
                    {/* Images */}
                    {update.images.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faImage}
                            className="text-primary-600"
                          />
                          Photos ({update.images.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {update.images.map((image, index) => (
                            <div
                              key={index}
                              className="aspect-video bg-neutral-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            >
                              <img
                                src={image}
                                alt={`Update image ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/400x300?text=Image+Not+Found";
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos */}
                    {update.videos.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faVideo}
                            className="text-primary-600"
                          />
                          Videos ({update.videos.length})
                        </h3>
                        <div className="space-y-2">
                          {update.videos.map((video, index) => (
                            <div
                              key={index}
                              className="aspect-video bg-neutral-900 rounded-lg overflow-hidden"
                            >
                              <video
                                src={video}
                                controls
                                className="w-full h-full"
                              >
                                Your browser does not support video playback.
                              </video>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {update.documents.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faFileAlt}
                            className="text-primary-600"
                          />
                          Documents ({update.documents.length})
                        </h3>
                        <div className="space-y-2">
                          {update.documents.map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-neutral-0 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors"
                            >
                              <FontAwesomeIcon
                                icon={faFileAlt}
                                className="text-primary-600 text-xl"
                              />
                              <span className="font-medium text-neutral-900">
                                {doc}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments Section */}
                <div className="p-6">
                  <button
                    onClick={() =>
                      setExpandedUpdate(
                        expandedUpdate === update.id ? null : update.id,
                      )
                    }
                    className="flex items-center gap-2 text-neutral-700 hover:text-primary-600 font-semibold mb-4 transition-colors"
                  >
                    <FontAwesomeIcon icon={faComment} />
                    <span>Comments ({update.comments.length})</span>
                    <FontAwesomeIcon
                      icon={
                        expandedUpdate === update.id
                          ? faChevronUp
                          : faChevronDown
                      }
                      className="text-sm"
                    />
                  </button>

                  {expandedUpdate === update.id && (
                    <div className="space-y-4">
                      {/* Existing Comments */}
                      {update.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`flex gap-3 p-4 rounded-lg ${
                            comment.isClient ? "bg-primary-50" : "bg-neutral-50"
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
                            <p className="text-neutral-700">{comment.text}</p>
                          </div>
                        </div>
                      ))}

                      {/* Add Comment */}
                      <div className="flex gap-3 pt-4 border-t border-neutral-200">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-neutral-0 font-semibold flex-shrink-0">
                          CL
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={commentText[update.id] || ""}
                            onChange={(e) =>
                              setCommentText({
                                ...commentText,
                                [update.id]: e.target.value,
                              })
                            }
                            placeholder="Add a comment or ask a question..."
                            rows={3}
                            className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleAddComment(update.id)}
                              className="btn-primary text-sm flex items-center gap-2"
                            >
                              <FontAwesomeIcon icon={faPaperPlane} />
                              Post Comment
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
        )}
      </div>
    </div>
  );
}
