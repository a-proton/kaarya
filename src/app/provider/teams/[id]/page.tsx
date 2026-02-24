"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPenToSquare,
  faTrash,
  faUser,
  faEnvelope,
  faPhone,
  faBriefcase,
  faIdCard,
  faCalendar,
  faMapMarkerAlt,
  faDollarSign,
  faExclamationTriangle,
  faUserGroup,
  faFolder,
  faSpinner,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  join_date: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  emergency_contact: string;
  emergency_phone: string;
  salary: string;
  skills: string[];
  notes: string;
  photo: string | null;
  is_active: boolean;
  projects_count: number;
  current_projects: Array<{ id: number; name: string }>;
}

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

const SKILL_COLORS: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  Electrical: {
    bg: "rgba(234,179,8,0.1)",
    color: "#a16207",
    border: "1px solid rgba(234,179,8,0.2)",
  },
  Plumbing: {
    bg: "rgba(59,130,246,0.1)",
    color: "#1d4ed8",
    border: "1px solid rgba(59,130,246,0.2)",
  },
  HVAC: {
    bg: "rgba(249,115,22,0.1)",
    color: "#c2410c",
    border: "1px solid rgba(249,115,22,0.2)",
  },
  Carpentry: {
    bg: "rgba(245,158,11,0.1)",
    color: "#b45309",
    border: "1px solid rgba(245,158,11,0.2)",
  },
  "Project Management": {
    bg: "rgba(26,177,137,0.1)",
    color: "#0d9060",
    border: "1px solid rgba(26,177,137,0.2)",
  },
  Supervision: {
    bg: "rgba(168,85,247,0.1)",
    color: "#7c3aed",
    border: "1px solid rgba(168,85,247,0.2)",
  },
  Design: {
    bg: "rgba(236,72,153,0.1)",
    color: "#be185d",
    border: "1px solid rgba(236,72,153,0.2)",
  },
  Landscaping: {
    bg: "rgba(34,197,94,0.1)",
    color: "#15803d",
    border: "1px solid rgba(34,197,94,0.2)",
  },
};
const DEFAULT_SKILL = {
  bg: "rgba(115,115,115,0.08)",
  color: "var(--color-neutral-600)",
  border: "1px solid var(--color-neutral-200)",
};

const formatStatus = (status: string) =>
  ({ active: "Active", inactive: "Inactive", on_leave: "On Leave" })[status] ??
  status;

const formatCurrency = (amount: string | number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    typeof amount === "string" ? parseFloat(amount) : amount,
  );

