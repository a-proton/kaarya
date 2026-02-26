"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faTrash,
  faCalendar,
  faMapMarkerAlt,
  faFileAlt,
  faBriefcase,
  faCheckCircle,
  faPenToSquare,
  faEye,
  faMoneyBill,
  faTimes,
  faCheck,
  faExclamationTriangle,
  faDollarSign,
  faUsers,
  faSpinner,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/* ─────────────────────────────────────────── */
/* Types                                        */
/* ─────────────────────────────────────────── */
interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  amount: number;
  status: "pending" | "in_progress" | "completed";
}

interface MilestoneFormData {
  title: string;
  description: string;
  dueDate: string;
  amount: string;
  status: "pending" | "in_progress" | "completed";
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

interface CreateProjectPayload {
  project_name: string;
  description: string;
  site_address: string;
  status: string;
  start_date: string;
  expected_end_date: string;
  total_cost: string;
  advance_payment: string;
  balance_payment: string;
}

interface CreateMilestonePayload {
  title: string;
  description: string;
  target_date: string;
  status: "pending" | "in_progress" | "completed";
}

interface AssignEmployeePayload {
  employee_id: number;
  assigned_date: string;
}

interface CreatedProject {
  id: number;
}

/* ─────────────────────────────────────────── */
/* API helpers                                  */
/* ─────────────────────────────────────────── */
async function fetchEmployees(): Promise<{ results: Employee[] }> {
  const token = getAccessToken();
  if (!token) throw new Error("No authentication token found");
  const res = await fetch(`${API_BASE_URL}/api/v1/employees/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch employees");
  const data: unknown = await res.json();
  return Array.isArray(data)
    ? { results: data as Employee[] }
    : (data as { results: Employee[] });
}

async function assignEmployee(
  projectId: number,
  payload: AssignEmployeePayload,
): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error("No authentication token found");
  const res = await fetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/employees/assign/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const err = (await res.json()) as { detail?: string; error?: string };
    throw new Error(err.detail ?? err.error ?? "Failed to assign employee");
  }
}

/* ─────────────────────────────────────────── */
/* Constants                                    */
/* ─────────────────────────────────────────── */
const MILESTONE_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#fefce8", color: "#a16207" },
  in_progress: { bg: "#eff6ff", color: "#1d4ed8" },
  completed: { bg: "rgba(26,177,137,0.1)", color: "#1ab189" },
};

const MILESTONE_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
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

const getMilestoneStyle = (s: string) =>
  MILESTONE_STATUS_STYLES[s] ?? {
    bg: "var(--color-neutral-100)",
    color: "var(--color-neutral-600)",
  };
const getMilestoneIcon = (s: string) =>
  s === "completed"
    ? faCheck
    : s === "in_progress"
      ? faClock
      : faExclamationTriangle;
const employeeColor = (id: number) =>
  EMPLOYEE_COLORS[id % EMPLOYEE_COLORS.length];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

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
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
) {
  e.currentTarget.style.borderColor = "#1ab189";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,177,137,0.12)";
}
function onFocusOut(
  e: React.FocusEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
) {
  e.currentTarget.style.borderColor = "var(--color-neutral-200)";
  e.currentTarget.style.boxShadow = "none";
}

/* ─────────────────────────────────────────── */
/* Small reusable UI pieces                    */
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
  title,
  icon,
  extra,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  extra?: React.ReactNode;
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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
          >
            <span style={{ color: "#1ab189", fontSize: "0.875rem" }}>
              {icon}
            </span>
          </div>
          <h2
            className="font-semibold"
            style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
          >
            {title}
          </h2>
        </div>
        {extra}
      </div>
      {children}
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  border = true,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  border?: boolean;
}) {
  return (
    <div
      className="flex items-start gap-3"
      style={{
        paddingBottom: border ? "0.875rem" : 0,
        marginBottom: border ? "0.875rem" : 0,
        borderBottom: border ? "1px solid var(--color-neutral-100)" : "none",
      }}
    >
      <span
        style={{
          color: "#1ab189",
          marginTop: "2px",
          fontSize: "0.8rem",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="mb-0.5 font-semibold tracking-wider uppercase"
          style={{ fontSize: "0.65rem", color: "var(--color-neutral-400)" }}
        >
          {label}
        </p>
        <p
          className="font-semibold truncate"
          style={{ fontSize: "0.85rem", color: "var(--color-neutral-900)" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function CreateProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  /* Form state */
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [initialPaymentTaken, setInitialPaymentTaken] = useState(false);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  /* Milestone modal state */
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null,
  );
  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormData>({
    title: "",
    description: "",
    dueDate: "",
    amount: "",
    status: "pending",
  });
  const [viewingMilestone, setViewingMilestone] = useState<Milestone | null>(
    null,
  );

  /* UI state */
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [isCreatingMilestones, setIsCreatingMilestones] = useState(false);
  const [isAssigningEmployees, setIsAssigningEmployees] = useState(false);

  /* ── Queries ── */
  const {
    data: employeesData,
    isLoading: empLoading,
    isError: empError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });
  const employees = employeesData?.results ?? [];

  /* ── Helpers ── */
  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const assignEmployees = async (projectId: number) => {
    setIsAssigningEmployees(true);
    const date = startDate || new Date().toISOString().split("T")[0];
    const results = await Promise.allSettled(
      selectedEmployees.map((id) =>
        assignEmployee(projectId, { employee_id: id, assigned_date: date }),
      ),
    );
    setIsAssigningEmployees(false);
    return results.filter((r) => r.status === "fulfilled").length;
  };

  const createMilestones = async (projectId: number) => {
    setIsCreatingMilestones(true);
    const results = await Promise.allSettled(
      milestones.map((m) => {
        const payload: CreateMilestonePayload = {
          title: m.title,
          description: m.description,
          target_date: m.dueDate,
          status: m.status,
        };
        return api.post(
          `/api/v1/projects/${projectId}/milestones/create/`,
          payload,
        );
      }),
    );
    setIsCreatingMilestones(false);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["all-milestones"] });
    return results.filter((r) => r.status === "fulfilled").length;
  };

  const buildSuccessMsg = (empCount: number, msCount: number) => {
    let msg = "Project created successfully!";
    if (empCount > 0)
      msg += ` ${empCount} employee${empCount !== 1 ? "s" : ""} assigned.`;
    if (msCount > 0)
      msg += ` ${msCount} milestone${msCount !== 1 ? "s" : ""} created.`;
    return msg;
  };

  /* ── Create mutation ── */
  const createMutation = useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      api.post<CreatedProject>("/api/v1/projects/create/", payload),
    onSuccess: async (data) => {
      const projectId = data.id;
      const empCount =
        selectedEmployees.length > 0 ? await assignEmployees(projectId) : 0;
      const msCount =
        milestones.length > 0 ? await createMilestones(projectId) : 0;
      notify(buildSuccessMsg(empCount, msCount));
      setTimeout(() => router.push("/provider/projects"), 1800);
    },
    onError: (err: unknown) => {
      const e = err as { data?: Record<string, unknown>; message?: string };
      if (e.data && typeof e.data === "object") {
        const msgs = Object.entries(e.data).map(
          ([f, v]) => `${f}: ${Array.isArray(v) ? v.join(", ") : String(v)}`,
        );
        alert(`Error:\n${msgs.join("\n")}`);
      } else {
        alert(`Error: ${e.message ?? "Failed to create project"}`);
      }
    },
  });

  /* ── Submit ── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !location || !startDate || !endDate || !projectBudget) {
      alert("Please fill in all required fields");
      return;
    }
    const budget = parseFloat(projectBudget.replace(/[^0-9.-]+/g, ""));
    if (isNaN(budget) || budget <= 0) {
      alert("Please enter a valid budget");
      return;
    }
    const advance = initialPaymentTaken
      ? parseFloat(initialPaymentAmount) || 0
      : 0;
    createMutation.mutate({
      project_name: projectName,
      description: description || `${category} project at ${location}`,
      site_address: location,
      status,
      start_date: startDate,
      expected_end_date: endDate,
      total_cost: budget.toFixed(2),
      advance_payment: advance.toFixed(2),
      balance_payment: (budget - advance).toFixed(2),
    });
  };

  /* ── Milestone handlers ── */
  const openMilestoneModal = (m?: Milestone) => {
    if (m) {
      setEditingMilestone(m);
      setMilestoneForm({
        title: m.title,
        description: m.description,
        dueDate: m.dueDate,
        amount: m.amount.toString(),
        status: m.status,
      });
    } else {
      setEditingMilestone(null);
      setMilestoneForm({
        title: "",
        description: "",
        dueDate: "",
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
      title: "",
      description: "",
      dueDate: "",
      amount: "",
      status: "pending",
    });
  };

  const saveMilestone = () => {
    if (
      !milestoneForm.title ||
      !milestoneForm.dueDate ||
      !milestoneForm.amount
    ) {
      alert("Please fill in all required milestone fields");
      return;
    }
    const amount = parseFloat(milestoneForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (editingMilestone) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === editingMilestone.id ? { ...m, ...milestoneForm, amount } : m,
        ),
      );
      notify("Milestone updated!");
    } else {
      setMilestones((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          title: milestoneForm.title,
          description: milestoneForm.description,
          dueDate: milestoneForm.dueDate,
          amount,
          status: milestoneForm.status,
        },
      ]);
      notify("Milestone added!");
    }
    closeMilestoneModal();
  };

  const deleteMilestone = (id: string) => {
    if (confirm("Delete this milestone?")) {
      setMilestones((prev) => prev.filter((m) => m.id !== id));
      notify("Milestone deleted.");
    }
  };

  const toggleEmployee = (id: number) =>
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  /* ── Derived values ── */
  const budget = parseFloat(projectBudget.replace(/[^0-9.-]+/g, "")) || 0;
  const advance = parseFloat(initialPaymentAmount) || 0;
  const balance = budget - advance;
  const totalMilestoneAmount = milestones.reduce((s, m) => s + m.amount, 0);
  const isSubmitting =
    createMutation.isPending || isCreatingMilestones || isAssigningEmployees;

  const submitLabel = isCreatingMilestones
    ? "Creating Milestones…"
    : isAssigningEmployees
      ? "Assigning Team…"
      : "Creating Project…";

  /* ── Loading ── */
  if (empLoading) {
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
            Loading employees…
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

      {/* Header */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.125rem 2rem",
        }}
      >
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
              Create New Project
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Fill in the details to create your project
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ padding: "1.75rem 2rem", maxWidth: "72rem", margin: "0 auto" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left col ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Project info */}
            <SectionCard
              title="Project Information"
              icon={<FontAwesomeIcon icon={faBriefcase} />}
            >
              <div className="space-y-4">
                <Field label="Project Name" required>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Kitchen Renovation"
                    required
                    style={baseInput}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>

                <Field label="Category" required>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    style={{
                      ...baseInput,
                      cursor: "pointer",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.875rem center",
                      paddingRight: "2.5rem",
                    }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  >
                    <option value="">Select a category</option>
                    {[
                      "Renovation",
                      "Electrical",
                      "Plumbing",
                      "HVAC",
                      "Landscaping",
                      "Commercial",
                      "Residential",
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Project Status" required>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                    style={{
                      ...baseInput,
                      cursor: "pointer",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.875rem center",
                      paddingRight: "2.5rem",
                    }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  >
                    {[
                      ["pending", "Pending"],
                      ["not_started", "Not Started"],
                      ["in_progress", "In Progress"],
                      ["on_hold", "On Hold"],
                      ["completed", "Completed"],
                      ["cancelled", "Cancelled"],
                    ].map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Location" required>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: "#1ab189", fontSize: "0.8rem" }}
                    />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., 123 Main Street, New York, NY"
                      required
                      style={{ ...baseInput, paddingLeft: "2.25rem" }}
                      onFocus={onFocusIn}
                      onBlur={onFocusOut}
                    />
                  </div>
                </Field>

                <Field label="Project Total Cost" required>
                  <div className="relative">
                    <span
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none font-semibold"
                      style={{
                        color: "var(--color-neutral-400)",
                        fontSize: "0.875rem",
                      }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      value={projectBudget}
                      onChange={(e) => setProjectBudget(e.target.value)}
                      placeholder="50000"
                      min="0"
                      step="0.01"
                      required
                      style={{ ...baseInput, paddingLeft: "1.875rem" }}
                      onFocus={onFocusIn}
                      onBlur={onFocusOut}
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Start Date" required>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faCalendar}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        style={{ ...baseInput, paddingLeft: "2.25rem" }}
                        onFocus={onFocusIn}
                        onBlur={onFocusOut}
                      />
                    </div>
                  </Field>
                  <Field label="End Date (Estimated)" required>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faCalendar}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        required
                        style={{ ...baseInput, paddingLeft: "2.25rem" }}
                        onFocus={onFocusIn}
                        onBlur={onFocusOut}
                      />
                    </div>
                  </Field>
                </div>

                <Field label="Project Description">
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faFileAlt}
                      className="absolute left-3.5 top-3.5 pointer-events-none"
                      style={{ color: "#1ab189", fontSize: "0.8rem" }}
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide a detailed description…"
                      rows={4}
                      style={{
                        ...baseInput,
                        paddingLeft: "2.25rem",
                        resize: "none",
                      }}
                      onFocus={onFocusIn}
                      onBlur={onFocusOut}
                    />
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* Advance payment */}
            <SectionCard
              title="Initial Payment (Advance)"
              icon={<FontAwesomeIcon icon={faDollarSign} />}
            >
              <div className="space-y-4">
                <div
                  className="flex items-start gap-3 rounded-xl"
                  style={{
                    padding: "1rem",
                    backgroundColor: "var(--color-neutral-50)",
                    border: "1px solid var(--color-neutral-200)",
                  }}
                >
                  <input
                    type="checkbox"
                    id="initPay"
                    checked={initialPaymentTaken}
                    onChange={(e) => {
                      setInitialPaymentTaken(e.target.checked);
                      if (!e.target.checked) setInitialPaymentAmount("");
                    }}
                    style={{
                      width: "1.125rem",
                      height: "1.125rem",
                      accentColor: "#1ab189",
                      marginTop: "2px",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  />
                  <div>
                    <label
                      htmlFor="initPay"
                      className="font-semibold block"
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-900)",
                        cursor: "pointer",
                      }}
                    >
                      Initial payment received
                    </label>
                    <p
                      className="mt-0.5"
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      Check this if you&apos;ve received an advance payment from
                      the client
                    </p>
                  </div>
                </div>

                {initialPaymentTaken && (
                  <Field label="Advance Payment Amount" required>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faDollarSign}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                          color: "var(--color-neutral-400)",
                          fontSize: "0.8rem",
                        }}
                      />
                      <input
                        type="number"
                        value={initialPaymentAmount}
                        onChange={(e) =>
                          setInitialPaymentAmount(e.target.value)
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required={initialPaymentTaken}
                        style={{ ...baseInput, paddingLeft: "2.25rem" }}
                        onFocus={onFocusIn}
                        onBlur={onFocusOut}
                      />
                    </div>
                    {advance > 0 && budget > 0 && (
                      <div className="mt-3 space-y-1">
                        <p
                          className="flex items-center gap-2 font-medium"
                          style={{ fontSize: "0.78rem", color: "#1ab189" }}
                        >
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            style={{ fontSize: "0.75rem" }}
                          />{" "}
                          Advance: {formatCurrency(advance)}
                        </p>
                        <p
                          className="flex items-center gap-2 font-medium"
                          style={{ fontSize: "0.78rem", color: "#3b82f6" }}
                        >
                          <FontAwesomeIcon
                            icon={faMoneyBill}
                            style={{ fontSize: "0.75rem" }}
                          />{" "}
                          Balance: {formatCurrency(balance)}
                        </p>
                      </div>
                    )}
                  </Field>
                )}
              </div>
            </SectionCard>

            {/* Team assignment */}
            <SectionCard
              title="Assign Team Members"
              icon={<FontAwesomeIcon icon={faUsers} />}
            >
              <p
                className="mb-4"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                Select employees to assign. They will be assigned automatically
                after creation.
              </p>
              {empError ? (
                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                  }}
                >
                  <p
                    className="flex items-center gap-2"
                    style={{ fontSize: "0.8rem", color: "#b91c1c" }}
                  >
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      style={{ fontSize: "0.8rem" }}
                    />
                    Failed to load employees. You can assign them after creating
                    the project.
                  </p>
                </div>
              ) : employees.length === 0 ? (
                <div
                  className="text-center py-8 rounded-xl"
                  style={{
                    border: "2px dashed var(--color-neutral-200)",
                    backgroundColor: "var(--color-neutral-50)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faUsers}
                    style={{
                      fontSize: "2.5rem",
                      color: "var(--color-neutral-300)",
                      marginBottom: "0.75rem",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-600)",
                    }}
                  >
                    No employees available
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--color-neutral-400)",
                    }}
                  >
                    Add employees to your team first
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {employees.map((emp) => {
                      const selected = selectedEmployees.includes(emp.id);
                      return (
                        <div
                          key={emp.id}
                          onClick={() => toggleEmployee(emp.id)}
                          className="flex items-center gap-3 rounded-xl p-3.5 cursor-pointer"
                          style={{
                            border: `2px solid ${selected ? "#1ab189" : "var(--color-neutral-200)"}`,
                            backgroundColor: selected
                              ? "rgba(26,177,137,0.06)"
                              : "var(--color-neutral-0)",
                            transition:
                              "border-color 150ms, background-color 150ms",
                          }}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                            style={{
                              backgroundColor: employeeColor(emp.id),
                              color: "white",
                              fontSize: "0.8rem",
                            }}
                          >
                            {emp.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-semibold truncate"
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--color-neutral-900)",
                              }}
                            >
                              {emp.full_name}
                            </p>
                            <p
                              className="truncate"
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-neutral-500)",
                              }}
                            >
                              {emp.role || "No role"}
                              {emp.department ? ` · ${emp.department}` : ""}
                            </p>
                          </div>
                          {selected && (
                            <FontAwesomeIcon
                              icon={faCheck}
                              style={{
                                color: "#1ab189",
                                fontSize: "0.8rem",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {selectedEmployees.length > 0 && (
                    <div
                      className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3"
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
                        {selectedEmployees.length} employee
                        {selectedEmployees.length !== 1 ? "s" : ""} selected
                      </p>
                    </div>
                  )}
                </>
              )}
            </SectionCard>

            {/* Milestones */}
            <SectionCard
              title="Project Milestones"
              icon={<FontAwesomeIcon icon={faCheckCircle} />}
              extra={
                <button
                  type="button"
                  onClick={() => openMilestoneModal()}
                  className="btn btn-primary btn-sm flex items-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    style={{ fontSize: "0.75rem" }}
                  />{" "}
                  Add Milestone
                </button>
              }
            >
              {milestones.length === 0 ? (
                <div
                  className="text-center py-8 rounded-xl"
                  style={{
                    border: "2px dashed var(--color-neutral-200)",
                    backgroundColor: "var(--color-neutral-50)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    style={{
                      fontSize: "2.5rem",
                      color: "var(--color-neutral-300)",
                      marginBottom: "0.75rem",
                    }}
                  />
                  <p
                    className="mb-3"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-600)",
                    }}
                  >
                    No milestones added yet
                  </p>
                  <button
                    type="button"
                    onClick={() => openMilestoneModal()}
                    className="btn btn-secondary btn-sm"
                  >
                    Add First Milestone
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((m) => {
                    const ms = getMilestoneStyle(m.status);
                    return (
                      <div
                        key={m.id}
                        className="flex items-start justify-between rounded-xl p-4"
                        style={{
                          border: "1px solid var(--color-neutral-200)",
                          backgroundColor: "var(--color-neutral-50)",
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h4
                              className="font-semibold"
                              style={{
                                fontSize: "0.9rem",
                                color: "var(--color-neutral-900)",
                              }}
                            >
                              {m.title}
                            </h4>
                            <span
                              className="rounded-full font-semibold"
                              style={{
                                fontSize: "0.65rem",
                                padding: "0.15rem 0.55rem",
                                backgroundColor: ms.bg,
                                color: ms.color,
                              }}
                            >
                              {MILESTONE_LABELS[m.status]}
                            </span>
                          </div>
                          {m.description && (
                            <p
                              className="mb-2"
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--color-neutral-600)",
                              }}
                            >
                              {m.description}
                            </p>
                          )}
                          <div
                            className="flex items-center gap-3 flex-wrap"
                            style={{ fontSize: "0.8rem" }}
                          >
                            <span
                              className="font-semibold flex items-center gap-1"
                              style={{ color: "#1ab189" }}
                            >
                              <FontAwesomeIcon
                                icon={faDollarSign}
                                style={{ fontSize: "0.7rem" }}
                              />
                              {formatCurrency(m.amount)}
                            </span>
                            <span
                              className="flex items-center gap-1"
                              style={{ color: "var(--color-neutral-500)" }}
                            >
                              <FontAwesomeIcon
                                icon={faCalendar}
                                style={{ fontSize: "0.7rem" }}
                              />
                              {new Date(m.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                          {[
                            {
                              icon: faEye,
                              color: "#3b82f6",
                              hover: "#eff6ff",
                              action: () => setViewingMilestone(m),
                            },
                            {
                              icon: faPenToSquare,
                              color: "#1ab189",
                              hover: "rgba(26,177,137,0.1)",
                              action: () => openMilestoneModal(m),
                            },
                            {
                              icon: faTrash,
                              color: "#ef4444",
                              hover: "#fef2f2",
                              action: () => deleteMilestone(m.id),
                            },
                          ].map(({ icon, color, hover, action }, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={action}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color,
                                padding: "0.375rem",
                                borderRadius: "0.5rem",
                              }}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.backgroundColor = hover;
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.backgroundColor = "transparent";
                              }}
                            >
                              <FontAwesomeIcon
                                icon={icon}
                                style={{ fontSize: "0.8rem" }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {/* Total */}
                  <div
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: "rgba(26,177,137,0.06)",
                      border: "1px solid rgba(26,177,137,0.2)",
                    }}
                  >
                    <div>
                      <p
                        className="font-semibold"
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-neutral-900)",
                        }}
                      >
                        Total Milestone Value
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        {milestones.length} milestone
                        {milestones.length !== 1 ? "s" : ""} · avg{" "}
                        {formatCurrency(
                          totalMilestoneAmount / milestones.length,
                        )}
                      </p>
                    </div>
                    <span
                      className="font-bold"
                      style={{ fontSize: "1.125rem", color: "#1ab189" }}
                    >
                      {formatCurrency(totalMilestoneAmount)}
                    </span>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── Right col: summary + actions ── */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl sticky top-6"
              style={{
                backgroundColor: "var(--color-neutral-0)",
                border: "1px solid var(--color-neutral-200)",
                padding: "1.5rem",
              }}
            >
              <h3
                className="font-semibold mb-4"
                style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
              >
                Project Summary
              </h3>

              <div className="mb-5">
                <SummaryRow
                  icon={<FontAwesomeIcon icon={faBriefcase} />}
                  label="Project Name"
                  value={projectName || "Not specified"}
                />
                <SummaryRow
                  icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
                  label="Location"
                  value={location || "Not specified"}
                />
                <SummaryRow
                  icon={<FontAwesomeIcon icon={faMoneyBill} />}
                  label="Total Cost"
                  value={budget > 0 ? formatCurrency(budget) : "Not specified"}
                />
                <SummaryRow
                  icon={<FontAwesomeIcon icon={faUsers} />}
                  label="Team Members"
                  value={
                    selectedEmployees.length === 0
                      ? "None"
                      : `${selectedEmployees.length} selected`
                  }
                />
                <SummaryRow
                  icon={<FontAwesomeIcon icon={faCheckCircle} />}
                  label="Milestones"
                  value={
                    milestones.length === 0
                      ? "None"
                      : `${milestones.length} added`
                  }
                />
                <SummaryRow
                  icon={<FontAwesomeIcon icon={faCalendar} />}
                  label="Duration"
                  value={
                    startDate && endDate
                      ? `${new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : "Not specified"
                  }
                  border={false}
                />
              </div>

              {/* Payment breakdown */}
              {budget > 0 && (
                <div
                  className="rounded-xl mb-5"
                  style={{
                    backgroundColor: "var(--color-neutral-50)",
                    border: "1px solid var(--color-neutral-200)",
                    padding: "1rem",
                  }}
                >
                  <p
                    className="font-semibold mb-3 flex items-center gap-2"
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-neutral-700)",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      style={{ color: "#1ab189", fontSize: "0.75rem" }}
                    />
                    Payment Breakdown
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        Total Cost
                      </span>
                      <span
                        className="font-semibold"
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--color-neutral-900)",
                        }}
                      >
                        {formatCurrency(budget)}
                      </span>
                    </div>
                    {initialPaymentTaken && advance > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--color-neutral-500)",
                            }}
                          >
                            Advance
                          </span>
                          <span
                            className="font-semibold"
                            style={{ fontSize: "0.78rem", color: "#1ab189" }}
                          >
                            {formatCurrency(advance)}
                          </span>
                        </div>
                        <div
                          style={{
                            borderTop: "1px solid var(--color-neutral-200)",
                            paddingTop: "0.5rem",
                            marginTop: "0.25rem",
                          }}
                        />
                        <div className="flex justify-between">
                          <span
                            className="font-semibold"
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--color-neutral-700)",
                            }}
                          >
                            Balance
                          </span>
                          <span
                            className="font-bold"
                            style={{ fontSize: "0.9rem", color: "#1ab189" }}
                          >
                            {formatCurrency(balance)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-md w-full justify-center"
                  style={{ opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      {submitLabel}
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faPlus}
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Create Project
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Discard unsaved changes?"))
                      router.push("/provider/projects");
                  }}
                  disabled={isSubmitting}
                  className="btn btn-ghost btn-md w-full justify-center"
                >
                  Cancel
                </button>
              </div>

              <div
                className="rounded-xl mt-4"
                style={{
                  backgroundColor: "rgba(26,177,137,0.06)",
                  border: "1px solid rgba(26,177,137,0.2)",
                  padding: "0.875rem",
                }}
              >
                <p
                  className="flex items-start gap-2"
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-neutral-600)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    style={{
                      color: "#1ab189",
                      fontSize: "0.75rem",
                      marginTop: "2px",
                      flexShrink: 0,
                    }}
                  />
                  Project will be created with {selectedEmployees.length}{" "}
                  employee{selectedEmployees.length !== 1 ? "s" : ""} and{" "}
                  {milestones.length} milestone
                  {milestones.length !== 1 ? "s" : ""}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ── Milestone modal ── */}
      {showMilestoneModal && (
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
                  {editingMilestone ? "Edit Milestone" : "Add Milestone"}
                </h3>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-neutral-500)",
                    marginTop: "0.125rem",
                  }}
                >
                  {editingMilestone
                    ? "Update milestone details"
                    : "Create a new milestone"}
                </p>
              </div>
              <button
                onClick={closeMilestoneModal}
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

            <div style={{ padding: "1.5rem" }} className="space-y-4">
              <Field label="Milestone Title" required>
                <input
                  type="text"
                  value={milestoneForm.title}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Foundation Complete"
                  style={baseInput}
                  onFocus={onFocusIn}
                  onBlur={onFocusOut}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={milestoneForm.description}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe this milestone…"
                  rows={3}
                  style={{ ...baseInput, resize: "none" }}
                  onFocus={onFocusIn}
                  onBlur={onFocusOut}
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Payment Amount" required>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        color: "var(--color-neutral-400)",
                        fontSize: "0.8rem",
                      }}
                    />
                    <input
                      type="number"
                      value={milestoneForm.amount}
                      onChange={(e) =>
                        setMilestoneForm({
                          ...milestoneForm,
                          amount: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      style={{ ...baseInput, paddingLeft: "2.25rem" }}
                      onFocus={onFocusIn}
                      onBlur={onFocusOut}
                    />
                  </div>
                </Field>
                <Field label="Due Date" required>
                  <input
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={(e) =>
                      setMilestoneForm({
                        ...milestoneForm,
                        dueDate: e.target.value,
                      })
                    }
                    min={startDate}
                    max={endDate}
                    style={baseInput}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>
              </div>
              <Field label="Status" required>
                <select
                  value={milestoneForm.status}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      status: e.target.value as
                        | "pending"
                        | "in_progress"
                        | "completed",
                    })
                  }
                  style={{
                    ...baseInput,
                    cursor: "pointer",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.875rem center",
                    paddingRight: "2.5rem",
                  }}
                  onFocus={onFocusIn}
                  onBlur={onFocusOut}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{
                  backgroundColor: "rgba(26,177,137,0.06)",
                  border: "1px solid rgba(26,177,137,0.2)",
                }}
              >
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  style={{
                    color: "#1ab189",
                    fontSize: "0.875rem",
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-neutral-600)",
                  }}
                >
                  This milestone will be created when you submit the project
                  form.
                </p>
              </div>
            </div>

            <div
              className="sticky bottom-0 flex items-center justify-end gap-3 rounded-b-2xl"
              style={{
                backgroundColor: "var(--color-neutral-50)",
                borderTop: "1px solid var(--color-neutral-200)",
                padding: "1rem 1.5rem",
              }}
            >
              <button
                type="button"
                onClick={closeMilestoneModal}
                className="btn btn-ghost btn-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMilestone}
                className="btn btn-primary btn-md flex items-center gap-2"
              >
                <FontAwesomeIcon
                  icon={editingMilestone ? faCheckCircle : faPlus}
                  style={{ fontSize: "0.875rem" }}
                />
                {editingMilestone ? "Update Milestone" : "Add Milestone"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View milestone modal ── */}
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
                    Payment Amount
                  </p>
                  <div
                    className="flex items-center gap-2 rounded-xl p-3"
                    style={{
                      backgroundColor: "rgba(26,177,137,0.06)",
                      border: "1px solid rgba(26,177,137,0.2)",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      style={{ color: "#1ab189", fontSize: "0.8rem" }}
                    />
                    <span
                      className="font-bold"
                      style={{
                        fontSize: "1.125rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      {formatCurrency(viewingMilestone.amount)}
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
                    Due Date
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
                      {new Date(viewingMilestone.dueDate).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </span>
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
                  className="inline-flex items-center gap-2 rounded-full font-semibold"
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.3rem 0.75rem",
                    backgroundColor: getMilestoneStyle(viewingMilestone.status)
                      .bg,
                    color: getMilestoneStyle(viewingMilestone.status).color,
                  }}
                >
                  <FontAwesomeIcon
                    icon={getMilestoneIcon(viewingMilestone.status)}
                    style={{ fontSize: "0.65rem" }}
                  />
                  {MILESTONE_LABELS[viewingMilestone.status]}
                </span>
              </div>
            </div>

            <div
              className="sticky bottom-0 flex items-center justify-between gap-3 rounded-b-2xl"
              style={{
                backgroundColor: "var(--color-neutral-50)",
                borderTop: "1px solid var(--color-neutral-200)",
                padding: "1rem 1.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this milestone?")) {
                    deleteMilestone(viewingMilestone.id);
                    setViewingMilestone(null);
                  }
                }}
                className="btn btn-md flex items-center gap-2"
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                }}
              >
                <FontAwesomeIcon
                  icon={faTrash}
                  style={{ fontSize: "0.8rem" }}
                />{" "}
                Delete
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewingMilestone(null)}
                  className="btn btn-ghost btn-md"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewingMilestone(null);
                    openMilestoneModal(viewingMilestone);
                  }}
                  className="btn btn-primary btn-md flex items-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={faPenToSquare}
                    style={{ fontSize: "0.8rem" }}
                  />{" "}
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
