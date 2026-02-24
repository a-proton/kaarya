"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faFilter,
  faSearch,
  faCalendar,
  faComment,
  faPaperPlane,
  faChevronDown,
  faChevronUp,
  faExclamationTriangle,
  faCheck,
  faClock,
  faFolder,
  faUser,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Milestone {
  id: number;
  project?: number;
  title: string;
  description: string;
  target_date: string | null;
  completion_date: string | null;
  status: "pending" | "in_progress" | "completed";
  milestone_order: number | null;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: number;
  project_name: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "on_hold";
  status_display: string;
  service_provider: {
    id: number;
    full_name: string;
    business_name?: string;
    profile_image?: string;
    initials: string;
  };
  created_at: string;
}

interface MilestoneComment {
  id: string;
  author: string;
  authorInitials: string;
  isClient: boolean;
  text: string;
  timeAgo: string;
}

interface EnrichedMilestone extends Milestone {
  projectId: number;
  projectName: string;
  postedBy: string;
  providerInitials: string;
  comments: MilestoneComment[];
}

// ─── Design tokens ────────────────────────────────────────────────────────────

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

// FIX: Use longhand border properties to avoid conflict with borderColor in focusRing
const baseInput: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 1rem",
  fontFamily: "inherit",
  fontSize: "0.875rem",
  color: "var(--color-neutral-900)",
  background: "#fff",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--color-neutral-200)",
  borderRadius: "0.625rem",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
};

