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
  faFolder,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

interface DailyUpdate {
  id: string;
  projectId: string;
  projectName: string;
  postedBy: string; // Provider who posted the update
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

export default function ClientProjectUpdatesPage() {
  const [selectedProject, setSelectedProject] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUpdate, setExpandedUpdate] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  // Mock data for projects
  const projects = [
    { id: "1", name: "Kitchen Remodel", status: "active" },
    { id: "2", name: "Bathroom Renovation", status: "active" },
    { id: "3", name: "Living Room Redesign", status: "completed" },
  ];

  // Mock data for daily updates
  const dailyUpdates: DailyUpdate[] = [
    {
      id: "1",
      projectId: "1",
      projectName: "Kitchen Remodel",
      postedBy: "Michael Rodriguez",
      providerName: "Michael Rodriguez",
      providerInitials: "MR",
      date: "January 15, 2025",
      timeAgo: "2 hours ago",
      title: "Electrical Wiring Installation Completed",
      description:
        "Today we completed the electrical wiring installation for the kitchen. All outlets, switches, and lighting fixtures have been properly wired and tested. The electrical inspector will come tomorrow for the final inspection. We also started preparing the walls for drywall installation.",
      status: "completed",
      images: [
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
      ],
      videos: [],
      documents: ["Electrical_Inspection_Report.pdf"],
      comments: [
        {
          id: "c1",
          author: "John Smith",
          authorInitials: "JS",
          isClient: true,
          text: "Great progress! When do you expect the inspection to be completed?",
          timeAgo: "1 hour ago",
        },
        {
          id: "c2",
          author: "Michael Rodriguez",
          authorInitials: "MR",
          isClient: false,
          text: "The inspector is scheduled for tomorrow at 10 AM. I'll update you once it's done.",
          timeAgo: "45 minutes ago",
        },
      ],
    },
    {
      id: "2",
      projectId: "2",
      projectName: "Bathroom Renovation",
      postedBy: "Sarah Johnson",
      providerName: "Sarah Johnson",
      providerInitials: "SJ",
      date: "January 15, 2025",
      timeAgo: "5 hours ago",
      title: "Plumbing Installation in Progress",
      description:
        "We've started installing the new plumbing system. The water supply lines and drainage pipes are being laid out according to the approved plans. We encountered a minor issue with the existing pipes that needed replacement, which will add approximately 1 day to the schedule.",
      status: "in-progress",
      images: [
        "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400&h=300&fit=crop",
      ],
      videos: [],
      documents: [],
      comments: [
        {
          id: "c3",
          author: "John Smith",
          authorInitials: "JS",
          isClient: true,
          text: "Thanks for the update. Is the 1-day delay going to affect the final completion date?",
          timeAgo: "3 hours ago",
        },
      ],
    },
    {
      id: "3",
      projectId: "1",
      projectName: "Kitchen Remodel",
      postedBy: "Michael Rodriguez",
      providerName: "Michael Rodriguez",
      providerInitials: "MR",
      date: "January 14, 2025",
      timeAgo: "1 day ago",
      title: "Cabinet Installation Started",
      description:
        "We began installing the custom cabinets today. The base cabinets are now in place and leveled. Tomorrow we'll continue with the upper cabinets and start the countertop measurements for the final template.",
      status: "completed",
      images: [
        "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400&h=300&fit=crop",
      ],
      videos: [],
      documents: ["Cabinet_Specifications.pdf"],
      comments: [],
    },
    {
      id: "4",
      projectId: "2",
      projectName: "Bathroom Renovation",
      postedBy: "Sarah Johnson",
      providerName: "Sarah Johnson",
      providerInitials: "SJ",
      date: "January 13, 2025",
      timeAgo: "2 days ago",
      title: "Demolition Phase Completed",
      description:
        "All demolition work has been completed. Old fixtures, tiles, and flooring have been removed. The space is now ready for the plumbing and electrical rough-in work. We've also disposed of all debris according to local regulations.",
      status: "completed",
      images: [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop",
      ],
      videos: [],
      documents: [],
      comments: [
        {
          id: "c4",
          author: "John Smith",
          authorInitials: "JS",
          isClient: true,
          text: "Looks good! The space looks much bigger now.",
          timeAgo: "2 days ago",
        },
      ],
    },
  ];

  // Filter updates based on selected project and search
  const filteredUpdates = dailyUpdates.filter((update) => {
    const matchesProject =
      selectedProject === "all" || update.projectId === selectedProject;
    const matchesSearch =
      searchQuery === "" ||
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const handleAddComment = (updateId: string) => {
    const comment = commentText[updateId];
    if (!comment || comment.trim() === "") {
      alert("Please enter a comment");
      return;
    }
    console.log("Adding comment to update:", updateId, comment);
    alert("Comment added successfully!");
    setCommentText({ ...commentText, [updateId]: "" });
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
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
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
                  {projects.find((p) => p.id === selectedProject)?.name}
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
                              update.status
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
                  <p className="text-neutral-700 leading-relaxed">
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
                              className="flex items-center gap-3 p-3 bg-neutral-0 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors"
                            >
                              <FontAwesomeIcon
                                icon={faVideo}
                                className="text-primary-600 text-xl"
                              />
                              <span className="font-medium text-neutral-900">
                                Video {index + 1}
                              </span>
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
                        expandedUpdate === update.id ? null : update.id
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
                          JS
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
