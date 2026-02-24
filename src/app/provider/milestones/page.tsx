"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faFilter,
  faSearch,
  faCalendar,
  faUser,
  faCheck,
  faTimes,
  faPlus,
  faPenToSquare,
  faEye,
  faTrash,
  faDollarSign,
  faSpinner,
  faExclamationTriangle,
  faClock,
  faFolder,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ApiMilestone {
  id: number;
  project: number;
  title: string;
  description: string;
  target_date: string | null;
  completion_date: string | null;
  amount: string;
  status: "pending" | "in_progress" | "completed";
  status_display: string;
  milestone_order: number | null;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

interface Client {
  id: number;
  full_name: string;
  user_email: string;
}

interface Project {
  id: number;
  project_name: string;
  client: Client | null;
  start_date: string;
  expected_end_date: string;
}

interface Milestone {
  id: number;
  project: number;
  project_name?: string;
  client_name?: string;
  title: string;
  description: string;
  due_date: string;
  amount: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
  status_display: string;
  completion_percentage: number;
}

interface MilestoneFormData {
  project: string;
  title: string;
  description: string;
  due_date: string;
  amount: string;
  status: "pending" | "in_progress" | "completed";
}

interface ApiError {
  data?: { detail?: string };
  message?: string;
}

interface DeleteTarget {
  id: number;
  title: string;
}

// ─── Design tokens ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  string,
  {
    bg: string;
    color: string;
    border: string;
    icon: typeof faCheck;
    label: string;
  }
> = {
  pending: {
    bg: "rgba(245,158,11,0.1)",
    color: "#92400e",
    border: "rgba(245,158,11,0.3)",
    icon: faExclamationTriangle,
    label: "Pending",
  },
  in_progress: {
    bg: "rgba(59,130,246,0.1)",
    color: "#1d4ed8",
    border: "rgba(59,130,246,0.3)",
    icon: faClock,
    label: "In Progress",
  },
  completed: {
    bg: "rgba(26,177,137,0.1)",
    color: "#065f46",
    border: "rgba(26,177,137,0.3)",
    icon: faCheck,
    label: "Completed",
  },
};

const baseInput: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 1rem",
  fontFamily: "inherit",
  fontSize: "0.875rem",
  color: "var(--color-neutral-900)",
  background: "#fff",
  border: "1px solid var(--color-neutral-200)",
  borderRadius: "0.625rem",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
};

const focusRing: React.CSSProperties = {
  borderColor: "#1ab189",
  boxShadow: "0 0 0 3px rgba(26,177,137,0.12)",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n || 0);
}

function isOverdue(dueDate: string, status: string): boolean {
  if (status === "completed") return false;
  return new Date(dueDate) < new Date();
}

function getProjectProgress(
  milestones: Milestone[],
  projectId: string,
): number {
  const pm = milestones.filter((m) => m.project.toString() === projectId);
  if (!pm.length) return 0;
  return Math.round(
    (pm.filter((m) => m.status === "completed").length / pm.length) * 100,
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.03em",
        padding: "0.25rem 0.625rem",
        borderRadius: 9999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <FontAwesomeIcon icon={s.icon} style={{ fontSize: "0.625rem" }} />
      {s.label}
    </span>
  );
}

