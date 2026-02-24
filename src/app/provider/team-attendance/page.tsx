"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardCheck,
  faCalendar,
  faUsers,
  faBriefcase,
  faArrowLeft,
  faCheck,
  faTimes,
  faSpinner,
  faSave,
  faDownload,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faUserCheck,
  faUserXmark,
  faUserClock,
  faHouse,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

/* ─────────────────────────────────────────── */
/* Types                                        */
/* ─────────────────────────────────────────── */
interface Project {
  id: number;
  project_name: string;
  client: { id: number; full_name: string } | null;
  status: string;
}

interface Employee {
  id: number;
  full_name: string;
  initials: string;
  role: string;
  department: string;
  photo: string | null;
  is_active: boolean;
}

interface AttendanceRecord {
  employee_id: number;
  status: "present" | "absent" | "half_day" | "leave";
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
}

interface BulkAttendancePayload {
  attendance_date: string;
  records: AttendanceRecord[];
}

interface AttendanceHistoryRecord {
  id: number;
  project: number;
  project_name: string;
  employee: number;
  employee_name: string;
  employee_role: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: string | null;
  status: "present" | "absent" | "half_day" | "leave";
  notes: string;
}

/* ─────────────────────────────────────────── */
/* Shared input style                           */
/* ─────────────────────────────────────────── */
const baseInput: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 1rem",
  fontFamily: "var(--font-sans)",
  fontSize: "0.875rem",
  color: "var(--color-neutral-900)",
  backgroundColor: "var(--color-neutral-0)",
  border: "1px solid var(--color-neutral-200)",
  borderRadius: "0.625rem",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
  appearance: "none" as const,
};

