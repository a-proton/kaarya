"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendar,
  faMapMarkerAlt,
  faFileAlt,
  faBriefcase,
  faCheckCircle,
  faTimes,
  faCheck,
  faDollarSign,
  faMoneyBill,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, use } from "react";
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

interface Project {
  id: number;
  project_name: string;
  description: string;
  site_address: string;
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
  milestone_count: number;
  created_at: string;
  updated_at: string;
}

interface UpdateProjectPayload {
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

interface PageProps {
  params: Promise<{ id: string }>;
}

/* ─────────────────────────────────────────── */
/* Shared inline style base                    */
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

function onFocus(
  e: React.FocusEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
) {
  e.currentTarget.style.borderColor = "#1ab189";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,177,137,0.12)";
}
function onBlur(
  e: React.FocusEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
) {
  e.currentTarget.style.borderColor = "var(--color-neutral-200)";
  e.currentTarget.style.boxShadow = "none";
}

/* ─────────────────────────────────────────── */
/* Status config                               */
/* ─────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#fefce8", color: "#a16207" },
  not_started: { bg: "#fefce8", color: "#a16207" },
  in_progress: { bg: "#eff6ff", color: "#1d4ed8" },
  completed: { bg: "rgba(26,177,137,0.1)", color: "#1ab189" },
  on_hold: { bg: "#fff7ed", color: "#c2410c" },
  cancelled: { bg: "#fef2f2", color: "#b91c1c" },
};

const getStatusStyle = (s: string) =>
  STATUS_STYLES[s] ?? {
    bg: "var(--color-neutral-100)",
    color: "var(--color-neutral-600)",
  };

const statusLabel = (s: string) =>
  STATUS_OPTIONS.find((o) => o.value === s)?.label ??
  s.charAt(0).toUpperCase() + s.slice(1);

/* ─────────────────────────────────────────── */
/* Currency formatter                          */
/* ─────────────────────────────────────────── */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

