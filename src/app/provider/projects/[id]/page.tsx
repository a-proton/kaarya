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
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface Milestone {
  id: number;
  title: string;
  description: string;
  due_date: string;
  amount: string;
  status: "pending" | "in_progress" | "completed";
  payment_status: string;
}

interface Project {
  id: number;
  project_name: string;
  description: string;
  site_address: string;
  status:
    | "not_started"
    | "in_progress"
    | "completed"
    | "on_hold"
    | "cancelled"
    | "pending";
  status_display: string;
  start_date: string;
  expected_end_date: string;
  actual_end_date: string | null;
  total_cost: string;
  advance_payment: string;
  balance_payment: string;
  client: Client | null;
  service_provider: ServiceProvider;
  milestones: Milestone[];
  milestone_count: number;
  created_at: string;
  updated_at: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ViewProjectPage({ params }: PageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewingMilestone, setViewingMilestone] = useState<Milestone | null>(
    null
  );

  // Fetch project data
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      try {
        const response = await api.get<Project>(
          `/api/v1/projects/${projectId}/`
        );
        return response;
      } catch (error: any) {
        // Handle 401 Unauthorized - redirect to login
        if (error.status === 401) {
          router.push("/login");
          throw new Error("Session expired. Please login again.");
        }
        throw error;
      }
    },
    enabled: !!projectId,
    retry: (failureCount, error: any) => {
      // Don't retry on 401
      if (error.status === 401) return false;
      return failureCount < 3;
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/v1/projects/${projectId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/provider/projects");
    },
    onError: (error: any) => {
      alert(
        `Failed to delete project: ${
          error.data?.detail || error.message || "Unknown error"
        }`
      );
    },
  });

  const handleDelete = () => {
    deleteProjectMutation.mutate();
  };

  const handleEdit = () => {
    router.push(`/provider/projects/${projectId}/edit`);
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numAmount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_progress: "bg-blue-600",
      completed: "bg-green-600",
      not_started: "bg-yellow-600",
      pending: "bg-yellow-600",
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
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      on_hold: "bg-orange-100 text-orange-700 border-orange-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      colors[status] || "bg-neutral-100 text-neutral-600 border-neutral-200"
    );
  };

  const getMilestoneBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
    };
    return (
      colors[status] || "bg-neutral-100 text-neutral-600 border-neutral-200"
    );
  };

  const getMilestoneIcon = (status: string) => {
    if (status === "completed") return faCheckCircle;
    if (status === "in_progress") return faChartLine;
    return faCalendar;
  };

  const getClientInitials = (fullName: string) => {
    const names = fullName.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const calculateProgress = (project: Project) => {
    const start = new Date(project.start_date).getTime();
    const end = new Date(project.expected_end_date).getTime();
    const now = Date.now();

    if (project.status === "completed") return 100;
    if (project.status === "not_started" || project.status === "pending")
      return 0;
    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTimes} className="text-red-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Project
          </h3>
          <p className="text-red-700 mb-4">
            {error instanceof Error ? error.message : "Failed to load project"}
          </p>
          <button
            onClick={() => router.push("/provider/projects")}
            className="btn-primary"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const completedMilestones = project.milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const totalMilestoneAmount = project.milestones.reduce(
    (sum, m) => sum + parseFloat(m.amount),
    0
  );
  const advancePayment = parseFloat(project.advance_payment);
  const totalProjectValue = parseFloat(project.total_cost);
  const paidAmount =
    project.milestones
      .filter((m) => m.status === "completed")
      .reduce((sum, m) => sum + parseFloat(m.amount), 0) + advancePayment;
  const remainingAmount = totalProjectValue - paidAmount;
  const progress = calculateProgress(project);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/provider/projects")}
              className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
              aria-label="Go back"
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                className="text-neutral-600 text-lg"
              />
            </button>
            <div>
              <h1 className="heading-2 text-neutral-900">
                {project.project_name}
              </h1>
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
                  {project.status_display}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-600 font-medium">
                      Overall Progress
                    </span>
                    <span className="text-neutral-900 font-semibold text-lg">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStatusColor(
                        project.status
                      )} rounded-full transition-all`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <p className="text-primary-600 text-sm font-medium mb-1">
                      Start Date
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {new Date(project.start_date).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                    <p className="text-secondary-600 text-sm font-medium mb-1">
                      Expected End Date
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {new Date(project.expected_end_date).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
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
                      Balance Remaining
                    </p>
                    <p className="text-yellow-900 font-bold text-2xl">
                      {formatCurrency(remainingAmount)}
                    </p>
                  </div>
                </div>

                {advancePayment > 0 && (
                  <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="text-primary-600"
                        />
                        <span className="font-semibold text-neutral-900">
                          Advance Payment Received
                        </span>
                      </div>
                      <span className="text-primary-600 font-bold text-lg">
                        {formatCurrency(advancePayment)}
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
                {project.description || "No description provided."}
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
                  {project.milestones.length > 0 && (
                    <span className="text-sm font-normal text-neutral-500">
                      ({completedMilestones}/{project.milestones.length}{" "}
                      completed)
                    </span>
                  )}
                </h2>
              </div>

              {project.milestones.length > 0 ? (
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
                              : milestone.status === "in_progress"
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
                              {new Date(milestone.due_date).toLocaleDateString(
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
                              {milestone.status === "in_progress"
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

                  {totalMilestoneAmount > 0 && (
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
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-5xl mb-4 opacity-30"
                  />
                  <p className="body-regular">No milestones added yet</p>
                  <p className="body-small mt-2">
                    Milestones will appear here once they are created
                  </p>
                </div>
              )}
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
                    <p className="text-neutral-600 body-small mb-1">
                      Project ID
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      #{project.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-5 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faMoneyBill}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">
                      Total Cost
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {formatCurrency(project.total_cost)}
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
                    {project.client ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center text-sm font-semibold">
                          {getClientInitials(project.client.full_name)}
                        </div>
                        <p className="text-neutral-900 font-semibold truncate">
                          {project.client.full_name}
                        </p>
                      </div>
                    ) : (
                      <p className="text-neutral-500 italic">
                        No client assigned
                      </p>
                    )}
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
                      {project.site_address}
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
                      Service Provider
                    </p>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50">
                      {project.service_provider.profile_image ? (
                        <img
                          src={project.service_provider.profile_image}
                          alt={project.service_provider.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center text-xs font-semibold">
                          {getClientInitials(
                            project.service_provider.full_name
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-neutral-700 text-sm font-medium truncate">
                          {project.service_provider.full_name}
                        </p>
                        <p className="text-neutral-500 text-xs truncate">
                          {project.service_provider.business_name}
                        </p>
                      </div>
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
                Are you sure you want to delete "{project.project_name}"? This
                action cannot be undone and will permanently remove all project
                data, milestones, and updates.
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
                  disabled={deleteProjectMutation.isPending}
                  className="flex-1 px-5 py-3 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteProjectMutation.isPending}
                  className="flex-1 px-5 py-3 bg-red-600 text-neutral-0 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleteProjectMutation.isPending ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faTrash} />
                      Delete Project
                    </>
                  )}
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
                      {new Date(viewingMilestone.due_date).toLocaleDateString(
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
                  {viewingMilestone.status === "in_progress"
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
