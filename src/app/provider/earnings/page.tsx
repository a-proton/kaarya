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
  faRotate,
  faBolt,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useCallback } from "react";
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
  posted_by_name?: string;
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

const fmt = (n: number | string | null | undefined) => {
  if (n === null || n === undefined || n === "") return "0.00";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0.00";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

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

const isEsewa = (method?: string) =>
  method?.toLowerCase().includes("esewa") ?? false;

// ==================================================================================
// PAYMENT METHOD BADGE
// ==================================================================================

function MethodBadge({ method }: { method?: string }) {
  if (!method)
    return <span style={{ color: "var(--color-neutral-400)" }}>—</span>;

  if (isEsewa(method)) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          padding: "0.18rem 0.5rem",
          borderRadius: "0.3rem",
          fontSize: "0.68rem",
          fontWeight: 700,
          backgroundColor: "rgba(96,187,71,0.12)",
          color: "#2d7a1f",
          border: "1px solid rgba(96,187,71,0.3)",
          whiteSpace: "nowrap",
        }}
      >
        <FontAwesomeIcon
          icon={faExternalLinkAlt}
          style={{ fontSize: "0.55rem" }}
        />
        eSewa
      </span>
    );
  }

  return (
    <span
      style={{
        fontSize: "0.8125rem",
        color: "var(--color-neutral-600)",
        whiteSpace: "nowrap",
      }}
    >
      {method}
    </span>
  );
}

// ==================================================================================
// TOAST
// ==================================================================================

function Toast({
  msg,
  type = "success",
  onClose,
}: {
  msg: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}) {
  const colors = {
    success: "#1ab189",
    error: "#ef4444",
    info: "#3b82f6",
  };
  const icons = {
    success: faCheck,
    error: faTimes,
    info: faBolt,
  };

  return (
    <div className="fixed top-5 right-5 z-[60]" style={{ minWidth: "17rem" }}>
      <div
        className="flex items-center gap-3 rounded-2xl px-5 py-3.5"
        style={{
          backgroundColor: "var(--color-neutral-900)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: colors[type] }}
        >
          <FontAwesomeIcon
            icon={icons[type]}
            style={{ color: "white", fontSize: "0.6rem" }}
          />
        </div>
        <p
          className="flex-1 font-medium"
          style={{ fontSize: "0.875rem", color: "white" }}
        >
          {msg}
        </p>
        <button
          onClick={onClose}
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
  );
}

// ==================================================================================
// INPUT STYLES
// ==================================================================================

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  fontFamily: "var(--font-sans)",
  fontSize: "0.875rem",
  color: "var(--color-neutral-900)",
  backgroundColor: "var(--color-neutral-0)",
  border: "1px solid var(--color-neutral-200)",
  borderRadius: "0.625rem",
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 150ms, box-shadow 150ms",
};
const iFocus = (
  e: React.FocusEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >,
) => {
  e.currentTarget.style.borderColor = "#1ab189";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,177,137,0.12)";
};
const iBlur = (
  e: React.FocusEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >,
) => {
  e.currentTarget.style.borderColor = "var(--color-neutral-200)";
  e.currentTarget.style.boxShadow = "none";
};

// ==================================================================================
// LIVE PAYMENT FEED — shows recent eSewa payments streamed in
// ==================================================================================