function FocusInput({
  as: Tag = "input",
  style,
  ...props
}: {
  as?: "input" | "select" | "textarea";
  style?: React.CSSProperties;
} & Record<string, unknown>) {
  const [focused, setFocused] = useState(false);
  const El = Tag as "input";
  return (
    <El
      {...props}
      style={{ ...baseInput, ...(focused ? focusRing : {}), ...style }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "2rem",
        right: "2rem",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "var(--color-neutral-900)",
        color: "#fff",
        padding: "0.875rem 1.25rem",
        borderRadius: 9999,
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        animation: "slideInRight 0.25s ease",
        minWidth: 260,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#1ab189",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FontAwesomeIcon
          icon={faCheck}
          style={{ fontSize: "0.75rem", color: "#fff" }}
        />
      </span>
      <span style={{ fontSize: "0.875rem", fontWeight: 500, flex: 1 }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.6)",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <FontAwesomeIcon icon={faTimes} style={{ fontSize: "0.75rem" }} />
      </button>
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "1.25rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          maxWidth: 640,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        background: "#fff",
        borderBottom: "1px solid var(--color-neutral-200)",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 10,
        borderRadius: "1.25rem 1.25rem 0 0",
      }}
    >
      <div>
        <p
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--color-neutral-900)",
            margin: 0,
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-neutral-500)",
              margin: "0.15rem 0 0",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        style={{
          background: "var(--color-neutral-100)",
          border: "none",
          borderRadius: "0.5rem",
          width: 32,
          height: 32,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-neutral-600)",
        }}
      >
        <FontAwesomeIcon icon={faTimes} style={{ fontSize: "0.875rem" }} />
      </button>
    </div>
  );
}

function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        background: "var(--color-neutral-50)",
        borderTop: "1px solid var(--color-neutral-200)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "0.75rem",
        borderRadius: "0 0 1.25rem 1.25rem",
      }}
    >
      {children}
    </div>
  );
}

