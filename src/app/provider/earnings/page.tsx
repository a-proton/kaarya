"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDollarSign,
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
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
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
// HELPERS
// ==================================================================================

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const PROJECT_COLORS = [
  "#1ab189",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];
const projectColor = (id: number) => PROJECT_COLORS[id % PROJECT_COLORS.length];

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
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "Bank Transfer",
    payment_type: "advance",
    transaction_id: "",
    notes: "",
  });

  // ==================================================================================
  // DATA FETCHING
  // ==================================================================================

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
        `/api/v1/projects/?${params.toString()}`,
      );
    },
  });

  const projectIds = projectsData?.results.map((p) => p.id) || [];

  const paymentsQueries = useQuery({
    queryKey: ["all-payments", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return {};
      const paymentsMap: Record<number, Payment[]> = {};
      await Promise.all(
        projectIds.map(async (projectId) => {
          try {
            const response = await api.get<PaymentsResponse>(
              `/api/v1/projects/${projectId}/payments/`,
            );
            paymentsMap[projectId] = response.results || [];
          } catch (err) {
            paymentsMap[projectId] = [];
          }
        }),
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
      return {
        ...project,
        payments,
        total_paid: totalPaid,
        balance: totalCost - totalPaid,
      };
    }) || [];

  const totalEarnings = projects.reduce((sum, p) => sum + p.total_paid, 0);
  const pendingPayments = projects.reduce((sum, p) => sum + p.balance, 0);

  const now = new Date();
  const completedThisMonth = projects.reduce((sum, p) => {
    const monthPayments = p.payments.filter((payment) => {
      const d = new Date(payment.payment_date);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear() &&
        payment.payment_status === "completed"
      );
    });
    return (
      sum +
      monthPayments.reduce((s, payment) => s + parseFloat(payment.amount), 0)
    );
  }, 0);

  const filteredProjects = projects.filter((project) => {
    if (
      searchQuery &&
      !project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !project.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================

  const createPaymentMutation = useMutation({
    mutationFn: async (data: {
      projectId: number;
      payment: PaymentFormData;
    }) => {
      return api.post<Payment>(
        `/api/v1/projects/${data.projectId}/payments/record/`,
        data.payment,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["all-payments"] });
      setShowAddPaymentModal(false);
      setSelectedProjectForPayment(null);
      resetPaymentForm();
      notify("Payment recorded successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to record payment: ${error.data?.detail || error.message || "Unknown error"}`,
      );
    },
  });

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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

  const handleViewDetails = (projectId: number) => {
    window.location.href = `/provider/earnings/view?id=${projectId}`;
  };

  const handleDownloadInvoice = async (project: ProjectWithPayments) => {
    alert(
      `Download functionality for ${project.project_name} would be implemented here`,
    );
  };

  const handleExportReport = async () => {
    alert("Export report functionality would be implemented here");
  };

  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "completed":
        return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
      case "in_progress":
        return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
      case "pending":
        return { bg: "#fefce8", color: "#ca8a04", border: "#fef08a" };
      case "cancelled":
        return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
      case "on_hold":
        return { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" };
      default:
        return { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" };
    }
  };

  const getStatusText = (status: Project["status"]) =>
    status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

  // ==================================================================================
  // LOADING & ERROR STATES
  // ==================================================================================

  const isLoading = projectsLoading || paymentsQueries.isLoading;
  const isError = projectsError || paymentsQueries.isError;

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="animate-spin mb-3"
            style={{ fontSize: "2rem", color: "#1ab189" }}
          />
          <p
            style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}
          >
            Loading earnings data…
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#fef2f2" }}
          >
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              style={{ color: "#ef4444", fontSize: "1.1rem" }}
            />
          </div>
          <p className="mb-4" style={{ color: "#ef4444" }}>
            {projectsErrorData instanceof Error
              ? projectsErrorData.message
              : "Failed to load earnings data"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-md"
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-neutral-50)" }}
    >
      {/* Toast */}
      {showToast && (
        <div
          className="fixed top-5 right-5 z-[60]"
          style={{ minWidth: "17rem" }}
        >
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-3.5"
            style={{
              backgroundColor: "var(--color-neutral-900)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#1ab189" }}
            >
              <FontAwesomeIcon
                icon={faCheck}
                style={{ color: "white", fontSize: "0.6rem" }}
              />
            </div>
            <p
              className="flex-1 font-medium"
              style={{ fontSize: "0.875rem", color: "white" }}
            >
              {toastMsg}
            </p>
            <button
              onClick={() => setShowToast(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                padding: 0,
              }}
            >
              <FontAwesomeIcon icon={faTimes} style={{ fontSize: "0.75rem" }} />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.125rem 2rem",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: "1.375rem",
                color: "var(--color-neutral-900)",
                lineHeight: 1.2,
              }}
            >
              Earnings
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Track your income and payment history ({projectsData?.count ?? 0}{" "}
              projects)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{
                  appearance: "none",
                  padding: "0.5rem 2.25rem 0.5rem 1rem",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  color: "var(--color-neutral-700)",
                  backgroundColor: "var(--color-neutral-0)",
                  border: "1px solid var(--color-neutral-200)",
                  borderRadius: "0.625rem",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
                <option>All Time</option>
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  color: "var(--color-neutral-400)",
                  fontSize: "0.65rem",
                }}
              />
            </div>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2"
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--color-neutral-700)",
                backgroundColor: "var(--color-neutral-0)",
                border: "1px solid var(--color-neutral-200)",
                borderRadius: "0.625rem",
                cursor: "pointer",
              }}
            >
              <FontAwesomeIcon
                icon={faDownload}
                style={{ fontSize: "0.75rem" }}
              />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "1.75rem 2rem" }}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Earnings */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              backgroundColor: "#1ab189",
              boxShadow: "0 4px 20px rgba(26,177,137,0.25)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <FontAwesomeIcon
                  icon={faDollarSign}
                  style={{ color: "white", fontSize: "1.1rem" }}
                />
              </div>
              <div
                className="flex items-center gap-1 rounded-lg px-2 py-0.5"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <FontAwesomeIcon
                  icon={faArrowUp}
                  style={{ color: "white", fontSize: "0.6rem" }}
                />
                <span
                  style={{
                    color: "white",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  12%
                </span>
              </div>
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.75)",
                marginBottom: "0.25rem",
              }}
            >
              Total Earnings
            </p>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "white",
                lineHeight: 1,
              }}
            >
              $
              {totalEarnings.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Pending */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#fefce8" }}
            >
              <FontAwesomeIcon
                icon={faClock}
                style={{ color: "#ca8a04", fontSize: "1.1rem" }}
              />
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-neutral-500)",
                marginBottom: "0.25rem",
              }}
            >
              Pending Payments
            </p>
            <p
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "var(--color-neutral-900)",
                lineHeight: 1,
              }}
            >
              $
              {pendingPayments.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* This Month */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <FontAwesomeIcon
                icon={faCheckCircle}
                style={{ color: "#16a34a", fontSize: "1.1rem" }}
              />
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-neutral-500)",
                marginBottom: "0.25rem",
              }}
            >
              This Month
            </p>
            <p
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "var(--color-neutral-900)",
                lineHeight: 1,
              }}
            >
              $
              {completedThisMonth.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Active Projects */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#eff6ff" }}
            >
              <FontAwesomeIcon
                icon={faChartLine}
                style={{ color: "#2563eb", fontSize: "1.1rem" }}
              />
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-neutral-500)",
                marginBottom: "0.25rem",
              }}
            >
              Active Projects
            </p>
            <p
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "var(--color-neutral-900)",
                lineHeight: 1,
              }}
            >
              {projects.length}
            </p>
          </div>
        </div>

        {/* Projects Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--color-neutral-0)",
            border: "1px solid var(--color-neutral-200)",
          }}
        >
          {/* Table Header */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid var(--color-neutral-200)",
            }}
          >
            <h2
              className="font-bold"
              style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
            >
              Projects & Earnings
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search projects…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "17rem",
                    padding: "0.5rem 1rem",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.8125rem",
                    color: "var(--color-neutral-900)",
                    backgroundColor: "var(--color-neutral-50)",
                    border: "1px solid var(--color-neutral-200)",
                    borderRadius: "0.625rem",
                    outline: "none",
                    transition: "border-color 150ms, box-shadow 150ms",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#1ab189";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(26,177,137,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-neutral-200)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    appearance: "none",
                    padding: "0.5rem 2.25rem 0.5rem 1rem",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.8125rem",
                    color: "var(--color-neutral-700)",
                    backgroundColor: "var(--color-neutral-0)",
                    border: "1px solid var(--color-neutral-200)",
                    borderRadius: "0.625rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option>All Status</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Pending</option>
                  <option>On Hold</option>
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    color: "var(--color-neutral-400)",
                    fontSize: "0.65rem",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            {filteredProjects.length === 0 ? (
              <div className="text-center" style={{ padding: "4rem 2rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💰</div>
                <h3
                  className="font-semibold mb-2"
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  No projects found
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-500)",
                  }}
                >
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Projects will appear here once created"}
                </p>
              </div>
            ) : (
              <table
                style={{
                  width: "100%",
                  minWidth: "52rem",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "var(--color-neutral-50)",
                      borderBottom: "1px solid var(--color-neutral-200)",
                    }}
                  >
                    {[
                      "Project",
                      "Client",
                      "Total Cost",
                      "Paid",
                      "Balance",
                      "Status",
                      "Actions",
                    ].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.75rem 1.5rem",
                          textAlign: i === 6 ? "center" : "left",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          color: "var(--color-neutral-400)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project, idx) => {
                    const badge = getStatusBadge(project.status);
                    return (
                      <tr
                        key={project.id}
                        style={{
                          borderTop:
                            idx === 0
                              ? "none"
                              : "1px solid var(--color-neutral-100)",
                          transition: "background-color 120ms",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLTableRowElement
                          ).style.backgroundColor = "var(--color-neutral-50)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLTableRowElement
                          ).style.backgroundColor = "transparent";
                        }}
                      >
                        {/* Project */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold flex-shrink-0"
                              style={{
                                backgroundColor: projectColor(project.id),
                                color: "white",
                                fontSize: "0.75rem",
                              }}
                            >
                              {getInitials(project.project_name)}
                            </div>
                            <div>
                              <p
                                className="font-semibold whitespace-nowrap"
                                style={{
                                  fontSize: "0.875rem",
                                  color: "var(--color-neutral-900)",
                                }}
                              >
                                {project.project_name}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--color-neutral-500)",
                                }}
                              >
                                {project.payments.length} payment
                                {project.payments.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Client */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <p
                            className="whitespace-nowrap"
                            style={{
                              fontSize: "0.8125rem",
                              color: "var(--color-neutral-700)",
                            }}
                          >
                            {project.client_name || "N/A"}
                          </p>
                        </td>

                        {/* Total Cost */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <p
                            className="font-semibold whitespace-nowrap"
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--color-neutral-900)",
                            }}
                          >
                            $
                            {parseFloat(
                              project.total_cost || "0",
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </td>

                        {/* Paid */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <p
                            className="font-semibold whitespace-nowrap"
                            style={{ fontSize: "0.875rem", color: "#16a34a" }}
                          >
                            $
                            {project.total_paid.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </td>

                        {/* Balance */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <p
                            className="font-semibold whitespace-nowrap"
                            style={{ fontSize: "0.875rem", color: "#ea580c" }}
                          >
                            $
                            {project.balance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <span
                            className="whitespace-nowrap"
                            style={{
                              display: "inline-block",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                            }}
                          >
                            {getStatusText(project.status)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <div className="flex justify-center">
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenActionsMenu(
                                    openActionsMenu === project.id
                                      ? null
                                      : project.id,
                                  )
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: "0.5rem",
                                  borderRadius: "0.5rem",
                                  color: "var(--color-neutral-600)",
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.backgroundColor =
                                    "var(--color-neutral-100)";
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.backgroundColor = "transparent";
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faEllipsisVertical}
                                  style={{ fontSize: "0.9rem" }}
                                />
                              </button>

                              {openActionsMenu === project.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenActionsMenu(null)}
                                  />
                                  <div
                                    className="absolute right-0 rounded-xl overflow-hidden z-20"
                                    style={{
                                      marginTop: "0.5rem",
                                      width: "11rem",
                                      backgroundColor: "var(--color-neutral-0)",
                                      border:
                                        "1px solid var(--color-neutral-200)",
                                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                    }}
                                  >
                                    {[
                                      {
                                        icon: faEye,
                                        color: "#3b82f6",
                                        label: "View Details",
                                        onClick: () => {
                                          handleViewDetails(project.id);
                                          setOpenActionsMenu(null);
                                        },
                                      },
                                      {
                                        icon: faPlus,
                                        color: "#1ab189",
                                        label: "Add Payment",
                                        onClick: () => {
                                          openAddPaymentModal(project.id);
                                          setOpenActionsMenu(null);
                                        },
                                      },
                                      {
                                        icon: faDownload,
                                        color: "#2563eb",
                                        label: "Export Payments",
                                        onClick: () => {
                                          handleDownloadInvoice(project);
                                          setOpenActionsMenu(null);
                                        },
                                      },
                                    ].map(({ icon, color, label, onClick }) => (
                                      <button
                                        key={label}
                                        onClick={onClick}
                                        className="w-full flex items-center gap-3 px-4 py-2.5"
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          fontSize: "0.8125rem",
                                          color: "var(--color-neutral-700)",
                                          textAlign: "left",
                                        }}
                                        onMouseEnter={(e) => {
                                          (
                                            e.currentTarget as HTMLButtonElement
                                          ).style.backgroundColor =
                                            "var(--color-neutral-50)";
                                        }}
                                        onMouseLeave={(e) => {
                                          (
                                            e.currentTarget as HTMLButtonElement
                                          ).style.backgroundColor =
                                            "transparent";
                                        }}
                                      >
                                        <FontAwesomeIcon
                                          icon={icon}
                                          style={{
                                            color,
                                            fontSize: "0.8rem",
                                            width: "1rem",
                                          }}
                                        />
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-2xl w-full my-8"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: "1.25rem 1.75rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <h3
                className="font-bold"
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                Record Payment
              </h3>
              <button
                onClick={() => {
                  setShowAddPaymentModal(false);
                  setSelectedProjectForPayment(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.375rem",
                  borderRadius: "0.5rem",
                  color: "var(--color-neutral-500)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--color-neutral-100)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                }}
              >
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: "1rem" }} />
              </button>
            </div>

            <div
              style={{
                padding: "1.75rem",
                maxHeight: "calc(100vh - 220px)",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                {/* Project Info Banner */}
                {selectedProjectForPayment &&
                  (() => {
                    const proj = projects.find(
                      (p) => p.id === selectedProjectForPayment,
                    );
                    if (!proj) return null;
                    return (
                      <div
                        className="rounded-xl p-4"
                        style={{
                          backgroundColor: "rgba(26,177,137,0.06)",
                          border: "1px solid rgba(26,177,137,0.2)",
                        }}
                      >
                        <h4
                          className="font-semibold mb-3"
                          style={{
                            fontSize: "0.9rem",
                            color: "var(--color-neutral-900)",
                          }}
                        >
                          {proj.project_name}
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            {
                              label: "Total Budget",
                              value: `$${parseFloat(proj.total_cost || "0").toLocaleString()}`,
                              color: "var(--color-neutral-900)",
                            },
                            {
                              label: "Paid",
                              value: `$${proj.total_paid.toLocaleString()}`,
                              color: "#16a34a",
                            },
                            {
                              label: "Balance",
                              value: `$${proj.balance.toLocaleString()}`,
                              color: "#ea580c",
                            },
                          ].map(({ label, value, color }) => (
                            <div key={label}>
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--color-neutral-500)",
                                  marginBottom: "0.125rem",
                                }}
                              >
                                {label}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.9rem",
                                  fontWeight: 700,
                                  color,
                                }}
                              >
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                {/* Amount */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-neutral-700)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Amount <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold"
                      style={{ color: "var(--color-neutral-500)" }}
                    >
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
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem 0.75rem 2rem",
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-900)",
                        backgroundColor: "var(--color-neutral-0)",
                        border: "1px solid var(--color-neutral-200)",
                        borderRadius: "0.625rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#1ab189";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(26,177,137,0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--color-neutral-200)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                {/* Date + Method */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--color-neutral-700)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Payment Date <span style={{ color: "#ef4444" }}>*</span>
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
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-900)",
                        backgroundColor: "var(--color-neutral-0)",
                        border: "1px solid var(--color-neutral-200)",
                        borderRadius: "0.625rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#1ab189";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(26,177,137,0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--color-neutral-200)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--color-neutral-700)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Payment Method <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          payment_method: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-900)",
                        backgroundColor: "var(--color-neutral-0)",
                        border: "1px solid var(--color-neutral-200)",
                        borderRadius: "0.625rem",
                        outline: "none",
                        cursor: "pointer",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#1ab189";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(26,177,137,0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--color-neutral-200)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
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
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-neutral-700)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Payment Type <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={paymentForm.payment_type}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        payment_type: e.target.value as any,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-900)",
                      backgroundColor: "var(--color-neutral-0)",
                      border: "1px solid var(--color-neutral-200)",
                      borderRadius: "0.625rem",
                      outline: "none",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#1ab189";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(26,177,137,0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--color-neutral-200)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <option value="advance">Advance Payment</option>
                    <option value="milestone">Milestone Payment</option>
                    <option value="final">Final Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Transaction ID */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-neutral-700)",
                      marginBottom: "0.5rem",
                    }}
                  >
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
                    placeholder="Enter transaction ID…"
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-900)",
                      backgroundColor: "var(--color-neutral-0)",
                      border: "1px solid var(--color-neutral-200)",
                      borderRadius: "0.625rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#1ab189";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(26,177,137,0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--color-neutral-200)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-neutral-700)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Notes
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                    placeholder="Add payment notes…"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-900)",
                      backgroundColor: "var(--color-neutral-0)",
                      border: "1px solid var(--color-neutral-200)",
                      borderRadius: "0.625rem",
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#1ab189";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(26,177,137,0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--color-neutral-200)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="flex items-center justify-end gap-3"
              style={{
                padding: "1rem 1.75rem",
                borderTop: "1px solid var(--color-neutral-200)",
                backgroundColor: "var(--color-neutral-50)",
                borderRadius: "0 0 1rem 1rem",
              }}
            >
              <button
                onClick={() => {
                  setShowAddPaymentModal(false);
                  setSelectedProjectForPayment(null);
                }}
                disabled={createPaymentMutation.isPending}
                className="btn btn-ghost btn-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                disabled={createPaymentMutation.isPending}
                className="flex items-center gap-2 btn btn-md"
                style={{
                  backgroundColor: "#1ab189",
                  color: "white",
                  border: "none",
                  opacity: createPaymentMutation.isPending ? 0.6 : 1,
                  cursor: createPaymentMutation.isPending
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {createPaymentMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                      style={{ fontSize: "0.875rem" }}
                    />
                    Recording…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={faPlus}
                      style={{ fontSize: "0.875rem" }}
                    />
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
