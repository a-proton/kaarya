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
  faBriefcase,
  faIdCard,
  faCalendar,
  faDollarSign,
  faTimes,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* ─────────────────────────────────────────── */
/* Types                                        */
/* ─────────────────────────────────────────── */
interface EmployeeCreateData {
  full_name: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  employee_id?: string;
  status?: string;
  join_date?: string;
  salary?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  skills?: string[];
  notes?: string;
  is_active?: boolean;
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

const PREDEFINED_SKILLS = [
  "Electrical",
  "Plumbing",
  "HVAC",
  "Carpentry",
  "Project Management",
  "Supervision",
  "Design",
  "Landscaping",
];

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

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function AddTeamMemberPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [memberName, setMemberName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "on_leave">(
    "active",
  );
  const [employeeId, setEmployeeId] = useState("");
  const [joinDate, setJoinDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [salary, setSalary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [notes, setNotes] = useState("");

  /* ── Create mutation ── */
  const createMutation = useMutation({
    mutationFn: (data: EmployeeCreateData) =>
      api.post("/api/v1/employees/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      router.push("/provider/teams");
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Error: ${e.data?.detail ?? e.message ?? "Failed to create team member"}`,
      );
    },
  });

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) {
      alert("Please enter the member's full name");
      return;
    }

    createMutation.mutate({
      full_name: memberName,
      email: email || undefined,
      phone: phone || undefined,
      role: role || undefined,
      department: department || undefined,
      employee_id: employeeId || undefined,
      status,
      join_date: joinDate || undefined,
      salary: salary ? salary.replace(/[$,]/g, "") : undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zip_code: zipCode || undefined,
      emergency_contact: emergencyContact || undefined,
      emergency_phone: emergencyPhone || undefined,
      skills: skills.length > 0 ? skills : undefined,
      notes: notes || undefined,
      is_active: status === "active",
    });
  };

  const isSubmitting = createMutation.isPending;

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
              Add Team Member
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Create a new team member profile
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
            {/* Personal information */}
            <SectionCard
              title="Personal Information"
              icon={<FontAwesomeIcon icon={faUser} />}
            >
              <div className="space-y-4">
                <Field label="Full Name" required>
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="e.g., John Smith"
                    required
                    disabled={isSubmitting}
                    style={{ ...baseInput, opacity: isSubmitting ? 0.6 : 1 }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Email Address">
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
                        placeholder="john@company.com"
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
                  <Field label="Phone Number">
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
                        placeholder="+1 (555) 123-4567"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Emergency Contact Name">
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g., Jane Smith"
                      disabled={isSubmitting}
                      style={{ ...baseInput, opacity: isSubmitting ? 0.6 : 1 }}
                      onFocus={onFocusIn}
                      onBlur={onFocusOut}
                    />
                  </Field>
                  <Field label="Emergency Contact Phone">
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+1 (555) 987-6543"
                      disabled={isSubmitting}
                      style={{ ...baseInput, opacity: isSubmitting ? 0.6 : 1 }}
                      onFocus={onFocusIn}
                      onBlur={onFocusOut}
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* Employment details */}
            <SectionCard
              title="Employment Details"
              icon={<FontAwesomeIcon icon={faBriefcase} />}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Role">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
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
                      <option value="">Select a role</option>
                      {[
                        "Project Manager",
                        "Supervisor",
                        "Electrician",
                        "Plumber",
                        "HVAC Specialist",
                        "Carpenter",
                        "Landscaper",
                        "Interior Designer",
                      ].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Department">
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
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
                      <option value="">Select a department</option>
                      {[
                        "Operations",
                        "Technical",
                        "Design",
                        "Outdoor Services",
                      ].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Employee ID">
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faIdCard}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="e.g., EMP-001"
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
                  <Field label="Status" required>
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(
                          e.target.value as "active" | "inactive" | "on_leave",
                        )
                      }
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
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Join Date">
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faCalendar}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      <input
                        type="date"
                        value={joinDate}
                        onChange={(e) => setJoinDate(e.target.value)}
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
                  <Field label="Salary">
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faDollarSign}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      <input
                        type="text"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        placeholder="e.g., 65000"
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

                {/* Skills */}
                <Field label="Skills & Certifications">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PREDEFINED_SKILLS.map((skill) => {
                      const selected = skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() =>
                            selected ? removeSkill(skill) : addSkill(skill)
                          }
                          disabled={isSubmitting}
                          style={{
                            padding: "0.3rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            cursor: isSubmitting ? "not-allowed" : "pointer",
                            border: selected
                              ? (SKILL_COLORS[skill]?.border ??
                                "1px solid rgba(26,177,137,0.2)")
                              : "1px solid var(--color-neutral-200)",
                            backgroundColor: selected
                              ? (SKILL_COLORS[skill]?.bg ??
                                "rgba(26,177,137,0.1)")
                              : "transparent",
                            color: selected
                              ? (SKILL_COLORS[skill]?.color ?? "#0d9060")
                              : "var(--color-neutral-600)",
                            transition: "all 150ms",
                          }}
                        >
                          {selected ? "✓ " : "+ "}
                          {skill}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill(skillInput);
                        }
                      }}
                      placeholder="Add custom skill…"
                      disabled={isSubmitting}
                      style={{
                        ...baseInput,
                        flex: 1,
                        opacity: isSubmitting ? 0.6 : 1,
                      }}
                      onFocus={onFocusIn}
                      onBlur={onFocusOut}
                    />
                    <button
                      type="button"
                      onClick={() => addSkill(skillInput)}
                      disabled={isSubmitting}
                      style={{
                        padding: "0 1rem",
                        backgroundColor: "#1ab189",
                        color: "white",
                        border: "none",
                        borderRadius: "0.625rem",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        fontSize: "0.875rem",
                        opacity: isSubmitting ? 0.6 : 1,
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {skills.map((skill) => {
                        const s = SKILL_COLORS[skill] ?? DEFAULT_SKILL;
                        return (
                          <span
                            key={skill}
                            style={{
                              padding: "0.25rem 0.625rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              backgroundColor: s.bg,
                              color: s.color,
                              border: s.border,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.375rem",
                            }}
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                color: "inherit",
                                opacity: 0.6,
                                lineHeight: 1,
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faTimes}
                                style={{ fontSize: "0.6rem" }}
                              />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </Field>
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
                    { label: "City", val: city, set: setCity, ph: "New York" },
                    { label: "State", val: state, set: setState, ph: "NY" },
                    {
                      label: "Zip Code",
                      val: zipCode,
                      set: setZipCode,
                      ph: "10001",
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

            {/* Notes */}
            <SectionCard
              title="Additional Notes"
              icon={
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  style={{ fontSize: "0.875rem" }}
                />
              }
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this team member…"
                rows={4}
                disabled={isSubmitting}
                style={{
                  ...baseInput,
                  resize: "none",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
                onFocus={onFocusIn}
                onBlur={onFocusOut}
              />
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
                Member Preview
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
                  {memberName ? getInitials(memberName) : "?"}
                </div>
              </div>

              {/* Preview rows */}
              {[
                { label: "Name", value: memberName || "Not specified" },
                { label: "Role", value: role || "Not specified" },
                { label: "Department", value: department || "Not specified" },
                { label: "Email", value: email || "Not specified" },
                { label: "Phone", value: phone || "Not specified" },
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

              {/* Status badge */}
              <div
                className="text-center pb-4 mb-4"
                style={{ borderBottom: "1px solid var(--color-neutral-100)" }}
              >
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--color-neutral-500)",
                    marginBottom: "0.4rem",
                  }}
                >
                  Status
                </p>
                <span
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    ...STATUS_STYLES[status],
                  }}
                >
                  {status === "on_leave"
                    ? "On Leave"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>

              {/* Skills preview */}
              {skills.length > 0 && (
                <div className="text-center mb-5">
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-500)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {skills.slice(0, 3).map((skill) => {
                      const s = SKILL_COLORS[skill] ?? DEFAULT_SKILL;
                      return (
                        <span
                          key={skill}
                          style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "9999px",
                            fontSize: "0.65rem",
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
                    {skills.length > 3 && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        +{skills.length - 3} more
                      </span>
                    )}
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
                      Adding…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faPlus}
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Add Team Member
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
                  <strong>Tip:</strong> Add relevant skills to help with project
                  assignments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
