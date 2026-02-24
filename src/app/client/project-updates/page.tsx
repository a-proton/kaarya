"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faNewspaper,
  faFilter,
  faSearch,
  faImage,
  faVideo,
  faComment,
  faPaperPlane,
  faClock,
  faCheckCircle,
  faExclamationCircle,
  faChevronDown,
  faChevronUp,
  faCalendar,
  faUser,
  faSpinner,
  faExclamationTriangle,
  faFolder,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpdateMedia {
  id: number;
  media_type: "image" | "video";
  media_url: string;
  thumbnail_url: string;
  caption?: string;
  file_size: number;
  created_at: string;
}
interface ProjectUpdate {
  id: number;
  update_text: string;
  work_hours?: number;
  posted_by_name: string;
  milestone?: number;
  milestone_title?: string;
  media: UpdateMedia[];
  created_at: string;
}
interface Project {
  id: number;
  project_name: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "on_hold";
  status_display: string;
  service_provider: {
    id: number;
    full_name: string;
    business_name?: string;
    profile_image?: string;
  };
  created_at: string;
}
interface DailyUpdate {
  id: string;
  projectId: string;
  projectName: string;
  postedBy: string;
  providerInitials: string;
  date: string;
  timeAgo: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "blocked";
  images: string[];
  videos: string[];
  providerColor: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  string,
  {
    bg: string;
    color: string;
    border: string;
    icon: typeof faCheckCircle;
    label: string;
  }
> = {
  completed: {
    bg: "rgba(26,177,137,0.1)",
    color: "#065f46",
    border: "rgba(26,177,137,0.3)",
    icon: faCheckCircle,
    label: "Completed",
  },
  "in-progress": {
    bg: "rgba(59,130,246,0.1)",
    color: "#1d4ed8",
    border: "rgba(59,130,246,0.3)",
    icon: faClock,
    label: "In Progress",
  },
  blocked: {
    bg: "rgba(239,68,68,0.1)",
    color: "#991b1b",
    border: "rgba(239,68,68,0.3)",
    icon: faExclamationCircle,
    label: "Blocked",
  },
};

const AVATAR_COLORS = [
  "#1ab189",
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];

const baseInput: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 1rem 0.625rem 2.5rem",
  fontFamily: "inherit",
  fontSize: "0.875rem",
  color: "var(--color-neutral-900)",
  background: "#fff",
  border: "1px solid var(--color-neutral-200)",
  borderRadius: "0.625rem",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) => {
  if (!name) return "?";
  const w = name.split(" ");
  return w.length >= 2
    ? `${w[0][0]}${w[1][0]}`.toUpperCase()
    : w[0][0].toUpperCase();
};
const getTimeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000),
    h = Math.floor(diff / 3600000),
    dy = Math.floor(diff / 86400000);
  if (m < 60) return `${m} min${m !== 1 ? "s" : ""} ago`;
  if (h < 24) return `${h} hr${h !== 1 ? "s" : ""} ago`;
  if (dy < 7) return `${dy} day${dy !== 1 ? "s" : ""} ago`;
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const transformUpdate = (
  u: ProjectUpdate,
  p: Project,
  idx: number,
): DailyUpdate => ({
  id: `${p.id}-${u.id}`,
  projectId: p.id.toString(),
  projectName: p.project_name,
  postedBy: u.posted_by_name,
  providerInitials: getInitials(u.posted_by_name),
  date: formatDate(u.created_at),
  timeAgo: getTimeAgo(u.created_at),
  title: u.milestone_title || "Daily Progress Update",
  description: u.update_text,
  status:
    p.status === "completed"
      ? "completed"
      : p.status === "in_progress"
        ? "in-progress"
        : "blocked",
  images: u.media
    .filter((m) => m.media_type === "image")
    .map((m) => m.media_url),
  videos: u.media
    .filter((m) => m.media_type === "video")
    .map((m) => m.media_url),
  providerColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["in-progress"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "0.6875rem",
        fontWeight: 600,
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

function FLabel({ children }: { children: React.ReactNode }) {
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientProjectUpdatesPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUpdates, setAllUpdates] = useState<DailyUpdate[]>([]);
  const [selProject, setSelProject] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated()) {
        router.push("/login?type=client&session=expired");
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const pd = await api.get<{ results: Project[] }>("/api/v1/projects/");
        const projs = pd.results || [];
        setProjects(projs);
        const arrays = await Promise.all(
          projs.map(async (p, i) => {
            try {
              const r = await api.get<{ results: ProjectUpdate[] }>(
                `/api/v1/projects/${p.id}/updates/`,
              );
              return (r.results || []).map((u) => transformUpdate(u, p, i));
            } catch {
              return [];
            }
          }),
        );
        setAllUpdates(
          arrays
            .flat()
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            ),
        );
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string };
        if (err.status !== 401)
          setError(err.message || "Failed to load updates");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const filtered = allUpdates.filter((u) => {
    const matchP = selProject === "all" || u.projectId === selProject;
    const q = search.toLowerCase();
    const matchS =
      !q ||
      u.title.toLowerCase().includes(q) ||
      u.description.toLowerCase().includes(q) ||
      u.projectName.toLowerCase().includes(q);
    return matchP && matchS;
  });

  if (loading)
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
            className="animate-spin"
            style={{
              fontSize: "2.5rem",
              color: "#1ab189",
              marginBottom: "1rem",
            }}
          />
          <p
            style={{ fontSize: "0.9375rem", color: "var(--color-neutral-500)" }}
          >
            Loading your project updates…
          </p>
        </div>
      </div>
    );

  if (error)
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
              icon={faExclamationTriangle}
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
            Error Loading Updates
          </h3>
          <p
            style={{
              color: "var(--color-neutral-500)",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            {error}
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

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-neutral-50)" }}>
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .upd-card { transition: box-shadow 150ms, border-color 150ms; }
        .upd-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.09) !important; border-color: var(--color-neutral-300) !important; }
        .media-thumb { transition: opacity 150ms; cursor: pointer; }
        .media-thumb:hover { opacity: 0.88; }
        .cmt-btn:hover { color: #1ab189 !important; }
        .comment-ta:focus { border-color: #1ab189 !important; box-shadow: 0 0 0 3px rgba(26,177,137,0.12) !important; outline: none; }
        .sel-focus:focus { border-color: #1ab189 !important; box-shadow: 0 0 0 3px rgba(26,177,137,0.12) !important; outline: none; }
        .inp-focus:focus { border-color: #1ab189 !important; box-shadow: 0 0 0 3px rgba(26,177,137,0.12) !important; outline: none; }
      `}</style>

      {/* Page header */}
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
          Daily Updates
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-neutral-500)",
            margin: "0.25rem 0 0",
          }}
        >
          Progress updates from your service providers
        </p>
      </div>

      <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
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
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            {/* Project */}
            <div>
              <FLabel>Project</FLabel>
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
                <select
                  value={selProject}
                  onChange={(e) => setSelProject(e.target.value)}
                  className="sel-focus"
                  style={{
                    ...baseInput,
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="all">All Projects ({projects.length})</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      {p.project_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Search */}
            <div>
              <FLabel>Search</FLabel>
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
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, description, project…"
                  className="inp-focus"
                  style={{ ...baseInput }}
                />
              </div>
            </div>
          </div>

          {(selProject !== "all" || search) && (
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
              {selProject !== "all" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.25rem 0.75rem",
                    borderRadius: 9999,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: "rgba(26,177,137,0.08)",
                    color: "#065f46",
                    border: "1px solid rgba(26,177,137,0.2)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFolder}
                    style={{ fontSize: "0.6rem" }}
                  />
                  {
                    projects.find((p) => p.id.toString() === selProject)
                      ?.project_name
                  }
                </span>
              )}
              {search && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.25rem 0.75rem",
                    borderRadius: 9999,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: "var(--color-neutral-100)",
                    color: "var(--color-neutral-700)",
                    border: "1px solid var(--color-neutral-200)",
                  }}
                >
                  "{search}"
                </span>
              )}
              <button
                onClick={() => {
                  setSelProject("all");
                  setSearch("");
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

        {/* Updates */}
        {filtered.length === 0 ? (
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
                icon={faNewspaper}
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
              No Updates Found
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-500)",
              }}
            >
              {search || selProject !== "all"
                ? "Try adjusting your filters"
                : "Your service providers haven't posted any updates yet"}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {filtered.map((upd) => (
              <div
                key={upd.id}
                className="upd-card"
                style={{
                  background: "#fff",
                  border: "1px solid var(--color-neutral-200)",
                  borderRadius: "1rem",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
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
                      gap: "1rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        backgroundColor: upd.providerColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        flexShrink: 0,
                      }}
                    >
                      {upd.providerInitials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.625rem",
                            borderRadius: 9999,
                            background: "rgba(26,177,137,0.1)",
                            color: "#065f46",
                            border: "1px solid rgba(26,177,137,0.2)",
                          }}
                        >
                          {upd.projectName}
                        </span>
                        <StatusBadge status={upd.status} />
                      </div>
                      <h2
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "var(--color-neutral-900)",
                          margin: "0 0 0.5rem",
                        }}
                      >
                        {upd.title}
                      </h2>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "1rem",
                        }}
                      >
                        {[
                          { icon: faUser, label: upd.postedBy },
                          { icon: faCalendar, label: upd.date },
                          { icon: faClock, label: upd.timeAgo },
                        ].map(({ icon, label }, metaIdx) => (
                          <span
                            key={metaIdx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              fontSize: "0.8125rem",
                              color: "var(--color-neutral-500)",
                            }}
                          >
                            <FontAwesomeIcon
                              icon={icon}
                              style={{ fontSize: "0.625rem" }}
                            />
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description box */}
                  <div
                    style={{
                      background: "var(--color-neutral-50)",
                      border: "1px solid var(--color-neutral-200)",
                      borderRadius: "0.75rem",
                      padding: "0.875rem 1rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-700)",
                        lineHeight: 1.6,
                        margin: 0,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {upd.description}
                    </p>
                  </div>
                </div>

                {/* Media */}
                {(upd.images.length > 0 || upd.videos.length > 0) && (
                  <div
                    style={{
                      padding: "1.25rem 1.5rem",
                      background: "var(--color-neutral-50)",
                      borderBottom: "1px solid var(--color-neutral-200)",
                    }}
                  >
                    {upd.images.length > 0 && (
                      <div
                        style={{
                          marginBottom: upd.videos.length ? "1.25rem" : 0,
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "var(--color-neutral-700)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            margin: "0 0 0.75rem",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faImage}
                            style={{ color: "#1ab189", fontSize: "0.75rem" }}
                          />
                          Photos ({upd.images.length})
                        </p>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "0.5rem",
                          }}
                        >
                          {upd.images.map((src, i) => (
                            <div
                              key={i}
                              className="media-thumb"
                              style={{
                                aspectRatio: "16/9",
                                borderRadius: "0.625rem",
                                overflow: "hidden",
                              }}
                              onClick={() => window.open(src, "_blank")}
                            >
                              <img
                                src={src}
                                alt={`Image ${i + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "https://via.placeholder.com/400x300?text=Not+Found";
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {upd.videos.length > 0 && (
                      <div>
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "var(--color-neutral-700)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            margin: "0 0 0.75rem",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faVideo}
                            style={{ color: "#1ab189", fontSize: "0.75rem" }}
                          />
                          Videos ({upd.videos.length})
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          {upd.videos.map((src, i) => (
                            <div
                              key={i}
                              style={{
                                borderRadius: "0.75rem",
                                overflow: "hidden",
                                background: "var(--color-neutral-900)",
                              }}
                            >
                              <video
                                src={src}
                                controls
                                style={{ width: "100%", display: "block" }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments */}
                <div style={{ padding: "1rem 1.5rem" }}>
                  <button
                    className="cmt-btn"
                    onClick={() =>
                      setExpandedId(expandedId === upd.id ? null : upd.id)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-neutral-600)",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      padding: 0,
                      marginBottom: expandedId === upd.id ? "1rem" : 0,
                      transition: "color 150ms",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faComment}
                      style={{ fontSize: "0.875rem" }}
                    />
                    Add Comment
                    <FontAwesomeIcon
                      icon={expandedId === upd.id ? faChevronUp : faChevronDown}
                      style={{ fontSize: "0.75rem" }}
                    />
                  </button>

                  {expandedId === upd.id && (
                    <div
                      style={{
                        paddingTop: "0.875rem",
                        borderTop: "1px solid var(--color-neutral-200)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "0.875rem",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            backgroundColor: "#1ab189",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            flexShrink: 0,
                          }}
                        >
                          CL
                        </div>
                        <div style={{ flex: 1 }}>
                          <textarea
                            value={commentText[upd.id] || ""}
                            rows={3}
                            onChange={(e) =>
                              setCommentText({
                                ...commentText,
                                [upd.id]: e.target.value,
                              })
                            }
                            placeholder="Add a comment or ask a question…"
                            className="comment-ta"
                            style={{
                              width: "100%",
                              padding: "0.625rem 1rem",
                              fontFamily: "inherit",
                              fontSize: "0.875rem",
                              color: "var(--color-neutral-900)",
                              background: "#fff",
                              border: "1px solid var(--color-neutral-200)",
                              borderRadius: "0.625rem",
                              resize: "none",
                              transition:
                                "border-color 150ms, box-shadow 150ms",
                              boxSizing: "border-box",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              marginTop: "0.5rem",
                            }}
                          >
                            <button
                              onClick={() => {
                                const c = commentText[upd.id];
                                if (!c?.trim()) {
                                  alert("Please enter a comment");
                                  return;
                                }
                                alert("Comment functionality coming soon!");
                                setCommentText({
                                  ...commentText,
                                  [upd.id]: "",
                                });
                              }}
                              className="btn btn-primary btn-sm"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faPaperPlane}
                                style={{ fontSize: "0.7rem" }}
                              />
                              Post Comment
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
