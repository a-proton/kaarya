"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDollarSign,
  faWallet,
  faClock,
  faCheckCircle,
  faChartLine,
  faDownload,
  faEllipsisVertical,
  faArrowUp,
  faChevronDown,
  faEye,
  faSpinner,
  faExclamationTriangle,
  faPlus,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface Project {
  id: number;
  project_name: string;
  client_name: string;
  client_email: string;
  total_cost: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "on_hold";
  start_date: string;
  expected_end_date: string;
  created_at: string;
}

interface ProjectWithPayments extends Project {
  payments: Payment[];
  total_paid: number;
  balance: number;
}

interface ProjectsResponse {
  count: number;
  results: Project[];
}

interface PaymentsResponse {
  count: number;
  results: Payment[];
}

interface PaymentFormData {
  amount: string;
  payment_date: string;
  payment_method: string;
  payment_type: "advance" | "milestone" | "final" | "other";
  transaction_id: string;
  notes: string;
}

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================

export default function EarningsPage() {
  const queryClient = useQueryClient();

  const [selectedPeriod, setSelectedPeriod] = useState("This Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [openActionsMenu, setOpenActionsMenu] = useState<number | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState<
    number | null
  >(null);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "Bank Transfer",
    payment_type: "advance",
    transaction_id: "",
    notes: "",
  });

  // ==================================================================================
  // DATA FETCHING WITH TANSTACK QUERY
  // ==================================================================================

  // Fetch all projects
  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectsErrorData,
  } = useQuery<ProjectsResponse>({
    queryKey: ["projects", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "All Status") {
        params.append("status", statusFilter.toLowerCase().replace(" ", "_"));
      }
      return api.get<ProjectsResponse>(
        `/api/v1/projects/?${params.toString()}`
      );
    },
  });

  // Fetch payments for all projects (we'll fetch individually for each project)
  const projectIds = projectsData?.results.map((p) => p.id) || [];

  // Fetch payments for each project
  const paymentsQueries = useQuery({
    queryKey: ["all-payments", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return {};

      const paymentsMap: Record<number, Payment[]> = {};

      await Promise.all(
        projectIds.map(async (projectId) => {
          try {
            const response = await api.get<PaymentsResponse>(
              `/api/v1/projects/${projectId}/payments/`
            );
            paymentsMap[projectId] = response.results || [];
          } catch (err) {
            console.error(
              `Failed to fetch payments for project ${projectId}:`,
              err
            );
            paymentsMap[projectId] = [];
          }
        })
      );

      return paymentsMap;
    },
    enabled: projectIds.length > 0,
  });

  // ==================================================================================
  // DATA PROCESSING
  // ==================================================================================

  const projects: ProjectWithPayments[] =
    projectsData?.results.map((project) => {
      const payments = paymentsQueries.data?.[project.id] || [];
      const totalPaid = payments
        .filter((p) => p.payment_status === "completed")
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const totalCost = parseFloat(project.total_cost || "0");
      const balance = totalCost - totalPaid;

      return {
        ...project,
        payments,
        total_paid: totalPaid,
        balance: balance,
      };
    }) || [];

  // Calculate stats
  const totalEarnings = projects.reduce((sum, p) => sum + p.total_paid, 0);
  const pendingPayments = projects.reduce((sum, p) => sum + p.balance, 0);

  // This month earnings
  const now = new Date();
  const completedThisMonth = projects.reduce((sum, p) => {
    const monthPayments = p.payments.filter((payment) => {
      const paymentDate = new Date(payment.payment_date);
      return (
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear() &&
        payment.payment_status === "completed"
      );
    });
    return (
      sum +
      monthPayments.reduce((s, payment) => s + parseFloat(payment.amount), 0)
    );
  }, 0);

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: {
      projectId: number;
      payment: PaymentFormData;
    }) => {
      return api.post<Payment>(
        `/api/v1/projects/${data.projectId}/payments/record/`,
        data.payment
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["all-payments"] });
      setShowAddPaymentModal(false);
      setSelectedProjectForPayment(null);
      resetPaymentForm();
      alert("Payment recorded successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to record payment: ${
          error.data?.detail || error.message || "Unknown error"
        }`
      );
    },
  });

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "Bank Transfer",
      payment_type: "advance",
      transaction_id: "",
      notes: "",
    });
  };

  const handleAddPayment = () => {
    if (!selectedProjectForPayment) {
      alert("Please select a project");
      return;
    }
    if (!paymentForm.amount || !paymentForm.payment_date) {
      alert("Please fill in required fields (Amount and Date)");
      return;
    }

    createPaymentMutation.mutate({
      projectId: selectedProjectForPayment,
      payment: paymentForm,
    });
  };

  const openAddPaymentModal = (projectId: number) => {
    setSelectedProjectForPayment(projectId);
    resetPaymentForm();
    setShowAddPaymentModal(true);
  };

  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "on_hold":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
    }
  };

  const getStatusText = (status: Project["status"]) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const filteredProjects = projects.filter((project) => {
    if (
      searchQuery &&
      !project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !project.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleViewDetails = (projectId: number) => {
    window.location.href = `/provider/earnings/view?id=${projectId}`;
  };

  const handleDownloadInvoice = async (project: ProjectWithPayments) => {
    try {
      // This would need a backend endpoint to generate PDF
      alert(
        `Download functionality for ${project.project_name} would be implemented here`
      );
    } catch (err) {
      console.error("Download error:", err);
      alert("Error downloading invoice");
    }
  };

  const handleExportReport = async () => {
    try {
      // This would need a backend endpoint to generate report
      alert("Export report functionality would be implemented here");
    } catch (err) {
      console.error("Export error:", err);
      alert("Error exporting report");
    }
  };

  // ==================================================================================
  // LOADING & ERROR STATES
  // ==================================================================================

  const isLoading = projectsLoading || paymentsQueries.isLoading;
  const isError = projectsError || paymentsQueries.isError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-primary-600 mb-4"
          />
          <p className="text-neutral-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  if (isError) {
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
            Error Loading Data
          </h2>
          <p className="text-neutral-600 mb-4">
            {projectsErrorData instanceof Error
              ? projectsErrorData.message
              : "Failed to load earnings data"}
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

  // ==================================================================================
  // RENDER
  // ==================================================================================

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-neutral-900 mb-1">Earnings</h1>
            <p className="text-neutral-600 body-regular">
              Track your income and payment history
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer"
              >
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
                <option>All Time</option>
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
              />
            </div>
            <button
              onClick={handleExportReport}
              className="btn-secondary flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faDownload} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-neutral-0 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-neutral-0/20 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faDollarSign} className="text-2xl" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-green-500/20 px-2 py-1 rounded">
                <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
                <span>12%</span>
              </div>
            </div>
            <h3 className="text-neutral-0/80 body-small mb-1">
              Total Earnings
            </h3>
            <p className="heading-2 mb-0">
              $
              {totalEarnings.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faClock}
                  className="text-2xl text-yellow-600"
                />
              </div>
            </div>
            <h3 className="text-neutral-600 body-small mb-1">
              Pending Payments
            </h3>
            <p className="heading-3 text-neutral-900 mb-0">
              $
              {pendingPayments.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-2xl text-green-600"
                />
              </div>
            </div>
            <h3 className="text-neutral-600 body-small mb-1">This Month</h3>
            <p className="heading-3 text-neutral-900 mb-0">
              $
              {completedThisMonth.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faChartLine}
                  className="text-2xl text-blue-600"
                />
              </div>
            </div>
            <h3 className="text-neutral-600 body-small mb-1">
              Active Projects
            </h3>
            <p className="heading-3 text-neutral-900 mb-0">{projects.length}</p>
          </div>
        </div>

        {/* Projects with Earnings */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="heading-4 text-neutral-900">
                Projects & Earnings
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-4 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small w-64"
                  />
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer"
                  >
                    <option>All Status</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Pending</option>
                    <option>On Hold</option>
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500">No projects found</p>
              </div>
            ) : (
              <table className="w-full min-w-[900px]">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">
                      PROJECT
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">
                      CLIENT
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">
                      TOTAL COST
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">
                      PAID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">
                      BALANCE
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">
                      STATUS
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-600">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-neutral-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-neutral-900">
                          {project.project_name}
                        </p>
                        <p className="text-neutral-500 text-sm">
                          {project.payments.length} payment
                          {project.payments.length !== 1 ? "s" : ""}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-neutral-700">
                          {project.client_name || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-neutral-900">
                          $
                          {parseFloat(project.total_cost || "0").toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-green-600">
                          $
                          {project.total_paid.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-orange-600">
                          $
                          {project.balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusBadge(
                            project.status
                          )}`}
                        >
                          {getStatusText(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center relative">
                          <button
                            onClick={() =>
                              setOpenActionsMenu(
                                openActionsMenu === project.id
                                  ? null
                                  : project.id
                              )
                            }
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <FontAwesomeIcon
                              icon={faEllipsisVertical}
                              className="text-neutral-600"
                            />
                          </button>

                          {openActionsMenu === project.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenActionsMenu(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-0 border border-neutral-200 rounded-lg shadow-lg z-20 py-1">
                                <button
                                  onClick={() => {
                                    handleViewDetails(project.id);
                                    setOpenActionsMenu(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors flex items-center gap-3 text-neutral-700"
                                >
                                  <FontAwesomeIcon
                                    icon={faEye}
                                    className="text-primary-600 w-4"
                                  />
                                  <span className="body-small">
                                    View Details
                                  </span>
                                </button>
                                <button
                                  onClick={() => {
                                    openAddPaymentModal(project.id);
                                    setOpenActionsMenu(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors flex items-center gap-3 text-neutral-700"
                                >
                                  <FontAwesomeIcon
                                    icon={faPlus}
                                    className="text-green-600 w-4"
                                  />
                                  <span className="body-small">
                                    Add Payment
                                  </span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleDownloadInvoice(project);
                                    setOpenActionsMenu(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors flex items-center gap-3 text-neutral-700"
                                >
                                  <FontAwesomeIcon
                                    icon={faDownload}
                                    className="text-blue-600 w-4"
                                  />
                                  <span className="body-small">
                                    Export Payments
                                  </span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full my-8">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
              <h3 className="heading-4 text-neutral-900">Record Payment</h3>
              <button
                onClick={() => {
                  setShowAddPaymentModal(false);
                  setSelectedProjectForPayment(null);
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="space-y-5">
                {/* Project Info */}
                {selectedProjectForPayment && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <h4 className="font-semibold text-neutral-900 mb-1">
                      {
                        projects.find((p) => p.id === selectedProjectForPayment)
                          ?.project_name
                      }
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-neutral-600 text-sm mb-1">
                          Total Budget
                        </p>
                        <p className="font-semibold text-neutral-900">
                          $
                          {parseFloat(
                            projects.find(
                              (p) => p.id === selectedProjectForPayment
                            )?.total_cost || "0"
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-600 text-sm mb-1">Paid</p>
                        <p className="font-semibold text-green-600">
                          $
                          {(
                            projects.find(
                              (p) => p.id === selectedProjectForPayment
                            )?.total_paid || 0
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-600 text-sm mb-1">Balance</p>
                        <p className="font-semibold text-orange-600">
                          $
                          {(
                            projects.find(
                              (p) => p.id === selectedProjectForPayment
                            )?.balance || 0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          amount: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                </div>

                {/* Date and Payment Method */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          payment_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          payment_method: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                    >
                      <option>Bank Transfer</option>
                      <option>Credit Card</option>
                      <option>Cash</option>
                      <option>Check</option>
                      <option>Digital Wallet</option>
                    </select>
                  </div>
                </div>

                {/* Payment Type */}
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Payment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentForm.payment_type}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        payment_type: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                  >
                    <option value="advance">Advance Payment</option>
                    <option value="milestone">Milestone Payment</option>
                    <option value="final">Final Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={paymentForm.transaction_id}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        transaction_id: e.target.value,
                      })
                    }
                    placeholder="Enter transaction ID..."
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Notes
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                    placeholder="Add payment notes..."
                    rows={4}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-4 bg-neutral-50">
              <button
                onClick={() => {
                  setShowAddPaymentModal(false);
                  setSelectedProjectForPayment(null);
                }}
                disabled={createPaymentMutation.isPending}
                className="btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                disabled={createPaymentMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {createPaymentMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    Recording...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} />
                    Record Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
