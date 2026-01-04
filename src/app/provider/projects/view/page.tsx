"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPenToSquare,
  faTrash,
  faCalendar,
  faMapMarkerAlt,
  faUser,
  faBriefcase,
  faCheckCircle,
  faExclamationTriangle,
  faEye,
  faTimes,
  faFileAlt,
  faChartLine,
  faDollarSign,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  location: string;
  client: {
    name: string;
    initials: string;
  };
  startDate: string;
  endDate: string;
  category: string;
  description: string;
  budget: string;
  progress: number;
  status: "On Track" | "Needs Attention" | "Completed" | "Archived";
  milestones: Milestone[];
  initialPaymentTaken: boolean;
  initialPaymentAmount: number;
  team: Array<{
    initials: string;
    color: string;
    name: string;
  }>;
}

export default function ViewProjectPage() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewingMilestone, setViewingMilestone] = useState<Milestone | null>(
    null
  );

  const project: Project = {
    id: "1",
    name: "Kitchen Renovation",
    location: "123 Main Street, New York, NY",
    client: {
      name: "Sarah Johnson",
      initials: "SJ",
    },
    startDate: "2024-01-15",
    endDate: "2024-02-28",
    category: "Renovation",
    budget: "$75,000",
    description:
      "Complete kitchen renovation including new cabinets, countertops, appliances, and electrical work. The project involves removing old fixtures, updating plumbing, installing modern lighting, and creating an open-concept design that flows into the dining area.",
    progress: 65,
    status: "On Track",
    initialPaymentTaken: true,
    initialPaymentAmount: 15000,
    milestones: [
      {
        id: "1",
        title: "Demolition Complete",
        description: "Remove old cabinets, countertops, and fixtures",
        dueDate: "2024-01-20",
        amount: 8000,
        status: "completed",
      },
      {
        id: "2",
        title: "Electrical & Plumbing Rough-In",
        description: "Install new electrical wiring and plumbing lines",
        dueDate: "2024-02-05",
        amount: 12000,
        status: "in-progress",
      },
      {
        id: "3",
        title: "Cabinet Installation",
        description: "Install new custom cabinets and hardware",
        dueDate: "2024-02-15",
        amount: 18000,
        status: "pending",
      },
      {
        id: "4",
        title: "Countertop & Appliance Installation",
        description: "Install granite countertops and all appliances",
        dueDate: "2024-02-25",
        amount: 13000,
        status: "pending",
      },
    ],
    team: [
      { initials: "SJ", color: "bg-primary-600", name: "Sarah Johnson" },
      { initials: "MR", color: "bg-secondary-600", name: "Mike Roberts" },
      { initials: "JD", color: "bg-yellow-600", name: "John Davis" },
    ],
  };

  const handleDelete = () => {
    console.log("Deleting project:", project.id);
    setShowDeleteModal(false);
    router.push("/provider/projects");
  };

  const handleEdit = () => {
    router.push(`/provider/projects/edit`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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

  const getMilestoneBadgeColor = (status: Milestone["status"]) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[status];
  };

  const getMilestoneIcon = (status: Milestone["status"]) => {
    if (status === "completed") return faCheckCircle;
    if (status === "in-progress") return faChartLine;
    return faCalendar;
  };

  const completedMilestones = project.milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const totalMilestoneAmount = project.milestones.reduce(
    (sum, m) => sum + m.amount,
    0
  );
  const totalProjectValue = totalMilestoneAmount + project.initialPaymentAmount;
  const paidAmount =
    project.milestones
      .filter((m) => m.status === "completed")
      .reduce((sum, m) => sum + m.amount, 0) +
    (project.initialPaymentTaken ? project.initialPaymentAmount : 0);
  const remainingAmount = totalProjectValue - paidAmount;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
              aria-label="Go back"
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                className="text-neutral-600 text-lg"
              />
            </button>
            <div>
              <h1 className="heading-2 text-neutral-900">{project.name}</h1>
              <p className="text-neutral-600 body-regular mt-1">
                Project Details & Progress
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleEdit}
              className="btn-secondary flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPenToSquare} />
              Edit Project
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-5 py-3 bg-red-600 text-neutral-0 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faTrash} />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-4 text-neutral-900">Project Status</h2>
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getStatusBadgeColor(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-600 font-medium">
                      Overall Progress
                    </span>
                    <span className="text-neutral-900 font-semibold text-lg">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStatusColor(
                        project.status
                      )} rounded-full transition-all`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <p className="text-primary-600 text-sm font-medium mb-1">
                      Start Date
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {new Date(project.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                    <p className="text-secondary-600 text-sm font-medium mb-1">
                      End Date
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {new Date(project.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6 flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  className="text-primary-600"
                />
                Financial Summary
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <p className="text-green-700 text-sm font-medium mb-1">
                      Total Project Value
                    </p>
                    <p className="text-green-900 font-bold text-2xl">
                      {formatCurrency(totalProjectValue)}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <p className="text-blue-700 text-sm font-medium mb-1">
                      Amount Paid
                    </p>
                    <p className="text-blue-900 font-bold text-2xl">
                      {formatCurrency(paidAmount)}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <p className="text-yellow-700 text-sm font-medium mb-1">
                      Remaining
                    </p>
                    <p className="text-yellow-900 font-bold text-2xl">
                      {formatCurrency(remainingAmount)}
                    </p>
                  </div>
                </div>

                {project.initialPaymentTaken && (
                  <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="text-primary-600"
                        />
                        <span className="font-semibold text-neutral-900">
                          Initial Payment Received
                        </span>
                      </div>
                      <span className="text-primary-600 font-bold text-lg">
                        {formatCurrency(project.initialPaymentAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-4 flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faFileAlt}
                  className="text-primary-600"
                />
                Project Description
              </h2>
              <p className="text-neutral-700 body-regular leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Milestones Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-4 text-neutral-900 flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-primary-600"
                  />
                  Milestones & Payments
                  <span className="text-sm font-normal text-neutral-500">
                    ({completedMilestones}/{project.milestones.length}{" "}
                    completed)
                  </span>
                </h2>
              </div>

              <div className="space-y-3">
                {project.milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-primary-500 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          milestone.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : milestone.status === "in-progress"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-neutral-100 text-neutral-500"
                        } font-semibold flex-shrink-0`}
                      >
                        <FontAwesomeIcon
                          icon={getMilestoneIcon(milestone.status)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-900 truncate">
                          {milestone.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-primary-600 font-semibold text-sm flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faDollarSign}
                              className="text-xs"
                            />
                            {formatCurrency(milestone.amount)}
                          </span>
                          <span className="text-neutral-400">•</span>
                          <span className="text-neutral-500 text-sm flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faCalendar}
                              className="text-xs"
                            />
                            {new Date(milestone.dueDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold border ${getMilestoneBadgeColor(
                              milestone.status
                            )}`}
                          >
                            {milestone.status === "in-progress"
                              ? "In Progress"
                              : milestone.status.charAt(0).toUpperCase() +
                                milestone.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewingMilestone(milestone)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
                      aria-label="View milestone"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </div>
                ))}

                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-primary-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700">
                      Total Milestone Payments:
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalMilestoneAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Project Info Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 sticky top-8">
              <h3 className="heading-4 text-neutral-900 mb-6">
                Project Information
              </h3>

              <div className="space-y-5">
                <div className="flex items-start gap-3 pb-5 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faBriefcase}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">Category</p>
                    <p className="text-neutral-900 font-semibold">
                      {project.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-5 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faMoneyBill}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">Budget</p>
                    <p className="text-neutral-900 font-semibold">
                      {project.budget}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-5 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">Client</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center text-sm font-semibold">
                        {project.client.initials}
                      </div>
                      <p className="text-neutral-900 font-semibold truncate">
                        {project.client.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-5 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">Location</p>
                    <p className="text-neutral-900 font-semibold">
                      {project.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-neutral-600 body-small mb-3">
                      Team Members
                    </p>
                    <div className="space-y-2">
                      {project.team.map((member, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          <div
                            className={`w-8 h-8 rounded-full ${member.color} text-neutral-0 flex items-center justify-center text-xs font-semibold`}
                          >
                            {member.initials}
                          </div>
                          <span className="text-neutral-700 text-sm font-medium">
                            {member.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-red-600 text-xl"
                />
              </div>
              <h3 className="heading-4 text-neutral-900 text-center mb-2">
                Delete Project?
              </h3>
              <p className="text-neutral-600 text-center mb-6">
                Are you sure you want to delete "{project.name}"? This action
                cannot be undone and will permanently remove all project data,
                milestones, and updates.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  Warning: This action is irreversible
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-5 py-3 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-5 py-3 bg-red-600 text-neutral-0 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Milestone Modal */}
      {viewingMilestone && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="heading-4 text-neutral-900">
                  Milestone Details
                </h3>
                <p className="text-neutral-600 text-sm mt-1">
                  Review milestone information and payment
                </p>
              </div>
              <button
                onClick={() => setViewingMilestone(null)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Close modal"
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
                    <p className="text-neutral-700 body-regular leading-relaxed">
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
                  className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-semibold border ${getMilestoneBadgeColor(
                    viewingMilestone.status
                  )}`}
                >
                  {viewingMilestone.status === "in-progress"
                    ? "In Progress"
                    : viewingMilestone.status.charAt(0).toUpperCase() +
                      viewingMilestone.status.slice(1)}
                </span>
              </div>

              {viewingMilestone.status === "completed" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 text-sm font-medium flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Payment of {formatCurrency(viewingMilestone.amount)} has
                    been completed for this milestone
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end rounded-b-xl">
              <button
                onClick={() => setViewingMilestone(null)}
                className="px-5 py-2.5 border border-neutral-200 rounded-lg text-neutral-700 font-medium hover:bg-neutral-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
