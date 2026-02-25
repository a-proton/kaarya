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
  faImage,
  faBox,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* ─────────────────────────────────────────── */
/* Types                                        */
/* ─────────────────────────────────────────── */
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
  site_location: unknown;
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
  params: Promise<{ id: string }>;
}

type TabKey = "overview" | "updates" | "inventory" | "payments" | "team";

/* ─────────────────────────────────────────── */
/* Status helpers                              */
/* ─────────────────────────────────────────── */
const STATUS_BADGE: Record<string, { bg: string; color: string; bar: string }> =
  {
    in_progress: { bg: "#eff6ff", color: "#1d4ed8", bar: "#3b82f6" },
    completed: { bg: "rgba(26,177,137,0.1)", color: "#1ab189", bar: "#1ab189" },
    not_started: { bg: "#fefce8", color: "#a16207", bar: "#eab308" },
    pending: { bg: "#fefce8", color: "#a16207", bar: "#eab308" },
    on_hold: { bg: "#fff7ed", color: "#c2410c", bar: "#f97316" },
    cancelled: { bg: "#fef2f2", color: "#b91c1c", bar: "#ef4444" },
  };

const MILESTONE_BADGE: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#fefce8", color: "#a16207" },
  in_progress: { bg: "#eff6ff", color: "#1d4ed8" },
  completed: { bg: "rgba(26,177,137,0.1)", color: "#1ab189" },
};

