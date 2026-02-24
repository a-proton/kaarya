"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faEye,
  faCheckCircle,
  faClock,
  faCalendar,
  faReceipt,
  faChartPie,
  faTimes,
  faChevronDown,
  faPlus,
  faCheck,
  faArrowUp,
  faDollarSign,
  faEllipsisVertical,
  faDownload,
  faSpinner,
  faExclamationTriangle,
  faFilter,
  faFileInvoice,
  faExclamationCircle,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { useRouter } from "next/navigation";

// ==================================================================================
// TYPES
// ==================================================================================

interface Payment {
  id: number;
  project: number;
  amount: string;
  payment_date: string;
  payment_method?: string;
  transaction_id?: string;
  payment_type: "advance" | "milestone" | "final" | "other";
  payment_status: "pending" | "completed" | "failed";
  notes?: string;
  posted_by_name: string;
  created_at: string;
}

interface Project {
  id: number;
  project_name: string;
  total_cost: string | null;
  status: string;
  service_provider: {
    id: number;
    full_name: string;
    business_name?: string;
  };
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

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// Two-letter initials from project name
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// Deterministic color per project id — same palette as provider page
const PROJECT_COLORS = [
  "#1ab189",
  "#8b5cf6",
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ec4899",
  "#f97316",
  "#06b6d4",
];
const projectColor = (id: number) => PROJECT_COLORS[id % PROJECT_COLORS.length];

const STATUS_CFG = {
  completed: {
    bg: "#f0fdf4",
    color: "#16a34a",
    border: "#bbf7d0",
    icon: faCheckCircle,
    label: "Completed",
  },
  pending: {
    bg: "#fefce8",
    color: "#ca8a04",
    border: "#fef08a",
    icon: faClock,
    label: "Pending",
  },
  failed: {
    bg: "#fef2f2",
    color: "#dc2626",
    border: "#fecaca",
    icon: faExclamationCircle,
    label: "Failed",
  },
} as const;

const TYPE_CFG: Record<string, { bg: string; color: string; border: string }> =
  {
    advance: {
      bg: "rgba(99,102,241,0.08)",
      color: "#4338ca",
      border: "rgba(99,102,241,0.25)",
    },
    milestone: {
      bg: "rgba(20,184,166,0.08)",
      color: "#0f766e",
      border: "rgba(20,184,166,0.25)",
    },
    final: {
      bg: "rgba(239,68,68,0.08)",
      color: "#b91c1c",
      border: "rgba(239,68,68,0.25)",
    },
    other: {
      bg: "rgba(107,114,128,0.08)",
      color: "#374151",
      border: "rgba(107,114,128,0.25)",
    },
  };

// ==================================================================================
// SMALL SHARED COMPONENTS
// ==================================================================================

function StatusPill({ status }: { status: string }) {
  const s = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.25rem 0.625rem",
        borderRadius: 9999,
        fontSize: "0.7rem",
        fontWeight: 600,
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <FontAwesomeIcon icon={s.icon} style={{ fontSize: "0.58rem" }} />
      {s.label}
    </span>
  );
}

function TypePill({ type }: { type: string }) {
  const t = TYPE_CFG[type] ?? TYPE_CFG.other;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.2rem 0.5rem",
        borderRadius: "0.3rem",
        fontSize: "0.7rem",
        fontWeight: 600,
        textTransform: "capitalize",
        backgroundColor: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {type}
    </span>
  );
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
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

// Input base — longhands to avoid React border/borderColor conflict warning
const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  fontFamily: "var(--font-sans)",
  fontSize: "0.875rem",
  color: "var(--color-neutral-900)",
  backgroundColor: "var(--color-neutral-0)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--color-neutral-200)",
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
// MAIN PAGE
// ==================================================================================

