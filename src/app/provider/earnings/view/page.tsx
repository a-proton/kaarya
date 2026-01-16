"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCheckCircle,
  faDownload,
  faPrint,
  faShare,
  faCalendar,
  faDollarSign,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ==================================================================================
// TYPE DEFINITIONS
// ==================================================================================

interface Payment {
  id: number;
  amount: string;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  payment_type: "advance" | "milestone" | "final" | "other";
  payment_status: "pending" | "completed" | "failed";
  notes: string;
  created_at: string;
}

interface Client {
  id: number;
  full_name: string;
  user: {
    email: string;
    phone: string;
  };
}

interface Project {
  id: number;
  project_name: string;
  description: string;
  client: Client | null;
  client_name?: string;
  site_address: string;
  total_cost: string;
  status: string;
  start_date: string;
  expected_end_date: string;
  created_at: string;
}

interface PaymentsResponse {
  count: number;
  results: Payment[];
}

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================

export default function EarningsViewPage() {
  // Get project ID from URL
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const projectId = params.get("id");

  // ==================================================================================
  // DATA FETCHING WITH TANSTACK QUERY
  // ==================================================================================

  // Fetch project details
  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErrorData,
  } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("No project ID provided");
      return api.get<Project>(`/api/v1/projects/${projectId}/`);
    },
    enabled: !!projectId,
  });

  // Fetch payments for this project
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    isError: paymentsError,
  } = useQuery<PaymentsResponse>({
    queryKey: ["payments", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("No project ID provided");
      return api.get<PaymentsResponse>(
        `/api/v1/projects/${projectId}/payments/`
      );
    },
    enabled: !!projectId,
  });

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  const handleDownload = async () => {
    if (!project) return;
    alert(
      `Download functionality for payment report would be implemented here for ${project.project_name}`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share && project) {
      navigator
        .share({
          title: project.project_name,
          text: `Payment details for ${project.project_name}`,
          url: window.location.href,
        })
        .catch((err) => console.log("Share failed:", err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
    }
  };

  const getStatusText = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getPaymentTypeText = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // ==================================================================================
  // LOADING & ERROR STATES
  // ==================================================================================

  const isLoading = projectLoading || paymentsLoading;
  const isError = projectError || paymentsError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-primary-600 mb-4"
          />
          <p className="text-neutral-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (isError || !project || !projectId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-red-600 text-2xl"
            />
          </div>
          <h2 className="heading-3 text-neutral-900 mb-2">
            Error Loading Project
          </h2>
          <p className="text-neutral-600 mb-4">
            {!projectId
              ? "No project ID provided"
              : projectErrorData instanceof Error
              ? projectErrorData.message
              : "Project not found"}
          </p>
          <button onClick={handleBack} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // DATA CALCULATIONS
  // ==================================================================================

  const payments = paymentsData?.results || [];
  const totalPaid = payments
    .filter((p) => p.payment_status === "completed")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalBudget = parseFloat(project.total_cost || "0");
  const remainingAmount = totalBudget - totalPaid;
  const progressPercentage =
    totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

  // Get client info - handle both nested client object and flat client_name
  const clientName =
    project.client?.full_name || project.client_name || "Not assigned";
  const clientEmail = project.client?.user?.email || "";
  const clientPhone = project.client?.user?.phone || "";

  // ==================================================================================
  // RENDER
  // ==================================================================================

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span className="body-regular font-medium">Back to Earnings</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="px-4 py-2 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faShare} />
                <span>Share</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPrint} />
                <span>Print</span>
              </button>
              <button
                onClick={handleDownload}
                className="btn-primary flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} />
                Download Report
              </button>
            </div>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="heading-2 text-neutral-900 mb-2">
                {project.project_name}
              </h1>
              <div className="flex items-center gap-4 text-neutral-600">
                <span className="body-small">Project ID: #{project.id}</span>
                <span className="body-small">•</span>
                <span className="body-small">
                  Started:{" "}
                  {new Date(project.start_date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getStatusBadge(
                project.status
              )}`}
            >
              {getStatusText(project.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Summary */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6">
                Project Summary
              </h2>

              {/* Amount Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faDollarSign}
                        className="text-neutral-0 text-sm"
                      />
                    </div>
                    <p className="text-neutral-600 body-small">Total Budget</p>
                  </div>
                  <p className="heading-3 text-neutral-900">
                    $
                    {totalBudget.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="text-neutral-0 text-sm"
                      />
                    </div>
                    <p className="text-neutral-600 body-small">Earned</p>
                  </div>
                  <p className="heading-3 text-green-700">
                    $
                    {totalPaid.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faCalendar}
                        className="text-neutral-0 text-sm"
                      />
                    </div>
                    <p className="text-neutral-600 body-small">Remaining</p>
                  </div>
                  <p className="heading-3 text-orange-700">
                    $
                    {remainingAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="body-small text-neutral-600 font-medium">
                    Payment Progress
                  </span>
                  <span className="body-small text-neutral-900 font-semibold">
                    {progressPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-600 to-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-2">
                    Description
                  </h3>
                  <p className="text-neutral-600 body-regular leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6">
                Payment History
              </h2>

              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No payments recorded yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 hover:border-primary-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                payment.payment_status === "completed"
                                  ? "bg-green-100"
                                  : payment.payment_status === "pending"
                                  ? "bg-yellow-100"
                                  : "bg-red-100"
                              }`}
                            >
                              <FontAwesomeIcon
                                icon={faCheckCircle}
                                className={`text-xl ${
                                  payment.payment_status === "completed"
                                    ? "text-green-600"
                                    : payment.payment_status === "pending"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="heading-4 text-neutral-900 mb-1">
                                $
                                {parseFloat(payment.amount).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </p>
                              <p className="text-neutral-500 body-small">
                                {getPaymentTypeText(payment.payment_type)} •{" "}
                                {payment.payment_method}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-neutral-900 font-medium body-small mb-1">
                              {new Date(
                                payment.payment_date
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            {payment.transaction_id && (
                              <p className="text-neutral-500 text-xs">
                                {payment.transaction_id}
                              </p>
                            )}
                          </div>
                        </div>
                        {payment.notes && (
                          <p className="text-neutral-600 body-small pl-16">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <div className="flex items-center justify-between">
                      <span className="body-regular text-neutral-600">
                        Total Received
                      </span>
                      <span className="heading-4 text-green-600">
                        $
                        {totalPaid.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6">
                Client Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-primary-600"
                    />
                  </div>
                  <div>
                    <p className="text-neutral-500 body-small mb-1">
                      Client Name
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {clientName}
                    </p>
                  </div>
                </div>

                {clientEmail && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-blue-600"
                      />
                    </div>
                    <div>
                      <p className="text-neutral-500 body-small mb-1">Email</p>
                      <p className="text-neutral-900 font-medium body-small break-all">
                        {clientEmail}
                      </p>
                    </div>
                  </div>
                )}

                {clientPhone && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="text-green-600"
                      />
                    </div>
                    <div>
                      <p className="text-neutral-500 body-small mb-1">Phone</p>
                      <p className="text-neutral-900 font-medium">
                        {clientPhone}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="text-orange-600"
                    />
                  </div>
                  <div>
                    <p className="text-neutral-500 body-small mb-1">
                      Site Address
                    </p>
                    <p className="text-neutral-900 font-medium body-small leading-relaxed">
                      {project.site_address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6">
                Project Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                  <span className="text-neutral-600 body-small">
                    Project ID
                  </span>
                  <span className="text-neutral-900 font-semibold">
                    #{project.id}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                  <span className="text-neutral-600 body-small">
                    Start Date
                  </span>
                  <span className="text-neutral-900 font-semibold">
                    {new Date(project.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                  <span className="text-neutral-600 body-small">
                    Expected End
                  </span>
                  <span className="text-neutral-900 font-semibold">
                    {new Date(project.expected_end_date).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 body-small">Status</span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusBadge(
                      project.status
                    )}`}
                  >
                    {getStatusText(project.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl border border-primary-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-primary-50 hover:border-primary-500 transition-colors flex items-center gap-3"
                >
                  <FontAwesomeIcon
                    icon={faDownload}
                    className="text-primary-600"
                  />
                  <span>Download Report</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-primary-50 hover:border-primary-500 transition-colors flex items-center gap-3"
                >
                  <FontAwesomeIcon
                    icon={faPrint}
                    className="text-primary-600"
                  />
                  <span>Print Details</span>
                </button>
                <button
                  onClick={handleShare}
                  className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-primary-50 hover:border-primary-500 transition-colors flex items-center gap-3"
                >
                  <FontAwesomeIcon
                    icon={faShare}
                    className="text-primary-600"
                  />
                  <span>Share with Client</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
