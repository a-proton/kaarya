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
  faUsers,
  faClipboardList,
  faImage,
  faBox,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ==================================================================================
// TYPE DEFINITIONS
// ==================================================================================

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
  target_date: string;
  completion_date: string | null;
  status: "pending" | "in_progress" | "completed";
  status_display: string;
  milestone_order: number;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

interface UpdateMedia {
  id: number;
  media_type: "image" | "video";
  media_url: string;
  thumbnail_url: string;
  caption: string;
  file_size: number;
  created_at: string;
}

interface ProjectUpdate {
  id: number;
  update_text: string;
  work_hours: string | null;
  posted_by_name: string;
  milestone: number | null;
  milestone_title: string | null;
  media: UpdateMedia[];
  created_at: string;
}

interface InventoryItem {
  id: number;
  item_name: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string | null;
  total_price: string | null;
  supplier_name: string;
  purchase_date: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: number;
  amount: string;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  payment_type: string;
  payment_type_display: string;
  payment_status: string;
  payment_status_display: string;
  receipt_url: string | null;
  notes: string;
  posted_by_name: string;
  created_at: string;
}

interface Employee {
  id: number;
  full_name: string;
  initials: string;
  role: string;
  department: string;
  employee_id: string;
  phone: string;
  email: string;
  photo: string | null;
  is_active: boolean;
  projects_count: number;
}

interface ProjectDetail {
  id: number;
  project_name: string;
  description: string;
  site_address: string;
  site_location: any;
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
  recent_updates: ProjectUpdate[];
  payment_summary: {
    total_paid: string;
    balance: string;
    payment_count: number;
  };
  created_at: string;
  updated_at: string;
}

interface ProjectSummary {
  financial: {
    total_cost: number;
    total_paid: number;
    balance_remaining: number;
    total_inventory_cost: number;
  };
  progress: {
    status: string;
    total_milestones: number;
    completed_milestones: number;
    average_completion: number;
    start_date: string;
    expected_end_date: string;
    actual_end_date: string | null;
  };
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================

export default function ViewProjectPage({ params }: PageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    "overview" | "updates" | "inventory" | "payments" | "team"
  >("overview");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewingMilestone, setViewingMilestone] = useState<Milestone | null>(
    null
  );
  const [viewingUpdate, setViewingUpdate] = useState<ProjectUpdate | null>(
    null
  );

  // ==================================================================================
  // DATA FETCHING
  // ==================================================================================