function DeleteModal({
  target,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  target: DeleteTarget;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "1.25rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          maxWidth: 420,
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "1.5rem 1.5rem 0" }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "rgba(239,68,68,0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <FontAwesomeIcon
              icon={faTrash}
              style={{ color: "#ef4444", fontSize: "1.125rem" }}
            />
          </div>
          <p
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-neutral-900)",
              margin: "0 0 0.375rem",
            }}
          >
            Delete Milestone
          </p>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-neutral-500)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to delete{" "}
            <strong style={{ color: "var(--color-neutral-800)" }}>
              "{target.title}"
            </strong>
            ? This action cannot be undone.
          </p>
        </div>

        {/* Warning box */}
        <div
          style={{
            margin: "1.25rem 1.5rem",
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "0.625rem",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.625rem",
          }}
        >
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            style={{
              color: "#ef4444",
              fontSize: "0.8125rem",
              marginTop: 2,
              flexShrink: 0,
            }}
          />
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#991b1b",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Any invoices or payments linked to this milestone may be affected.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            background: "var(--color-neutral-50)",
            borderTop: "1px solid var(--color-neutral-200)",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "0.625rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.6 : 1,
              transition: "opacity 150ms, box-shadow 150ms",
            }}
            onMouseEnter={(e) => {
              if (!isDeleting)
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 4px 12px rgba(239,68,68,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            {isDeleting ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="animate-spin"
                  style={{ fontSize: "0.75rem" }}
                />
                Deleting…
              </>
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faTrash}
                  style={{ fontSize: "0.75rem" }}
                />
                Yes, Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "var(--color-neutral-700)",
        marginBottom: "0.375rem",
        letterSpacing: "0.02em",
      }}
    >
      {children}
      {required && (
        <span style={{ color: "#ef4444", marginLeft: "0.2rem" }}>*</span>
      )}
    </label>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProviderMilestonesPage() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null,
  );
  const [viewingMilestone, setViewingMilestone] = useState<Milestone | null>(
    null,
  );
  const [deletingMilestone, setDeletingMilestone] =
    useState<DeleteTarget | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormData>({
    project: "",
    title: "",
    description: "",
    due_date: "",
    amount: "",
    status: "pending",
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await api.get<{ results: Project[] }>(
        "/api/v1/projects/",
      );
      return response.results || [];
    },
  });

  const {
    data: allMilestonesData,
    isLoading: milestonesLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["all-milestones"],
    queryFn: async () => {
      let projects: Project[] = [];
      if (projectsData && Array.isArray(projectsData)) {
        projects = projectsData;
      } else {
        const projRes = await api.get<{ results: Project[] }>(
          "/api/v1/projects/",
        );
        projects = projRes.results || [];
      }
      if (projects.length === 0) return [];

      const arrays = await Promise.all(
        projects.map((project) =>
          api
            .get<{ results: ApiMilestone[] }>(
              `/api/v1/projects/${project.id}/milestones/`,
            )
            .then((res) =>
              (res.results || []).map((m) => ({
                ...m,
                project: m.project || project.id,
                amount: m.amount || "0",
              })),
            )
            .catch(() => [] as ApiMilestone[]),
        ),
      );

      return arrays.flat().map((milestone) => {
        const project = projects.find((p) => p.id === milestone.project);
        return {
          ...milestone,
          due_date:
            milestone.target_date ||
            milestone.completion_date ||
            new Date().toISOString().split("T")[0],
          project_name: project?.project_name || "Unknown Project",
          client_name: project?.client?.full_name || "Unassigned",
        } as Milestone;
      });
    },
    enabled: true,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMilestoneMutation = useMutation({
    mutationFn: async (data: MilestoneFormData) =>
      api.post(`/api/v1/projects/${data.project}/milestones/create/`, {
        title: data.title,
        description: data.description,
        target_date: data.due_date,
        amount: data.amount,
        status: data.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-milestones"] });
      showToast("Milestone created successfully!");
      closeMilestoneModal();
    },
    onError: (err: unknown) => {
      const e = err as ApiError;
      alert(e.data?.detail || e.message || "Failed to create milestone");
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<MilestoneFormData>;
    }) =>
      api.put(`/api/v1/milestones/${id}/update/`, {
        title: data.title,
        description: data.description,
        target_date: data.due_date,
        amount: data.amount,
        status: data.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-milestones"] });
      showToast("Milestone updated successfully!");
      closeMilestoneModal();
    },
    onError: (err: unknown) => {
      const e = err as ApiError;
      alert(e.data?.detail || e.message || "Failed to update milestone");
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: number) =>
      api.delete(`/api/v1/milestones/${id}/delete/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-milestones"] });
      showToast("Milestone deleted successfully!");
    },
    onError: (err: unknown) => {
      const e = err as ApiError;
      alert(e.data?.detail || e.message || "Failed to delete milestone");
    },
  });

  // ── Local state helpers ────────────────────────────────────────────────────

  const projects: Project[] = Array.isArray(projectsData) ? projectsData : [];
  const milestones: Milestone[] = Array.isArray(allMilestonesData)
    ? allMilestonesData
    : [];

  useEffect(() => {
    if (isError) console.error("Milestones fetch error:", error);
  }, [isError, error]);

  const openMilestoneModal = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setMilestoneForm({
        project: milestone.project.toString(),
        title: milestone.title,
        description: milestone.description,
        due_date: milestone.due_date,
        amount: milestone.amount,
        status: milestone.status,
      });
    } else {
      setEditingMilestone(null);
      setMilestoneForm({
        project: "",
        title: "",
        description: "",
        due_date: "",
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
      project: "",
      title: "",
      description: "",
      due_date: "",
      amount: "",
      status: "pending",
    });
  };

  const saveMilestone = () => {
    if (
      !milestoneForm.project ||
      !milestoneForm.title ||
      !milestoneForm.due_date ||
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
    if (editingMilestone) {
      updateMilestoneMutation.mutate({
        id: editingMilestone.id,
        data: milestoneForm,
      });
    } else {
      createMilestoneMutation.mutate(milestoneForm);
    }
  };

  const deleteMilestone = (id: number, title: string) => {
    setDeletingMilestone({ id, title });
  };

  const confirmDelete = () => {
    if (!deletingMilestone) return;
    deleteMilestoneMutation.mutate(deletingMilestone.id, {
      onSuccess: () => setDeletingMilestone(null),
      onError: () => setDeletingMilestone(null),
    });
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredMilestones = milestones.filter((m) => {
    const matchProject =
      selectedProject === "all" || m.project.toString() === selectedProject;
    const matchStatus = selectedStatus === "all" || m.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      (m.project_name?.toLowerCase().includes(q) ?? false);
    return matchProject && matchStatus && matchSearch;
  });

  const groupedMilestones = filteredMilestones.reduce<
    Record<string, Milestone[]>
  >((acc, m) => {
    const pid = m.project?.toString();
    if (!pid) return acc;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(m);
    return acc;
  }, {});

  const selectedProjectData = projects.find(
    (p) => p.id.toString() === milestoneForm.project,
  );
  const isSaving =
    createMilestoneMutation.isPending || updateMilestoneMutation.isPending;
  const isLoading = projectsLoading || milestonesLoading;

  // ── Loading / Error screens ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-neutral-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <FontAwesomeIcon
            icon={faSpinner}
            style={{
              fontSize: "2.5rem",
              color: "#1ab189",
              marginBottom: "1rem",
            }}
            className="animate-spin"
          />
          <p
            style={{ color: "var(--color-neutral-600)", fontSize: "0.9375rem" }}
          >
            Loading milestones…
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-neutral-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--color-neutral-200)",
            borderRadius: "1.25rem",
            padding: "3rem",
            maxWidth: 420,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: "rgba(239,68,68,0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <FontAwesomeIcon
              icon={faTimes}
              style={{ color: "#ef4444", fontSize: "1.25rem" }}
            />
          </div>
          <h3
            style={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "var(--color-neutral-900)",
              marginBottom: "0.5rem",
            }}
          >
            Error Loading Milestones
          </h3>
          <p
            style={{
              color: "var(--color-neutral-500)",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            Something went wrong. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-neutral-50)" }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .milestone-row:hover { background: var(--color-neutral-50); }
        .action-btn { background: none; border: none; cursor: pointer; border-radius: 0.5rem; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: background 150ms; }
        .action-btn:hover { background: var(--color-neutral-100); }
        .chip-filter { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; border: 1px solid; }
      `}</style>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Page header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.5rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: "var(--color-neutral-900)",
              margin: 0,
            }}
          >
            Milestones
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-neutral-500)",
              margin: "0.25rem 0 0",
            }}
          >
            Track progress and manage project milestones
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => openMilestoneModal()}
        >
          <FontAwesomeIcon icon={faPlus} style={{ fontSize: "0.75rem" }} />
          Create Milestone
        </button>
      </div>

      <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
        {/* Filters card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--color-neutral-200)",
            borderRadius: "1rem",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {/* Project filter */}
            <div>
              <FormLabel>Project</FormLabel>
              <div style={{ position: "relative" }}>
                <FontAwesomeIcon
                  icon={faFolder}
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#1ab189",
                    fontSize: "0.75rem",
                    pointerEvents: "none",
                  }}
                />
                <FocusInput
                  as="select"
                  value={selectedProject}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedProject(e.target.value)
                  }
                  style={{ paddingLeft: "2.25rem", cursor: "pointer" }}
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name}
                    </option>
                  ))}
                </FocusInput>
              </div>
            </div>

            {/* Status filter */}
            <div>
              <FormLabel>Status</FormLabel>
              <div style={{ position: "relative" }}>
                <FontAwesomeIcon
                  icon={faFilter}
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#1ab189",
                    fontSize: "0.75rem",
                    pointerEvents: "none",
                  }}
                />
                <FocusInput
                  as="select"
                  value={selectedStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedStatus(e.target.value)
                  }
                  style={{ paddingLeft: "2.25rem", cursor: "pointer" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </FocusInput>
              </div>
            </div>

            {/* Search */}
            <div>
              <FormLabel>Search</FormLabel>
              <div style={{ position: "relative" }}>
                <FontAwesomeIcon
                  icon={faSearch}
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-neutral-400)",
                    fontSize: "0.75rem",
                    pointerEvents: "none",
                  }}
                />
                <FocusInput
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder="Search by title, description…"
                  style={{ paddingLeft: "2.25rem" }}
                />
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {(selectedProject !== "all" ||
            selectedStatus !== "all" ||
            searchQuery) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--color-neutral-200)",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-neutral-500)",
                  fontWeight: 500,
                }}
              >
                Filters:
              </span>
              {selectedProject !== "all" && (
                <span
                  className="chip-filter"
                  style={{
                    background: "rgba(26,177,137,0.08)",
                    color: "#065f46",
                    borderColor: "rgba(26,177,137,0.2)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFolder}
                    style={{ fontSize: "0.6rem" }}
                  />
                  {
                    projects.find((p) => p.id.toString() === selectedProject)
                      ?.project_name
                  }
                </span>
              )}
              {selectedStatus !== "all" && (
                <span
                  className="chip-filter"
                  style={{
                    background: "rgba(59,130,246,0.08)",
                    color: "#1d4ed8",
                    borderColor: "rgba(59,130,246,0.2)",
                  }}
                >
                  {STATUS_STYLES[selectedStatus]?.label}
                </span>
              )}
              {searchQuery && (
                <span
                  className="chip-filter"
                  style={{
                    background: "var(--color-neutral-100)",
                    color: "var(--color-neutral-700)",
                    borderColor: "var(--color-neutral-200)",
                  }}
                >
                  "{searchQuery}"
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedProject("all");
                  setSelectedStatus("all");
                  setSearchQuery("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-neutral-500)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Milestone groups */}
        {filteredMilestones.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--color-neutral-200)",
              borderRadius: "1rem",
              padding: "4rem 2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                background: "rgba(26,177,137,0.08)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <FontAwesomeIcon
                icon={faCheckCircle}
                style={{ color: "#1ab189", fontSize: "1.5rem" }}
              />
            </div>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-neutral-900)",
                marginBottom: "0.5rem",
              }}
            >
              No milestones found
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-500)",
                marginBottom: "1.5rem",
              }}
            >
              {searchQuery ||
              selectedProject !== "all" ||
              selectedStatus !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first milestone"}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => openMilestoneModal()}
            >
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: "0.75rem" }} />
              Create Milestone
            </button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {Object.entries(groupedMilestones).map(
              ([projectId, pMilestones]) => {
                const project = projects.find(
                  (p) => p.id.toString() === projectId,
                );
                const progress = getProjectProgress(milestones, projectId);
                const completedCount = pMilestones.filter(
                  (m) => m.status === "completed",
                ).length;

                return (
                  <div
                    key={projectId}
                    style={{
                      background: "#fff",
                      border: "1px solid var(--color-neutral-200)",
                      borderRadius: "1rem",
                      overflow: "hidden",
                    }}
                  >
                    {/* Project header */}
                    <div
                      style={{
                        padding: "1.25rem 1.5rem",
                        borderBottom: "1px solid var(--color-neutral-200)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          marginBottom: "0.875rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              background: "rgba(26,177,137,0.1)",
                              borderRadius: "0.625rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faFolder}
                              style={{ color: "#1ab189", fontSize: "0.875rem" }}
                            />
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: "0.9375rem",
                                fontWeight: 700,
                                color: "var(--color-neutral-900)",
                                margin: 0,
                              }}
                            >
                              {project?.project_name}
                            </p>
                            <p
                              style={{
                                fontSize: "0.8125rem",
                                color: "var(--color-neutral-500)",
                                margin: "0.15rem 0 0",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.35rem",
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faUser}
                                style={{ fontSize: "0.625rem" }}
                              />
                              {project?.client?.full_name || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              color: "var(--color-neutral-700)",
                              margin: 0,
                            }}
                          >
                            {completedCount} / {pMilestones.length}
                          </p>
                          <p
                            style={{
                              fontSize: "0.6875rem",
                              color: "var(--color-neutral-400)",
                              margin: "0.15rem 0 0",
                            }}
                          >
                            completed
                          </p>
                        </div>
                      </div>
                      {/* Progress */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 6,
                            background: "var(--color-neutral-150)",
                            borderRadius: 9999,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${progress}%`,
                              background: "#1ab189",
                              borderRadius: 9999,
                              transition: "width 0.6s ease",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#1ab189",
                            minWidth: 36,
                            textAlign: "right",
                          }}
                        >
                          {progress}%
                        </span>
                      </div>
                    </div>

                    {/* Milestone rows */}
                    <div>
                      {pMilestones.map((milestone, idx) => {
                        const overdue = isOverdue(
                          milestone.due_date,
                          milestone.status,
                        );
                        return (
                          <div
                            key={milestone.id}
                            className="milestone-row"
                            style={{
                              padding: "1rem 1.5rem",
                              borderBottom:
                                idx < pMilestones.length - 1
                                  ? "1px solid var(--color-neutral-200)"
                                  : "none",
                              transition: "background 150ms",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "1rem",
                              }}
                            >
                              {/* Left content */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "0.5rem",
                                    marginBottom: "0.375rem",
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: "0.9375rem",
                                      fontWeight: 600,
                                      color: "var(--color-neutral-900)",
                                      margin: 0,
                                    }}
                                  >
                                    {milestone.title}
                                  </p>
                                  <StatusBadge status={milestone.status} />
                                  {overdue && (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.25rem",
                                        fontSize: "0.6875rem",
                                        fontWeight: 600,
                                        padding: "0.25rem 0.625rem",
                                        borderRadius: 9999,
                                        background: "rgba(239,68,68,0.1)",
                                        color: "#991b1b",
                                        border:
                                          "1px solid rgba(239,68,68,0.25)",
                                      }}
                                    >
                                      <FontAwesomeIcon
                                        icon={faExclamationTriangle}
                                        style={{ fontSize: "0.6rem" }}
                                      />
                                      Overdue
                                    </span>
                                  )}
                                </div>
                                {milestone.description && (
                                  <p
                                    style={{
                                      fontSize: "0.8125rem",
                                      color: "var(--color-neutral-500)",
                                      margin: "0 0 0.625rem",
                                      overflow: "hidden",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                    }}
                                  >
                                    {milestone.description}
                                  </p>
                                )}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "1rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "0.8125rem",
                                      fontWeight: 700,
                                      color: "#1ab189",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                    }}
                                  >
                                    <FontAwesomeIcon
                                      icon={faDollarSign}
                                      style={{ fontSize: "0.625rem" }}
                                    />
                                    {formatCurrency(milestone.amount)}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.8125rem",
                                      color: "var(--color-neutral-500)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.35rem",
                                    }}
                                  >
                                    <FontAwesomeIcon
                                      icon={faCalendar}
                                      style={{ fontSize: "0.625rem" }}
                                    />
                                    {new Date(
                                      milestone.due_date,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  flexShrink: 0,
                                }}
                              >
                                <button
                                  className="action-btn"
                                  onClick={() => setViewingMilestone(milestone)}
                                  title="View details"
                                  style={{ color: "var(--color-neutral-500)" }}
                                >
                                  <FontAwesomeIcon
                                    icon={faEye}
                                    style={{ fontSize: "0.875rem" }}
                                  />
                                </button>
                                <button
                                  className="action-btn"
                                  onClick={() => openMilestoneModal(milestone)}
                                  title="Edit"
                                  style={{ color: "var(--color-neutral-500)" }}
                                >
                                  <FontAwesomeIcon
                                    icon={faPenToSquare}
                                    style={{ fontSize: "0.875rem" }}
                                  />
                                </button>
                                <button
                                  className="action-btn"
                                  onClick={() =>
                                    deleteMilestone(
                                      milestone.id,
                                      milestone.title,
                                    )
                                  }
                                  title="Delete"
                                  disabled={deleteMilestoneMutation.isPending}
                                  style={{ color: "#ef4444" }}
                                >
                                  <FontAwesomeIcon
                                    icon={faTrash}
                                    style={{ fontSize: "0.875rem" }}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {showMilestoneModal && (
        <Modal onClose={closeMilestoneModal}>
          <ModalHeader
            title={editingMilestone ? "Edit Milestone" : "Create Milestone"}
            subtitle={
              editingMilestone
                ? "Update details and payment amount"
                : "Add a new milestone with payment amount"
            }
            onClose={closeMilestoneModal}
          />

          <div
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Project */}
            <div>
              <FormLabel required>Project</FormLabel>
              <FocusInput
                as="select"
                value={milestoneForm.project}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setMilestoneForm({
                    ...milestoneForm,
                    project: e.target.value,
                  })
                }
                disabled={!!editingMilestone}
                style={{
                  cursor: editingMilestone ? "not-allowed" : "pointer",
                  background: editingMilestone
                    ? "var(--color-neutral-100)"
                    : "#fff",
                }}
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name} — {p.client?.full_name || "No client"}
                  </option>
                ))}
              </FocusInput>
              {selectedProjectData && (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-neutral-500)",
                    marginTop: "0.375rem",
                  }}
                >
                  Client:{" "}
                  <strong style={{ color: "var(--color-neutral-700)" }}>
                    {selectedProjectData.client?.full_name || "Unassigned"}
                  </strong>
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <FormLabel required>Title</FormLabel>
              <FocusInput
                value={milestoneForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMilestoneForm({ ...milestoneForm, title: e.target.value })
                }
                placeholder="e.g., Initial Design Phase"
              />
            </div>

            {/* Description */}
            <div>
              <FormLabel>Description</FormLabel>
              <FocusInput
                as="textarea"
                value={milestoneForm.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setMilestoneForm({
                    ...milestoneForm,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this milestone…"
                style={{ resize: "none", minHeight: 100 }}
                rows={4}
              />
            </div>

            {/* Amount + Due date */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <FormLabel required>Payment Amount</FormLabel>
                <div style={{ position: "relative" }}>
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-neutral-400)",
                      fontSize: "0.75rem",
                      pointerEvents: "none",
                    }}
                  />
                  <FocusInput
                    type="number"
                    value={milestoneForm.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMilestoneForm({
                        ...milestoneForm,
                        amount: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    style={{ paddingLeft: "2.25rem" }}
                  />
                </div>
              </div>
              <div>
                <FormLabel required>Due Date</FormLabel>
                <FocusInput
                  type="date"
                  value={milestoneForm.due_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      due_date: e.target.value,
                    })
                  }
                  min={selectedProjectData?.start_date}
                  max={selectedProjectData?.expected_end_date}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <FormLabel required>Status</FormLabel>
              <FocusInput
                as="select"
                value={milestoneForm.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setMilestoneForm({
                    ...milestoneForm,
                    status: e.target.value as MilestoneFormData["status"],
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <option value="pending">⚠ Pending</option>
                <option value="in_progress">⏱ In Progress</option>
                <option value="completed">✓ Completed</option>
              </FocusInput>
            </div>

            {/* Info note */}
            <div
              style={{
                background: "rgba(26,177,137,0.06)",
                border: "1px solid rgba(26,177,137,0.2)",
                borderRadius: "0.625rem",
                padding: "0.875rem 1rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.625rem",
              }}
            >
              <FontAwesomeIcon
                icon={faCheckCircle}
                style={{
                  color: "#1ab189",
                  fontSize: "0.875rem",
                  marginTop: 2,
                  flexShrink: 0,
                }}
              />
              <p style={{ fontSize: "0.8125rem", color: "#065f46", margin: 0 }}>
                This milestone will be visible to the client and the payment
                amount will be used for invoicing.
              </p>
            </div>
          </div>

          <ModalFooter>
            <button
              className="btn btn-ghost"
              onClick={closeMilestoneModal}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={saveMilestone}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin"
                    style={{ fontSize: "0.75rem" }}
                  />
                  {editingMilestone ? "Updating…" : "Creating…"}
                </>
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={editingMilestone ? faCheckCircle : faPlus}
                    style={{ fontSize: "0.75rem" }}
                  />
                  {editingMilestone ? "Update Milestone" : "Create Milestone"}
                </>
              )}
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* ── View Milestone Modal ─────────────────────────────────────────────── */}
      {viewingMilestone && (
        <Modal onClose={() => setViewingMilestone(null)}>
          <ModalHeader
            title="Milestone Details"
            subtitle={`${viewingMilestone.project_name} — ${viewingMilestone.client_name}`}
            onClose={() => setViewingMilestone(null)}
          />

          <div
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Title */}
            <div>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--color-neutral-400)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "0.375rem",
                }}
              >
                Title
              </p>
              <p
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--color-neutral-900)",
                  margin: 0,
                }}
              >
                {viewingMilestone.title}
              </p>
            </div>

            {/* Description */}
            {viewingMilestone.description && (
              <div>
                <p
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--color-neutral-400)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "0.375rem",
                  }}
                >
                  Description
                </p>
                <div
                  style={{
                    background: "var(--color-neutral-50)",
                    border: "1px solid var(--color-neutral-200)",
                    borderRadius: "0.625rem",
                    padding: "0.875rem 1rem",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-700)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {viewingMilestone.description}
                  </p>
                </div>
              </div>
            )}

            {/* Amount + Date */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--color-neutral-400)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "0.375rem",
                  }}
                >
                  Payment Amount
                </p>
                <div
                  style={{
                    background: "rgba(26,177,137,0.06)",
                    border: "1px solid rgba(26,177,137,0.2)",
                    borderRadius: "0.625rem",
                    padding: "0.875rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    style={{ color: "#1ab189", fontSize: "1rem" }}
                  />
                  <span
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {formatCurrency(viewingMilestone.amount)}
                  </span>
                </div>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--color-neutral-400)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "0.375rem",
                  }}
                >
                  Due Date
                </p>
                <div
                  style={{
                    background: "var(--color-neutral-50)",
                    border: "1px solid var(--color-neutral-200)",
                    borderRadius: "0.625rem",
                    padding: "0.875rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCalendar}
                    style={{ color: "#1ab189", fontSize: "0.875rem" }}
                  />
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {new Date(viewingMilestone.due_date).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--color-neutral-400)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "0.5rem",
                }}
              >
                Status
              </p>
              <StatusBadge status={viewingMilestone.status} />
            </div>
          </div>

          <ModalFooter>
            <button
              onClick={() => {
                deleteMilestone(viewingMilestone.id, viewingMilestone.title);
                setViewingMilestone(null);
              }}
              disabled={deleteMilestoneMutation.isPending}
              style={{
                marginRight: "auto",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444",
                borderRadius: "0.625rem",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background 150ms",
              }}
            >
              <FontAwesomeIcon icon={faTrash} style={{ fontSize: "0.75rem" }} />
              Delete
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setViewingMilestone(null)}
            >
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setViewingMilestone(null);
                openMilestoneModal(viewingMilestone);
              }}
            >
              <FontAwesomeIcon
                icon={faPenToSquare}
                style={{ fontSize: "0.75rem" }}
              />
              Edit
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      {deletingMilestone && (
        <DeleteModal
          target={deletingMilestone}
          isDeleting={deleteMilestoneMutation.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingMilestone(null)}
        />
      )}
    </div>
  );
}