/* ─────────────────────────────────────────── */
/* Small reusable pieces                       */
/* ─────────────────────────────────────────── */
function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: any;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
      >
        <FontAwesomeIcon
          icon={icon}
          style={{ color: "#1ab189", fontSize: "0.75rem" }}
        />
      </div>
      <div className="min-w-0">
        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--color-neutral-500)",
            marginBottom: "0.125rem",
          }}
        >
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="font-semibold truncate block"
            style={{
              fontSize: "0.875rem",
              color: "var(--color-neutral-900)",
              textDecoration: "none",
            }}
          >
            {value || "—"}
          </a>
        ) : (
          <p
            className="font-semibold"
            style={{ fontSize: "0.875rem", color: "var(--color-neutral-900)" }}
          >
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: "var(--color-neutral-0)",
        border: "1px solid var(--color-neutral-200)",
        padding: "1.5rem",
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
        >
          <FontAwesomeIcon
            icon={icon}
            style={{ color: "#1ab189", fontSize: "0.875rem" }}
          />
        </div>
        <h2
          className="font-semibold"
          style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function ViewTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const employeeId = Number(params.id);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  /* ── Query ── */
  const {
    data: member,
    isLoading,
    isError,
    error,
  } = useQuery<TeamMember>({
    queryKey: ["team-member", employeeId],
    queryFn: () => api.get<TeamMember>(`/api/v1/employees/${employeeId}/`),
    enabled: !!employeeId,
  });

  /* ── Delete mutation ── */
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/v1/employees/${employeeId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      notify("Team member deleted successfully");
      setTimeout(() => router.push("/provider/teams"), 1000);
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Failed to delete: ${e.data?.detail ?? e.message ?? "Unknown error"}`,
      );
    },
  });

  /* ── Loading ── */
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
            Loading team member details…
          </p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (isError || !member) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <p className="mb-4" style={{ color: "#ef4444" }}>
            {error instanceof Error ? error.message : "Team member not found"}
          </p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary btn-md"
          >
            Go Back
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
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
                {member.full_name}
              </h1>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-neutral-500)",
                  marginTop: "0.125rem",
                }}
              >
                Team Member Details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/provider/teams/${employeeId}/edit`)}
              className="btn btn-ghost btn-md flex items-center gap-2"
            >
              <FontAwesomeIcon
                icon={faPenToSquare}
                style={{ fontSize: "0.8rem" }}
              />
              Edit Member
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-md flex items-center gap-2"
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
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
        style={{ padding: "1.75rem 2rem", maxWidth: "72rem", margin: "0 auto" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl sticky top-8"
              style={{
                backgroundColor: "var(--color-neutral-0)",
                border: "1px solid var(--color-neutral-200)",
                padding: "1.5rem",
              }}
            >
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center font-bold"
                  style={{
                    backgroundColor: avatarColor(member.id),
                    color: "white",
                    fontSize: "2rem",
                  }}
                >
                  {member.initials || getInitials(member.full_name)}
                </div>
              </div>

              {/* Name + role */}
              <div className="text-center mb-4">
                <h2
                  className="font-bold"
                  style={{
                    fontSize: "1.125rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {member.full_name}
                </h2>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-600)",
                    marginTop: "0.125rem",
                  }}
                >
                  {member.role || "—"}
                </p>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-neutral-400)",
                  }}
                >
                  {member.department || "—"}
                </p>
              </div>

              {/* Status */}
              <div
                className="flex justify-center pb-4 mb-4"
                style={{ borderBottom: "1px solid var(--color-neutral-100)" }}
              >
                <span
                  style={{
                    padding: "0.3rem 0.875rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    ...(STATUS_STYLES[member.status] ?? STATUS_STYLES.inactive),
                  }}
                >
                  {formatStatus(member.status)}
                </span>
              </div>

              {/* Quick stats */}
              <div
                className="grid grid-cols-2 gap-3 pb-4 mb-4"
                style={{ borderBottom: "1px solid var(--color-neutral-100)" }}
              >
                <div
                  className="rounded-xl text-center"
                  style={{
                    padding: "0.875rem 0.5rem",
                    backgroundColor: "rgba(26,177,137,0.06)",
                    border: "1px solid rgba(26,177,137,0.12)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFolder}
                    style={{
                      color: "#1ab189",
                      fontSize: "1rem",
                      marginBottom: "0.375rem",
                      display: "block",
                    }}
                  />
                  <p
                    className="font-bold"
                    style={{
                      fontSize: "1.125rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {member.projects_count}
                  </p>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Projects
                  </p>
                </div>
                <div
                  className="rounded-xl text-center"
                  style={{
                    padding: "0.875rem 0.5rem",
                    backgroundColor: "rgba(59,130,246,0.06)",
                    border: "1px solid rgba(59,130,246,0.12)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCalendar}
                    style={{
                      color: "#3b82f6",
                      fontSize: "1rem",
                      marginBottom: "0.375rem",
                      display: "block",
                    }}
                  />
                  <p
                    className="font-bold"
                    style={{
                      fontSize: "1.125rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {member.join_date
                      ? `${new Date().getFullYear() - new Date(member.join_date).getFullYear()}y`
                      : "—"}
                  </p>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Tenure
                  </p>
                </div>
              </div>

              {/* Skills */}
              {member.skills && member.skills.length > 0 && (
                <div className="mb-4">
                  <p
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "var(--color-neutral-400)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((skill) => {
                      const s = SKILL_COLORS[skill] ?? DEFAULT_SKILL;
                      return (
                        <span
                          key={skill}
                          style={{
                            padding: "0.2rem 0.6rem",
                            borderRadius: "9999px",
                            fontSize: "0.72rem",
                            fontWeight: 500,
                            backgroundColor: s.bg,
                            color: s.color,
                            border: s.border,
                          }}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Employee ID */}
              {member.employee_id && (
                <div
                  className="rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: "rgba(26,177,137,0.06)",
                    border: "1px solid rgba(26,177,137,0.12)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--color-neutral-500)",
                      marginBottom: "0.125rem",
                    }}
                  >
                    Employee ID
                  </p>
                  <p
                    className="font-semibold"
                    style={{ fontSize: "0.875rem", color: "#1ab189" }}
                  >
                    {member.employee_id}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Contact information */}
            <SectionCard icon={faUser} title="Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InfoRow
                  icon={faEnvelope}
                  label="Email"
                  value={member.email}
                  href={member.email ? `mailto:${member.email}` : undefined}
                />
                <InfoRow
                  icon={faPhone}
                  label="Phone"
                  value={member.phone}
                  href={member.phone ? `tel:${member.phone}` : undefined}
                />
                <InfoRow
                  icon={faUser}
                  label="Emergency Contact"
                  value={member.emergency_contact}
                />
                <InfoRow
                  icon={faPhone}
                  label="Emergency Phone"
                  value={member.emergency_phone}
                />
              </div>
            </SectionCard>

            {/* Employment details */}
            <SectionCard icon={faBriefcase} title="Employment Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InfoRow
                  icon={faIdCard}
                  label="Employee ID"
                  value={member.employee_id}
                />
                <InfoRow
                  icon={faBriefcase}
                  label="Department"
                  value={member.department}
                />
                <InfoRow
                  icon={faCalendar}
                  label="Join Date"
                  value={
                    member.join_date
                      ? new Date(member.join_date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"
                  }
                />
                <InfoRow
                  icon={faDollarSign}
                  label="Salary"
                  value={member.salary ? formatCurrency(member.salary) : "—"}
                />
              </div>
            </SectionCard>

            {/* Address */}
            <SectionCard icon={faMapMarkerAlt} title="Address Details">
              <div className="space-y-3">
                <div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-500)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Street Address
                  </p>
                  <p
                    className="font-semibold"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {member.address || "—"}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "City", value: member.city },
                    { label: "State", value: member.state },
                    { label: "Zip Code", value: member.zip_code },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--color-neutral-500)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        className="font-semibold"
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-neutral-900)",
                        }}
                      >
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Notes */}
            {member.notes && (
              <SectionCard icon={faBriefcase} title="Notes">
                <div
                  className="rounded-xl px-4 py-3"
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
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {member.notes}
                  </p>
                </div>
              </SectionCard>
            )}

            {/* Projects */}
            <SectionCard icon={faUserGroup} title="Project Assignments">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="rounded-xl text-center"
                  style={{
                    padding: "1rem 1.5rem",
                    backgroundColor: "rgba(26,177,137,0.06)",
                    border: "1px solid rgba(26,177,137,0.12)",
                  }}
                >
                  <p
                    className="font-bold"
                    style={{
                      fontSize: "1.5rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {member.projects_count}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Active Projects
                  </p>
                </div>
              </div>

              {member.current_projects &&
                member.current_projects.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {member.current_projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{
                          backgroundColor: "var(--color-neutral-50)",
                          border: "1px solid var(--color-neutral-200)",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faFolder}
                          style={{
                            color: "#1ab189",
                            fontSize: "0.8rem",
                            flexShrink: 0,
                          }}
                        />
                        <p
                          className="font-semibold"
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--color-neutral-900)",
                          }}
                        >
                          {project.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

              <button className="btn btn-primary btn-md w-full flex items-center justify-center gap-2">
                <FontAwesomeIcon
                  icon={faFolder}
                  style={{ fontSize: "0.8rem" }}
                />
                View All Projects
              </button>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Delete modal */}
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
                Delete Team Member?
              </h3>
              <p
                className="text-center mb-6"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                Are you sure you want to delete &quot;{member.full_name}&quot;?
                This action cannot be undone and will remove all data and
                project assignments.
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
    </div>
  );
}
