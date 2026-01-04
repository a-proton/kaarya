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
  faPlus,
  faPenToSquare,
  faEye,
  faTrash,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

interface Comment {
  id: string;
  author: string;
  authorInitials: string;
  isProvider: boolean;
  text: string;
  timeAgo: string;
}

interface Milestone {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  title: string;
  description: string;
  dueDate: string;
  amount: number;
  status: "pending" | "in-progress" | "completed";
  comments: Comment[];
  createdDate: string;
}

interface MilestoneFormData {
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  amount: string;
  status: "pending" | "in-progress" | "completed";
}

export default function ProviderMilestonesPage() {
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
    null
  );
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [viewingMilestone, setViewingMilestone] = useState<Milestone | null>(
    null
  );
  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormData>({
    projectId: "",
    title: "",
    description: "",
    dueDate: "",
    amount: "",
    status: "pending",
  });

  // Mock data for projects
  const projects = [
    {
      id: "1",
      name: "Kitchen Remodel",
      clientName: "John Smith",
      startDate: "2025-01-01",
      endDate: "2025-03-01",
    },
    {
      id: "2",
      name: "Bathroom Renovation",
      clientName: "Sarah Johnson",
      startDate: "2025-01-10",
      endDate: "2025-02-28",
    },
    {
      id: "3",
      name: "Living Room Redesign",
      clientName: "Mike Anderson",
      startDate: "2025-01-15",
      endDate: "2025-02-15",
    },
  ];

  // Mock data for milestones
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: "1",
      projectId: "1",
      projectName: "Kitchen Remodel",
      clientName: "John Smith",
      title: "Foundation Complete",
      description:
        "Complete all foundation work including pouring concrete and letting it cure for the required time period.",
      dueDate: "2025-01-20",
      amount: 15000,
      status: "completed",
      createdDate: "January 10, 2025",
      comments: [
        {
          id: "c1",
          author: "John Smith",
          authorInitials: "JS",
          isProvider: false,
          text: "Great work! The foundation looks solid.",
          timeAgo: "2 hours ago",
        },
        {
          id: "c2",
          author: "Michael Rodriguez",
          authorInitials: "MR",
          isProvider: true,
          text: "Thank you! We're moving ahead of schedule.",
          timeAgo: "1 hour ago",
        },
      ],
    },
    {
      id: "2",
      projectId: "1",
      projectName: "Kitchen Remodel",
      clientName: "John Smith",
      title: "Electrical Wiring Installation",
      description:
        "Install all electrical wiring, outlets, and fixtures according to the approved electrical plan. Schedule inspection after completion.",
      dueDate: "2025-01-25",
      amount: 12000,
      status: "in-progress",
      createdDate: "January 10, 2025",
      comments: [
        {
          id: "c3",
          author: "John Smith",
          authorInitials: "JS",
          isProvider: false,
          text: "When do you expect to finish this milestone?",
          timeAgo: "3 hours ago",
        },
      ],
    },
    {
      id: "3",
      projectId: "1",
      projectName: "Kitchen Remodel",
      clientName: "John Smith",
      title: "Cabinet Installation",
      description:
        "Install custom cabinets, ensure proper leveling, and prepare for countertop measurements.",
      dueDate: "2025-02-01",
      amount: 10000,
      status: "pending",
      createdDate: "January 10, 2025",
      comments: [],
    },
    {
      id: "4",
      projectId: "2",
      projectName: "Bathroom Renovation",
      clientName: "Sarah Johnson",
      title: "Demolition Phase",
      description:
        "Remove all existing fixtures, tiles, and flooring. Dispose of debris according to local regulations.",
      dueDate: "2025-01-18",
      amount: 8000,
      status: "completed",
      createdDate: "January 12, 2025",
      comments: [
        {
          id: "c5",
          author: "Sarah Johnson",
          authorInitials: "SJ",
          isProvider: false,
          text: "The space looks much bigger now!",
          timeAgo: "1 day ago",
        },
      ],
    },
  ]);

  const openMilestoneModal = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setMilestoneForm({
        projectId: milestone.projectId,
        title: milestone.title,
        description: milestone.description,
        dueDate: milestone.dueDate,
        amount: milestone.amount.toString(),
        status: milestone.status,
      });
    } else {
      setEditingMilestone(null);
      setMilestoneForm({
        projectId: "",
        title: "",
        description: "",
        dueDate: "",
        amount: "",
        status: "pending",
      });
    }
    setShowMilestoneModal(true);
  };

  const closeMilestoneModal = () => {
    setShowMilestoneModal(false);
    setEditingMilestone(null);
    setMilestoneForm({
      projectId: "",
      title: "",
      description: "",
      dueDate: "",
      amount: "",
      status: "pending",
    });
  };

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const saveMilestone = () => {
    if (
      !milestoneForm.projectId ||
      !milestoneForm.title ||
      !milestoneForm.dueDate ||
      !milestoneForm.amount
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(milestoneForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    const project = projects.find((p) => p.id === milestoneForm.projectId);
    if (!project) return;

    if (editingMilestone) {
      setMilestones(
        milestones.map((m) =>
          m.id === editingMilestone.id
            ? {
                ...m,
                ...milestoneForm,
                amount,
                projectName: project.name,
                clientName: project.clientName,
              }
            : m
        )
      );
      showSuccessNotification("Milestone updated successfully!");
    } else {
      const newMilestone: Milestone = {
        id: Date.now().toString(),
        projectId: milestoneForm.projectId,
        projectName: project.name,
        clientName: project.clientName,
        title: milestoneForm.title,
        description: milestoneForm.description,
        dueDate: milestoneForm.dueDate,
        amount,
        status: milestoneForm.status,
        comments: [],
        createdDate: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      };
      setMilestones([...milestones, newMilestone]);
      showSuccessNotification("Milestone created successfully!");
    }
    closeMilestoneModal();
  };

  const deleteMilestone = (id: string) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      setMilestones(milestones.filter((m) => m.id !== id));
      showSuccessNotification("Milestone deleted successfully!");
    }
  };

  const viewMilestone = (milestone: Milestone) => {
    setViewingMilestone(milestone);
  };

  const closeViewModal = () => {
    setViewingMilestone(null);
  };

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
    showSuccessNotification("Response sent successfully!");
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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

  // Count pending client questions
  const getPendingQuestionsCount = (milestoneId: string) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (!milestone) return 0;

    const lastProviderComment = milestone.comments
      .slice()
      .reverse()
      .find((c) => c.isProvider);
    const lastClientComment = milestone.comments
      .slice()
      .reverse()
      .find((c) => !c.isProvider);

    // If there's a client comment after the last provider comment, there's a pending question
    if (
      !lastProviderComment ||
      (lastClientComment &&
        milestone.comments.indexOf(lastClientComment) >
          milestone.comments.indexOf(lastProviderComment))
    ) {
      return 1;
    }
    return 0;
  };

  const totalPendingQuestions = milestones.reduce(
    (sum, m) => sum + getPendingQuestionsCount(m.id),
    0
  );

  const selectedProjectData = projects.find(
    (p) => p.id === milestoneForm.projectId
  );

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-neutral-900 mb-1">
              Milestones Management
            </h1>
            <p className="text-neutral-600 body-regular">
              Create milestones, track progress, and respond to client questions
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalPendingQuestions > 0 && (
              <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-sm font-semibold">
                  <FontAwesomeIcon icon={faComment} className="mr-2" />
                  {totalPendingQuestions} pending{" "}
                  {totalPendingQuestions === 1 ? "question" : "questions"}
                </p>
              </div>
            )}
            <button
              onClick={() => openMilestoneModal()}
              className="btn-primary flex items-center gap-2 shadow-lg"
            >
              <FontAwesomeIcon icon={faPlus} />
              Create Milestone
            </button>
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
            <p className="text-neutral-600 mb-4">
              {searchQuery ||
              selectedProject !== "all" ||
              selectedStatus !== "all"
                ? "Try adjusting your filters or search query"
                : "Get started by creating your first milestone"}
            </p>
            <button
              onClick={() => openMilestoneModal()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Create Milestone
            </button>
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
                        <div>
                          <h2 className="heading-4 text-neutral-900">
                            {project?.name}
                          </h2>
                          <p className="text-neutral-600 text-sm mt-1">
                            <FontAwesomeIcon icon={faUser} className="mr-1" />
                            Client: {project?.clientName}
                          </p>
                        </div>
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
                      {projectMilestones.map((milestone) => {
                        const pendingQuestions = getPendingQuestionsCount(
                          milestone.id
                        );

                        return (
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
                                  {pendingQuestions > 0 && (
                                    <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded flex items-center gap-1">
                                      <FontAwesomeIcon icon={faComment} />
                                      Client Question
                                    </span>
                                  )}
                                </div>
                                <p className="text-neutral-700 mb-3">
                                  {milestone.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-neutral-600 flex-wrap">
                                  <span className="flex items-center gap-1 font-semibold text-green-600">
                                    <FontAwesomeIcon
                                      icon={faDollarSign}
                                      className="text-xs"
                                    />
                                    {formatCurrency(milestone.amount)}
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
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => viewMilestone(milestone)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View details"
                                >
                                  <FontAwesomeIcon icon={faEye} />
                                </button>
                                <button
                                  onClick={() => openMilestoneModal(milestone)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Edit milestone"
                                >
                                  <FontAwesomeIcon icon={faPenToSquare} />
                                </button>
                                <button
                                  onClick={() => deleteMilestone(milestone.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete milestone"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
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
                                  Client Questions & Responses (
                                  {milestone.comments.length})
                                </span>
                                {pendingQuestions > 0 && (
                                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                )}
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
                                          comment.isProvider
                                            ? "bg-primary-50"
                                            : "bg-blue-50"
                                        }`}
                                      >
                                        <div
                                          className={`w-10 h-10 rounded-full flex items-center justify-center text-neutral-0 font-semibold flex-shrink-0 ${
                                            comment.isProvider
                                              ? "bg-primary-600"
                                              : "bg-blue-600"
                                          }`}
                                        >
                                          {comment.authorInitials}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-neutral-900">
                                              {comment.author}
                                            </span>
                                            {comment.isProvider && (
                                              <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded">
                                                You
                                              </span>
                                            )}
                                            {!comment.isProvider && (
                                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                Client
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
                                      No questions from the client yet
                                    </p>
                                  )}

                                  {/* Add Response */}
                                  <div className="flex gap-3 pt-4 border-t border-neutral-200">
                                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-neutral-0 font-semibold flex-shrink-0">
                                      MR
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
                                        placeholder="Respond to client questions or provide updates..."
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
                                          <FontAwesomeIcon
                                            icon={faPaperPlane}
                                          />
                                          Send Response
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="heading-4 text-neutral-900">
                  {editingMilestone ? "Edit Milestone" : "Create New Milestone"}
                </h3>
                <p className="text-neutral-600 text-sm mt-1">
                  {editingMilestone
                    ? "Update milestone details and payment amount"
                    : "Create a new milestone with payment amount"}
                </p>
              </div>
              <button
                onClick={closeMilestoneModal}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Project Selection */}
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={milestoneForm.projectId}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      projectId: e.target.value,
                    })
                  }
                  disabled={!!editingMilestone}
                  className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer disabled:bg-neutral-100"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.clientName}
                    </option>
                  ))}
                </select>
                {selectedProjectData && (
                  <p className="mt-2 text-sm text-neutral-600">
                    Client:{" "}
                    <span className="font-semibold">
                      {selectedProjectData.clientName}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Milestone Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={milestoneForm.title}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Foundation Complete"
                  className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Description
                </label>
                <textarea
                  value={milestoneForm.description}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe this milestone..."
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Payment Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="number"
                      value={milestoneForm.amount}
                      onChange={(e) =>
                        setMilestoneForm({
                          ...milestoneForm,
                          amount: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={(e) =>
                      setMilestoneForm({
                        ...milestoneForm,
                        dueDate: e.target.value,
                      })
                    }
                    min={selectedProjectData?.startDate}
                    max={selectedProjectData?.endDate}
                    className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={milestoneForm.status}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      status: e.target.value as Milestone["status"],
                    })
                  }
                  className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
                >
                  <option value="pending">⚠ Pending</option>
                  <option value="in-progress">⏱ In Progress</option>
                  <option value="completed">✓ Completed</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm flex items-start gap-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <span>
                    This milestone will be visible to the client and payment
                    amount will be used for invoicing.
                  </span>
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={closeMilestoneModal}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveMilestone}
                className="btn-primary flex items-center gap-2"
              >
                <FontAwesomeIcon
                  icon={editingMilestone ? faCheckCircle : faPlus}
                />
                {editingMilestone ? "Update Milestone" : "Create Milestone"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Milestone Modal */}
      {viewingMilestone && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="heading-4 text-neutral-900">
                  Milestone Details
                </h3>
                <p className="text-neutral-600 text-sm mt-1">
                  {viewingMilestone.projectName} - {viewingMilestone.clientName}
                </p>
              </div>
              <button
                onClick={closeViewModal}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-neutral-600 font-medium mb-2 body-small">
                  Title
                </label>
                <p className="text-neutral-900 font-semibold text-lg">
                  {viewingMilestone.title}
                </p>
              </div>

              {viewingMilestone.description && (
                <div>
                  <label className="block text-neutral-600 font-medium mb-2 body-small">
                    Description
                  </label>
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <p className="text-neutral-700 leading-relaxed">
                      {viewingMilestone.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-neutral-600 font-medium mb-2 body-small">
                    Payment Amount
                  </label>
                  <div className="flex items-center gap-2 text-neutral-900 font-bold text-2xl bg-green-50 p-4 rounded-lg border border-green-200">
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      className="text-green-600"
                    />
                    {formatCurrency(viewingMilestone.amount)}
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-600 font-medium mb-2 body-small">
                    Due Date
                  </label>
                  <div className="flex items-center gap-2 text-neutral-900 font-medium bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="text-primary-600"
                    />
                    <span className="text-sm">
                      {new Date(viewingMilestone.dueDate).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-2 body-small">
                  Status
                </label>
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border ${getStatusBadgeColor(
                    viewingMilestone.status
                  )}`}
                >
                  <FontAwesomeIcon
                    icon={getStatusIcon(viewingMilestone.status)}
                  />
                  {getStatusText(viewingMilestone.status)}
                </span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  if (
                    confirm("Are you sure you want to delete this milestone?")
                  ) {
                    deleteMilestone(viewingMilestone.id);
                    closeViewModal();
                  }
                }}
                className="px-5 py-2.5 bg-red-600 text-neutral-0 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeViewModal}
                  className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeViewModal();
                    openMilestoneModal(viewingMilestone);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                  Edit Milestone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