const focusRing: React.CSSProperties = {
  borderColor: "#1ab189",
  boxShadow: "0 0 0 3px rgba(26,177,137,0.12)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "completed") return false;
  return new Date(dueDate) < new Date();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function FormLabel({ children }: { children: React.ReactNode }) {
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
    </label>
  );
}

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientMilestonesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
    null,
  );
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Queries ───────────────────────────────────────────────────────────────

  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => {
      if (!isAuthenticated()) {
        router.push("/login?type=client&session=expired");
        throw new Error("Not authenticated");
      }
      const data = await api.get<{ results: Project[] }>("/api/v1/projects/");
      return data.results || [];
    },
  });

  const {
    data: allMilestones,
    isLoading: milestonesLoading,
    error: milestonesError,
  } = useQuery({
    queryKey: ["client-milestones", projectsData],
    queryFn: async () => {
      if (!projectsData || projectsData.length === 0) return [];

      const milestonesPromises = projectsData.map(async (project) => {
        try {
          const data = await api.get<{ results: Milestone[] }>(
            `/api/v1/projects/${project.id}/milestones/`,
          );
          return (data.results || []).map((milestone) => ({
            ...milestone,
            projectId: project.id,
            projectName: project.project_name,
            postedBy: project.service_provider.full_name,
            providerInitials: project.service_provider.initials,
            comments: [] as MilestoneComment[],
          }));
        } catch {
          return [];
        }
      });

      const arrays = await Promise.all(milestonesPromises);
      return arrays.flat();
    },
    enabled: !!projectsData && projectsData.length > 0,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addCommentMutation = useMutation({
    mutationFn: async ({
      milestoneId,
      comment,
    }: {
      milestoneId: string;
      comment: string;
    }) => {
      throw new Error("Comment functionality coming soon!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-milestones"] });
      showToast("Comment posted successfully!");
    },
    onError: (error: unknown) => {
      const e = error as { message?: string };
      alert(e.message || "Failed to add comment. Please try again.");
    },
  });

  const handleAddComment = async (milestoneId: string) => {
    const comment = commentText[milestoneId];
    if (!comment || comment.trim() === "") {
      alert("Please enter a comment");
      return;
    }
    try {
      await addCommentMutation.mutateAsync({ milestoneId, comment });
      setCommentText({ ...commentText, [milestoneId]: "" });
    } catch {
      // handled in mutation
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const projects: Project[] = Array.isArray(projectsData) ? projectsData : [];
  const milestones: EnrichedMilestone[] = Array.isArray(allMilestones)
    ? allMilestones
    : [];

  const filteredMilestones = milestones.filter((m) => {
    const matchProject =
      selectedProject === "all" || m.projectId.toString() === selectedProject;
    const matchStatus = selectedStatus === "all" || m.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      m.title?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.projectName?.toLowerCase().includes(q);
    return matchProject && matchStatus && matchSearch;
  });

  const groupedMilestones = filteredMilestones.reduce<
    Record<string, EnrichedMilestone[]>
  >((acc, m) => {
    const pid = m.projectId.toString();
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(m);
    return acc;
  }, {});

  const getProjectProgress = (projectId: string) => {
    const pm = milestones.filter((m) => m.projectId.toString() === projectId);
    if (!pm.length) return 0;
    return Math.round(
      (pm.filter((m) => m.status === "completed").length / pm.length) * 100,
    );
  };

  const isLoading = projectsLoading || milestonesLoading;

  // ── Loading ───────────────────────────────────────────────────────────────

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
          <div
            className="animate-spin"
            style={{
              width: 48,
              height: 48,
              border: "3px solid var(--color-neutral-200)",
              borderTopColor: "#1ab189",
              borderRadius: "50%",
              margin: "0 auto 1rem",
            }}
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

  if (projectsError || milestonesError) {
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
            style={{
              padding: "0.625rem 1.5rem",
              background: "#1ab189",
              color: "#fff",
              border: "none",
              borderRadius: "0.625rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-neutral-50)" }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .milestone-row:hover { background: var(--color-neutral-50); }
        .comment-toggle:hover { color: #1ab189; }
        .chip-filter {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.25rem 0.75rem; border-radius: 9999px;
          font-size: 0.75rem; font-weight: 600; border: 1px solid;
        }
      `}</style>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.5rem 2rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.375rem",
            fontWeight: 700,
            color: "var(--color-neutral-900)",
            margin: 0,
          }}
        >
          Project Milestones
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-neutral-500)",
            margin: "0.25rem 0 0",
          }}
        >
          Track progress and milestones for your projects
        </p>
      </div>

      <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
        {/* Filters Card */}
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
            {/* Project Filter */}
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
                  <option value="all">All Projects ({projects.length})</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      {p.project_name}
                    </option>
                  ))}
                </FocusInput>
              </div>
            </div>

            {/* Status Filter */}
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
                  placeholder="Search by title or description…"
                  style={{ paddingLeft: "2.25rem" }}
                />
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
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

        {/* Empty State */}
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
              No Milestones Found
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-500)",
              }}
            >
              {searchQuery ||
              selectedProject !== "all" ||
              selectedStatus !== "all"
                ? "Try adjusting your filters or search query"
                : "Your service providers haven't created any milestones yet"}
            </p>
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
                const progress = getProjectProgress(projectId);
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
                    {/* Project Header */}
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
                              {project?.service_provider?.full_name ||
                                "Service Provider"}
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

                      {/* Progress Bar */}
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
                            background: "var(--color-neutral-200)",
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

                    {/* Milestone Rows */}
                    <div>
                      {pMilestones.map((milestone, idx) => {
                        const overdue = isOverdue(
                          milestone.target_date,
                          milestone.status,
                        );
                        const isExpanded =
                          expandedMilestone === milestone.id.toString();

                        return (
                          <div
                            key={milestone.id}
                            className="milestone-row"
                            style={{
                              borderBottom:
                                idx < pMilestones.length - 1
                                  ? "1px solid var(--color-neutral-200)"
                                  : "none",
                              transition: "background 150ms",
                            }}
                          >
                            {/* Milestone Content */}
                            <div style={{ padding: "1rem 1.5rem" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "1rem",
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {/* Title + Badges */}
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

                                  {/* Description */}
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

                                  {/* Meta row */}
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
                                        color: "var(--color-neutral-500)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.35rem",
                                      }}
                                    >
                                      <FontAwesomeIcon
                                        icon={faUser}
                                        style={{ fontSize: "0.625rem" }}
                                      />
                                      {milestone.postedBy}
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
                                      Due: {formatDate(milestone.target_date)}
                                    </span>
                                    {milestone.completion_date && (
                                      <span
                                        style={{
                                          fontSize: "0.8125rem",
                                          color: "#1ab189",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.35rem",
                                          fontWeight: 600,
                                        }}
                                      >
                                        <FontAwesomeIcon
                                          icon={faCheck}
                                          style={{ fontSize: "0.625rem" }}
                                        />
                                        Completed:{" "}
                                        {formatDate(milestone.completion_date)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Comments Toggle */}
                              <div
                                style={{
                                  marginTop: "0.875rem",
                                  paddingTop: "0.875rem",
                                  borderTop:
                                    "1px solid var(--color-neutral-200)",
                                }}
                              >
                                <button
                                  className="comment-toggle"
                                  onClick={() =>
                                    setExpandedMilestone(
                                      isExpanded
                                        ? null
                                        : milestone.id.toString(),
                                    )
                                  }
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    background: "none",
                                    border: "none",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    color: "var(--color-neutral-600)",
                                    cursor: "pointer",
                                    padding: 0,
                                    transition: "color 150ms",
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={faComment}
                                    style={{ fontSize: "0.8125rem" }}
                                  />
                                  Comments ({milestone.comments.length})
                                  <FontAwesomeIcon
                                    icon={
                                      isExpanded ? faChevronUp : faChevronDown
                                    }
                                    style={{ fontSize: "0.6875rem" }}
                                  />
                                </button>
                              </div>
                            </div>

                            {/* Comments Panel */}
                            {isExpanded && (
                              <div
                                style={{
                                  padding: "0 1.5rem 1.25rem",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.75rem",
                                }}
                              >
                                {/* Existing Comments */}
                                {milestone.comments.length > 0 ? (
                                  milestone.comments.map((comment) => (
                                    <div
                                      key={comment.id}
                                      style={{
                                        display: "flex",
                                        gap: "0.75rem",
                                        padding: "0.875rem 1rem",
                                        borderRadius: "0.75rem",
                                        background: comment.isClient
                                          ? "rgba(26,177,137,0.06)"
                                          : "var(--color-neutral-50)",
                                        border: comment.isClient
                                          ? "1px solid rgba(26,177,137,0.15)"
                                          : "1px solid var(--color-neutral-200)",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 36,
                                          height: 36,
                                          borderRadius: "50%",
                                          background: comment.isClient
                                            ? "#3b82f6"
                                            : "#1ab189",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "#fff",
                                          fontSize: "0.75rem",
                                          fontWeight: 700,
                                          flexShrink: 0,
                                        }}
                                      >
                                        {comment.authorInitials}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            marginBottom: "0.25rem",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: "0.8125rem",
                                              fontWeight: 600,
                                              color: "var(--color-neutral-900)",
                                            }}
                                          >
                                            {comment.author}
                                          </span>
                                          {comment.isClient && (
                                            <span
                                              style={{
                                                fontSize: "0.625rem",
                                                fontWeight: 700,
                                                padding: "0.125rem 0.5rem",
                                                borderRadius: 9999,
                                                background:
                                                  "rgba(59,130,246,0.1)",
                                                color: "#1d4ed8",
                                                border:
                                                  "1px solid rgba(59,130,246,0.2)",
                                              }}
                                            >
                                              You
                                            </span>
                                          )}
                                          <span
                                            style={{
                                              fontSize: "0.75rem",
                                              color: "var(--color-neutral-400)",
                                            }}
                                          >
                                            {comment.timeAgo}
                                          </span>
                                        </div>
                                        <p
                                          style={{
                                            fontSize: "0.875rem",
                                            color: "var(--color-neutral-700)",
                                            margin: 0,
                                            lineHeight: 1.5,
                                          }}
                                        >
                                          {comment.text}
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p
                                    style={{
                                      fontSize: "0.875rem",
                                      color: "var(--color-neutral-400)",
                                      textAlign: "center",
                                      padding: "1.25rem 0",
                                      margin: 0,
                                    }}
                                  >
                                    No comments yet. Be the first to comment!
                                  </p>
                                )}

                                {/* Add Comment */}
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "0.75rem",
                                    paddingTop: "0.75rem",
                                    borderTop:
                                      "1px solid var(--color-neutral-200)",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: "50%",
                                      background: "#3b82f6",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#fff",
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      flexShrink: 0,
                                    }}
                                  >
                                    CL
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <FocusInput
                                      as="textarea"
                                      value={
                                        commentText[milestone.id.toString()] ||
                                        ""
                                      }
                                      onChange={(
                                        e: React.ChangeEvent<HTMLTextAreaElement>,
                                      ) =>
                                        setCommentText({
                                          ...commentText,
                                          [milestone.id.toString()]:
                                            e.target.value,
                                        })
                                      }
                                      placeholder="Add a comment or ask a question about this milestone…"
                                      style={{ resize: "none", minHeight: 80 }}
                                      rows={3}
                                    />
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        marginTop: "0.5rem",
                                      }}
                                    >
                                      <button
                                        onClick={() =>
                                          handleAddComment(
                                            milestone.id.toString(),
                                          )
                                        }
                                        disabled={addCommentMutation.isPending}
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "0.375rem",
                                          padding: "0.5rem 1rem",
                                          background: "#1ab189",
                                          color: "#fff",
                                          border: "none",
                                          borderRadius: "0.5rem",
                                          fontSize: "0.8125rem",
                                          fontWeight: 600,
                                          cursor: addCommentMutation.isPending
                                            ? "not-allowed"
                                            : "pointer",
                                          opacity: addCommentMutation.isPending
                                            ? 0.6
                                            : 1,
                                          transition: "opacity 150ms",
                                        }}
                                      >
                                        <FontAwesomeIcon
                                          icon={faPaperPlane}
                                          style={{ fontSize: "0.75rem" }}
                                        />
                                        {addCommentMutation.isPending
                                          ? "Posting…"
                                          : "Post Comment"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
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
    </div>
  );
}
