"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faCalendar,
  faImage,
  faVideo,
  faFileAlt,
  faTimes,
  faPaperPlane,
  faPlus,
  faChevronDown,
  faArrowLeft,
  faBriefcase,
  faCheck,
  faSpinner,
  faEye,
  faTrash,
  faFilter,
  faClock,
  faUser,
  faCloudUpload,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { uploadProjectUpdateMedia } from "@/lib/storageService";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface MediaFile {
  id: string;
  file: File;
  type: "image" | "video";
  preview: string;
  uploadStatus?: "pending" | "uploading" | "uploaded" | "failed";
  uploadProgress?: number;
  uploadedUrl?: string;
  error?: string;
}

interface ApiUpdate {
  id: number;
  update_text: string;
  work_hours: string;
  posted_by_name: string;
  milestone: number | null;
  media: MediaItem[];
  created_at: string;
}

interface MediaItem {
  media_file?: string;
  media_url?: string;
  file?: string;
  url?: string;
}

interface DailyUpdate extends ApiUpdate {
  project_id: number;
  project_name?: string;
  client_name?: string;
  title?: string;
  status?: "completed" | "in-progress" | "blocked";
}

interface UpdateFormData {
  project: string;
  title: string;
  content: string;
  status: "completed" | "in-progress" | "blocked";
  work_hours: string;
}

interface ApiError {
  data?: { detail?: string };
  message?: string;
}

interface DeleteTarget {
  id: number;
  projectId: number;
  title: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; border: string; label: string; symbol: string }
> = {
  completed: {
    bg: "rgba(26,177,137,0.1)",
    color: "#065f46",
    border: "rgba(26,177,137,0.3)",
    label: "Completed",
    symbol: "✓",
  },
  "in-progress": {
    bg: "rgba(59,130,246,0.1)",
    color: "#1d4ed8",
    border: "rgba(59,130,246,0.3)",
    label: "In Progress",
    symbol: "⏱",
  },
  blocked: {
    bg: "rgba(239,68,68,0.1)",
    color: "#991b1b",
    border: "rgba(239,68,68,0.25)",
    label: "Blocked",
    symbol: "⚠",
  },
};

// ─── Design tokens ────────────────────────────────────────────────────────────

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
  appearance: "none" as const,
};

const focusRing: React.CSSProperties = {
  borderColor: "#1ab189",
  boxShadow: "0 0 0 3px rgba(26,177,137,0.12)",
};

// ─── API helpers ──────────────────────────────────────────────────────────────

async function authedFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) throw new Error("No authentication token found");
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });
}