  // Fetch main project details
  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErrorObj,
  } = useQuery<ProjectDetail>({
    queryKey: ["project", projectId],
    queryFn: async () =>
      api.get<ProjectDetail>(`/api/v1/projects/${projectId}/`),
    enabled: !!projectId,
  });

  // Fetch project summary
  const { data: summary } = useQuery<ProjectSummary>({
    queryKey: ["project-summary", projectId],
    queryFn: async () =>
      api.get<ProjectSummary>(`/api/v1/projects/${projectId}/summary/`),
    enabled: !!projectId,
  });

  // Fetch all updates (not just recent 5)
  const { data: allUpdates } = useQuery<{
    count: number;
    results: ProjectUpdate[];
  }>({
    queryKey: ["project-updates", projectId],
    queryFn: async () => api.get(`/api/v1/projects/${projectId}/updates/`),
    enabled: !!projectId && activeTab === "updates",
  });

  // Fetch inventory
  const { data: inventory } = useQuery<{
    count: number;
    results: InventoryItem[];
  }>({
    queryKey: ["project-inventory", projectId],
    queryFn: async () => api.get(`/api/v1/projects/${projectId}/inventory/`),
    enabled: !!projectId && activeTab === "inventory",
  });

  // Fetch payments
  const { data: payments } = useQuery<{ count: number; results: Payment[] }>({
    queryKey: ["project-payments", projectId],
    queryFn: async () => api.get(`/api/v1/projects/${projectId}/payments/`),
    enabled: !!projectId && activeTab === "payments",
  });

  // Fetch assigned employees
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["project-employees", projectId],
    queryFn: async () => api.get(`/api/v1/projects/${projectId}/employees/`),
    enabled: !!projectId && activeTab === "team",
  });

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================

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

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  const handleDelete = () => {
    deleteProjectMutation.mutate();
  };

  const handleEdit = () => {
    router.push(`/provider/projects/${projectId}/edit`);
  };

  // ==================================================================================
  // HELPER FUNCTIONS
  // ==================================================================================

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

  const getInitials = (fullName: string) => {
    const names = fullName.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const calculateProgress = (project: ProjectDetail) => {
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

  const getEmployeeColor = (id: number) => {
    const colors = [
      "bg-primary-600",
      "bg-secondary-600",
      "bg-yellow-600",
      "bg-purple-600",
      "bg-green-600",
      "bg-blue-600",
      "bg-orange-600",
      "bg-teal-600",
      "bg-pink-600",
      "bg-indigo-600",
    ];
    return colors[id % colors.length];
  };

  // ==================================================================================
  // LOADING & ERROR STATES
  // ==================================================================================

  if (projectLoading) {
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

  if (projectError || !project) {
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
            {projectErrorObj instanceof Error
              ? projectErrorObj.message
              : "Failed to load project"}
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
  const progress = calculateProgress(project);

  // ==================================================================================
  // RENDER
  // ==================================================================================

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/provider/projects")}
              className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
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
                      Expected End
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
                      Total Value
                    </p>
                    <p className="text-green-900 font-bold text-2xl">
                      {formatCurrency(project.total_cost)}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <p className="text-blue-700 text-sm font-medium mb-1">
                      Amount Paid
                    </p>
                    <p className="text-blue-900 font-bold text-2xl">
                      {formatCurrency(project.payment_summary.total_paid)}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <p className="text-yellow-700 text-sm font-medium mb-1">
                      Balance
                    </p>
                    <p className="text-yellow-900 font-bold text-2xl">
                      {formatCurrency(project.balance_payment)}
                    </p>
                  </div>
                </div>

                {parseFloat(project.advance_payment) > 0 && (
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
                        {formatCurrency(project.advance_payment)}
                      </span>
                    </div>
                  </div>
                )}

                {summary && (
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 font-medium">
                        Total Inventory Cost
                      </span>
                      <span className="text-neutral-900 font-semibold">
                        {formatCurrency(summary.financial.total_inventory_cost)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200">
              {/* Tab Headers */}
              <div className="border-b border-neutral-200 px-6 pt-4 flex items-center gap-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "overview"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("updates")}
                  className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "updates"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <FontAwesomeIcon icon={faImage} className="mr-2" />
                  Updates ({allUpdates?.count || project.recent_updates.length})
                </button>
                <button
                  onClick={() => setActiveTab("inventory")}
                  className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "inventory"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <FontAwesomeIcon icon={faBox} className="mr-2" />
                  Inventory ({inventory?.count || 0})
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "payments"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
                  Payments (
                  {payments?.count || project.payment_summary.payment_count})
                </button>
                <button
                  onClick={() => setActiveTab("team")}
                  className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "team"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <FontAwesomeIcon icon={faUsers} className="mr-2" />
                  Team ({employees?.length || 0})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-3">
                        Project Description
                      </h3>
                      <p className="text-neutral-700 body-regular leading-relaxed">
                        {project.description || "No description provided."}
                      </p>
                    </div>

                    {/* Milestones */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-neutral-900">
                          Milestones
                          {project.milestones.length > 0 && (
                            <span className="text-sm font-normal text-neutral-500 ml-2">
                              ({completedMilestones}/{project.milestones.length}{" "}
                              completed)
                            </span>
                          )}
                        </h3>
                      </div>

                      {project.milestones.length > 0 ? (
                        <div className="space-y-3">
                          {project.milestones.map((milestone) => (
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
                                    <span className="text-neutral-500 text-sm flex items-center gap-1">
                                      <FontAwesomeIcon
                                        icon={faCalendar}
                                        className="text-xs"
                                      />
                                      {new Date(
                                        milestone.target_date
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-semibold border ${getMilestoneBadgeColor(
                                        milestone.status
                                      )}`}
                                    >
                                      {milestone.status_display}
                                    </span>
                                    <span className="text-neutral-500 text-sm">
                                      {milestone.completion_percentage}%
                                      complete
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => setViewingMilestone(milestone)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-neutral-500">
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="text-5xl mb-4 opacity-30"
                          />
                          <p className="body-regular">
                            No milestones added yet
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Recent Updates */}
                    {project.recent_updates.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-4">
                          Recent Updates
                        </h3>
                        <div className="space-y-4">
                          {project.recent_updates.map((update) => (
                            <div
                              key={update.id}
                              className="p-4 border border-neutral-200 rounded-lg"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-neutral-700">
                                    {update.update_text}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500">
                                    <span>{update.posted_by_name}</span>
                                    <span>•</span>
                                    <span>
                                      {new Date(
                                        update.created_at
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                    {update.work_hours && (
                                      <>
                                        <span>•</span>
                                        <span>{update.work_hours} hours</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {update.media.length > 0 && (
                                <div className="mt-3 grid grid-cols-4 gap-2">
                                  {update.media.slice(0, 4).map((media) => (
                                    <img
                                      key={media.id}
                                      src={media.thumbnail_url}
                                      alt={media.caption}
                                      className="w-full h-20 object-cover rounded-lg"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Updates Tab */}
                {activeTab === "updates" && (
                  <div>
                    {allUpdates && allUpdates.count > 0 ? (
                      <div className="space-y-4">
                        {allUpdates.results.map((update) => (
                          <div
                            key={update.id}
                            className="p-4 border border-neutral-200 rounded-lg hover:border-primary-500 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-neutral-700 font-medium">
                                  {update.update_text}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500">
                                  <span className="font-medium">
                                    {update.posted_by_name}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {new Date(
                                      update.created_at
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {update.work_hours && (
                                    <>
                                      <span>•</span>
                                      <span className="text-primary-600 font-medium">
                                        {update.work_hours} hours
                                      </span>
                                    </>
                                  )}
                                  {update.milestone_title && (
                                    <>
                                      <span>•</span>
                                      <span className="text-blue-600">
                                        🎯 {update.milestone_title}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => setViewingUpdate(update)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                            </div>
                            {update.media.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                {update.media.map((media) => (
                                  <div
                                    key={media.id}
                                    className="relative group"
                                  >
                                    <img
                                      src={media.thumbnail_url}
                                      alt={media.caption}
                                      className="w-full h-32 object-cover rounded-lg"
                                    />
                                    {media.caption && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        {media.caption}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-neutral-500">
                        <FontAwesomeIcon
                          icon={faImage}
                          className="text-5xl mb-4 opacity-30"
                        />
                        <p className="body-regular">No updates posted yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Inventory Tab */}
                {activeTab === "inventory" && (
                  <div>
                    {inventory && inventory.count > 0 ? (
                      <div className="space-y-3">
                        {inventory.results.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 border border-neutral-200 rounded-lg"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-neutral-900">
                                  {item.item_name}
                                </h4>
                                {item.description && (
                                  <p className="text-neutral-600 text-sm mt-1">
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="text-neutral-600">
                                    Qty:{" "}
                                    <span className="font-semibold text-neutral-900">
                                      {item.quantity}
                                    </span>{" "}
                                    {item.unit}
                                  </span>
                                  {item.unit_price && (
                                    <>
                                      <span className="text-neutral-400">
                                        •
                                      </span>
                                      <span className="text-neutral-600">
                                        Price:{" "}
                                        <span className="font-semibold text-neutral-900">
                                          {formatCurrency(item.unit_price)}
                                        </span>
                                        {item.unit && `/${item.unit}`}
                                      </span>
                                    </>
                                  )}
                                  {item.total_price && (
                                    <>
                                      <span className="text-neutral-400">
                                        •
                                      </span>
                                      <span className="text-primary-600 font-semibold">
                                        Total:{" "}
                                        {formatCurrency(item.total_price)}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {item.supplier_name && (
                                  <p className="text-neutral-500 text-sm mt-2">
                                    Supplier: {item.supplier_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {summary &&
                          summary.financial.total_inventory_cost > 0 && (
                            <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-neutral-700">
                                  Total Inventory Value:
                                </span>
                                <span className="text-2xl font-bold text-primary-600">
                                  {formatCurrency(
                                    summary.financial.total_inventory_cost
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-neutral-500">
                        <FontAwesomeIcon
                          icon={faBox}
                          className="text-5xl mb-4 opacity-30"
                        />
                        <p className="body-regular">
                          No inventory items added yet
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payments Tab */}
                {activeTab === "payments" && (
                  <div>
                    {payments && payments.count > 0 ? (
                      <div className="space-y-3">
                        {payments.results.map((payment) => (
                          <div
                            key={payment.id}
                            className="p-4 border border-neutral-200 rounded-lg"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-2xl font-bold text-green-600">
                                    {formatCurrency(payment.amount)}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                      payment.payment_status === "completed"
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : payment.payment_status === "pending"
                                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                        : "bg-red-100 text-red-700 border border-red-200"
                                    }`}
                                  >
                                    {payment.payment_status_display}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                    {payment.payment_type_display}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                  <div>
                                    <span className="text-neutral-600">
                                      Payment Date:
                                    </span>
                                    <span className="ml-2 font-semibold text-neutral-900">
                                      {new Date(
                                        payment.payment_date
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                  {payment.payment_method && (
                                    <div>
                                      <span className="text-neutral-600">
                                        Method:
                                      </span>
                                      <span className="ml-2 font-semibold text-neutral-900">
                                        {payment.payment_method}
                                      </span>
                                    </div>
                                  )}
                                  {payment.transaction_id && (
                                    <div>
                                      <span className="text-neutral-600">
                                        Transaction ID:
                                      </span>
                                      <span className="ml-2 font-mono text-xs text-neutral-700">
                                        {payment.transaction_id}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-neutral-600">
                                      Recorded by:
                                    </span>
                                    <span className="ml-2 font-semibold text-neutral-900">
                                      {payment.posted_by_name}
                                    </span>
                                  </div>
                                </div>
                                {payment.notes && (
                                  <p className="text-neutral-600 text-sm mt-2 italic">
                                    Note: {payment.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-neutral-700">
                              Total Payments Received:
                            </span>
                            <span className="text-2xl font-bold text-green-600">
                              {formatCurrency(
                                project.payment_summary.total_paid
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-neutral-500">
                        <FontAwesomeIcon
                          icon={faCreditCard}
                          className="text-5xl mb-4 opacity-30"
                        />
                        <p className="body-regular">No payments recorded yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Team Tab */}
                {activeTab === "team" && (
                  <div>
                    {employees && employees.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {employees.map((employee) => (
                          <div
                            key={employee.id}
                            className="p-4 border border-neutral-200 rounded-lg hover:border-primary-500 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-12 h-12 rounded-full ${getEmployeeColor(
                                  employee.id
                                )} text-neutral-0 flex items-center justify-center font-bold text-lg`}
                              >
                                {employee.initials}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-neutral-900">
                                  {employee.full_name}
                                </h4>
                                <p className="text-neutral-600 text-sm">
                                  {employee.role || "No role"}{" "}
                                  {employee.department &&
                                    `• ${employee.department}`}
                                </p>
                                {employee.phone && (
                                  <p className="text-neutral-500 text-xs mt-1">
                                    {employee.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-neutral-500">
                        <FontAwesomeIcon
                          icon={faUsers}
                          className="text-5xl mb-4 opacity-30"
                        />
                        <p className="body-regular">
                          No team members assigned yet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 sticky top-8 space-y-6">
              <div>
                <h3 className="heading-4 text-neutral-900 mb-4">
                  Project Information
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
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

                  <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
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

                  <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-primary-600 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-600 body-small mb-1">Client</p>
                      {project.client ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center text-sm font-semibold">
                            {getInitials(project.client.full_name)}
                          </div>
                          <div>
                            <p className="text-neutral-900 font-semibold">
                              {project.client.full_name}
                            </p>
                            <p className="text-neutral-500 text-xs">
                              {project.client.user_email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-neutral-500 italic">
                          No client assigned
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="text-primary-600 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-600 body-small mb-1">
                        Location
                      </p>
                      <p className="text-neutral-900 font-semibold">
                        {project.site_address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {summary && (
                <div className="pt-6 border-t border-neutral-200">
                  <h4 className="font-semibold text-neutral-900 mb-4">
                    Progress Statistics
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">
                        Milestones Completed:
                      </span>
                      <span className="font-semibold text-neutral-900">
                        {summary.progress.completed_milestones}/
                        {summary.progress.total_milestones}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Avg. Completion:</span>
                      <span className="font-semibold text-neutral-900">
                        {summary.progress.average_completion}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                action cannot be undone.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteProjectMutation.isPending}
                  className="flex-1 btn-secondary disabled:opacity-50"
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
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Detail Modal */}
      {viewingMilestone && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="heading-4 text-neutral-900">
                  Milestone Details
                </h3>
                <p className="text-neutral-600 text-sm mt-1">
                  Review milestone information
                </p>
              </div>
              <button
                onClick={() => setViewingMilestone(null)}
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
                    <p className="text-neutral-700 body-regular leading-relaxed">
                      {viewingMilestone.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-neutral-600 font-medium mb-2 body-small">
                    Target Date
                  </label>
                  <div className="flex items-center gap-2 text-neutral-900 font-medium bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="text-primary-600"
                    />
                    <span className="text-sm">
                      {new Date(
                        viewingMilestone.target_date
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-600 font-medium mb-2 body-small">
                    Completion
                  </label>
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Progress</span>
                      <span className="font-bold text-primary-600">
                        {viewingMilestone.completion_percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full transition-all"
                        style={{
                          width: `${viewingMilestone.completion_percentage}%`,
                        }}
                      />
                    </div>
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
                  {viewingMilestone.status_display}
                </span>
              </div>

              {viewingMilestone.completion_date && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 text-sm font-medium flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Completed on{" "}
                    {new Date(
                      viewingMilestone.completion_date
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end rounded-b-xl">
              <button
                onClick={() => setViewingMilestone(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Detail Modal */}
      {viewingUpdate && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-3xl w-full my-8">
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="heading-4 text-neutral-900">Update Details</h3>
                <p className="text-neutral-600 text-sm mt-1">
                  Posted by {viewingUpdate.posted_by_name}
                </p>
              </div>
              <button
                onClick={() => setViewingUpdate(null)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-neutral-600 font-medium mb-2 body-small">
                  Update
                </label>
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <p className="text-neutral-700 body-regular leading-relaxed">
                    {viewingUpdate.update_text}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-600 font-medium mb-2 body-small">
                    Posted Date
                  </label>
                  <p className="text-neutral-900 font-semibold">
                    {new Date(viewingUpdate.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
                {viewingUpdate.work_hours && (
                  <div>
                    <label className="block text-neutral-600 font-medium mb-2 body-small">
                      Work Hours
                    </label>
                    <p className="text-primary-600 font-bold text-lg">
                      {viewingUpdate.work_hours} hours
                    </p>
                  </div>
                )}
              </div>

              {viewingUpdate.milestone_title && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 font-medium">
                    🎯 Related Milestone:{" "}
                    <span className="font-bold">
                      {viewingUpdate.milestone_title}
                    </span>
                  </p>
                </div>
              )}

              {viewingUpdate.media.length > 0 && (
                <div>
                  <label className="block text-neutral-600 font-medium mb-3 body-small">
                    Media ({viewingUpdate.media.length})
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingUpdate.media.map((media) => (
                      <div key={media.id} className="relative group">
                        <img
                          src={media.media_url}
                          alt={media.caption}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        {media.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-sm p-2 rounded-b-lg">
                            {media.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end rounded-b-xl">
              <button
                onClick={() => setViewingUpdate(null)}
                className="btn-secondary"
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
