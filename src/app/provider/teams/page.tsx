"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faEllipsisVertical,
  faEnvelope,
  faPhone,
  faChevronLeft,
  faChevronRight,
  faUserGroup,
  faEye,
  faPenToSquare,
  faTrash,
  faSpinner,
  faTimes,
  faCheck,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* ─────────────────────────────────────────── */
/* Types                                        */
/* ─────────────────────────────────────────── */
interface TeamMember {
  id: number;
  full_name: string;
  initials: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employee_id: string;
  status: "active" | "inactive" | "on_leave";
  projects_count: number;
  join_date: string;
  photo: string | null;
  is_active: boolean;
  skills: string[];
}

interface TeamMembersResponse {
  count?: number;
  results?: TeamMember[];
}

type TabFilter = "all" | "active" | "inactive" | "onleave";

/* ─────────────────────────────────────────── */
/* Helpers                                      */
/* ─────────────────────────────────────────── */
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = [
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
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const STATUS_STYLES: Record<
  string,
  { background: string; color: string; border: string }
> = {
  active: {
    background: "rgba(22,163,74,0.1)",
    color: "#16a34a",
    border: "1px solid rgba(22,163,74,0.2)",
  },
  inactive: {
    background: "rgba(115,115,115,0.1)",
    color: "#737373",
    border: "1px solid rgba(115,115,115,0.2)",
  },
  on_leave: {
    background: "rgba(217,119,6,0.1)",
    color: "#d97706",
    border: "1px solid rgba(217,119,6,0.2)",
  },
};

const formatStatus = (status: string) =>
  ({ active: "Active", inactive: "Inactive", on_leave: "On Leave" })[status] ??
  status;

const PER_PAGE = 6;

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function TeamPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Query ── */
  const { data, isLoading, error } = useQuery<TeamMember[]>({
    queryKey: ["team-members", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      const response = await api.get<TeamMember[] | TeamMembersResponse>(
        `/api/v1/employees/?${params.toString()}`,
      );
      return Array.isArray(response) ? response : (response.results ?? []);
    },
    staleTime: 30000,
  });

  /* ── Delete mutation ── */
  const deleteMutation = useMutation({
    mutationFn: (memberId: number) =>
      api.delete(`/api/v1/employees/${memberId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      notify("Team member deleted successfully");
      setDeleteTarget(null);
      setOpenDropdown(null);
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Failed to delete: ${e.data?.detail ?? e.message ?? "Unknown error"}`,
      );
      setDeleteTarget(null);
    },
  });

  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const members = data ?? [];

  const filtered = members.filter((m) => {
    if (activeTab === "active" && m.status !== "active") return false;
    if (activeTab === "inactive" && m.status !== "inactive") return false;
    if (activeTab === "onleave" && m.status !== "on_leave") return false;
    return true;
  });

  const activeCount = members.filter((m) => m.status === "active").length;
  const onLeaveCount = members.filter((m) => m.status === "on_leave").length;
  const inactiveCount = members.filter((m) => m.status === "inactive").length;

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const tabStyle = (tab: TabFilter): React.CSSProperties => ({
    padding: "0.875rem 0",
    fontWeight: 500,
    fontSize: "0.875rem",
    background: "none",
    border: "none",
    borderBottom:
      activeTab === tab ? "2px solid #1ab189" : "2px solid transparent",
    color: activeTab === tab ? "#1ab189" : "var(--color-neutral-600)",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "color 150ms",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  });

  /* ── Loading / error ── */
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
            Loading team members…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <p className="mb-4" style={{ color: "#ef4444" }}>
            Error loading team members
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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

      {/* Page header */}
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
              Team Members
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Manage your team and their assignments ({members.length} total)
            </p>
          </div>
          <Link
            href="/provider/teams/create"
            className="btn btn-primary btn-md flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: "0.8rem" }} />
            Add Team Member
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "0 2rem",
          overflowX: "auto",
        }}
      >
        <div
          className="flex items-center gap-6"
          style={{ minWidth: "max-content" }}
        >
          <button
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            style={tabStyle("all")}
          >
            All Members
          </button>
          <button
            onClick={() => {
              setActiveTab("active");
              setCurrentPage(1);
            }}
            style={tabStyle("active")}
          >
            Active
            <span
              className="rounded-full font-bold"
              style={{
                fontSize: "0.6rem",
                padding: "0.15rem 0.45rem",
                backgroundColor: "#16a34a",
                color: "white",
              }}
            >
              {activeCount}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("onleave");
              setCurrentPage(1);
            }}
            style={tabStyle("onleave")}
          >
            On Leave
            <span
              className="rounded-full font-bold"
              style={{
                fontSize: "0.6rem",
                padding: "0.15rem 0.45rem",
                backgroundColor: "#d97706",
                color: "white",
              }}
            >
              {onLeaveCount}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("inactive");
              setCurrentPage(1);
            }}
            style={tabStyle("inactive")}
          >
            Inactive
            <span
              className="rounded-full font-bold"
              style={{
                fontSize: "0.6rem",
                padding: "0.15rem 0.45rem",
                backgroundColor: "var(--color-neutral-400)",
                color: "white",
              }}
            >
              {inactiveCount}
            </span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "0.875rem 2rem",
        }}
      >
        <div className="relative" style={{ width: "17rem" }}>
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--color-neutral-400)", fontSize: "0.75rem" }}
          />
          <input
            type="text"
            placeholder="Search team members…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              padding: "0.5rem 1rem 0.5rem 2rem",
              fontFamily: "var(--font-sans)",
              fontSize: "0.8125rem",
              color: "var(--color-neutral-900)",
              backgroundColor: "var(--color-neutral-0)",
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
              e.currentTarget.style.borderColor = "var(--color-neutral-200)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "1.75rem 2rem" }}>
        {filtered.length === 0 ? (
          <div className="text-center" style={{ paddingTop: "4rem" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>👷</div>
            <h3
              className="font-semibold mb-2"
              style={{
                fontSize: "1.125rem",
                color: "var(--color-neutral-900)",
              }}
            >
              No team members found
            </h3>
            <p
              className="mb-6"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-500)",
              }}
            >
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by adding your first team member"}
            </p>
            {!searchQuery && (
              <Link
                href="/provider/teams/create"
                className="btn btn-primary btn-md inline-flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} style={{ fontSize: "0.8rem" }} />
                Add Team Member
              </Link>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "56rem",
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
                      "Team Member",
                      "Role",
                      "Contact",
                      "Status",
                      "Projects",
                      "Join Date",
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
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.06em",
                          whiteSpace: "nowrap" as const,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((member, idx) => (
                    <tr
                      key={member.id}
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
                      {/* Member */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: avatarColor(member.id),
                              color: "white",
                              fontSize: "0.8rem",
                            }}
                          >
                            {member.initials || getInitials(member.full_name)}
                          </div>
                          <div className="min-w-0">
                            <h4
                              className="font-semibold whitespace-nowrap"
                              style={{
                                fontSize: "0.9rem",
                                color: "var(--color-neutral-900)",
                              }}
                            >
                              {member.full_name}
                            </h4>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-neutral-400)",
                              }}
                            >
                              {member.department || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--color-neutral-700)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {member.role || "—"}
                        </span>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <p
                          className="whitespace-nowrap"
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--color-neutral-700)",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faEnvelope}
                            style={{
                              color: "#1ab189",
                              fontSize: "0.7rem",
                              marginRight: "0.375rem",
                            }}
                          />
                          {member.email || "—"}
                        </p>
                        <p
                          className="whitespace-nowrap mt-0.5"
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--color-neutral-500)",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faPhone}
                            style={{
                              color: "var(--color-neutral-300)",
                              fontSize: "0.7rem",
                              marginRight: "0.375rem",
                            }}
                          />
                          {member.phone || "—"}
                        </p>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.625rem",
                            borderRadius: "9999px",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            whiteSpace: "nowrap" as const,
                            ...(STATUS_STYLES[member.status] ??
                              STATUS_STYLES.inactive),
                          }}
                        >
                          {formatStatus(member.status)}
                        </span>
                      </td>

                      {/* Projects */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faUserGroup}
                            style={{ color: "#1ab189", fontSize: "0.75rem" }}
                          />
                          <span
                            className="font-semibold"
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--color-neutral-900)",
                            }}
                          >
                            {member.projects_count}
                          </span>
                        </div>
                      </td>

                      {/* Join Date */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-neutral-600)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {member.join_date
                            ? new Date(member.join_date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <div className="flex justify-center">
                          <div
                            className="relative"
                            ref={
                              openDropdown === member.id.toString()
                                ? dropdownRef
                                : null
                            }
                          >
                            <button
                              onClick={() =>
                                setOpenDropdown(
                                  openDropdown === member.id.toString()
                                    ? null
                                    : member.id.toString(),
                                )
                              }
                              aria-label="Member actions"
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

                            {openDropdown === member.id.toString() && (
                              <div
                                className="absolute right-0 rounded-xl overflow-hidden z-10"
                                style={{
                                  marginTop: "0.5rem",
                                  width: "11rem",
                                  backgroundColor: "var(--color-neutral-0)",
                                  border: "1px solid var(--color-neutral-200)",
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                }}
                              >
                                <Link
                                  href={`/provider/teams/${member.id}`}
                                  className="flex items-center gap-3 px-4 py-2.5"
                                  style={{
                                    fontSize: "0.8125rem",
                                    color: "var(--color-neutral-700)",
                                    textDecoration: "none",
                                  }}
                                  onMouseEnter={(e) => {
                                    (
                                      e.currentTarget as HTMLAnchorElement
                                    ).style.backgroundColor =
                                      "var(--color-neutral-50)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (
                                      e.currentTarget as HTMLAnchorElement
                                    ).style.backgroundColor = "transparent";
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={faEye}
                                    style={{
                                      color: "#3b82f6",
                                      fontSize: "0.8rem",
                                      width: "1rem",
                                    }}
                                  />
                                  View Details
                                </Link>
                                <Link
                                  href={`/provider/teams/${member.id}/edit`}
                                  className="flex items-center gap-3 px-4 py-2.5"
                                  style={{
                                    fontSize: "0.8125rem",
                                    color: "var(--color-neutral-700)",
                                    textDecoration: "none",
                                  }}
                                  onMouseEnter={(e) => {
                                    (
                                      e.currentTarget as HTMLAnchorElement
                                    ).style.backgroundColor =
                                      "var(--color-neutral-50)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (
                                      e.currentTarget as HTMLAnchorElement
                                    ).style.backgroundColor = "transparent";
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={faPenToSquare}
                                    style={{
                                      color: "#1ab189",
                                      fontSize: "0.8rem",
                                      width: "1rem",
                                    }}
                                  />
                                  Edit Member
                                </Link>
                                <button
                                  onClick={() => {
                                    setDeleteTarget({
                                      id: member.id,
                                      name: member.full_name,
                                    });
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "0.8125rem",
                                    color: "#ef4444",
                                    textAlign: "left",
                                  }}
                                  onMouseEnter={(e) => {
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.backgroundColor = "#fef2f2";
                                  }}
                                  onMouseLeave={(e) => {
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.backgroundColor = "transparent";
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={faTrash}
                                    style={{
                                      fontSize: "0.8rem",
                                      width: "1rem",
                                    }}
                                  />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{
                padding: "0.875rem 1.5rem",
                borderTop: "1px solid var(--color-neutral-200)",
              }}
            >
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                Showing {(currentPage - 1) * PER_PAGE + 1}–
                {Math.min(currentPage * PER_PAGE, filtered.length)} of{" "}
                {filtered.length} members
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "0.5rem 0.625rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--color-neutral-200)",
                    background: "none",
                    cursor: "pointer",
                    color: "var(--color-neutral-600)",
                    opacity: currentPage === 1 ? 0.4 : 1,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    style={{ fontSize: "0.75rem" }}
                  />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const active = currentPage === i + 1;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{
                        width: "2.25rem",
                        height: "2.25rem",
                        borderRadius: "0.5rem",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                        border: active
                          ? "none"
                          : "1px solid var(--color-neutral-200)",
                        backgroundColor: active ? "#1ab189" : "transparent",
                        color: active ? "white" : "var(--color-neutral-700)",
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "0.5rem 0.625rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--color-neutral-200)",
                    background: "none",
                    cursor: "pointer",
                    color: "var(--color-neutral-600)",
                    opacity: currentPage === totalPages ? 0.4 : 1,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    style={{ fontSize: "0.75rem" }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
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
                Delete Team Member?
              </h3>
              <p
                className="text-center mb-6"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                Are you sure you want to delete &quot;{deleteTarget.name}&quot;?
                This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteMutation.isPending}
                  className="btn btn-ghost btn-md flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
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
    </div>
  );
}