function LiveFeed({ payments }: { payments: Payment[] }) {
  const recent = payments
    .filter(
      (p) => isEsewa(p.payment_method) && p.payment_status === "completed",
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <div
      className="rounded-2xl mb-5 overflow-hidden"
      style={{
        border: "1px solid rgba(96,187,71,0.25)",
        backgroundColor: "rgba(96,187,71,0.04)",
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{
          borderBottom: "1px solid rgba(96,187,71,0.15)",
          backgroundColor: "rgba(96,187,71,0.08)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: "#60BB47",
            display: "inline-block",
            boxShadow: "0 0 0 2px rgba(96,187,71,0.3)",
            animation: "pulse 2s infinite",
          }}
        />
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#2d7a1f",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Recent eSewa Payments
        </span>
      </div>
      <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
        {recent.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5"
            style={{
              backgroundColor: "rgba(96,187,71,0.1)",
              border: "1px solid rgba(96,187,71,0.2)",
            }}
          >
            <FontAwesomeIcon
              icon={faCheckCircle}
              style={{ color: "#16a34a", fontSize: "0.7rem" }}
            />
            <span
              style={{ fontSize: "0.8rem", fontWeight: 700, color: "#16a34a" }}
            >
              ${fmt(p.amount)}
            </span>
            <span
              style={{ fontSize: "0.72rem", color: "var(--color-neutral-500)" }}
            >
              {new Date(p.created_at).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
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
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  }>({ top: 0, right: 0 });
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState<
    number | null
  >(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [lastPaymentCount, setLastPaymentCount] = useState<
    Record<number, number>
  >({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "Bank Transfer",
    payment_type: "advance",
    transaction_id: "",
    notes: "",
  });

  const notify = (
    msg: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Projects query ───────────────────────────────────────────────────────

  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectsErrorData,
  } = useQuery<ProjectsResponse>({
    queryKey: ["provider-projects", statusFilter],
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

  // ── Payments query — refetchInterval polls every 30s for new eSewa payments ──

  const paymentsQuery = useQuery({
    queryKey: ["provider-all-payments", projectIds],
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
          } catch {
            paymentsMap[projectId] = [];
          }
        }),
      );
      return paymentsMap;
    },
    enabled: projectIds.length > 0,
    // Poll every 30 seconds to catch new eSewa payments from clients
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  // ── Detect new payments and notify ──────────────────────────────────────

  useEffect(() => {
    if (!paymentsQuery.data) return;
    const newCounts: Record<number, number> = {};
    let hasNew = false;

    Object.entries(paymentsQuery.data).forEach(([projectId, payments]) => {
      const pid = Number(projectId);
      const count = payments.length;
      newCounts[pid] = count;

      if (
        lastPaymentCount[pid] !== undefined &&
        count > lastPaymentCount[pid]
      ) {
        const newOnes = payments
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, count - lastPaymentCount[pid]);

        const esewaNew = newOnes.filter((p) => isEsewa(p.payment_method));
        if (esewaNew.length > 0) {
          const total = esewaNew.reduce(
            (s, p) => s + parseFloat(p.amount || "0"),
            0,
          );
          notify(`New eSewa payment received: $${fmt(total)}`, "info");
          hasNew = true;
        }
      }
    });

    if (Object.keys(lastPaymentCount).length > 0) {
      // Already initialized, just update
    }
    setLastPaymentCount(newCounts);
  }, [paymentsQuery.data]);

  // ── Manual refresh ───────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: ["provider-all-payments"],
    });
    await queryClient.invalidateQueries({ queryKey: ["provider-projects"] });
    setTimeout(() => setIsRefreshing(false), 600);
  }, [queryClient]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const projects: ProjectWithPayments[] =
    projectsData?.results.map((project) => {
      const payments = paymentsQuery.data?.[project.id] || [];
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

  const allPayments = projects.flatMap((p) => p.payments);
  const totalEarnings = projects.reduce((sum, p) => sum + p.total_paid, 0);
  const pendingPayments = projects.reduce((sum, p) => sum + p.balance, 0);
  const esewaTotal = allPayments
    .filter(
      (p) => isEsewa(p.payment_method) && p.payment_status === "completed",
    )
    .reduce((s, p) => s + parseFloat(p.amount || "0"), 0);

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

  // ── Mutations ────────────────────────────────────────────────────────────

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
      queryClient.invalidateQueries({ queryKey: ["provider-all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["provider-projects"] });
      setShowAddPaymentModal(false);
      setSelectedProjectForPayment(null);
      setPaymentError(null);
      resetPaymentForm();
      notify("Payment recorded successfully!");
    },
    onError: (error: any) => {
      const d = error?.response?.data;
      const msg = d
        ? typeof d === "object"
          ? (d.error ??
            Object.entries(d)
              .map(([f, e]) => `${f}: ${Array.isArray(e) ? e.join(", ") : e}`)
              .join("; "))
          : String(d)
        : (error?.message ?? "Failed to record payment");
      setPaymentError(msg);
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

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
    setPaymentError(null);
    if (!selectedProjectForPayment) {
      setPaymentError("Please select a project");
      return;
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setPaymentError("Amount must be greater than 0");
      return;
    }
    if (!paymentForm.payment_date) {
      setPaymentError("Payment date is required");
      return;
    }
    createPaymentMutation.mutate({
      projectId: selectedProjectForPayment,
      payment: paymentForm,
    });
  };

  const openAddPaymentModal = (projectId: number) => {
    setSelectedProjectForPayment(projectId);
    setPaymentError(null);
    resetPaymentForm();
    setShowAddPaymentModal(true);
  };

  const handleViewDetails = (projectId: number) => {
    window.location.href = `/provider/earnings/view?id=${projectId}`;
  };

  const getStatusBadge = (status: Project["status"]) => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      completed: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
      in_progress: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
      pending: { bg: "#fefce8", color: "#ca8a04", border: "#fef08a" },
      cancelled: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
      on_hold: { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
    };
    return (
      map[status] ?? { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" }
    );
  };

  const getStatusText = (status: string) =>
    status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (projectsLoading || (paymentsQuery.isLoading && projectIds.length > 0)) {
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

  if (projectsError) {
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
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
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
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh payments"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 0.875rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--color-neutral-700)",
                backgroundColor: "var(--color-neutral-0)",
                border: "1px solid var(--color-neutral-200)",
                borderRadius: "0.625rem",
                cursor: isRefreshing ? "not-allowed" : "pointer",
                opacity: isRefreshing ? 0.6 : 1,
              }}
            >
              <FontAwesomeIcon
                icon={faRotate}
                style={{
                  fontSize: "0.75rem",
                  animation: isRefreshing
                    ? "spin 0.6s linear infinite"
                    : "none",
                }}
              />
              Refresh
            </button>

            {/* Period filter */}
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
          </div>
        </div>
      </div>

      <div style={{ padding: "1.75rem 2rem" }}>
        {/* Live eSewa Feed */}
        <LiveFeed payments={allPayments} />

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
              ${fmt(totalEarnings)}
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
              ${fmt(pendingPayments)}
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
              ${fmt(completedThisMonth)}
            </p>
          </div>

          {/* eSewa Received */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid rgba(96,187,71,0.25)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "rgba(96,187,71,0.1)" }}
            >
              <FontAwesomeIcon
                icon={faExternalLinkAlt}
                style={{ color: "#60BB47", fontSize: "1rem" }}
              />
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-neutral-500)",
                marginBottom: "0.25rem",
              }}
            >
              Received via eSewa
            </p>
            <p
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "#2d7a1f",
                lineHeight: 1,
              }}
            >
              ${fmt(esewaTotal)}
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
            <div className="flex items-center gap-3">
              <h2
                className="font-bold"
                style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
              >
                Projects &amp; Earnings
              </h2>
              {paymentsQuery.isFetching && (
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="animate-spin"
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-neutral-400)",
                  }}
                />
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
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
                onFocus={iFocus}
                onBlur={iBlur}
              />
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
                  minWidth: "60rem",
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
                      "Last Payment",
                      "Balance",
                      "Status",
                      "Actions",
                    ].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.75rem 1.5rem",
                          textAlign: i === 7 ? "center" : "left",
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
                    const lastPayment = [...project.payments]
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime(),
                      )
                      .find((p) => p.payment_status === "completed");

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
                                {project.payments.some((p) =>
                                  isEsewa(p.payment_method),
                                ) && (
                                  <span
                                    style={{
                                      marginLeft: "0.375rem",
                                      padding: "0.1rem 0.3rem",
                                      borderRadius: "0.25rem",
                                      fontSize: "0.6rem",
                                      fontWeight: 700,
                                      backgroundColor: "rgba(96,187,71,0.12)",
                                      color: "#2d7a1f",
                                    }}
                                  >
                                    eSewa ✓
                                  </span>
                                )}
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
                            ${fmt(project.total_cost)}
                          </p>
                        </td>

                        {/* Paid */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <div>
                            <p
                              className="font-semibold whitespace-nowrap"
                              style={{ fontSize: "0.875rem", color: "#16a34a" }}
                            >
                              ${fmt(project.total_paid)}
                            </p>
                            {/* Progress mini-bar */}
                            {parseFloat(project.total_cost || "0") > 0 && (
                              <div
                                style={{
                                  marginTop: "0.25rem",
                                  height: 3,
                                  width: "4rem",
                                  borderRadius: 9999,
                                  backgroundColor: "var(--color-neutral-100)",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (project.total_paid /
                                        parseFloat(project.total_cost)) *
                                        100,
                                    )}%`,
                                    height: "100%",
                                    backgroundColor: "#1ab189",
                                    borderRadius: 9999,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Last Payment Method */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          {lastPayment ? (
                            <div>
                              <MethodBadge
                                method={lastPayment.payment_method}
                              />
                              <p
                                style={{
                                  fontSize: "0.68rem",
                                  color: "var(--color-neutral-400)",
                                  marginTop: "0.2rem",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {new Date(
                                  lastPayment.payment_date,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          ) : (
                            <span
                              style={{
                                color: "var(--color-neutral-400)",
                                fontSize: "0.8rem",
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* Balance */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <p
                            className="font-semibold whitespace-nowrap"
                            style={{
                              fontSize: "0.875rem",
                              color:
                                project.balance <= 0 ? "#16a34a" : "#ea580c",
                            }}
                          >
                            {project.balance <= 0
                              ? "✓ Paid"
                              : `$${fmt(project.balance)}`}
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
                            <div>
                              <button
                                onClick={(e) => {
                                  if (openActionsMenu === project.id) {
                                    setOpenActionsMenu(null);
                                  } else {
                                    const rect = (
                                      e.currentTarget as HTMLButtonElement
                                    ).getBoundingClientRect();
                                    const menuHeight = 120; // approx height of 3 items
                                    const spaceBelow =
                                      window.innerHeight - rect.bottom;
                                    const openUpward =
                                      spaceBelow < menuHeight + 16;
                                    setMenuPosition({
                                      top: openUpward
                                        ? rect.top - menuHeight - 6
                                        : rect.bottom + 6,
                                      right: window.innerWidth - rect.right,
                                    });
                                    setOpenActionsMenu(project.id);
                                  }
                                }}
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
                                    className="fixed rounded-xl overflow-hidden z-[100]"
                                    style={{
                                      top: menuPosition.top,
                                      right: menuPosition.right,
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
                                        icon: faRotate,
                                        color: "#8b5cf6",
                                        label: "Refresh",
                                        onClick: () => {
                                          queryClient.invalidateQueries({
                                            queryKey: ["provider-all-payments"],
                                          });
                                          setOpenActionsMenu(null);
                                          notify("Payments refreshed", "info");
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

          {/* Footer note */}
          {filteredProjects.length > 0 && (
            <div
              style={{
                padding: "0.75rem 1.5rem",
                borderTop: "1px solid var(--color-neutral-100)",
                backgroundColor: "var(--color-neutral-50)",
              }}
            >
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-neutral-400)",
                }}
              >
                Payments auto-refresh every 30 seconds · eSewa payments from
                clients appear automatically
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════ ADD PAYMENT MODAL ════════════════ */}
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
                  setPaymentError(null);
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
                              value: `$${fmt(proj.total_cost)}`,
                              color: "var(--color-neutral-900)",
                            },
                            {
                              label: "Paid",
                              value: `$${fmt(proj.total_paid)}`,
                              color: "#16a34a",
                            },
                            {
                              label: "Balance",
                              value: `$${fmt(proj.balance)}`,
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

                {/* Error */}
                {paymentError && (
                  <div
                    className="rounded-xl p-3 flex items-center gap-2"
                    style={{
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      fontSize: "0.875rem",
                      color: "#dc2626",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      style={{ flexShrink: 0 }}
                    />
                    {paymentError}
                  </div>
                )}

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
                      style={{ ...inputBase, paddingLeft: "2rem" }}
                      onFocus={iFocus}
                      onBlur={iBlur}
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
                      style={inputBase}
                      onFocus={iFocus}
                      onBlur={iBlur}
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
                      style={{ ...inputBase, cursor: "pointer" }}
                      onFocus={iFocus}
                      onBlur={iBlur}
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
                        payment_type: e.target
                          .value as PaymentFormData["payment_type"],
                      })
                    }
                    style={{ ...inputBase, cursor: "pointer" }}
                    onFocus={iFocus}
                    onBlur={iBlur}
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
                    style={inputBase}
                    onFocus={iFocus}
                    onBlur={iBlur}
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
                    style={{ ...inputBase, resize: "none" }}
                    onFocus={iFocus}
                    onBlur={iBlur}
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
                  setPaymentError(null);
                }}
                disabled={createPaymentMutation.isPending}
                style={{
                  padding: "0.5rem 1.125rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-neutral-700)",
                  backgroundColor: "transparent",
                  border: "1px solid var(--color-neutral-200)",
                  borderRadius: "0.625rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                disabled={createPaymentMutation.isPending}
                className="flex items-center gap-2"
                style={{
                  padding: "0.5rem 1.125rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  backgroundColor: "#1ab189",
                  color: "white",
                  border: "none",
                  borderRadius: "0.625rem",
                  cursor: createPaymentMutation.isPending
                    ? "not-allowed"
                    : "pointer",
                  opacity: createPaymentMutation.isPending ? 0.6 : 1,
                  boxShadow: "0 2px 8px rgba(26,177,137,0.3)",
                }}
              >
                {createPaymentMutation.isPending ? (
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin"
                    style={{ fontSize: "0.875rem" }}
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faPlus}
                    style={{ fontSize: "0.875rem" }}
                  />
                )}
                {createPaymentMutation.isPending
                  ? "Recording…"
                  : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