const EMPLOYEE_COLORS = [
  "#1ab189",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
  "#06b6d4",
  "#f97316",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

const getStatusBadge = (s: string) =>
  STATUS_BADGE[s] ?? {
    bg: "var(--color-neutral-100)",
    color: "var(--color-neutral-600)",
    bar: "var(--color-neutral-400)",
  };
const getMilestoneBadge = (s: string) =>
  MILESTONE_BADGE[s] ?? {
    bg: "var(--color-neutral-100)",
    color: "var(--color-neutral-600)",
  };
const employeeColor = (id: number) =>
  EMPLOYEE_COLORS[id % EMPLOYEE_COLORS.length];

const getMilestoneIcon = (status: string) => {
  if (status === "completed") return faCheckCircle;
  if (status === "in_progress") return faChartLine;
  return faCalendar;
};

const formatCurrency = (amount: string | number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);

const getInitials = (name: string) => {
  const parts = name.split(" ");
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const calculateProgress = (p: ProjectDetail) => {
  if (p.status === "completed") return 100;
  if (p.status === "not_started" || p.status === "pending") return 0;
  const start = new Date(p.start_date).getTime();
  const end = new Date(p.expected_end_date).getTime();
  const now = Date.now();
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
};

/* ─────────────────────────────────────────── */
/* Shared style helpers                         */
/* ─────────────────────────────────────────── */
const card: React.CSSProperties = {
  backgroundColor: "var(--color-neutral-0)",
  border: "1px solid var(--color-neutral-200)",
  borderRadius: "1rem",
};

function InfoRow({
  icon,
  label,
  children,
  border = true,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className="flex items-start gap-3"
      style={{
        paddingBottom: border ? "1rem" : 0,
        marginBottom: border ? "1rem" : 0,
        borderBottom: border ? "1px solid var(--color-neutral-100)" : "none",
      }}
    >
      <span
        style={{
          color: "#1ab189",
          marginTop: "2px",
          fontSize: "0.85rem",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold tracking-wider uppercase mb-0.5"
          style={{ fontSize: "0.65rem", color: "var(--color-neutral-400)" }}
        >
          {label}
        </p>
        <div
          className="font-semibold"
          style={{ fontSize: "0.875rem", color: "var(--color-neutral-900)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function ViewProjectPage({ params }: PageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewingMilestone, setViewingMilestone] = useState<Milestone | null>(
    null,
  );
  const [viewingUpdate, setViewingUpdate] = useState<ProjectUpdate | null>(
    null,
  );

  /* ── Queries ── */
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery<ProjectDetail>({
    queryKey: ["project", projectId],
    queryFn: () => api.get<ProjectDetail>(`/api/v1/projects/${projectId}/`),
    enabled: !!projectId,
  });

  const { data: summary } = useQuery<ProjectSummary>({
    queryKey: ["project-summary", projectId],
    queryFn: () =>
      api.get<ProjectSummary>(`/api/v1/projects/${projectId}/summary/`),
    enabled: !!projectId,
  });

  const { data: allUpdates } = useQuery<{
    count: number;
    results: ProjectUpdate[];
  }>({
    queryKey: ["project-updates", projectId],
    queryFn: () => api.get(`/api/v1/projects/${projectId}/updates/`),
    enabled: !!projectId && activeTab === "updates",
  });

  const { data: inventory } = useQuery<{
    count: number;
    results: InventoryItem[];
  }>({
    queryKey: ["project-inventory", projectId],
    queryFn: () => api.get(`/api/v1/projects/${projectId}/inventory/`),
    enabled: !!projectId && activeTab === "inventory",
  });

  const { data: payments } = useQuery<{ count: number; results: Payment[] }>({
    queryKey: ["project-payments", projectId],
    queryFn: () => api.get(`/api/v1/projects/${projectId}/payments/`),
    enabled: !!projectId && activeTab === "payments",
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["project-employees", projectId],
    queryFn: () => api.get(`/api/v1/projects/${projectId}/employees/`),
    enabled: !!projectId && activeTab === "team",
  });

  /* ── Mutations ── */
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/v1/projects/${projectId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/provider/projects");
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Failed to delete: ${e.data?.detail ?? e.message ?? "Unknown error"}`,
      );
    },
  });

  /* ── Loading / Error ── */
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
            Loading project details…
          </p>
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div
          className="rounded-2xl p-8 text-center max-w-md w-full"
          style={{ ...card, border: "1px solid #fecaca" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#fef2f2" }}
          >
            <FontAwesomeIcon
              icon={faTimes}
              style={{ color: "#ef4444", fontSize: "1rem" }}
            />
          </div>
          <h3
            className="font-semibold mb-2"
            style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
          >
            Error Loading Project
          </h3>
          <p
            className="mb-5"
            style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}
          >
            {error instanceof Error ? error.message : "Failed to load project"}
          </p>
          <button
            onClick={() => router.push("/provider/projects")}
            className="btn btn-primary btn-md"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const completedMilestones = project.milestones.filter(
    (m) => m.status === "completed",
  ).length;
  const progress = calculateProgress(project);
  const statusBadge = getStatusBadge(project.status);

  const TABS: {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    count: string | number;
  }[] = [
    {
      key: "overview",
      label: "Overview",
      icon: <FontAwesomeIcon icon={faFileAlt} />,
      count: "",
    },
    {
      key: "updates",
      label: "Updates",
      icon: <FontAwesomeIcon icon={faImage} />,
      count: allUpdates?.count ?? project.recent_updates.length,
    },
    {
      key: "inventory",
      label: "Inventory",
      icon: <FontAwesomeIcon icon={faBox} />,
      count: inventory?.count ?? 0,
    },
    {
      key: "payments",
      label: "Payments",
      icon: <FontAwesomeIcon icon={faCreditCard} />,
      count: payments?.count ?? project.payment_summary.payment_count,
    },
    {
      key: "team",
      label: "Team",
      icon: <FontAwesomeIcon icon={faUsers} />,
      count: employees?.length ?? 0,
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-neutral-50)" }}
    >
      {/* Page header */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.125rem 2rem",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/provider/projects")}
              aria-label="Go back"
              style={{
                width: "2.25rem",
                height: "2.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
                border: "1px solid var(--color-neutral-200)",
                borderRadius: "0.625rem",
                cursor: "pointer",
                color: "var(--color-neutral-500)",
                flexShrink: 0,
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
              <FontAwesomeIcon
                icon={faArrowLeft}
                style={{ fontSize: "0.85rem" }}
              />
            </button>
            <div>
              <h1
                className="font-bold"
                style={{
                  fontSize: "1.375rem",
                  color: "var(--color-neutral-900)",
                  lineHeight: 1.2,
                }}
              >
                {project.project_name}
              </h1>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-neutral-500)",
                  marginTop: "0.125rem",
                }}
              >
                Project Details &amp; Progress
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() =>
                router.push(`/provider/projects/${projectId}/edit`)
              }
              className="btn btn-secondary btn-md flex items-center gap-2"
            >
              <FontAwesomeIcon
                icon={faPenToSquare}
                style={{ fontSize: "0.8rem" }}
              />
              Edit Project
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-md flex items-center gap-2"
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#dc2626";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#ef4444";
              }}
            >
              <FontAwesomeIcon icon={faTrash} style={{ fontSize: "0.8rem" }} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{ padding: "1.75rem 2rem", maxWidth: "80rem", margin: "0 auto" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Main col ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Status card */}
            <div style={{ ...card, padding: "1.5rem" }}>
              <div className="flex items-center justify-between mb-5">
                <h2
                  className="font-semibold"
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  Project Status
                </h2>
                <span
                  className="rounded-full font-semibold"
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.3rem 0.75rem",
                    backgroundColor: statusBadge.bg,
                    color: statusBadge.color,
                  }}
                >
                  {project.status_display}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex justify-between mb-2">
                  <span
                    className="font-medium"
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-neutral-600)",
                    }}
                  >
                    Overall Progress
                  </span>
                  <span
                    className="font-bold"
                    style={{
                      fontSize: "1rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {progress}%
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "0.5rem",
                    backgroundColor: "var(--color-neutral-150)",
                    borderRadius: "9999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      backgroundColor: statusBadge.bar,
                      borderRadius: "9999px",
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Start Date", date: project.start_date },
                  { label: "Expected End", date: project.expected_end_date },
                ].map(({ label, date }) => (
                  <div
                    key={label}
                    style={{
                      backgroundColor: "var(--color-neutral-50)",
                      border: "1px solid var(--color-neutral-200)",
                      borderRadius: "0.75rem",
                      padding: "1rem",
                    }}
                  >
                    <p
                      className="font-semibold mb-1"
                      style={{
                        fontSize: "0.68rem",
                        color: "#1ab189",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      className="font-semibold"
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      {new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            <div style={{ ...card, padding: "1.5rem" }}>
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                >
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    style={{ color: "#1ab189", fontSize: "0.875rem" }}
                  />
                </div>
                <h2
                  className="font-semibold"
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  Financial Summary
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  {
                    label: "Total Value",
                    value: formatCurrency(project.total_cost),
                    color: "#1ab189",
                    bg: "rgba(26,177,137,0.06)",
                    border: "rgba(26,177,137,0.2)",
                  },
                  {
                    label: "Amount Paid",
                    value: formatCurrency(project.payment_summary.total_paid),
                    color: "#3b82f6",
                    bg: "#eff6ff",
                    border: "#bfdbfe",
                  },
                  {
                    label: "Balance",
                    value: formatCurrency(project.balance_payment),
                    color: "#f59e0b",
                    bg: "#fefce8",
                    border: "#fef08a",
                  },
                ].map(({ label, value, color, bg, border }) => (
                  <div
                    key={label}
                    style={{
                      backgroundColor: bg,
                      border: `1px solid ${border}`,
                      borderRadius: "0.75rem",
                      padding: "1rem",
                    }}
                  >
                    <p
                      className="font-semibold mb-1"
                      style={{
                        fontSize: "0.7rem",
                        color,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      className="font-bold"
                      style={{
                        fontSize: "1.25rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {parseFloat(project.advance_payment) > 0 && (
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: "rgba(26,177,137,0.06)",
                    border: "1px solid rgba(26,177,137,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      style={{ color: "#1ab189", fontSize: "0.875rem" }}
                    />
                    <span
                      className="font-semibold"
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      Advance Payment Received
                    </span>
                  </div>
                  <span
                    className="font-bold"
                    style={{ fontSize: "1rem", color: "#1ab189" }}
                  >
                    {formatCurrency(project.advance_payment)}
                  </span>
                </div>
              )}

              {summary && (
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3 mt-3"
                  style={{
                    backgroundColor: "var(--color-neutral-50)",
                    border: "1px solid var(--color-neutral-200)",
                  }}
                >
                  <span
                    className="font-medium"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-600)",
                    }}
                  >
                    Total Inventory Cost
                  </span>
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {formatCurrency(summary.financial.total_inventory_cost)}
                  </span>
                </div>
              )}
            </div>

            {/* Tabs card */}
            <div style={card}>
              {/* Tab headers */}
              <div
                style={{
                  borderBottom: "1px solid var(--color-neutral-200)",
                  padding: "0 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  overflowX: "auto",
                }}
              >
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.875rem 1rem",
                        fontSize: "0.8125rem",
                        fontWeight: isActive ? 600 : 500,
                        color: isActive
                          ? "#1ab189"
                          : "var(--color-neutral-500)",
                        background: "none",
                        border: "none",
                        borderBottom: isActive
                          ? "2px solid #1ab189"
                          : "2px solid transparent",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "color 150ms",
                      }}
                    >
                      <span style={{ fontSize: "0.75rem" }}>{tab.icon}</span>
                      {tab.label}
                      {tab.count !== "" && tab.count !== 0 && (
                        <span
                          className="rounded-full font-bold"
                          style={{
                            fontSize: "0.6rem",
                            padding: "0.15rem 0.45rem",
                            backgroundColor: isActive
                              ? "rgba(26,177,137,0.12)"
                              : "var(--color-neutral-100)",
                            color: isActive
                              ? "#1ab189"
                              : "var(--color-neutral-500)",
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div style={{ padding: "1.5rem" }}>
                {/* Overview */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3
                        className="font-semibold mb-2"
                        style={{
                          fontSize: "0.9375rem",
                          color: "var(--color-neutral-900)",
                        }}
                      >
                        Project Description
                      </h3>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-neutral-700)",
                          lineHeight: 1.7,
                        }}
                      >
                        {project.description || "No description provided."}
                      </p>
                    </div>

                    {/* Milestones */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3
                          className="font-semibold"
                          style={{
                            fontSize: "0.9375rem",
                            color: "var(--color-neutral-900)",
                          }}
                        >
                          Milestones{" "}
                          {project.milestones.length > 0 && (
                            <span
                              style={{
                                fontWeight: 400,
                                fontSize: "0.8rem",
                                color: "var(--color-neutral-500)",
                              }}
                            >
                              ({completedMilestones}/{project.milestones.length}{" "}
                              completed)
                            </span>
                          )}
                        </h3>
                      </div>

                      {project.milestones.length > 0 ? (
                        <div className="space-y-2.5">
                          {project.milestones.map((m) => {
                            const mb = getMilestoneBadge(m.status);
                            return (
                              <div
                                key={m.id}
                                className="flex items-center justify-between rounded-xl px-4 py-3"
                                style={{
                                  border: "1px solid var(--color-neutral-200)",
                                  backgroundColor: "var(--color-neutral-50)",
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLDivElement
                                  ).style.borderColor = "#1ab189";
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLDivElement
                                  ).style.borderColor =
                                    "var(--color-neutral-200)";
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                      backgroundColor: mb.bg,
                                      color: mb.color,
                                    }}
                                  >
                                    <FontAwesomeIcon
                                      icon={getMilestoneIcon(m.status)}
                                      style={{ fontSize: "0.8rem" }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4
                                      className="font-semibold truncate"
                                      style={{
                                        fontSize: "0.875rem",
                                        color: "var(--color-neutral-900)",
                                      }}
                                    >
                                      {m.title}
                                    </h4>
                                    <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                                      <span
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "var(--color-neutral-500)",
                                        }}
                                      >
                                        <FontAwesomeIcon
                                          icon={faCalendar}
                                          style={{
                                            fontSize: "0.65rem",
                                            marginRight: "0.25rem",
                                          }}
                                        />
                                        {new Date(
                                          m.target_date,
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </span>
                                      <span
                                        className="rounded-full font-semibold"
                                        style={{
                                          fontSize: "0.65rem",
                                          padding: "0.15rem 0.5rem",
                                          backgroundColor: mb.bg,
                                          color: mb.color,
                                        }}
                                      >
                                        {m.status_display}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "var(--color-neutral-500)",
                                        }}
                                      >
                                        {m.completion_percentage}% complete
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setViewingMilestone(m)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#1ab189",
                                    padding: "0.375rem",
                                    borderRadius: "0.5rem",
                                    flexShrink: 0,
                                  }}
                                  onMouseEnter={(e) => {
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.backgroundColor =
                                      "rgba(26,177,137,0.1)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.backgroundColor = "transparent";
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={faEye}
                                    style={{ fontSize: "0.8rem" }}
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          className="text-center py-10"
                          style={{ color: "var(--color-neutral-400)" }}
                        >
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            style={{
                              fontSize: "2.5rem",
                              marginBottom: "0.75rem",
                              opacity: 0.3,
                            }}
                          />
                          <p style={{ fontSize: "0.875rem" }}>
                            No milestones added yet
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Recent updates */}
                    {project.recent_updates.length > 0 && (
                      <div>
                        <h3
                          className="font-semibold mb-3"
                          style={{
                            fontSize: "0.9375rem",
                            color: "var(--color-neutral-900)",
                          }}
                        >
                          Recent Updates
                        </h3>
                        <div className="space-y-3">
                          {project.recent_updates.map((u) => (
                            <div
                              key={u.id}
                              className="rounded-xl p-4"
                              style={{
                                border: "1px solid var(--color-neutral-200)",
                                backgroundColor: "var(--color-neutral-50)",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  color: "var(--color-neutral-700)",
                                }}
                              >
                                {u.update_text}
                              </p>
                              <div
                                className="flex items-center gap-2 mt-2 flex-wrap"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--color-neutral-500)",
                                }}
                              >
                                <span>{u.posted_by_name}</span>
                                <span>·</span>
                                <span>
                                  {new Date(u.created_at).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                                {u.work_hours && (
                                  <>
                                    <span>·</span>
                                    <span>{u.work_hours} hrs</span>
                                  </>
                                )}
                              </div>
                              {u.media.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-3">
                                  {u.media.slice(0, 4).map((media) => (
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

                {/* Updates tab */}
                {activeTab === "updates" && (
                  <div>
                    {allUpdates && allUpdates.count > 0 ? (
                      <div className="space-y-3">
                        {allUpdates.results.map((u) => (
                          <div
                            key={u.id}
                            className="rounded-xl p-4"
                            style={{
                              border: "1px solid var(--color-neutral-200)",
                              backgroundColor: "var(--color-neutral-50)",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.borderColor = "#1ab189";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.borderColor = "var(--color-neutral-200)";
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p
                                  className="font-medium"
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "var(--color-neutral-800)",
                                  }}
                                >
                                  {u.update_text}
                                </p>
                                <div
                                  className="flex items-center gap-2 mt-1.5 flex-wrap"
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--color-neutral-500)",
                                  }}
                                >
                                  <span className="font-medium">
                                    {u.posted_by_name}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {new Date(u.created_at).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </span>
                                  {u.work_hours && (
                                    <>
                                      <span>·</span>
                                      <span
                                        style={{
                                          color: "#1ab189",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {u.work_hours} hrs
                                      </span>
                                    </>
                                  )}
                                  {u.milestone_title && (
                                    <>
                                      <span>·</span>
                                      <span style={{ color: "#3b82f6" }}>
                                        📍 {u.milestone_title}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => setViewingUpdate(u)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#1ab189",
                                  padding: "0.375rem",
                                  borderRadius: "0.5rem",
                                  flexShrink: 0,
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.backgroundColor =
                                    "rgba(26,177,137,0.1)";
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.backgroundColor = "transparent";
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faEye}
                                  style={{ fontSize: "0.8rem" }}
                                />
                              </button>
                            </div>
                            {u.media.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                                {u.media.map((media) => (
                                  <div
                                    key={media.id}
                                    className="relative group"
                                  >
                                    <img
                                      src={media.thumbnail_url}
                                      alt={media.caption}
                                      className="w-full h-28 object-cover rounded-lg"
                                    />
                                    {media.caption && (
                                      <div
                                        className="absolute inset-x-0 bottom-0 rounded-b-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{
                                          backgroundColor: "rgba(0,0,0,0.65)",
                                          fontSize: "0.7rem",
                                          color: "white",
                                        }}
                                      >
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
                      <div
                        className="text-center py-10"
                        style={{ color: "var(--color-neutral-400)" }}
                      >
                        <FontAwesomeIcon
                          icon={faImage}
                          style={{
                            fontSize: "2.5rem",
                            marginBottom: "0.75rem",
                            opacity: 0.3,
                          }}
                        />
                        <p style={{ fontSize: "0.875rem" }}>
                          No updates posted yet
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Inventory tab */}
                {activeTab === "inventory" && (
                  <div className="space-y-3">
                    {inventory && inventory.count > 0 ? (
                      <>
                        {inventory.results.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl p-4"
                            style={{
                              border: "1px solid var(--color-neutral-200)",
                              backgroundColor: "var(--color-neutral-50)",
                            }}
                          >
                            <h4
                              className="font-semibold mb-1"
                              style={{
                                fontSize: "0.9rem",
                                color: "var(--color-neutral-900)",
                              }}
                            >
                              {item.item_name}
                            </h4>
                            {item.description && (
                              <p
                                className="mb-2"
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--color-neutral-600)",
                                }}
                              >
                                {item.description}
                              </p>
                            )}
                            <div
                              className="flex flex-wrap items-center gap-3"
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--color-neutral-600)",
                              }}
                            >
                              <span>
                                Qty:{" "}
                                <strong
                                  style={{ color: "var(--color-neutral-900)" }}
                                >
                                  {item.quantity} {item.unit}
                                </strong>
                              </span>
                              {item.unit_price && (
                                <span>
                                  · Unit:{" "}
                                  <strong
                                    style={{
                                      color: "var(--color-neutral-900)",
                                    }}
                                  >
                                    {formatCurrency(item.unit_price)}
                                  </strong>
                                </span>
                              )}
                              {item.total_price && (
                                <span>
                                  · Total:{" "}
                                  <strong style={{ color: "#1ab189" }}>
                                    {formatCurrency(item.total_price)}
                                  </strong>
                                </span>
                              )}
                            </div>
                            {item.supplier_name && (
                              <p
                                className="mt-1"
                                style={{
                                  fontSize: "0.78rem",
                                  color: "var(--color-neutral-500)",
                                }}
                              >
                                Supplier: {item.supplier_name}
                              </p>
                            )}
                          </div>
                        ))}
                        {summary &&
                          summary.financial.total_inventory_cost > 0 && (
                            <div
                              className="flex items-center justify-between rounded-xl px-4 py-3"
                              style={{
                                backgroundColor: "rgba(26,177,137,0.06)",
                                border: "1px solid rgba(26,177,137,0.2)",
                              }}
                            >
                              <span
                                className="font-semibold"
                                style={{
                                  fontSize: "0.875rem",
                                  color: "var(--color-neutral-700)",
                                }}
                              >
                                Total Inventory Value
                              </span>
                              <span
                                className="font-bold"
                                style={{ fontSize: "1.1rem", color: "#1ab189" }}
                              >
                                {formatCurrency(
                                  summary.financial.total_inventory_cost,
                                )}
                              </span>
                            </div>
                          )}
                      </>
                    ) : (
                      <div
                        className="text-center py-10"
                        style={{ color: "var(--color-neutral-400)" }}
                      >
                        <FontAwesomeIcon
                          icon={faBox}
                          style={{
                            fontSize: "2.5rem",
                            marginBottom: "0.75rem",
                            opacity: 0.3,
                          }}
                        />
                        <p style={{ fontSize: "0.875rem" }}>
                          No inventory items added yet
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payments tab */}
                {activeTab === "payments" && (
                  <div className="space-y-3">
                    {payments && payments.count > 0 ? (
                      <>
                        {payments.results.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-xl p-4"
                            style={{
                              border: "1px solid var(--color-neutral-200)",
                              backgroundColor: "var(--color-neutral-50)",
                            }}
                          >
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <span
                                className="font-bold"
                                style={{
                                  fontSize: "1.375rem",
                                  color: "#1ab189",
                                }}
                              >
                                {formatCurrency(p.amount)}
                              </span>
                              {[
                                {
                                  label: p.payment_status_display,
                                  style:
                                    p.payment_status === "completed"
                                      ? {
                                          bg: "rgba(26,177,137,0.1)",
                                          color: "#1ab189",
                                        }
                                      : p.payment_status === "pending"
                                        ? { bg: "#fefce8", color: "#a16207" }
                                        : { bg: "#fef2f2", color: "#b91c1c" },
                                },
                                {
                                  label: p.payment_type_display,
                                  style: { bg: "#eff6ff", color: "#1d4ed8" },
                                },
                              ].map(({ label, style }) => (
                                <span
                                  key={label}
                                  className="rounded-full font-semibold"
                                  style={{
                                    fontSize: "0.65rem",
                                    padding: "0.2rem 0.65rem",
                                    backgroundColor: style.bg,
                                    color: style.color,
                                  }}
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                            <div
                              className="grid grid-cols-2 gap-x-4 gap-y-1.5"
                              style={{ fontSize: "0.8rem" }}
                            >
                              <div>
                                <span
                                  style={{ color: "var(--color-neutral-500)" }}
                                >
                                  Date:{" "}
                                </span>
                                <strong
                                  style={{ color: "var(--color-neutral-900)" }}
                                >
                                  {new Date(p.payment_date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </strong>
                              </div>
                              {p.payment_method && (
                                <div>
                                  <span
                                    style={{
                                      color: "var(--color-neutral-500)",
                                    }}
                                  >
                                    Method:{" "}
                                  </span>
                                  <strong
                                    style={{
                                      color: "var(--color-neutral-900)",
                                    }}
                                  >
                                    {p.payment_method}
                                  </strong>
                                </div>
                              )}
                              {p.transaction_id && (
                                <div>
                                  <span
                                    style={{
                                      color: "var(--color-neutral-500)",
                                    }}
                                  >
                                    ID:{" "}
                                  </span>
                                  <code
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "var(--color-neutral-700)",
                                    }}
                                  >
                                    {p.transaction_id}
                                  </code>
                                </div>
                              )}
                              <div>
                                <span
                                  style={{ color: "var(--color-neutral-500)" }}
                                >
                                  By:{" "}
                                </span>
                                <strong
                                  style={{ color: "var(--color-neutral-900)" }}
                                >
                                  {p.posted_by_name}
                                </strong>
                              </div>
                            </div>
                            {p.notes && (
                              <p
                                className="mt-2 italic"
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--color-neutral-500)",
                                }}
                              >
                                Note: {p.notes}
                              </p>
                            )}
                          </div>
                        ))}
                        <div
                          className="flex items-center justify-between rounded-xl px-4 py-3"
                          style={{
                            backgroundColor: "rgba(26,177,137,0.06)",
                            border: "1px solid rgba(26,177,137,0.2)",
                          }}
                        >
                          <span
                            className="font-semibold"
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--color-neutral-700)",
                            }}
                          >
                            Total Received
                          </span>
                          <span
                            className="font-bold"
                            style={{ fontSize: "1.1rem", color: "#1ab189" }}
                          >
                            {formatCurrency(project.payment_summary.total_paid)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div
                        className="text-center py-10"
                        style={{ color: "var(--color-neutral-400)" }}
                      >
                        <FontAwesomeIcon
                          icon={faCreditCard}
                          style={{
                            fontSize: "2.5rem",
                            marginBottom: "0.75rem",
                            opacity: 0.3,
                          }}
                        />
                        <p style={{ fontSize: "0.875rem" }}>
                          No payments recorded yet
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Team tab */}
                {activeTab === "team" && (
                  <div>
                    {employees && employees.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {employees.map((emp) => (
                          <div
                            key={emp.id}
                            className="flex items-center gap-3 rounded-xl p-4"
                            style={{
                              border: "1px solid var(--color-neutral-200)",
                              backgroundColor: "var(--color-neutral-50)",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.borderColor = "#1ab189";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.borderColor = "var(--color-neutral-200)";
                            }}
                          >
                            <div
                              className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                              style={{
                                backgroundColor: employeeColor(emp.id),
                                color: "white",
                                fontSize: "0.9rem",
                              }}
                            >
                              {emp.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className="font-semibold truncate"
                                style={{
                                  fontSize: "0.9rem",
                                  color: "var(--color-neutral-900)",
                                }}
                              >
                                {emp.full_name}
                              </h4>
                              <p
                                className="truncate"
                                style={{
                                  fontSize: "0.78rem",
                                  color: "var(--color-neutral-500)",
                                }}
                              >
                                {emp.role || "No role"}
                                {emp.department ? ` · ${emp.department}` : ""}
                              </p>
                              {emp.phone && (
                                <p
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "var(--color-neutral-400)",
                                    marginTop: "0.125rem",
                                  }}
                                >
                                  {emp.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="text-center py-10"
                        style={{ color: "var(--color-neutral-400)" }}
                      >
                        <FontAwesomeIcon
                          icon={faUsers}
                          style={{
                            fontSize: "2.5rem",
                            marginBottom: "0.75rem",
                            opacity: 0.3,
                          }}
                        />
                        <p style={{ fontSize: "0.875rem" }}>
                          No team members assigned yet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-5">
              {/* Project info */}
              <div style={{ ...card, padding: "1.5rem" }}>
                <h3
                  className="font-semibold mb-4"
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  Project Information
                </h3>
                <InfoRow
                  icon={<FontAwesomeIcon icon={faBriefcase} />}
                  label="Project ID"
                >
                  #{project.id}
                </InfoRow>
                <InfoRow
                  icon={<FontAwesomeIcon icon={faMoneyBill} />}
                  label="Total Cost"
                >
                  {formatCurrency(project.total_cost)}
                </InfoRow>
                <InfoRow
                  icon={<FontAwesomeIcon icon={faUser} />}
                  label="Client"
                >
                  {project.client ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                        style={{
                          backgroundColor: "#1ab189",
                          color: "white",
                          fontSize: "0.65rem",
                        }}
                      >
                        {getInitials(project.client.full_name)}
                      </div>
                      <div>
                        <p
                          className="font-semibold"
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--color-neutral-900)",
                          }}
                        >
                          {project.client.full_name}
                        </p>
                        <p
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--color-neutral-500)",
                          }}
                        >
                          {project.client.user_email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span
                      style={{
                        fontStyle: "italic",
                        color: "var(--color-neutral-400)",
                        fontWeight: 400,
                      }}
                    >
                      No client assigned
                    </span>
                  )}
                </InfoRow>
                <InfoRow
                  icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
                  label="Location"
                  border={false}
                >
                  {project.site_address}
                </InfoRow>
              </div>

              {/* Progress stats */}
              {summary && (
                <div style={{ ...card, padding: "1.5rem" }}>
                  <h3
                    className="font-semibold mb-4"
                    style={{
                      fontSize: "1rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    Progress Statistics
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Milestones Completed",
                        value: `${summary.progress.completed_milestones}/${summary.progress.total_milestones}`,
                      },
                      {
                        label: "Avg. Completion",
                        value: `${summary.progress.average_completion}%`,
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-neutral-500)",
                          }}
                        >
                          {label}
                        </span>
                        <span
                          className="font-semibold"
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--color-neutral-900)",
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-md w-full"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ padding: "1.75rem" }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#fef2f2" }}
              >
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  style={{ color: "#ef4444", fontSize: "1.1rem" }}
                />
              </div>
              <h3
                className="font-semibold text-center mb-2"
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                Delete Project?
              </h3>
              <p
                className="text-center mb-6"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                Are you sure you want to delete &quot;{project.project_name}
                &quot;? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteMutation.isPending}
                  className="btn btn-ghost btn-md flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="btn btn-md flex-1 justify-center flex items-center gap-2"
                  style={{
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    opacity: deleteMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Deleting…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faTrash}
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Milestone detail modal ── */}
      {viewingMilestone && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between sticky top-0 rounded-t-2xl"
              style={{
                backgroundColor: "var(--color-neutral-0)",
                borderBottom: "1px solid var(--color-neutral-200)",
                padding: "1.25rem 1.5rem",
              }}
            >
              <div>
                <h3
                  className="font-semibold"
                  style={{
                    fontSize: "1.0625rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  Milestone Details
                </h3>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-neutral-500)",
                    marginTop: "0.125rem",
                  }}
                >
                  Review milestone information
                </p>
              </div>
              <button
                onClick={() => setViewingMilestone(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                  padding: "0.375rem",
                  borderRadius: "0.5rem",
                }}
              >
                <FontAwesomeIcon
                  icon={faTimes}
                  style={{ fontSize: "0.875rem" }}
                />
              </button>
            </div>
            {/* Modal body */}
            <div style={{ padding: "1.5rem" }} className="space-y-5">
              <div>
                <p
                  className="font-semibold uppercase tracking-wider mb-1"
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--color-neutral-400)",
                  }}
                >
                  Title
                </p>
                <p
                  className="font-semibold"
                  style={{
                    fontSize: "1.0625rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {viewingMilestone.title}
                </p>
              </div>
              {viewingMilestone.description && (
                <div>
                  <p
                    className="font-semibold uppercase tracking-wider mb-1"
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--color-neutral-400)",
                    }}
                  >
                    Description
                  </p>
                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: "var(--color-neutral-50)",
                      border: "1px solid var(--color-neutral-200)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-700)",
                        lineHeight: 1.7,
                      }}
                    >
                      {viewingMilestone.description}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className="font-semibold uppercase tracking-wider mb-1"
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--color-neutral-400)",
                    }}
                  >
                    Target Date
                  </p>
                  <div
                    className="flex items-center gap-2 rounded-xl p-3"
                    style={{
                      backgroundColor: "var(--color-neutral-50)",
                      border: "1px solid var(--color-neutral-200)",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCalendar}
                      style={{ color: "#1ab189", fontSize: "0.8rem" }}
                    />
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-neutral-800)",
                        fontWeight: 500,
                      }}
                    >
                      {new Date(
                        viewingMilestone.target_date,
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
                  <p
                    className="font-semibold uppercase tracking-wider mb-1"
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--color-neutral-400)",
                    }}
                  >
                    Completion
                  </p>
                  <div
                    className="rounded-xl p-3"
                    style={{
                      backgroundColor: "var(--color-neutral-50)",
                      border: "1px solid var(--color-neutral-200)",
                    }}
                  >
                    <div className="flex justify-between mb-1.5">
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        Progress
                      </span>
                      <span
                        className="font-bold"
                        style={{ fontSize: "0.8rem", color: "#1ab189" }}
                      >
                        {viewingMilestone.completion_percentage}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "0.375rem",
                        backgroundColor: "var(--color-neutral-200)",
                        borderRadius: "9999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${viewingMilestone.completion_percentage}%`,
                          height: "100%",
                          backgroundColor: "#1ab189",
                          borderRadius: "9999px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p
                  className="font-semibold uppercase tracking-wider mb-2"
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--color-neutral-400)",
                  }}
                >
                  Status
                </p>
                <span
                  className="rounded-full font-semibold"
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.3rem 0.75rem",
                    backgroundColor: getMilestoneBadge(viewingMilestone.status)
                      .bg,
                    color: getMilestoneBadge(viewingMilestone.status).color,
                  }}
                >
                  {viewingMilestone.status_display}
                </span>
              </div>
              {viewingMilestone.completion_date && (
                <div
                  className="flex items-center gap-2 rounded-xl p-3"
                  style={{
                    backgroundColor: "rgba(26,177,137,0.06)",
                    border: "1px solid rgba(26,177,137,0.2)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    style={{ color: "#1ab189", fontSize: "0.875rem" }}
                  />
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#1ab189",
                      fontWeight: 500,
                    }}
                  >
                    Completed on{" "}
                    {new Date(
                      viewingMilestone.completion_date,
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
            {/* Modal footer */}
            <div
              className="sticky bottom-0 flex justify-end rounded-b-2xl"
              style={{
                backgroundColor: "var(--color-neutral-50)",
                borderTop: "1px solid var(--color-neutral-200)",
                padding: "1rem 1.5rem",
              }}
            >
              <button
                onClick={() => setViewingMilestone(null)}
                className="btn btn-secondary btn-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Update detail modal ── */}
      {viewingUpdate && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-3xl w-full my-8"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              className="flex items-center justify-between sticky top-0 rounded-t-2xl"
              style={{
                backgroundColor: "var(--color-neutral-0)",
                borderBottom: "1px solid var(--color-neutral-200)",
                padding: "1.25rem 1.5rem",
              }}
            >
              <div>
                <h3
                  className="font-semibold"
                  style={{
                    fontSize: "1.0625rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  Update Details
                </h3>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-neutral-500)",
                    marginTop: "0.125rem",
                  }}
                >
                  Posted by {viewingUpdate.posted_by_name}
                </p>
              </div>
              <button
                onClick={() => setViewingUpdate(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                  padding: "0.375rem",
                  borderRadius: "0.5rem",
                }}
              >
                <FontAwesomeIcon
                  icon={faTimes}
                  style={{ fontSize: "0.875rem" }}
                />
              </button>
            </div>
            <div style={{ padding: "1.5rem" }} className="space-y-5">
              <div>
                <p
                  className="font-semibold uppercase tracking-wider mb-1"
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--color-neutral-400)",
                  }}
                >
                  Update
                </p>
                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "var(--color-neutral-50)",
                    border: "1px solid var(--color-neutral-200)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-700)",
                      lineHeight: 1.7,
                    }}
                  >
                    {viewingUpdate.update_text}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className="font-semibold uppercase tracking-wider mb-1"
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--color-neutral-400)",
                    }}
                  >
                    Posted
                  </p>
                  <p
                    className="font-semibold"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {new Date(viewingUpdate.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>
                {viewingUpdate.work_hours && (
                  <div>
                    <p
                      className="font-semibold uppercase tracking-wider mb-1"
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--color-neutral-400)",
                      }}
                    >
                      Work Hours
                    </p>
                    <p
                      className="font-bold"
                      style={{ fontSize: "1.25rem", color: "#1ab189" }}
                    >
                      {viewingUpdate.work_hours} hrs
                    </p>
                  </div>
                )}
              </div>
              {viewingUpdate.milestone_title && (
                <div
                  className="flex items-center gap-2 rounded-xl p-3"
                  style={{
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#1d4ed8",
                      fontWeight: 500,
                    }}
                  >
                    📍 Related Milestone:{" "}
                    <strong>{viewingUpdate.milestone_title}</strong>
                  </p>
                </div>
              )}
              {viewingUpdate.media.length > 0 && (
                <div>
                  <p
                    className="font-semibold uppercase tracking-wider mb-2"
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--color-neutral-400)",
                    }}
                  >
                    Media ({viewingUpdate.media.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {viewingUpdate.media.map((media) => (
                      <div
                        key={media.id}
                        className="relative group rounded-xl overflow-hidden"
                      >
                        <img
                          src={media.media_url}
                          alt={media.caption}
                          className="w-full h-48 object-cover"
                        />
                        {media.caption && (
                          <div
                            className="absolute inset-x-0 bottom-0 px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.65)",
                              fontSize: "0.78rem",
                              color: "white",
                            }}
                          >
                            {media.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div
              className="sticky bottom-0 flex justify-end rounded-b-2xl"
              style={{
                backgroundColor: "var(--color-neutral-50)",
                borderTop: "1px solid var(--color-neutral-200)",
                padding: "1rem 1.5rem",
              }}
            >
              <button
                onClick={() => setViewingUpdate(null)}
                className="btn btn-secondary btn-md"
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