export default function ClientPaymentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [openActionsMenu, setOpenActionsMenu] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [form, setForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "Bank Transfer",
    payment_type: "advance",
    transaction_id: "",
    notes: "",
  });

  const resetForm = () =>
    setForm({
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "Bank Transfer",
      payment_type: "advance",
      transaction_id: "",
      notes: "",
    });

  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ── Queries ──────────────────────────────────────────────────────────────

  const {
    data: projectsRes,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => {
      if (!isAuthenticated()) {
        router.push("/login?type=client&session=expired");
        throw new Error("Not authenticated");
      }
      return api.get<{ count: number; results: Project[] } | Project[]>(
        "/api/v1/projects/",
      );
    },
  });

  const projects: Project[] = Array.isArray(projectsRes)
    ? projectsRes
    : ((projectsRes as any)?.results ?? []);

  const { data: paymentsRes, isLoading: paymentsLoading } = useQuery({
    queryKey: ["project-payments", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return { results: [] as Payment[] };
      return api.get<{ count: number; results: Payment[] }>(
        `/api/v1/projects/${selectedProject}/payments/`,
      );
    },
    enabled: !!selectedProject,
  });

  const payments: Payment[] = Array.isArray(paymentsRes)
    ? (paymentsRes as unknown as Payment[])
    : ((paymentsRes as any)?.results ?? []);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject)
      setSelectedProject(projects[0].id);
  }, [projects, selectedProject]);

  // ── Mutation ─────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (!selectedProject) throw new Error("No project selected");
      const body: Record<string, unknown> = {
        amount: parseFloat(data.amount),
        payment_date: data.payment_date,
        payment_type: data.payment_type,
        payment_status: "completed",
      };
      if (data.payment_method.trim()) body.payment_method = data.payment_method;
      if (data.transaction_id.trim()) body.transaction_id = data.transaction_id;
      if (data.notes.trim()) body.notes = data.notes;
      return api.post(
        `/api/v1/projects/${selectedProject}/payments/record/`,
        body,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-payments"] });
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      setShowPaymentModal(false);
      setPaymentError(null);
      resetForm();
      notify("Payment recorded successfully!");
    },
    onError: (error: any) => {
      let msg = "Failed to record payment";
      const d = error?.response?.data;
      if (d)
        msg =
          typeof d === "object"
            ? (d.error ??
              Object.entries(d)
                .map(([f, e]) => `${f}: ${Array.isArray(e) ? e.join(", ") : e}`)
                .join("; "))
            : String(d);
      else if (error?.message) msg = error.message;
      setPaymentError(msg);
    },
  });

  const handleSubmit = () => {
    setPaymentError(null);
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setPaymentError("Amount must be greater than 0");
      return;
    }
    if (!form.payment_date) {
      setPaymentError("Payment date is required");
      return;
    }
    mutation.mutate(form);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentProject = projects.find((p) => p.id === selectedProject);
  const totalPaid = payments
    .filter((p) => p.payment_status === "completed")
    .reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
  const totalCost = parseFloat(currentProject?.total_cost ?? "0") || 0;
  const amountDue = Math.max(0, totalCost - totalPaid);
  const progressPct =
    totalCost > 0 ? Math.min(100, (totalPaid / totalCost) * 100) : 0;
  const filtered =
    filterStatus === "all"
      ? payments
      : payments.filter((p) => p.payment_status === filterStatus);

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (projectsLoading)
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
            Loading payments…
          </p>
        </div>
      </div>
    );

  if (projectsError)
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
            Failed to load payment data
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.5rem 1.25rem",
              background: "#1ab189",
              color: "#fff",
              border: "none",
              borderRadius: "0.625rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );

  // ==================================================================================
  // RENDER
  // ==================================================================================

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-neutral-50)" }}
    >
      {showToast && (
        <Toast msg={toastMsg} onClose={() => setShowToast(false)} />
      )}

      {/* ─────────────────────────────────────────────────────────────────
          CONTENT AREA — white card with padding, exactly like provider page
          ───────────────────────────────────────────────────────────────── */}
      <div style={{ padding: "1.75rem 2rem" }}>
        {/* ── Page title row (matches "Earnings" heading + "This Month / Export" buttons) ── */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: "1.625rem",
                color: "var(--color-neutral-900)",
                lineHeight: 1.25,
                marginBottom: "0.25rem",
              }}
            >
              Payments &amp; Invoices
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-500)",
              }}
            >
              Track your project costs and payment history
              {projects.length > 0 &&
                ` (${projects.length} project${projects.length !== 1 ? "s" : ""})`}
            </p>
          </div>
          <button
            onClick={() => {
              setShowPaymentModal(true);
              setPaymentError(null);
            }}
            disabled={projects.length === 0}
            className="flex items-center gap-2"
            style={{
              padding: "0.5625rem 1.125rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              backgroundColor:
                projects.length === 0 ? "var(--color-neutral-200)" : "#1ab189",
              color: "white",
              border: "none",
              borderRadius: "0.625rem",
              cursor: projects.length === 0 ? "not-allowed" : "pointer",
              boxShadow:
                projects.length === 0
                  ? "none"
                  : "0 2px 8px rgba(26,177,137,0.3)",
            }}
          >
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: "0.8rem" }} />
            Record Payment
          </button>
        </div>

        {/* No projects notice */}
        {projects.length === 0 && (
          <div
            className="flex items-center gap-3 rounded-xl mb-6"
            style={{
              padding: "0.875rem 1.25rem",
              backgroundColor: "#fefce8",
              border: "1px solid #fef08a",
              fontSize: "0.875rem",
              color: "#92400e",
            }}
          >
            <FontAwesomeIcon icon={faExclamationTriangle} />
            No projects linked yet. Payments will appear here once a project has
            been assigned.
          </div>
        )}

        {/* ── Stat Cards — 4-column layout matching provider page exactly ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1 — green accent (Total Project Cost) matches provider "Total Earnings" card */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              backgroundColor: "#1ab189",
              boxShadow: "0 4px 20px rgba(26,177,137,0.25)",
            }}
          >
            {/* top-right badge */}
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <FontAwesomeIcon
                  icon={faChartPie}
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
                  {Math.round(progressPct)}%
                </span>
              </div>
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.8)",
                marginBottom: "0.25rem",
              }}
            >
              Total Project Cost
            </p>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "white",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              ${fmt(totalCost)}
            </p>
            {/* mini progress bar */}
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <div
                style={{
                  height: 4,
                  borderRadius: 9999,
                  backgroundColor: "rgba(255,255,255,0.3)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: "100%",
                    backgroundColor: "white",
                    borderRadius: 9999,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 2 — Amount Paid (matches provider "Pending Payments" white card layout) */}
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
              Amount Paid
            </p>
            <p
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "#16a34a",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              ${fmt(totalPaid)}
            </p>
          </div>

          {/* Card 3 — Amount Due */}
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
              Amount Due
            </p>
            <p
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                color: amountDue > 0 ? "#ca8a04" : "#16a34a",
              }}
            >
              ${fmt(amountDue)}
            </p>
          </div>

          {/* Card 4 — Transactions */}
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
              Transactions
            </p>
            <p
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "var(--color-neutral-900)",
                lineHeight: 1,
              }}
            >
              {payments.length}
            </p>
          </div>
        </div>

        {/* ── Payment History table card (matches "Projects & Earnings" table card) ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--color-neutral-0)",
            border: "1px solid var(--color-neutral-200)",
          }}
        >
          {/* Table toolbar */}
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
              Payment History
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Project selector — only shown when >1 project */}
              {projects.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedProject || ""}
                    onChange={(e) => setSelectedProject(Number(e.target.value))}
                    style={{
                      appearance: "none",
                      padding: "0.5rem 2.25rem 0.5rem 1rem",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.8125rem",
                      color: "var(--color-neutral-700)",
                      backgroundColor: "var(--color-neutral-0)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "var(--color-neutral-200)",
                      borderRadius: "0.625rem",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_name}
                      </option>
                    ))}
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-neutral-400)",
                      fontSize: "0.65rem",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              )}

              {/* Status filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    appearance: "none",
                    padding: "0.5rem 2.25rem 0.5rem 1rem",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.8125rem",
                    color: "var(--color-neutral-700)",
                    backgroundColor: "var(--color-neutral-0)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--color-neutral-200)",
                    borderRadius: "0.625rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">All Payments</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-neutral-400)",
                    fontSize: "0.65rem",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            {paymentsLoading ? (
              <div
                className="flex items-center justify-center"
                style={{ padding: "4rem 2rem" }}
              >
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="animate-spin"
                  style={{ fontSize: "1.5rem", color: "#1ab189" }}
                />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center" style={{ padding: "4rem 2rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💳</div>
                <h3
                  className="font-semibold mb-2"
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  No payments found
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-500)",
                  }}
                >
                  {filterStatus !== "all"
                    ? "Try adjusting your filter"
                    : "Record your first payment above"}
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
                    {/* Headers match provider page: PROJECT CLIENT TOTAL COST PAID BALANCE STATUS ACTIONS */}
                    {[
                      "Payment",
                      "Type",
                      "Date",
                      "Method",
                      "Amount",
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
                  {filtered.map((payment, idx) => (
                    <tr
                      key={payment.id}
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
                      {/* Payment — coloured avatar initials pill, exactly like BR / EP / BU in provider table */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: projectColor(payment.id),
                              color: "white",
                              fontSize: "0.75rem",
                              letterSpacing: "0.02em",
                            }}
                          >
                            {getInitials(
                              payment.payment_type === "advance"
                                ? "Advance Payment"
                                : payment.payment_type === "milestone"
                                  ? "Milestone Payment"
                                  : payment.payment_type === "final"
                                    ? "Final Payment"
                                    : "Other Payment",
                            )}
                          </div>
                          <div>
                            <p
                              className="font-semibold"
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--color-neutral-900)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {payment.payment_type.charAt(0).toUpperCase() +
                                payment.payment_type.slice(1)}{" "}
                              Payment
                            </p>
                            <p
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--color-neutral-400)",
                                marginTop: "0.1rem",
                              }}
                            >
                              {
                                payments.filter(
                                  (p) =>
                                    p.payment_type === payment.payment_type,
                                ).length
                              }{" "}
                              transaction
                              {payments.filter(
                                (p) => p.payment_type === payment.payment_type,
                              ).length !== 1
                                ? "s"
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type pill */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <TypePill type={payment.payment_type} />
                      </td>

                      {/* Date */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--color-neutral-700)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fmtDate(payment.payment_date)}
                        </span>
                      </td>

                      {/* Method */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--color-neutral-700)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {payment.payment_method || "—"}
                        </span>
                      </td>

                      {/* Amount — green like "Paid" column in provider, orange for pending */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <p
                          className="font-semibold"
                          style={{
                            fontSize: "0.875rem",
                            whiteSpace: "nowrap",
                            color:
                              payment.payment_status === "completed"
                                ? "#16a34a"
                                : payment.payment_status === "failed"
                                  ? "#dc2626"
                                  : "#ca8a04",
                          }}
                        >
                          ${fmt(payment.amount)}
                        </p>
                        {payment.transaction_id && (
                          <p
                            style={{
                              fontSize: "0.68rem",
                              color: "var(--color-neutral-400)",
                              fontFamily: "monospace",
                              marginTop: "0.1rem",
                            }}
                          >
                            #{payment.transaction_id}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <StatusPill status={payment.payment_status} />
                      </td>

                      {/* Actions — same ⋮ menu as provider */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <div className="flex justify-center">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenActionsMenu(
                                  openActionsMenu === payment.id
                                    ? null
                                    : payment.id,
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
                            {openActionsMenu === payment.id && (
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
                                      label: "View Receipt",
                                      onClick: () => {
                                        setSelectedPayment(payment);
                                        setShowReceiptModal(true);
                                        setOpenActionsMenu(null);
                                      },
                                    },
                                    {
                                      icon: faDownload,
                                      color: "#2563eb",
                                      label: "Download",
                                      onClick: () => {
                                        setOpenActionsMenu(null);
                                        alert("Download coming soon");
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
                                        ).style.backgroundColor = "transparent";
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
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          RECORD PAYMENT MODAL
          ════════════════════════════════════════════ */}
      {showPaymentModal && (
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
                  setShowPaymentModal(false);
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
                {/* Project info banner */}
                {currentProject && (
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
                      {currentProject.project_name}
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        {
                          label: "Total Budget",
                          value: `$${fmt(totalCost)}`,
                          color: "var(--color-neutral-900)",
                        },
                        {
                          label: "Paid",
                          value: `$${fmt(totalPaid)}`,
                          color: "#16a34a",
                        },
                        {
                          label: "Balance",
                          value: `$${fmt(amountDue)}`,
                          color: "#ea580c",
                        },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <p
                            style={{
                              fontSize: "0.72rem",
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
                )}

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
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: e.target.value })
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
                      value={form.payment_date}
                      onChange={(e) =>
                        setForm({ ...form, payment_date: e.target.value })
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
                      Payment Method
                    </label>
                    <select
                      value={form.payment_method}
                      onChange={(e) =>
                        setForm({ ...form, payment_method: e.target.value })
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
                    value={form.payment_type}
                    onChange={(e) =>
                      setForm({ ...form, payment_type: e.target.value })
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
                    value={form.transaction_id}
                    onChange={(e) =>
                      setForm({ ...form, transaction_id: e.target.value })
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
                    value={form.notes}
                    rows={3}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="Add payment notes…"
                    style={{ ...inputBase, resize: "none" }}
                    onFocus={iFocus}
                    onBlur={iBlur}
                  />
                </div>
              </div>
            </div>

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
                  setShowPaymentModal(false);
                  setPaymentError(null);
                }}
                disabled={mutation.isPending}
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
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="flex items-center gap-2"
                style={{
                  padding: "0.5rem 1.125rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  backgroundColor: "#1ab189",
                  color: "white",
                  border: "none",
                  borderRadius: "0.625rem",
                  cursor: mutation.isPending ? "not-allowed" : "pointer",
                  opacity: mutation.isPending ? 0.6 : 1,
                }}
              >
                {mutation.isPending ? (
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

      {/* ════════════════════════════════════════════
          RECEIPT MODAL
          ════════════════════════════════════════════ */}
      {showReceiptModal && selectedPayment && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-lg w-full"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            {/* Green gradient header */}
            <div
              className="relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #1ab189 0%, #0e9370 100%)",
                padding: "1.75rem 2rem",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <p
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.7)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Payment Receipt
                  </p>
                  <p
                    style={{
                      fontSize: "2.25rem",
                      fontWeight: 800,
                      color: "white",
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    ${fmt(selectedPayment.amount)}
                  </p>
                </div>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "0.5rem",
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faTimes}
                    style={{ fontSize: "0.75rem" }}
                  />
                </button>
              </div>
              <div
                className="flex items-center gap-3 mt-3"
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.8)",
                  flexWrap: "wrap",
                }}
              >
                <span>#{selectedPayment.id}</span>
                <span>·</span>
                <span>{fmtDate(selectedPayment.payment_date)}</span>
                <span>·</span>
                <StatusPill status={selectedPayment.payment_status} />
              </div>
            </div>

            <div style={{ padding: "1.5rem 2rem" }}>
              {/* Project badge */}
              {currentProject && (
                <div
                  className="flex items-center gap-2 rounded-xl mb-4 p-3"
                  style={{
                    backgroundColor: "rgba(26,177,137,0.06)",
                    border: "1px solid rgba(26,177,137,0.15)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFileInvoice}
                    style={{ color: "#1ab189", fontSize: "0.875rem" }}
                  />
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-neutral-800)",
                    }}
                  >
                    {currentProject.project_name}
                  </span>
                </div>
              )}

              {/* Detail rows */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--color-neutral-200)" }}
              >
                {[
                  {
                    label: "Payment Type",
                    value:
                      selectedPayment.payment_type.charAt(0).toUpperCase() +
                      selectedPayment.payment_type.slice(1),
                  },
                  ...(selectedPayment.payment_method
                    ? [
                        {
                          label: "Method",
                          value: selectedPayment.payment_method,
                        },
                      ]
                    : []),
                  ...(selectedPayment.transaction_id
                    ? [
                        {
                          label: "Transaction ID",
                          value: selectedPayment.transaction_id,
                          mono: true,
                        },
                      ]
                    : []),
                  {
                    label: "Recorded by",
                    value: selectedPayment.posted_by_name,
                  },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom:
                        i < arr.length - 1
                          ? "1px solid var(--color-neutral-100)"
                          : "none",
                      backgroundColor:
                        i % 2 === 0
                          ? "var(--color-neutral-0)"
                          : "var(--color-neutral-50)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--color-neutral-900)",
                        fontFamily: (row as any).mono ? "monospace" : "inherit",
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
                <div
                  className="flex items-center justify-between"
                  style={{
                    padding: "0.875rem 1rem",
                    backgroundColor: "var(--color-neutral-50)",
                    borderTop: "2px solid var(--color-neutral-200)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "#1ab189",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    ${fmt(selectedPayment.amount)}
                  </span>
                </div>
              </div>

              {selectedPayment.notes && (
                <div
                  className="rounded-xl mt-4 p-3"
                  style={{
                    backgroundColor: "var(--color-neutral-50)",
                    border: "1px solid var(--color-neutral-200)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--color-neutral-400)",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Notes
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-700)",
                      lineHeight: 1.5,
                    }}
                  >
                    {selectedPayment.notes}
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowReceiptModal(false)}
                style={{
                  width: "100%",
                  marginTop: "1.25rem",
                  padding: "0.75rem",
                  backgroundColor: "var(--color-neutral-100)",
                  border: "none",
                  borderRadius: "0.625rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-neutral-700)",
                  cursor: "pointer",
                }}
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
