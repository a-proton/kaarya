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

interface Comment {
  id: string;
  author: string;
  authorInitials: string;
  isClient: boolean;
  text: string;
  timeAgo: string;
}

interface Milestone {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "in-progress" | "completed";
  postedBy: string;
  providerInitials: string;
  comments: Comment[];
  createdDate: string;
}

export default function ClientMilestonesPage() {
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
    null
  );
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Mock data for projects
  const projects = [
    { id: "1", name: "Kitchen Remodel", status: "active" },
    { id: "2", name: "Bathroom Renovation", status: "active" },
    { id: "3", name: "Living Room Redesign", status: "completed" },
  ];

  // Mock data for milestones
  const milestones: Milestone[] = [
    {
      id: "1",
      projectId: "1",
      projectName: "Kitchen Remodel",
      title: "Foundation Complete",
      description:
        "Complete all foundation work including pouring concrete and letting it cure for the required time period.",
      dueDate: "2025-01-20",
      status: "completed",
      postedBy: "Michael Rodriguez",
      providerInitials: "MR",
      createdDate: "January 10, 2025",
      comments: [
        {
          id: "c1",
          author: "John Smith",
          authorInitials: "JS",
          isClient: true,
          text: "Great work! The foundation looks solid.",
          timeAgo: "2 hours ago",
        },
        {
          id: "c2",
          author: "Michael Rodriguez",
          authorInitials: "MR",
          isClient: false,
          text: "Thank you! We're moving ahead of schedule.",
          timeAgo: "1 hour ago",
        },
      ],
    },
    {
      id: "2",
      projectId: "1",
      projectName: "Kitchen Remodel",
      title: "Electrical Wiring Installation",
      description:
        "Install all electrical wiring, outlets, and fixtures according to the approved electrical plan. Schedule inspection after completion.",
      dueDate: "2025-01-25",
      status: "in-progress",
      postedBy: "Michael Rodriguez",
      providerInitials: "MR",
      createdDate: "January 10, 2025",
      comments: [
        {
          id: "c3",
          author: "John Smith",
          authorInitials: "JS",
          isClient: true,
          text: "When do you expect to finish this milestone?",
          timeAgo: "3 hours ago",
        },
        {
          id: "c4",
          author: "Michael Rodriguez",
          authorInitials: "MR",
          isClient: false,
          text: "We should complete it by end of this week. Inspection is scheduled for Monday.",
          timeAgo: "2 hours ago",
        },
      ],
    },
    {
      id: "3",
      projectId: "1",
      projectName: "Kitchen Remodel",
      title: "Cabinet Installation",
      description:
        "Install custom cabinets, ensure proper leveling, and prepare for countertop measurements.",
      dueDate: "2025-02-01",
      status: "pending",
      postedBy: "Michael Rodriguez",
      providerInitials: "MR",
      createdDate: "January 10, 2025",
      comments: [],
    },
    {
      id: "4",
      projectId: "2",
      projectName: "Bathroom Renovation",
      title: "Demolition Phase",
      description:
        "Remove all existing fixtures, tiles, and flooring. Dispose of debris according to local regulations.",
      dueDate: "2025-01-18",
      status: "completed",
      postedBy: "Sarah Johnson",
      providerInitials: "SJ",
      createdDate: "January 12, 2025",
      comments: [
        {
          id: "c5",
          author: "John Smith",
          authorInitials: "JS",
          isClient: true,
          text: "The space looks much bigger now!",
          timeAgo: "1 day ago",
        },
      ],
    },
    {
      id: "5",
      projectId: "2",
      projectName: "Bathroom Renovation",
      title: "Plumbing Installation",
      description:
        "Install new plumbing system including water supply lines and drainage pipes according to approved plans.",
      dueDate: "2025-01-28",
      status: "in-progress",
      postedBy: "Sarah Johnson",
      providerInitials: "SJ",
      createdDate: "January 12, 2025",
      comments: [],
    },
    {
      id: "6",
      projectId: "2",
      projectName: "Bathroom Renovation",
      title: "Tile Installation",
      description:
        "Install bathroom tiles on walls and floors. Ensure proper waterproofing and grouting.",
      dueDate: "2025-02-05",
      status: "pending",
      postedBy: "Sarah Johnson",
      providerInitials: "SJ",
      createdDate: "January 12, 2025",
      comments: [],
    },
  ];

  // Filter milestones
  const filteredMilestones = milestones.filter((milestone) => {
    const matchesProject =
      selectedProject === "all" || milestone.projectId === selectedProject;
    const matchesStatus =
      selectedStatus === "all" || milestone.status === selectedStatus;
    const matchesSearch =
      searchQuery === "" ||
      milestone.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      milestone.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      milestone.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesStatus && matchesSearch;
  });

  // Group milestones by project
  const groupedMilestones = filteredMilestones.reduce((acc, milestone) => {
    if (!acc[milestone.projectId]) {
      acc[milestone.projectId] = [];
    }
    acc[milestone.projectId].push(milestone);
    return acc;
  }, {} as { [key: string]: Milestone[] });

  const handleAddComment = (milestoneId: string) => {
    const comment = commentText[milestoneId];
    if (!comment || comment.trim() === "") {
      alert("Please enter a comment");
      return;
    }
    console.log("Adding comment to milestone:", milestoneId, comment);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
    setCommentText({ ...commentText, [milestoneId]: "" });
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[status as keyof typeof colors];
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: faExclamationTriangle,
      "in-progress": faClock,
      completed: faCheck,
    };
    return icons[status as keyof typeof icons];
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: "Pending",
      "in-progress": "In Progress",
      completed: "Completed",
    };
    return texts[status as keyof typeof texts];
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "completed") return false;
    return new Date(dueDate) < new Date();
  };

  // Calculate project progress
  const getProjectProgress = (projectId: string) => {
    const projectMilestones = milestones.filter(
      (m) => m.projectId === projectId
    );
    const completed = projectMilestones.filter(
      (m) => m.status === "completed"
    ).length;
    return projectMilestones.length > 0
      ? Math.round((completed / projectMilestones.length) * 100)
      : 0;
  };

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
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
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
                <option value="in-progress">In Progress</option>
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
                  {projects.find((p) => p.id === selectedProject)?.name}
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
                const project = projects.find((p) => p.id === projectId);
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
                          {project?.name}
                        </h2>
                        <span className="text-sm font-semibold text-neutral-600">
                          {
                            projectMilestones.filter(
                              (m) => m.status === "completed"
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
                                    milestone.status
                                  )}`}
                                >
                                  <FontAwesomeIcon
                                    icon={getStatusIcon(milestone.status)}
                                  />
                                  {getStatusText(milestone.status)}
                                </span>
                                {isOverdue(
                                  milestone.dueDate,
                                  milestone.status
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
                                  {new Date(
                                    milestone.dueDate
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Comments Section */}
                          <div className="mt-4 pt-4 border-t border-neutral-200">
                            <button
                              onClick={() =>
                                setExpandedMilestone(
                                  expandedMilestone === milestone.id
                                    ? null
                                    : milestone.id
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
                                  expandedMilestone === milestone.id
                                    ? faChevronUp
                                    : faChevronDown
                                }
                                className="text-sm"
                              />
                            </button>

                            {expandedMilestone === milestone.id && (
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
                                    JS
                                  </div>
                                  <div className="flex-1">
                                    <textarea
                                      value={commentText[milestone.id] || ""}
                                      onChange={(e) =>
                                        setCommentText({
                                          ...commentText,
                                          [milestone.id]: e.target.value,
                                        })
                                      }
                                      placeholder="Add a comment or ask a question about this milestone..."
                                      rows={3}
                                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                                    />
                                    <div className="flex justify-end mt-2">
                                      <button
                                        onClick={() =>
                                          handleAddComment(milestone.id)
                                        }
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
                  </div>
                );
              }
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