function onFocusIn(
  e: React.FocusEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >,
) {
  e.currentTarget.style.borderColor = "#1ab189";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,177,137,0.12)";
}
function onFocusOut(
  e: React.FocusEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >,
) {
  e.currentTarget.style.borderColor = "var(--color-neutral-200)";
  e.currentTarget.style.boxShadow = "none";
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

const STATUS_CONFIG: Record<
  AttendanceRecord["status"],
  {
    label: string;
    icon: any;
    badge: { background: string; color: string; border: string };
    active: { background: string; color: string; border: string };
    idle: { background: string; color: string; border: string };
  }
> = {
  present: {
    label: "Present",
    icon: faUserCheck,
    badge: {
      background: "rgba(22,163,74,0.1)",
      color: "#16a34a",
      border: "1px solid rgba(22,163,74,0.2)",
    },
    active: {
      background: "#16a34a",
      color: "white",
      border: "1px solid #16a34a",
    },
    idle: {
      background: "rgba(22,163,74,0.06)",
      color: "#16a34a",
      border: "1px solid rgba(22,163,74,0.2)",
    },
  },
  absent: {
    label: "Absent",
    icon: faUserXmark,
    badge: {
      background: "rgba(239,68,68,0.1)",
      color: "#dc2626",
      border: "1px solid rgba(239,68,68,0.2)",
    },
    active: {
      background: "#dc2626",
      color: "white",
      border: "1px solid #dc2626",
    },
    idle: {
      background: "rgba(239,68,68,0.06)",
      color: "#dc2626",
      border: "1px solid rgba(239,68,68,0.2)",
    },
  },
  half_day: {
    label: "Half Day",
    icon: faUserClock,
    badge: {
      background: "rgba(217,119,6,0.1)",
      color: "#d97706",
      border: "1px solid rgba(217,119,6,0.2)",
    },
    active: {
      background: "#d97706",
      color: "white",
      border: "1px solid #d97706",
    },
    idle: {
      background: "rgba(217,119,6,0.06)",
      color: "#d97706",
      border: "1px solid rgba(217,119,6,0.2)",
    },
  },
  leave: {
    label: "On Leave",
    icon: faHouse,
    badge: {
      background: "rgba(59,130,246,0.1)",
      color: "#2563eb",
      border: "1px solid rgba(59,130,246,0.2)",
    },
    active: {
      background: "#2563eb",
      color: "white",
      border: "1px solid #2563eb",
    },
    idle: {
      background: "rgba(59,130,246,0.06)",
      color: "#2563eb",
      border: "1px solid rgba(59,130,246,0.2)",
    },
  },
};

/* ─────────────────────────────────────────── */
/* Small reusable pieces                       */
/* ─────────────────────────────────────────── */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block font-semibold mb-1.5"
        style={{ fontSize: "0.8rem", color: "var(--color-neutral-700)" }}
      >
        {label}
        {required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
  action,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
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
      <div className="flex items-center justify-between mb-5">
        <h2
          className="font-semibold flex items-center gap-2.5"
          style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
          >
            <FontAwesomeIcon
              icon={icon}
              style={{ color: "#1ab189", fontSize: "0.875rem" }}
            />
          </div>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

const PER_HISTORY_PAGE = 5;

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function AttendancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [viewMode, setViewMode] = useState<"mark" | "history">("mark");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  /* ── Queries ── */
  const { data: projectsData, isLoading: projectsLoading } = useQuery<{
    results: Project[];
  }>({
    queryKey: ["projects"],
    queryFn: () => api.get("/api/v1/projects/"),
  });

  const {
    data: employeesData,
    isLoading: employeesLoading,
    isError: employeesError,
  } = useQuery<{ results: Employee[] }>({
    queryKey: ["project-employees", selectedProject],
    queryFn: async () => {
      const data = await api.get(
        `/api/v1/projects/${selectedProject}/employees/`,
      );
      return Array.isArray(data) ? { results: data } : data;
    },
    enabled: !!selectedProject,
  });

  const { data: attendanceHistoryData, isLoading: historyLoading } = useQuery<{
    results: AttendanceHistoryRecord[];
  }>({
    queryKey: ["project-attendance", selectedProject],
    queryFn: async () => {
      const data = await api.get(
        `/api/v1/projects/${selectedProject}/attendance/`,
      );
      return Array.isArray(data) ? { results: data } : data;
    },
    enabled: !!selectedProject && viewMode === "history",
  });

  /* ── Mutation ── */
  const submitMutation = useMutation({
    mutationFn: (payload: BulkAttendancePayload) =>
      api.post(`/api/v1/projects/${selectedProject}/attendance/bulk/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-attendance", selectedProject],
      });
      notify("Attendance saved successfully");
      setAttendanceRecords([]);
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Error: ${e.data?.detail ?? e.message ?? "Failed to submit attendance"}`,
      );
    },
  });

  /* ── Derived state ── */
  const projects = projectsData?.results ?? [];
  const employees = employeesData?.results ?? [];
  const attendanceHistory = attendanceHistoryData?.results ?? [];

  const selectedProjectData = projects.find(
    (p) => p.id.toString() === selectedProject,
  );

  // Initialize records when employees load
  if (
    selectedProject &&
    employees.length > 0 &&
    attendanceRecords.length === 0
  ) {
    setAttendanceRecords(
      employees.map((e) => ({
        employee_id: e.id,
        status: "present",
        check_in_time: "09:00",
        check_out_time: "17:00",
        notes: "",
      })),
    );
  }

  const stats = attendanceRecords.reduce(
    (acc, r) => {
      acc[r.status]++;
      return acc;
    },
    { present: 0, absent: 0, half_day: 0, leave: 0 } as Record<
      AttendanceRecord["status"],
      number
    >,
  );

  const groupedHistory = attendanceHistory.reduce(
    (acc, record) => {
      const d = record.attendance_date;
      if (!acc[d]) acc[d] = [];
      acc[d].push(record);
      return acc;
    },
    {} as Record<string, AttendanceHistoryRecord[]>,
  );

  const historyDates = Object.keys(groupedHistory).sort().reverse();
  const filteredDates = searchQuery
    ? historyDates.filter((date) =>
        groupedHistory[date].some(
          (r) =>
            r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.project_name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    : historyDates;

  const totalPages = Math.ceil(filteredDates.length / PER_HISTORY_PAGE);
  const paginatedDates = filteredDates.slice(
    (currentPage - 1) * PER_HISTORY_PAGE,
    currentPage * PER_HISTORY_PAGE,
  );

  /* ── Handlers ── */
  const updateStatus = (
    employeeId: number,
    status: AttendanceRecord["status"],
  ) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.employee_id === employeeId ? { ...r, status } : r)),
    );
  };

  const updateField = (
    employeeId: number,
    field: keyof AttendanceRecord,
    value: string,
  ) => {
    setAttendanceRecords((prev) =>
      prev.map((r) =>
        r.employee_id === employeeId ? { ...r, [field]: value } : r,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      alert("Please select a project");
      return;
    }
    if (attendanceRecords.length === 0) {
      alert("No team members to mark attendance for");
      return;
    }
    submitMutation.mutate({
      attendance_date: attendanceDate,
      records: attendanceRecords,
    });
  };

  const isSubmitting = submitMutation.isPending;

  /* ── Loading ── */
  if (projectsLoading) {
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
            Loading projects…
          </p>
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
        <div className="flex items-center gap-3 mb-4">
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
              Attendance Management
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Track team member attendance for projects
            </p>
          </div>
        </div>

        {/* View mode tabs */}
        <div
          className="flex items-center gap-6"
          style={{
            borderTop: "1px solid var(--color-neutral-200)",
            marginLeft: "-2rem",
            marginRight: "-2rem",
            paddingLeft: "2rem",
            paddingRight: "2rem",
            marginBottom: "-1.125rem",
            overflowX: "auto",
          }}
        >
          {(["mark", "history"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                setCurrentPage(1);
              }}
              style={{
                padding: "0.875rem 0",
                fontWeight: 500,
                fontSize: "0.875rem",
                background: "none",
                border: "none",
                borderBottom:
                  viewMode === mode
                    ? "2px solid #1ab189"
                    : "2px solid transparent",
                color:
                  viewMode === mode ? "#1ab189" : "var(--color-neutral-600)",
                cursor: "pointer",
                whiteSpace: "nowrap" as const,
                transition: "color 150ms",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FontAwesomeIcon
                icon={mode === "mark" ? faClipboardCheck : faCalendar}
                style={{ fontSize: "0.8rem" }}
              />
              {mode === "mark" ? "Mark Attendance" : "Attendance History"}
              {mode === "history" && historyDates.length > 0 && (
                <span
                  className="rounded-full font-bold"
                  style={{
                    fontSize: "0.6rem",
                    padding: "0.15rem 0.45rem",
                    backgroundColor: "#1ab189",
                    color: "white",
                  }}
                >
                  {historyDates.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div
        style={{ padding: "1.75rem 2rem", maxWidth: "72rem", margin: "0 auto" }}
      >
        {viewMode === "mark" ? (
          /* ── Mark Attendance ── */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project & Date */}
            <SectionCard icon={faBriefcase} title="Project & Date">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Project" required>
                  <select
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value);
                      setAttendanceRecords([]);
                    }}
                    required
                    disabled={isSubmitting}
                    style={{
                      ...baseInput,
                      cursor: "pointer",
                      opacity: isSubmitting ? 0.6 : 1,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.875rem center",
                      paddingRight: "2.5rem",
                    }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  >
                    <option value="">Choose a project…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_name} — {p.client?.full_name ?? "No client"}
                      </option>
                    ))}
                  </select>
                  {selectedProjectData && (
                    <div
                      className="mt-2 rounded-xl flex items-start gap-3 px-4 py-2.5"
                      style={{
                        backgroundColor: "rgba(26,177,137,0.06)",
                        border: "1px solid rgba(26,177,137,0.2)",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faUsers}
                        style={{
                          color: "#1ab189",
                          fontSize: "0.8rem",
                          marginTop: "0.15rem",
                          flexShrink: 0,
                        }}
                      />
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-neutral-700)",
                        }}
                      >
                        <strong>
                          {selectedProjectData.client?.full_name ??
                            "Unassigned"}
                        </strong>
                        {" · "}
                        {employees.length} team members
                      </p>
                    </div>
                  )}
                </Field>

                <Field label="Attendance Date" required>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: "#1ab189", fontSize: "0.8rem" }}
                    />
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      required
                      disabled={isSubmitting}
                      style={{
                        ...baseInput,
                        paddingLeft: "2.25rem",
                        opacity: isSubmitting ? 0.6 : 1,
                      }}
                      onFocus={onFocusIn}
                      onBlur={onFocusOut}
                    />
                  </div>
                  <p
                    className="mt-1"
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    {new Date(attendanceDate + "T00:00:00").toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </p>
                </Field>
              </div>
            </SectionCard>

            {/* Stats overview */}
            {selectedProject && attendanceRecords.length > 0 && (
              <div
                className="rounded-2xl"
                style={{
                  backgroundColor: "var(--color-neutral-0)",
                  border: "1px solid var(--color-neutral-200)",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                  >
                    <FontAwesomeIcon
                      icon={faUsers}
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
                    Attendance Overview
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Total */}
                  <div
                    className="rounded-xl text-center"
                    style={{
                      padding: "0.875rem 0.5rem",
                      backgroundColor: "var(--color-neutral-50)",
                      border: "1px solid var(--color-neutral-200)",
                    }}
                  >
                    <p
                      className="font-bold"
                      style={{
                        fontSize: "1.375rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      {attendanceRecords.length}
                    </p>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      Total
                    </p>
                  </div>
                  {(["present", "absent", "half_day", "leave"] as const).map(
                    (s) => (
                      <div
                        key={s}
                        className="rounded-xl text-center"
                        style={{
                          padding: "0.875rem 0.5rem",
                          backgroundColor: STATUS_CONFIG[s].badge.background,
                          border: STATUS_CONFIG[s].badge.border,
                        }}
                      >
                        <p
                          className="font-bold"
                          style={{
                            fontSize: "1.375rem",
                            color: STATUS_CONFIG[s].badge.color,
                          }}
                        >
                          {stats[s]}
                        </p>
                        <p
                          style={{
                            fontSize: "0.72rem",
                            color: STATUS_CONFIG[s].badge.color,
                          }}
                        >
                          {STATUS_CONFIG[s].label}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Employee loading */}
            {selectedProject && employeesLoading && (
              <div
                className="rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: "var(--color-neutral-0)",
                  border: "1px solid var(--color-neutral-200)",
                  padding: "3rem",
                }}
              >
                <div className="text-center">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin mb-3"
                    style={{ fontSize: "2rem", color: "#1ab189" }}
                  />
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Loading team members…
                  </p>
                </div>
              </div>
            )}

            {/* Employee error */}
            {selectedProject && employeesError && (
              <div
                className="rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  padding: "3rem",
                }}
              >
                <div className="text-center">
                  <FontAwesomeIcon
                    icon={faExclamationCircle}
                    className="mb-3"
                    style={{ fontSize: "2rem", color: "#ef4444" }}
                  />
                  <p style={{ fontSize: "0.875rem", color: "#dc2626" }}>
                    Failed to load team members
                  </p>
                </div>
              </div>
            )}

            {/* Employee cards */}
            {selectedProject &&
              !employeesLoading &&
              !employeesError &&
              employees.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--color-neutral-0)",
                    border: "1px solid var(--color-neutral-200)",
                  }}
                >
                  {/* Table header */}
                  <div
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "var(--color-neutral-50)",
                      borderBottom: "1px solid var(--color-neutral-200)",
                    }}
                  >
                    <h2
                      className="font-semibold flex items-center gap-2.5"
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-700)",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faUsers}
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      Team Members ({employees.length})
                    </h2>
                  </div>

                  <div
                    style={
                      { divideY: "1px solid var(--color-neutral-100)" } as any
                    }
                  >
                    {employees.map((employee, idx) => {
                      const record = attendanceRecords.find(
                        (r) => r.employee_id === employee.id,
                      );
                      if (!record) return null;

                      return (
                        <div
                          key={employee.id}
                          style={{
                            padding: "1.25rem 1.5rem",
                            borderTop:
                              idx === 0
                                ? "none"
                                : "1px solid var(--color-neutral-100)",
                          }}
                        >
                          {/* Member info */}
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0"
                              style={{
                                backgroundColor: avatarColor(employee.id),
                                color: "white",
                                fontSize: "0.8rem",
                              }}
                            >
                              {employee.initials ||
                                getInitials(employee.full_name)}
                            </div>
                            <div>
                              <h4
                                className="font-semibold"
                                style={{
                                  fontSize: "0.9rem",
                                  color: "var(--color-neutral-900)",
                                }}
                              >
                                {employee.full_name}
                              </h4>
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--color-neutral-500)",
                                }}
                              >
                                {employee.role}
                                {employee.department
                                  ? ` · ${employee.department}`
                                  : ""}
                              </p>
                            </div>
                          </div>

                          {/* Status buttons */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                            {(
                              [
                                "present",
                                "absent",
                                "half_day",
                                "leave",
                              ] as const
                            ).map((s) => {
                              const isActive = record.status === s;
                              const cfg = STATUS_CONFIG[s];
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => updateStatus(employee.id, s)}
                                  disabled={isSubmitting}
                                  style={{
                                    padding: "0.625rem",
                                    borderRadius: "0.625rem",
                                    fontWeight: 500,
                                    fontSize: "0.8rem",
                                    cursor: isSubmitting
                                      ? "not-allowed"
                                      : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.4rem",
                                    transition: "all 150ms",
                                    ...(isActive ? cfg.active : cfg.idle),
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={cfg.icon}
                                    style={{ fontSize: "0.8rem" }}
                                  />
                                  {cfg.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Time fields */}
                          {(record.status === "present" ||
                            record.status === "half_day") && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {[
                                {
                                  label: "Check-in Time",
                                  field: "check_in_time" as const,
                                  val: record.check_in_time,
                                },
                                {
                                  label: "Check-out Time",
                                  field: "check_out_time" as const,
                                  val: record.check_out_time,
                                },
                              ].map(({ label, field, val }) => (
                                <Field key={field} label={label}>
                                  <input
                                    type="time"
                                    value={val ?? ""}
                                    onChange={(e) =>
                                      updateField(
                                        employee.id,
                                        field,
                                        e.target.value,
                                      )
                                    }
                                    disabled={isSubmitting}
                                    style={{
                                      ...baseInput,
                                      opacity: isSubmitting ? 0.6 : 1,
                                    }}
                                    onFocus={onFocusIn}
                                    onBlur={onFocusOut}
                                  />
                                </Field>
                              ))}
                            </div>
                          )}

                          {/* Notes */}
                          <Field label="Notes (Optional)">
                            <textarea
                              value={record.notes ?? ""}
                              onChange={(e) =>
                                updateField(
                                  employee.id,
                                  "notes",
                                  e.target.value,
                                )
                              }
                              placeholder="Add any remarks or notes…"
                              rows={2}
                              disabled={isSubmitting}
                              style={{
                                ...baseInput,
                                resize: "none",
                                opacity: isSubmitting ? 0.6 : 1,
                              }}
                              onFocus={onFocusIn}
                              onBlur={onFocusOut}
                            />
                          </Field>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Empty project state */}
            {selectedProject &&
              !employeesLoading &&
              !employeesError &&
              employees.length === 0 && (
                <div
                  className="rounded-2xl text-center"
                  style={{
                    backgroundColor: "var(--color-neutral-0)",
                    border: "1px solid var(--color-neutral-200)",
                    padding: "3.5rem",
                  }}
                >
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                    👥
                  </div>
                  <h3
                    className="font-semibold mb-1"
                    style={{
                      fontSize: "1rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    No team members assigned
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Assign employees to this project first
                  </p>
                </div>
              )}

            {/* No project selected guide */}
            {!selectedProject && (
              <div
                className="rounded-2xl"
                style={{
                  backgroundColor: "var(--color-neutral-0)",
                  border: "1px solid var(--color-neutral-200)",
                  padding: "1.5rem",
                }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                  >
                    <FontAwesomeIcon
                      icon={faClipboardCheck}
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
                    Quick Guide
                  </h2>
                </div>
                <div className="space-y-2.5">
                  {[
                    "Select a project above to view its team members",
                    "Mark attendance status for each member — Present, Absent, Half Day, or On Leave",
                    "Set check-in and check-out times for present members",
                    "Add optional notes for special circumstances or remarks",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                      >
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            color: "#1ab189",
                          }}
                        >
                          {i + 1}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-neutral-700)",
                        }}
                      >
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit row */}
            {selectedProject && employees.length > 0 && (
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject("");
                    setAttendanceRecords([]);
                  }}
                  disabled={isSubmitting}
                  className="btn btn-ghost btn-md"
                  style={{ opacity: isSubmitting ? 0.6 : 1 }}
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-md flex items-center gap-2"
                  style={{
                    minWidth: "10rem",
                    justifyContent: "center",
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Saving…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faSave}
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Save Attendance
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        ) : (
          /* ── Attendance History ── */
          <div className="space-y-5">
            {/* Search + export */}
            <div
              className="rounded-2xl flex items-center gap-4"
              style={{
                backgroundColor: "var(--color-neutral-0)",
                border: "1px solid var(--color-neutral-200)",
                padding: "0.875rem 1.5rem",
              }}
            >
              <div className="relative flex-1" style={{ maxWidth: "20rem" }}>
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    color: "var(--color-neutral-400)",
                    fontSize: "0.75rem",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by employee or project…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    ...baseInput,
                    paddingLeft: "2rem",
                    padding: "0.5rem 1rem 0.5rem 2rem",
                  }}
                  onFocus={onFocusIn}
                  onBlur={onFocusOut}
                />
              </div>
              <button
                onClick={() => alert("Exporting attendance data to CSV…")}
                className="btn btn-ghost btn-md flex items-center gap-2"
                style={{ whiteSpace: "nowrap" }}
              >
                <FontAwesomeIcon
                  icon={faDownload}
                  style={{ fontSize: "0.8rem" }}
                />
                Export CSV
              </button>
            </div>

            {/* Loading */}
            {historyLoading && (
              <div
                className="rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: "var(--color-neutral-0)",
                  border: "1px solid var(--color-neutral-200)",
                  padding: "3rem",
                }}
              >
                <div className="text-center">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin mb-3"
                    style={{ fontSize: "2rem", color: "#1ab189" }}
                  />
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Loading attendance history…
                  </p>
                </div>
              </div>
            )}

            {/* History cards */}
            {!historyLoading && paginatedDates.length > 0 && (
              <>
                <div className="space-y-4">
                  {paginatedDates.map((date) => {
                    const records = groupedHistory[date];
                    const presentCount = records.filter(
                      (r) => r.status === "present",
                    ).length;
                    const absentCount = records.filter(
                      (r) => r.status === "absent",
                    ).length;
                    const otherCount =
                      records.length - presentCount - absentCount;

                    return (
                      <div
                        key={date}
                        className="rounded-2xl overflow-hidden"
                        style={{
                          backgroundColor: "var(--color-neutral-0)",
                          border: "1px solid var(--color-neutral-200)",
                        }}
                      >
                        {/* Card header */}
                        <div
                          className="flex items-center justify-between"
                          style={{
                            padding: "1rem 1.5rem",
                            borderBottom: "1px solid var(--color-neutral-200)",
                            backgroundColor: "var(--color-neutral-50)",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold flex-shrink-0"
                              style={{
                                backgroundColor: "#1ab189",
                                color: "white",
                                fontSize: "0.8rem",
                              }}
                            >
                              {selectedProjectData?.project_name.charAt(0) ??
                                "P"}
                            </div>
                            <div>
                              <h3
                                className="font-semibold"
                                style={{
                                  fontSize: "0.9rem",
                                  color: "var(--color-neutral-900)",
                                }}
                              >
                                {selectedProjectData?.project_name ?? "Project"}
                              </h3>
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--color-neutral-500)",
                                }}
                              >
                                {selectedProjectData?.client?.full_name ??
                                  "No client"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon
                              icon={faCalendar}
                              style={{ color: "#1ab189", fontSize: "0.75rem" }}
                            />
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--color-neutral-600)",
                              }}
                            >
                              {new Date(date + "T00:00:00").toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>

                        <div style={{ padding: "1.25rem 1.5rem" }}>
                          {/* Mini stats */}
                          <div className="grid grid-cols-4 gap-3 mb-4">
                            {[
                              {
                                label: "Total",
                                val: records.length,
                                bg: "var(--color-neutral-50)",
                                border: "var(--color-neutral-200)",
                                color: "var(--color-neutral-900)",
                              },
                              {
                                label: "Present",
                                val: presentCount,
                                bg: "rgba(22,163,74,0.08)",
                                border: "rgba(22,163,74,0.2)",
                                color: "#16a34a",
                              },
                              {
                                label: "Absent",
                                val: absentCount,
                                bg: "rgba(239,68,68,0.08)",
                                border: "rgba(239,68,68,0.2)",
                                color: "#dc2626",
                              },
                              {
                                label: "Others",
                                val: otherCount,
                                bg: "rgba(59,130,246,0.08)",
                                border: "rgba(59,130,246,0.2)",
                                color: "#2563eb",
                              },
                            ].map(({ label, val, bg, border, color }) => (
                              <div
                                key={label}
                                className="rounded-xl text-center"
                                style={{
                                  padding: "0.625rem 0.5rem",
                                  backgroundColor: bg,
                                  border: `1px solid ${border}`,
                                }}
                              >
                                <p
                                  className="font-bold"
                                  style={{ fontSize: "1.125rem", color }}
                                >
                                  {val}
                                </p>
                                <p style={{ fontSize: "0.68rem", color }}>
                                  {label}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Member rows */}
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
                            Team Members
                          </p>
                          <div className="space-y-2">
                            {records.map((record) => {
                              const cfg = STATUS_CONFIG[record.status];
                              return (
                                <div
                                  key={record.id}
                                  className="flex items-center justify-between rounded-xl"
                                  style={{
                                    padding: "0.625rem 0.875rem",
                                    backgroundColor: "var(--color-neutral-50)",
                                    border:
                                      "1px solid var(--color-neutral-100)",
                                  }}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className="w-8 h-8 rounded-full flex items-center justify-center font-semibold flex-shrink-0"
                                      style={{
                                        backgroundColor: avatarColor(
                                          record.employee,
                                        ),
                                        color: "white",
                                        fontSize: "0.7rem",
                                      }}
                                    >
                                      {getInitials(record.employee_name)}
                                    </div>
                                    <div>
                                      <p
                                        className="font-semibold"
                                        style={{
                                          fontSize: "0.825rem",
                                          color: "var(--color-neutral-900)",
                                        }}
                                      >
                                        {record.employee_name}
                                      </p>
                                      <p
                                        style={{
                                          fontSize: "0.72rem",
                                          color: "var(--color-neutral-500)",
                                        }}
                                      >
                                        {record.employee_role}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {record.check_in_time &&
                                      record.check_out_time && (
                                        <span
                                          style={{
                                            fontSize: "0.75rem",
                                            color: "var(--color-neutral-500)",
                                          }}
                                        >
                                          {record.check_in_time} –{" "}
                                          {record.check_out_time}
                                        </span>
                                      )}
                                    <span
                                      style={{
                                        padding: "0.2rem 0.6rem",
                                        borderRadius: "9999px",
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.3rem",
                                        ...cfg.badge,
                                      }}
                                    >
                                      <FontAwesomeIcon
                                        icon={cfg.icon}
                                        style={{ fontSize: "0.65rem" }}
                                      />
                                      {cfg.label}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl"
                    style={{
                      padding: "0.875rem 1.5rem",
                      backgroundColor: "var(--color-neutral-0)",
                      border: "1px solid var(--color-neutral-200)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      Showing {(currentPage - 1) * PER_HISTORY_PAGE + 1}–
                      {Math.min(
                        currentPage * PER_HISTORY_PAGE,
                        filteredDates.length,
                      )}{" "}
                      of {filteredDates.length} records
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
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
                              backgroundColor: active
                                ? "#1ab189"
                                : "transparent",
                              color: active
                                ? "white"
                                : "var(--color-neutral-700)",
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
                )}
              </>
            )}

            {/* Empty history */}
            {!historyLoading && paginatedDates.length === 0 && (
              <div
                className="rounded-2xl text-center"
                style={{
                  backgroundColor: "var(--color-neutral-0)",
                  border: "1px solid var(--color-neutral-200)",
                  padding: "4rem 2rem",
                }}
              >
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>
                  📋
                </div>
                <h3
                  className="font-semibold mb-2"
                  style={{
                    fontSize: "1.125rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  No attendance records found
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-500)",
                  }}
                >
                  {selectedProject
                    ? "Start marking attendance to see records here"
                    : "Select a project first to view attendance history"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
