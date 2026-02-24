"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faPlus,
  faCheckCircle,
  faLock,
  faEye,
  faEyeSlash,
  faKey,
  faSpinner,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { clientService, ClientCreateData } from "@/lib/clientService";
import { api } from "@/lib/api";

/* ─────────────────────────────────────────── */
/* Types                                        */
/* ─────────────────────────────────────────── */
interface Project {
  id: number;
  name: string;
  status: string;
  project_name?: string;
}

interface ProjectsResponse {
  results: Project[];
  count: number;
  next: string | null;
  previous: string | null;
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

function onFocusIn(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  if ((e.currentTarget as HTMLElement).dataset.disabled === "true") return;
  e.currentTarget.style.borderColor = "#1ab189";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,177,137,0.12)";
}
function onFocusOut(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
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
          style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}
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
  toggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  toggle?: React.ReactNode;
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
        <h2
          className="font-semibold flex items-center gap-2.5"
          style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
          >
            <span style={{ color: "#1ab189", fontSize: "0.875rem" }}>
              {icon}
            </span>
          </div>
          {title}
        </h2>
        {toggle}
      </div>
      {children}
    </div>
  );
}

/* Simple CSS toggle — no sr-only needed, styled entirely with inline styles */
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: "2.75rem",
        height: "1.5rem",
        borderRadius: "9999px",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: checked ? "#1ab189" : "var(--color-neutral-300)",
        position: "relative",
        transition: "background-color 200ms",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "0.125rem",
          left: checked ? "calc(100% - 1.375rem)" : "0.125rem",
          width: "1.25rem",
          height: "1.25rem",
          borderRadius: "50%",
          backgroundColor: "white",
          transition: "left 200ms",
        }}
      />
    </button>
  );
}

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function AddClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [assignToProject, setAssignToProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  const [createPortalAccount, setCreatePortalAccount] = useState(true);
  const [clientPassword, setClientPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ── Projects query ── */
  const { data: projectsData, isLoading: loadingProjects } =
    useQuery<ProjectsResponse>({
      queryKey: ["projects", "without-client"],
      queryFn: async () => {
        try {
          return await api.get<ProjectsResponse>(
            "/api/v1/projects/?without_client=true",
          );
        } catch (err: unknown) {
          const e = err as { status?: number };
          if (e.status === 401) {
            router.push("/login");
            throw new Error("Session expired");
          }
          throw err;
        }
      },
      enabled: assignToProject,
      retry: (count, err: unknown) => {
        const e = err as { status?: number };
        return e.status !== 401 && count < 3;
      },
    });

  /* ── Create mutation ── */
  const createMutation = useMutation({
    mutationFn: (data: ClientCreateData) => clientService.createClient(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/provider/clients");
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Error: ${e.data?.detail ?? e.message ?? "Failed to create client"}`,
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !email || !phone) {
      alert("Please fill in all required fields");
      return;
    }
    if (createPortalAccount) {
      if (!clientPassword || clientPassword.length < 8) {
        alert("Password must be at least 8 characters");
        return;
      }
      if (clientPassword !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }
    }
    if (assignToProject && !selectedProjectId) {
      alert("Please select a project");
      return;
    }

    const payload: ClientCreateData = {
      full_name: clientName,
      email,
      phone,
      password: createPortalAccount ? clientPassword : undefined,
      city: city || undefined,
      state: state || undefined,
      address: address || undefined,
      postal_code: postalCode || undefined,
      country_code: "+977",
      project_id: assignToProject
        ? (selectedProjectId ?? undefined)
        : undefined,
    };

    createMutation.mutate(payload);
  };

  const isSubmitting = createMutation.isPending;

  const selectedProject = projectsData?.results.find(
    (p) => p.id === selectedProjectId,
  );

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            disabled={isSubmitting}
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
              cursor: isSubmitting ? "not-allowed" : "pointer",
              color: "var(--color-neutral-500)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting)
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
              Add New Client
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Create a new client profile and optionally assign to a project
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ padding: "1.75rem 2rem", maxWidth: "72rem", margin: "0 auto" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Basic information */}
            <SectionCard
              title="Basic Information"
              icon={<FontAwesomeIcon icon={faUser} />}
            >
              <div className="space-y-4">
                <Field label="Full Name" required>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., John Smith"
                    required
                    disabled={isSubmitting}
                    style={{ ...baseInput, opacity: isSubmitting ? 0.6 : 1 }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Email Address" required>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@email.com"
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
                  </Field>
                  <Field label="Phone Number" required>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+9779841234567"
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
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* Address */}
            <SectionCard
              title="Address Information"
              icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
            >
              <div className="space-y-4">
                <Field label="Street Address">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main Street"
                    disabled={isSubmitting}
                    style={{ ...baseInput, opacity: isSubmitting ? 0.6 : 1 }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "City", val: city, set: setCity, ph: "Pokhara" },
                    {
                      label: "State/Province",
                      val: state,
                      set: setState,
                      ph: "Gandaki",
                    },
                    {
                      label: "Postal Code",
                      val: postalCode,
                      set: setPostalCode,
                      ph: "33700",
                    },
                  ].map(({ label, val, set, ph }) => (
                    <Field key={label} label={label}>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        placeholder={ph}
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
              </div>
            </SectionCard>

            {/* Project assignment */}
            <SectionCard
              title="Project Assignment (Optional)"
              icon={<FontAwesomeIcon icon={faFolderOpen} />}
              toggle={
                <Toggle
                  checked={assignToProject}
                  onChange={(v) => {
                    setAssignToProject(v);
                    if (!v) setSelectedProjectId(null);
                  }}
                  disabled={isSubmitting}
                />
              }
            >
              {assignToProject ? (
                <div className="space-y-4">
                  {/* Info banner */}
                  <div
                    className="rounded-xl flex items-start gap-3 px-4 py-3"
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
                        marginTop: "0.1rem",
                        flexShrink: 0,
                      }}
                    />
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-neutral-700)",
                      }}
                    >
                      The client will be assigned to the selected project during
                      creation.
                    </p>
                  </div>

                  <Field label="Select Project" required>
                    {loadingProjects ? (
                      <div
                        className="flex items-center gap-2 px-4 py-3 rounded-xl"
                        style={{
                          border: "1px solid var(--color-neutral-200)",
                          backgroundColor: "var(--color-neutral-50)",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin"
                          style={{ color: "#1ab189", fontSize: "0.875rem" }}
                        />
                        <span
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--color-neutral-600)",
                          }}
                        >
                          Loading projects…
                        </span>
                      </div>
                    ) : (projectsData?.results ?? []).length > 0 ? (
                      <select
                        value={selectedProjectId ?? ""}
                        onChange={(e) =>
                          setSelectedProjectId(Number(e.target.value))
                        }
                        disabled={isSubmitting}
                        required={assignToProject}
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
                        <option value="">— Select a project —</option>
                        {(projectsData?.results ?? []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name ?? p.project_name} ({p.status})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        className="px-4 py-3 rounded-xl"
                        style={{
                          backgroundColor: "#fffbeb",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <p style={{ fontSize: "0.8rem", color: "#92400e" }}>
                          No projects available without clients. Create a
                          project first or assign this client later.
                        </p>
                      </div>
                    )}
                    <p
                      className="mt-1"
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      Only projects without assigned clients are shown
                    </p>
                  </Field>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-600)",
                    }}
                  >
                    Project assignment is disabled. You can assign the client to
                    a project later.
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Enable the toggle above to assign to a project now
                  </p>
                </div>
              )}
            </SectionCard>

            {/* Client portal */}
            <SectionCard
              title="Client Portal Account"
              icon={<FontAwesomeIcon icon={faKey} />}
              toggle={
                <Toggle
                  checked={createPortalAccount}
                  onChange={setCreatePortalAccount}
                  disabled={isSubmitting}
                />
              }
            >
              {createPortalAccount ? (
                <div className="space-y-4">
                  <div
                    className="rounded-xl flex items-start gap-3 px-4 py-3"
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
                        marginTop: "0.1rem",
                        flexShrink: 0,
                      }}
                    />
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-neutral-700)",
                      }}
                    >
                      Client portal credentials will be created. The password
                      can be changed later.
                    </p>
                  </div>

                  <Field
                    label="Portal Password"
                    required
                    hint="Minimum 8 characters"
                  >
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faLock}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={clientPassword}
                        onChange={(e) => setClientPassword(e.target.value)}
                        placeholder="Create a secure password (min 8 characters)"
                        disabled={isSubmitting}
                        style={{
                          ...baseInput,
                          paddingLeft: "2.25rem",
                          paddingRight: "3rem",
                          opacity: isSubmitting ? 0.6 : 1,
                        }}
                        onFocus={onFocusIn}
                        onBlur={onFocusOut}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        disabled={isSubmitting}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--color-neutral-400)",
                          padding: 0,
                        }}
                      >
                        <FontAwesomeIcon
                          icon={showPassword ? faEyeSlash : faEye}
                          style={{ fontSize: "0.875rem" }}
                        />
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirm Password" required>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faLock}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        disabled={isSubmitting}
                        style={{
                          ...baseInput,
                          paddingLeft: "2.25rem",
                          paddingRight: "3rem",
                          opacity: isSubmitting ? 0.6 : 1,
                        }}
                        onFocus={onFocusIn}
                        onBlur={onFocusOut}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        disabled={isSubmitting}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--color-neutral-400)",
                          padding: 0,
                        }}
                      >
                        <FontAwesomeIcon
                          icon={showConfirmPassword ? faEyeSlash : faEye}
                          style={{ fontSize: "0.875rem" }}
                        />
                      </button>
                    </div>
                    {confirmPassword && clientPassword !== confirmPassword && (
                      <p
                        className="mt-1"
                        style={{ fontSize: "0.78rem", color: "#ef4444" }}
                      >
                        Passwords do not match
                      </p>
                    )}
                  </Field>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-600)",
                    }}
                  >
                    Portal account creation is disabled. The client will not be
                    able to log in.
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Enable the toggle above to create portal credentials
                  </p>
                </div>
              )}
            </SectionCard>
          </div>

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
              <h3
                className="font-semibold mb-5"
                style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
              >
                Client Preview
              </h3>

              {/* Avatar */}
              <div className="flex justify-center mb-5">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center font-bold"
                  style={{
                    backgroundColor: "#1ab189",
                    color: "white",
                    fontSize: "1.5rem",
                  }}
                >
                  {clientName ? getInitials(clientName) : "?"}
                </div>
              </div>

              {/* Preview rows */}
              {[
                { label: "Name", value: clientName || "Not specified" },
                { label: "Email", value: email || "Not specified" },
                { label: "Phone", value: phone || "Not specified" },
                {
                  label: "Location",
                  value: city && state ? `${city}, ${state}` : "Not specified",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="text-center pb-4 mb-4"
                  style={{ borderBottom: "1px solid var(--color-neutral-100)" }}
                >
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
                    className="font-semibold truncate"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}

              {assignToProject && selectedProject && (
                <div
                  className="text-center pb-4 mb-4"
                  style={{ borderBottom: "1px solid var(--color-neutral-100)" }}
                >
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-500)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Assigned Project
                  </p>
                  <div className="flex items-center justify-center gap-1.5">
                    <FontAwesomeIcon
                      icon={faFolderOpen}
                      style={{ color: "#1ab189", fontSize: "0.75rem" }}
                    />
                    <span
                      className="font-semibold"
                      style={{ fontSize: "0.8rem", color: "#1ab189" }}
                    >
                      {selectedProject.name ?? selectedProject.project_name}
                    </span>
                  </div>
                </div>
              )}

              {createPortalAccount && (
                <div className="text-center mb-5">
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-500)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Portal Access
                  </p>
                  <div className="flex items-center justify-center gap-1.5">
                    <FontAwesomeIcon
                      icon={faKey}
                      style={{ color: "#1ab189", fontSize: "0.75rem" }}
                    />
                    <span
                      className="font-semibold"
                      style={{ fontSize: "0.8rem", color: "#1ab189" }}
                    >
                      Enabled
                    </span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-primary btn-md flex items-center justify-center gap-2"
                  style={{ opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Creating…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faPlus}
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Add Client
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="w-full btn btn-ghost btn-md"
                  style={{ opacity: isSubmitting ? 0.6 : 1 }}
                >
                  Cancel
                </button>
              </div>

              {/* Tip */}
              <div
                className="mt-5 rounded-xl flex items-start gap-2.5 px-4 py-3"
                style={{
                  backgroundColor: "rgba(26,177,137,0.06)",
                  border: "1px solid rgba(26,177,137,0.2)",
                }}
              >
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  style={{
                    color: "#1ab189",
                    fontSize: "0.8rem",
                    marginTop: "0.1rem",
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-neutral-700)",
                  }}
                >
                  <strong>Tip:</strong> All fields marked with * are required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