/* ─────────────────────────────────────────── */
/* Small reusable pieces                       */
/* ─────────────────────────────────────────── */
function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
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
      {hint && (
        <p
          className="mt-1"
          style={{ fontSize: "0.72rem", color: "var(--color-neutral-400)" }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
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
          <span style={{ color: "#1ab189", fontSize: "0.875rem" }}>{icon}</span>
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

function SummaryRow({
  icon,
  label,
  value,
  border = true,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
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
      <span style={{ color: "#1ab189", marginTop: "2px", fontSize: "0.8rem" }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="mb-0.5 font-semibold tracking-wider uppercase"
          style={{ fontSize: "0.65rem", color: "var(--color-neutral-400)" }}
        >
          {label}
        </p>
        <div
          className="font-semibold truncate"
          style={{ fontSize: "0.85rem", color: "var(--color-neutral-900)" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Page                                        */
/* ─────────────────────────────────────────── */
export default function EditProjectPage({ params }: PageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [description, setDescription] = useState("");
  const [initialPaymentTaken, setInitialPaymentTaken] = useState(false);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      try {
        return await api.get<Project>(`/api/v1/projects/${projectId}/`);
      } catch (err: unknown) {
        const e = err as { status?: number };
        if (e.status === 401) {
          router.push("/login");
          throw new Error("Session expired.");
        }
        throw err;
      }
    },
    enabled: !!projectId,
    retry: (count, err: unknown) => {
      const e = err as { status?: number };
      return e.status !== 401 && count < 3;
    },
  });

  useEffect(() => {
    if (!project) return;
    setProjectName(project.project_name);
    setLocation(project.site_address);
    setProjectBudget(project.total_cost);
    setStartDate(project.start_date);
    setEndDate(project.expected_end_date);
    setStatus(project.status);
    setDescription(project.description);
    const adv = parseFloat(project.advance_payment);
    if (adv > 0) {
      setInitialPaymentTaken(true);
      setInitialPaymentAmount(adv.toString());
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProjectPayload) =>
      api.put(`/api/v1/projects/${projectId}/update/`, payload),
    onSuccess: () => {
      notify("Project updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setTimeout(() => router.push(`/provider/projects/${projectId}`), 1500);
    },
    onError: (err: unknown) => {
      const e = err as {
        data?: { detail?: string; message?: string };
        message?: string;
      };
      alert(
        `Error: ${e.data?.detail ?? e.data?.message ?? e.message ?? "Failed to update project."}`,
      );
    },
  });

  const notify = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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
    updateMutation.mutate({
      project_name: projectName,
      description,
      site_address: location,
      status,
      start_date: startDate,
      expected_end_date: endDate,
      total_cost: budget.toFixed(2),
      advance_payment: advance.toFixed(2),
      balance_payment: (budget - advance).toFixed(2),
    });
  };

  const budget = parseFloat(projectBudget.replace(/[^0-9.-]+/g, "")) || 0;
  const advance = parseFloat(initialPaymentAmount) || 0;
  const balance = budget - advance;

  /* Loading */
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
            Loading project…
          </p>
        </div>
      </div>
    );
  }

  /* Error */
  if (isError || !project) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div
          className="rounded-2xl p-8 text-center max-w-md w-full"
          style={{
            backgroundColor: "var(--color-neutral-0)",
            border: "1px solid #fecaca",
          }}
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
              {toastMessage}
            </p>
            <button
              onClick={() => setShowToast(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                padding: 0,
                lineHeight: 1,
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/provider/projects/${projectId}`)}
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
              Edit Project
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Updating{" "}
              <span
                style={{ color: "var(--color-neutral-700)", fontWeight: 600 }}
              >
                {project.project_name}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <form
        onSubmit={handleSubmit}
        style={{ padding: "1.75rem 2rem", maxWidth: "72rem", margin: "0 auto" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left: fields ── */}
          <div className="lg:col-span-2 space-y-5">
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
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </Field>

                <Field
                  label="Project Status"
                  required
                  hint="Select the current status of the project"
                >
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
                    onFocus={onFocus}
                    onBlur={onBlur}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
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
                      onFocus={onFocus}
                      onBlur={onBlur}
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
                      onFocus={onFocus}
                      onBlur={onBlur}
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
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>
                  </Field>
                  <Field label="Expected End Date" required>
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
                        onFocus={onFocus}
                        onBlur={onBlur}
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
                      placeholder="Provide a detailed description of the project…"
                      rows={4}
                      style={{
                        ...baseInput,
                        paddingLeft: "2.25rem",
                        resize: "none",
                      }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </Field>
              </div>
            </SectionCard>

            <SectionCard
              title="Advance Payment"
              icon={<FontAwesomeIcon icon={faDollarSign} />}
            >
              <div className="space-y-4">
                {/* checkbox */}
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
                    id="initialPayment"
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
                      htmlFor="initialPayment"
                      className="font-semibold block"
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-900)",
                        cursor: "pointer",
                      }}
                    >
                      Advance payment received
                    </label>
                    <p
                      className="mt-0.5"
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      Check this if you've received an advance payment from the
                      client
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
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>
                    {advance > 0 && (
                      <div className="mt-3 space-y-1">
                        <p
                          className="flex items-center gap-2 font-medium"
                          style={{ fontSize: "0.78rem", color: "#1ab189" }}
                        >
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            style={{ fontSize: "0.75rem" }}
                          />
                          Advance: {formatCurrency(advance)}
                        </p>
                        {budget > 0 && (
                          <p
                            className="flex items-center gap-2 font-medium"
                            style={{ fontSize: "0.78rem", color: "#3b82f6" }}
                          >
                            <FontAwesomeIcon
                              icon={faMoneyBill}
                              style={{ fontSize: "0.75rem" }}
                            />
                            Balance: {formatCurrency(balance)}
                          </p>
                        )}
                      </div>
                    )}
                  </Field>
                )}
              </div>
            </SectionCard>
          </div>

          {/* ── Right: summary + actions ── */}
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
                  icon={<FontAwesomeIcon icon={faCheckCircle} />}
                  label="Status"
                  value={
                    <span
                      className="inline-flex rounded-full font-semibold"
                      style={{
                        fontSize: "0.65rem",
                        padding: "0.2rem 0.65rem",
                        backgroundColor: getStatusStyle(status).bg,
                        color: getStatusStyle(status).color,
                      }}
                    >
                      {statusLabel(status)}
                    </span>
                  }
                />
                <SummaryRow
                  icon={<FontAwesomeIcon icon={faMoneyBill} />}
                  label="Total Cost"
                  value={budget > 0 ? formatCurrency(budget) : "Not specified"}
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
                  disabled={updateMutation.isPending}
                  className="btn btn-primary btn-md w-full justify-center"
                  style={{ opacity: updateMutation.isPending ? 0.6 : 1 }}
                >
                  {updateMutation.isPending ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Updating…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Update Project
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Discard unsaved changes?"))
                      router.push(`/provider/projects/${projectId}`);
                  }}
                  disabled={updateMutation.isPending}
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
                  Changes will be saved immediately and reflected across the
                  system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