async function fetchProjects(): Promise<{ results: Project[] }> {
  const res = await authedFetch(`${API_BASE_URL}/api/v1/projects/`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

async function fetchProjectUpdates(
  projectId: number,
): Promise<{ results: ApiUpdate[] }> {
  const res = await authedFetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/updates/`,
  );
  if (!res.ok)
    throw new Error(`Failed to fetch updates for project ${projectId}`);
  return res.json();
}

async function createUpdateWithMediaUrls(
  projectId: string,
  updateData: { update_text: string; work_hours: string; media_urls: string[] },
): Promise<unknown> {
  const res = await authedFetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/updates/create/`,
    { method: "POST", body: JSON.stringify(updateData) },
  );
  if (!res.ok) {
    let errorData: Record<string, unknown>;
    try {
      errorData = await res.json();
    } catch {
      errorData = {};
    }
    const detail = (errorData.detail as string) || (errorData.error as string);
    if (detail) throw new Error(detail);
    const fieldErrors = Object.entries(errorData)
      .map(
        ([f, msgs]) => `${f}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`,
      )
      .join("\n");
    throw new Error(fieldErrors || "Failed to create update");
  }
  return res.json();
}

async function deleteUpdateApi(
  projectId: number,
  updateId: number,
): Promise<void> {
  const res = await authedFetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/updates/${updateId}/delete/`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    let errorData: Record<string, unknown>;
    try {
      errorData = await res.json();
    } catch {
      errorData = {};
    }
    throw new Error(
      (errorData.detail as string) ||
        (errorData.error as string) ||
        "Failed to delete update",
    );
  }
}

function getMediaUrl(media: MediaItem): string {
  return media.media_file || media.media_url || media.file || media.url || "";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-neutral-200)",
        borderRadius: "1rem",
        padding: "1.5rem",
      }}
    >
      {children}
    </div>
  );
}

function SectionIcon({ icon }: { icon: typeof faCheck }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        background: "rgba(26,177,137,0.1)",
        borderRadius: "0.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <FontAwesomeIcon
        icon={icon}
        style={{ color: "#1ab189", fontSize: "0.8125rem" }}
      />
    </div>
  );
}

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
        letterSpacing: "0.03em",
        padding: "0.25rem 0.625rem",
        borderRadius: 9999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {s.symbol} {s.label}
    </span>
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

function UploadingToast() {
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
        minWidth: 260,
      }}
    >
      <FontAwesomeIcon
        icon={faSpinner}
        className="animate-spin"
        style={{ color: "#1ab189", fontSize: "1rem" }}
      />
      <div>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>
          Uploading Media…
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.6)",
            margin: 0,
          }}
        >
          Please wait
        </p>
      </div>
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
          maxWidth: 720,
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

// ─── Delete Modal ─────────────────────────────────────────────────────────────

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
            Delete Update
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
        {/* Warning */}
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
            Any media files and client-visible progress associated with this
            update will also be removed.
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

// ─── Discard Modal ────────────────────────────────────────────────────────────

function DiscardModal({
  onConfirm,
  onCancel,
}: {
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
        <div style={{ padding: "1.5rem 1.5rem 0" }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "rgba(245,158,11,0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              style={{ color: "#f59e0b", fontSize: "1.125rem" }}
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
            Discard Update?
          </p>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-neutral-500)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            All content you've entered — title, description, and attached media
            — will be permanently lost.
          </p>
        </div>
        <div
          style={{
            background: "var(--color-neutral-50)",
            borderTop: "1px solid var(--color-neutral-200)",
            padding: "1rem 1.5rem",
            marginTop: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button className="btn btn-ghost" onClick={onCancel}>
            Keep Editing
          </button>
          <button
            onClick={onConfirm}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              background: "#f59e0b",
              color: "#fff",
              border: "none",
              borderRadius: "0.625rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <FontAwesomeIcon icon={faTrash} style={{ fontSize: "0.75rem" }} />
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DailyUpdatesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Form state
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [updateTitle, setUpdateTitle] = useState<string>("");
  const [updateContent, setUpdateContent] = useState<string>("");
  const [workHours, setWorkHours] = useState<string>("");
  const [updateStatus, setUpdateStatus] = useState<
    "completed" | "in-progress" | "blocked"
  >("completed");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // UI state
  const [toast, setToast] = useState<string | null>(null);
  const [viewingUpdate, setViewingUpdate] = useState<DailyUpdate | null>(null);
  const [deletingUpdate, setDeletingUpdate] = useState<DeleteTarget | null>(
    null,
  );
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [filterProject, setFilterProject] = useState<string>("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const {
    data: allUpdatesData,
    isLoading: updatesLoading,
    isError,
  } = useQuery({
    queryKey: ["all-daily-updates"],
    queryFn: async () => {
      let projects: Project[] = projectsData?.results || [];
      if (!projects.length) {
        const res = await fetchProjects();
        projects = res.results || [];
      }
      if (!projects.length) return [];

      const arrays = await Promise.all(
        projects.map(async (project) => {
          try {
            const res = await fetchProjectUpdates(project.id);
            return (res.results || []).map((update) => ({
              ...update,
              project_id: project.id,
              project_name: project.project_name,
              client_name: project.client?.full_name || "Unassigned",
              title: update.update_text.split("\n")[0].substring(0, 100),
              status:
                parseFloat(update.work_hours) > 0 ? "completed" : "in-progress",
            })) as DailyUpdate[];
          } catch {
            return [] as DailyUpdate[];
          }
        }),
      );
      return arrays.flat();
    },
    enabled: true,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createUpdateMutation = useMutation({
    mutationFn: async (data: UpdateFormData & { media: MediaFile[] }) => {
      const uploadedUrls: string[] = [];

      if (data.media.length > 0) {
        setIsUploadingMedia(true);
        for (const media of data.media) {
          setMediaFiles((prev) =>
            prev.map((m) =>
              m.id === media.id
                ? { ...m, uploadStatus: "uploading", uploadProgress: 0 }
                : m,
            ),
          );
          try {
            const result = await uploadProjectUpdateMedia(media.file, {
              folder: `project_updates/${data.project}`,
            });
            if (result.success && result.publicUrl) {
              uploadedUrls.push(result.publicUrl);
              setMediaFiles((prev) =>
                prev.map((m) =>
                  m.id === media.id
                    ? {
                        ...m,
                        uploadStatus: "uploaded",
                        uploadProgress: 100,
                        uploadedUrl: result.publicUrl,
                      }
                    : m,
                ),
              );
            } else throw new Error(result.error || "Upload failed");
          } catch (err) {
            setMediaFiles((prev) =>
              prev.map((m) =>
                m.id === media.id
                  ? {
                      ...m,
                      uploadStatus: "failed",
                      error:
                        err instanceof Error ? err.message : "Upload failed",
                    }
                  : m,
              ),
            );
            throw new Error(
              `Failed to upload ${media.file.name}: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
          }
        }
        setIsUploadingMedia(false);
      }

      return createUpdateWithMediaUrls(data.project, {
        update_text: `${data.title}\n\n${data.content}`,
        work_hours: data.work_hours.trim() || "0",
        media_urls: uploadedUrls,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-daily-updates"] });
      showToast("Update posted successfully!");
      resetForm();
    },
    onError: (err: unknown) => {
      const e = err as ApiError;
      alert(e.message || "Failed to post update");
      setIsUploadingMedia(false);
    },
  });

  const deleteUpdateMutation = useMutation({
    mutationFn: async ({
      projectId,
      updateId,
    }: {
      projectId: number;
      updateId: number;
    }) => {
      await deleteUpdateApi(projectId, updateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-daily-updates"] });
      showToast("Update deleted successfully!");
      setDeletingUpdate(null);
      setViewingUpdate(null);
    },
    onError: (err: unknown) => {
      const e = err as ApiError;
      alert(e.message || "Failed to delete update");
      setDeletingUpdate(null);
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const projects = projectsData?.results || [];
  const dailyUpdates: DailyUpdate[] = Array.isArray(allUpdatesData)
    ? allUpdatesData
    : [];

  const resetForm = () => {
    setUpdateTitle("");
    setUpdateContent("");
    setUpdateStatus("completed");
    setWorkHours("");
    mediaFiles.forEach((m) => URL.revokeObjectURL(m.preview));
    setMediaFiles([]);
    setSelectedProject("");
    setIsUploadingMedia(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: MediaFile[] = [];
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        alert(`${file.name} is not a valid image or video`);
        return;
      }
      const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`${file.name} exceeds the ${isVideo ? "100MB" : "5MB"} limit`);
        return;
      }
      newFiles.push({
        id: Date.now().toString() + Math.random(),
        file,
        type: isImage ? "image" : "video",
        preview: URL.createObjectURL(file),
        uploadStatus: "pending",
        uploadProgress: 0,
      });
    });
    setMediaFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = (id: string) => {
    setMediaFiles((prev) => {
      const f = prev.find((m) => m.id === id);
      if (f) URL.revokeObjectURL(f.preview);
      return prev.filter((m) => m.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      alert("Please select a project");
      return;
    }
    if (!updateTitle.trim()) {
      alert("Please add a title");
      return;
    }
    if (!updateContent.trim()) {
      alert("Please add update content");
      return;
    }
    setIsSubmitting(true);
    try {
      await createUpdateMutation.mutateAsync({
        project: selectedProject,
        title: updateTitle,
        content: updateContent,
        status: updateStatus,
        work_hours: workHours,
        media: mediaFiles,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUpdates =
    filterProject === "all"
      ? dailyUpdates
      : dailyUpdates.filter((u) => u.project_id.toString() === filterProject);

  const selectedProjectData = projects.find(
    (p) => p.id.toString() === selectedProject,
  );
  const isLoading = projectsLoading || updatesLoading;
  const isBusy =
    isSubmitting || createUpdateMutation.isPending || isUploadingMedia;

  // ── Loading / Error ────────────────────────────────────────────────────────

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
            className="animate-spin"
            style={{
              fontSize: "2.5rem",
              color: "#1ab189",
              marginBottom: "1rem",
            }}
          />
          <p
            style={{ color: "var(--color-neutral-600)", fontSize: "0.9375rem" }}
          >
            Loading updates…
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
            Error Loading Updates
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
        @keyframes slideInRight { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .update-card:hover { border-color: #1ab189 !important; }
        .media-thumb:hover { border-color: #1ab189 !important; }
        .upload-zone:hover { border-color: #1ab189 !important; background: rgba(26,177,137,0.03) !important; }
        .action-btn { background: none; border: none; cursor: pointer; border-radius: 0.5rem; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: background 150ms; }
        .action-btn:hover { background: var(--color-neutral-100); }
        .remove-btn { opacity: 0; transition: opacity 150ms; }
        .media-wrap:hover .remove-btn { opacity: 1; }
      `}</style>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {isUploadingMedia && <UploadingToast />}

      {/* Page header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.25rem 2rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "rgba(26,177,137,0.1)",
              borderRadius: "0.625rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faClipboardList}
              style={{ color: "#1ab189", fontSize: "0.9375rem" }}
            />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--color-neutral-900)",
                margin: 0,
              }}
            >
              Daily Updates
            </h1>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-neutral-500)",
                margin: 0,
              }}
            >
              Post progress updates with photos and videos
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "2rem", maxWidth: 860, margin: "0 auto" }}>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Project & Work Hours */}
          <SectionCard>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "1.25rem",
              }}
            >
              <SectionIcon icon={faBriefcase} />
              <p
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--color-neutral-900)",
                  margin: 0,
                }}
              >
                Project Details
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <FormLabel required>Select Project</FormLabel>
                <div style={{ position: "relative" }}>
                  <FocusInput
                    as="select"
                    value={selectedProject}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setSelectedProject(e.target.value)
                    }
                    required
                    style={{ cursor: "pointer", paddingRight: "2.5rem" }}
                  >
                    <option value="">Choose a project…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_name} — {p.client?.full_name || "No client"}
                      </option>
                    ))}
                  </FocusInput>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    style={{
                      position: "absolute",
                      right: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-neutral-400)",
                      fontSize: "0.75rem",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                {selectedProjectData && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      background: "rgba(26,177,137,0.06)",
                      border: "1px solid rgba(26,177,137,0.2)",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "#065f46",
                        margin: 0,
                      }}
                    >
                      Client:{" "}
                      <strong>
                        {selectedProjectData.client?.full_name || "Unassigned"}
                      </strong>
                    </p>
                  </div>
                )}
              </div>
              <div>
                <FormLabel>Work Hours</FormLabel>
                <FocusInput
                  type="number"
                  value={workHours}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWorkHours(e.target.value)
                  }
                  min="0"
                  step="0.5"
                  placeholder="e.g., 8.5"
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-neutral-400)",
                    marginTop: "0.375rem",
                  }}
                >
                  Total hours worked on this update
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Title & Status */}
          <SectionCard>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "1.25rem",
              }}
            >
              <SectionIcon icon={faFileAlt} />
              <p
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--color-neutral-900)",
                  margin: 0,
                }}
              >
                Update Info
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <FormLabel required>Title</FormLabel>
                <FocusInput
                  value={updateTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUpdateTitle(e.target.value)
                  }
                  placeholder="e.g., Electrical Wiring Completed"
                  required
                />
              </div>
              <div>
                <FormLabel required>Work Status</FormLabel>
                <div style={{ position: "relative" }}>
                  <FocusInput
                    as="select"
                    value={updateStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setUpdateStatus(e.target.value as typeof updateStatus)
                    }
                    required
                    style={{ cursor: "pointer", paddingRight: "2.5rem" }}
                  >
                    <option value="completed">✓ Completed</option>
                    <option value="in-progress">⏱ In Progress</option>
                    <option value="blocked">⚠ Blocked</option>
                  </FocusInput>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    style={{
                      position: "absolute",
                      right: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-neutral-400)",
                      fontSize: "0.75rem",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Content */}
          <SectionCard>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "1.25rem",
              }}
            >
              <SectionIcon icon={faClipboardList} />
              <p
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--color-neutral-900)",
                  margin: 0,
                }}
              >
                Update Content
              </p>
            </div>
            <FormLabel required>Description</FormLabel>
            <FocusInput
              as="textarea"
              value={updateContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setUpdateContent(e.target.value)
              }
              placeholder={
                "Share today's progress, challenges, or accomplishments…\n\nExample:\n- Completed foundation work\n- Installed electrical wiring\n- Team meeting scheduled for tomorrow"
              }
              required
              rows={8}
              style={{ resize: "none", minHeight: 160 }}
            />
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-neutral-400)",
                marginTop: "0.375rem",
                textAlign: "right",
              }}
            >
              {updateContent.length} characters
            </p>
          </SectionCard>

          {/* Media */}
          <SectionCard>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                }}
              >
                <SectionIcon icon={faImage} />
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "var(--color-neutral-900)",
                    margin: 0,
                  }}
                >
                  Attach Media
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="btn btn-primary"
                style={{ fontSize: "0.8125rem", padding: "0.5rem 0.875rem" }}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  style={{ fontSize: "0.75rem" }}
                />
                Add Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
                disabled={isUploadingMedia}
              />
            </div>

            {mediaFiles.length > 0 ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: "0.75rem",
                  }}
                >
                  {mediaFiles.map((media) => (
                    <div
                      key={media.id}
                      className="media-wrap"
                      style={{ position: "relative" }}
                    >
                      <div
                        className="media-thumb"
                        style={{
                          aspectRatio: "1",
                          background: "var(--color-neutral-100)",
                          border: "1px solid var(--color-neutral-200)",
                          borderRadius: "0.625rem",
                          overflow: "hidden",
                          position: "relative",
                          transition: "border-color 150ms",
                        }}
                      >
                        {media.type === "image" ? (
                          <img
                            src={media.preview}
                            alt="preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              position: "relative",
                            }}
                          >
                            <video
                              src={media.preview}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(0,0,0,0.4)",
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faVideo}
                                style={{ color: "#fff", fontSize: "1.5rem" }}
                              />
                            </div>
                          </div>
                        )}
                        {/* Upload overlay */}
                        {media.uploadStatus &&
                          media.uploadStatus !== "pending" && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(0,0,0,0.6)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.25rem",
                              }}
                            >
                              {media.uploadStatus === "uploading" && (
                                <FontAwesomeIcon
                                  icon={faSpinner}
                                  className="animate-spin"
                                  style={{ color: "#fff", fontSize: "1.25rem" }}
                                />
                              )}
                              {media.uploadStatus === "uploaded" && (
                                <FontAwesomeIcon
                                  icon={faCheck}
                                  style={{
                                    color: "#1ab189",
                                    fontSize: "1.25rem",
                                  }}
                                />
                              )}
                              {media.uploadStatus === "failed" && (
                                <FontAwesomeIcon
                                  icon={faTimes}
                                  style={{
                                    color: "#ef4444",
                                    fontSize: "1.25rem",
                                  }}
                                />
                              )}
                              <p
                                style={{
                                  color: "#fff",
                                  fontSize: "0.625rem",
                                  margin: 0,
                                }}
                              >
                                {media.uploadStatus === "uploading"
                                  ? "Uploading…"
                                  : media.uploadStatus === "uploaded"
                                    ? "Done"
                                    : "Failed"}
                              </p>
                            </div>
                          )}
                      </div>
                      {/* File name */}
                      <p
                        style={{
                          fontSize: "0.625rem",
                          color: "var(--color-neutral-500)",
                          marginTop: "0.25rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {media.file.name}
                      </p>
                      {/* Remove */}
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeMedia(media.id)}
                        disabled={isUploadingMedia}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 22,
                          height: 22,
                          background: "#ef4444",
                          border: "none",
                          borderRadius: "50%",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faTimes}
                          style={{ fontSize: "0.5rem" }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.75rem 1rem",
                    background: "rgba(26,177,137,0.06)",
                    border: "1px solid rgba(26,177,137,0.2)",
                    borderRadius: "0.625rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCloudUpload}
                    style={{ color: "#1ab189", fontSize: "0.875rem" }}
                  />
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "#065f46",
                      margin: 0,
                    }}
                  >
                    {mediaFiles.length} file{mediaFiles.length > 1 ? "s" : ""}{" "}
                    ready — will be uploaded to cloud storage when you post
                  </p>
                </div>
              </>
            ) : (
              <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--color-neutral-300)",
                  borderRadius: "0.875rem",
                  padding: "3rem 2rem",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color 150ms, background 150ms",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    background: "var(--color-neutral-100)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCloudUpload}
                    style={{
                      color: "var(--color-neutral-400)",
                      fontSize: "1.25rem",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--color-neutral-700)",
                    margin: "0 0 0.375rem",
                  }}
                >
                  Click to upload or drag and drop
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-neutral-500)",
                    margin: "0 0 0.25rem",
                  }}
                >
                  Images up to 5MB · Videos up to 100MB
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-neutral-400)",
                    margin: 0,
                  }}
                >
                  JPG, PNG, GIF, MP4, MOV, WEBM
                </p>
              </div>
            )}
          </SectionCard>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={() => setShowDiscardModal(true)}
              disabled={isBusy}
              className="btn btn-ghost"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="btn btn-primary"
              style={{
                minWidth: 160,
                fontSize: "0.9375rem",
                padding: "0.75rem 1.75rem",
                opacity: isBusy ? 0.7 : 1,
                cursor: isBusy ? "not-allowed" : "pointer",
              }}
            >
              {isUploadingMedia ? (
                <>
                  <FontAwesomeIcon
                    icon={faCloudUpload}
                    className="animate-pulse"
                    style={{ fontSize: "0.875rem" }}
                  />
                  Uploading…
                </>
              ) : isBusy ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin"
                    style={{ fontSize: "0.875rem" }}
                  />
                  Posting…
                </>
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={faPaperPlane}
                    style={{ fontSize: "0.875rem" }}
                  />
                  Post Update
                </>
              )}
            </button>
          </div>

          {/* Tips */}
          <div
            style={{
              background: "rgba(26,177,137,0.05)",
              border: "1px solid rgba(26,177,137,0.15)",
              borderRadius: "1rem",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "0.875rem",
              }}
            >
              <SectionIcon icon={faClipboardList} />
              <p
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--color-neutral-900)",
                  margin: 0,
                }}
              >
                Tips for Great Updates
              </p>
            </div>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {[
                "Include specific accomplishments and progress made today",
                "Add photos showing before/after or work in progress",
                "Mention any challenges faced and how they were resolved",
                "Note next steps or what's planned for tomorrow",
              ].map((tip, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      color: "#1ab189",
                      marginTop: 2,
                      fontSize: "0.625rem",
                    }}
                  >
                    ●
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-700)",
                    }}
                  >
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </form>

        {/* Updates list */}
        {dailyUpdates.length > 0 && (
          <div style={{ marginTop: "3rem" }}>
            {/* List header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--color-neutral-900)",
                    margin: 0,
                  }}
                >
                  Recent Updates
                </h2>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-neutral-500)",
                    background: "var(--color-neutral-100)",
                    padding: "0.2rem 0.625rem",
                    borderRadius: 9999,
                  }}
                >
                  {dailyUpdates.length}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FontAwesomeIcon
                  icon={faFilter}
                  style={{
                    color: "var(--color-neutral-400)",
                    fontSize: "0.75rem",
                  }}
                />
                <div style={{ position: "relative" }}>
                  <FocusInput
                    as="select"
                    value={filterProject}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFilterProject(e.target.value)
                    }
                    style={{
                      cursor: "pointer",
                      paddingRight: "2rem",
                      fontSize: "0.8125rem",
                      padding: "0.5rem 2rem 0.5rem 0.875rem",
                    }}
                  >
                    <option value="all">All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_name}
                      </option>
                    ))}
                  </FocusInput>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    style={{
                      position: "absolute",
                      right: "0.625rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-neutral-400)",
                      fontSize: "0.625rem",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {filteredUpdates.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--color-neutral-200)",
                  borderRadius: "1rem",
                  padding: "3rem 2rem",
                  textAlign: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={faClipboardList}
                  style={{
                    fontSize: "2.5rem",
                    color: "var(--color-neutral-300)",
                    marginBottom: "1rem",
                  }}
                />
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--color-neutral-700)",
                    margin: "0 0 0.375rem",
                  }}
                >
                  No updates for this filter
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-400)",
                    margin: 0,
                  }}
                >
                  Try selecting a different project
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {filteredUpdates.map((update) => {
                  const project = projects.find(
                    (p) => p.id === update.project_id,
                  );
                  const initial = project?.project_name.charAt(0) || "?";
                  return (
                    <div
                      key={update.id}
                      className="update-card"
                      style={{
                        background: "#fff",
                        border: "1px solid var(--color-neutral-200)",
                        borderRadius: "1rem",
                        overflow: "hidden",
                        transition: "border-color 150ms",
                      }}
                    >
                      <div style={{ padding: "1.25rem 1.5rem" }}>
                        {/* Card header */}
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
                                width: 38,
                                height: 38,
                                borderRadius: "50%",
                                background: "#1ab189",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                flexShrink: 0,
                              }}
                            >
                              {initial}
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: 700,
                                  color: "var(--color-neutral-900)",
                                  margin: 0,
                                }}
                              >
                                {project?.project_name}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--color-neutral-500)",
                                  margin: 0,
                                }}
                              >
                                {project?.client?.full_name || "Unassigned"}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            <button
                              className="action-btn"
                              onClick={() => setViewingUpdate(update)}
                              title="View"
                              style={{ color: "var(--color-neutral-500)" }}
                            >
                              <FontAwesomeIcon
                                icon={faEye}
                                style={{ fontSize: "0.875rem" }}
                              />
                            </button>
                            <button
                              className="action-btn"
                              onClick={() =>
                                setDeletingUpdate({
                                  id: update.id,
                                  projectId: update.project_id,
                                  title: update.title || "this update",
                                })
                              }
                              title="Delete"
                              disabled={deleteUpdateMutation.isPending}
                              style={{ color: "#ef4444" }}
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                style={{ fontSize: "0.875rem" }}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <p
                          style={{
                            fontSize: "0.9375rem",
                            fontWeight: 600,
                            color: "var(--color-neutral-900)",
                            margin: "0 0 0.5rem",
                          }}
                        >
                          {update.title}
                        </p>

                        {/* Badges */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <StatusBadge
                            status={update.status || "in-progress"}
                          />
                          {update.work_hours &&
                            parseFloat(update.work_hours) > 0 && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.6875rem",
                                  fontWeight: 600,
                                  padding: "0.25rem 0.625rem",
                                  borderRadius: 9999,
                                  background: "var(--color-neutral-100)",
                                  color: "var(--color-neutral-600)",
                                  border: "1px solid var(--color-neutral-200)",
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faClock}
                                  style={{ fontSize: "0.6rem" }}
                                />
                                {update.work_hours} hrs
                              </span>
                            )}
                        </div>

                        {/* Date + Author */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.8125rem",
                            color: "var(--color-neutral-500)",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faCalendar}
                            style={{ fontSize: "0.625rem" }}
                          />
                          {new Date(update.created_at).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                          <span style={{ color: "var(--color-neutral-300)" }}>
                            ·
                          </span>
                          <FontAwesomeIcon
                            icon={faUser}
                            style={{ fontSize: "0.625rem" }}
                          />
                          {update.posted_by_name}
                        </div>

                        {/* Content preview */}
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--color-neutral-600)",
                            lineHeight: 1.6,
                            margin: "0 0 0.875rem",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {update.update_text}
                        </p>

                        {/* Media thumbnails */}
                        {update.media && update.media.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              flexWrap: "wrap",
                            }}
                          >
                            {update.media.slice(0, 4).map((media, idx) => (
                              <div
                                key={idx}
                                style={{
                                  width: 64,
                                  height: 64,
                                  borderRadius: "0.5rem",
                                  overflow: "hidden",
                                  border: "1px solid var(--color-neutral-200)",
                                  flexShrink: 0,
                                }}
                              >
                                <img
                                  src={getMediaUrl(media)}
                                  alt="media"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </div>
                            ))}
                            {update.media.length > 4 && (
                              <div
                                style={{
                                  width: 64,
                                  height: 64,
                                  borderRadius: "0.5rem",
                                  background: "var(--color-neutral-100)",
                                  border: "1px solid var(--color-neutral-200)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.8125rem",
                                  fontWeight: 600,
                                  color: "var(--color-neutral-600)",
                                }}
                              >
                                +{update.media.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── View Update Modal ─────────────────────────────────────────────────── */}
      {viewingUpdate && (
        <Modal onClose={() => setViewingUpdate(null)}>
          <ModalHeader
            title="Update Details"
            subtitle={`${viewingUpdate.project_name} — ${viewingUpdate.client_name}`}
            onClose={() => setViewingUpdate(null)}
          />
          <div
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Project info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                padding: "0.875rem 1rem",
                background: "rgba(26,177,137,0.06)",
                border: "1px solid rgba(26,177,137,0.2)",
                borderRadius: "0.75rem",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#1ab189",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1rem",
                  flexShrink: 0,
                }}
              >
                {viewingUpdate.project_name?.charAt(0)}
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
                  {viewingUpdate.project_name}
                </p>
                <p
                  style={{ fontSize: "0.8125rem", color: "#065f46", margin: 0 }}
                >
                  {viewingUpdate.client_name}
                </p>
              </div>
            </div>

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
                {viewingUpdate.title}
              </p>
            </div>

            {/* Status + Hours */}
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
                    marginBottom: "0.5rem",
                  }}
                >
                  Status
                </p>
                <StatusBadge status={viewingUpdate.status || "in-progress"} />
              </div>
              {viewingUpdate.work_hours &&
                parseFloat(viewingUpdate.work_hours) > 0 && (
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
                      Work Hours
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faClock}
                        style={{ color: "#1ab189", fontSize: "0.875rem" }}
                      />
                      <span
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--color-neutral-900)",
                        }}
                      >
                        {viewingUpdate.work_hours} hours
                      </span>
                    </div>
                  </div>
                )}
            </div>

            {/* Date */}
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
                Posted On
              </p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FontAwesomeIcon
                  icon={faCalendar}
                  style={{ color: "#1ab189", fontSize: "0.875rem" }}
                />
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {new Date(viewingUpdate.created_at).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </span>
              </div>
            </div>

            {/* Content */}
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
                Content
              </p>
              <div
                style={{
                  background: "var(--color-neutral-50)",
                  border: "1px solid var(--color-neutral-200)",
                  borderRadius: "0.625rem",
                  padding: "1rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-800)",
                    lineHeight: 1.7,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {viewingUpdate.update_text}
                </p>
              </div>
            </div>

            {/* Media */}
            {viewingUpdate.media && viewingUpdate.media.length > 0 && (
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
                  Media ({viewingUpdate.media.length})
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.625rem",
                  }}
                >
                  {viewingUpdate.media.map((media, idx) => (
                    <div
                      key={idx}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "0.625rem",
                        overflow: "hidden",
                        border: "1px solid var(--color-neutral-200)",
                        cursor: "pointer",
                      }}
                      onClick={() => window.open(getMediaUrl(media), "_blank")}
                    >
                      <img
                        src={getMediaUrl(media)}
                        alt="media"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 200ms",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.05)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posted by */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                background: "var(--color-neutral-50)",
                border: "1px solid var(--color-neutral-200)",
                borderRadius: "0.625rem",
              }}
            >
              <FontAwesomeIcon
                icon={faUser}
                style={{ color: "#1ab189", fontSize: "0.875rem" }}
              />
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-neutral-600)",
                  margin: 0,
                }}
              >
                Posted by{" "}
                <strong style={{ color: "var(--color-neutral-900)" }}>
                  {viewingUpdate.posted_by_name}
                </strong>
              </p>
            </div>
          </div>

          <ModalFooter>
            <button
              onClick={() => {
                setDeletingUpdate({
                  id: viewingUpdate.id,
                  projectId: viewingUpdate.project_id,
                  title: viewingUpdate.title || "this update",
                });
                setViewingUpdate(null);
              }}
              disabled={deleteUpdateMutation.isPending}
              style={{
                marginRight: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444",
                borderRadius: "0.625rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 150ms",
              }}
            >
              <FontAwesomeIcon icon={faTrash} style={{ fontSize: "0.75rem" }} />
              Delete
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setViewingUpdate(null)}
            >
              Close
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* ── Delete Modal ──────────────────────────────────────────────────────── */}
      {deletingUpdate && (
        <DeleteModal
          target={deletingUpdate}
          isDeleting={deleteUpdateMutation.isPending}
          onConfirm={() =>
            deleteUpdateMutation.mutate({
              projectId: deletingUpdate.projectId,
              updateId: deletingUpdate.id,
            })
          }
          onCancel={() => setDeletingUpdate(null)}
        />
      )}

      {/* ── Discard Modal ─────────────────────────────────────────────────────── */}
      {showDiscardModal && (
        <DiscardModal
          onConfirm={() => {
            resetForm();
            setShowDiscardModal(false);
          }}
          onCancel={() => setShowDiscardModal(false)}
        />
      )}
    </div>
  );
}
