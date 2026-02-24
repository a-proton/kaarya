"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faTimes,
  faCheck,
  faSpinner,
  faBoxOpen,
  faDollarSign,
  faCalendar,
  faStore,
  faBriefcase,
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
  client: { full_name: string } | null;
}

interface FormState {
  project_id: string;
  item_name: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  supplier_name: string;
  purchase_date: string;
  receipt_url: string;
}

interface InventoryPayload {
  item_name: string;
  quantity: number;
  description?: string;
  unit?: string;
  unit_price?: number;
  supplier_name?: string;
  purchase_date?: string;
  receipt_url?: string;
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
export default function CreateInventoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormState>({
    project_id: "",
    item_name: "",
    description: "",
    quantity: "",
    unit: "",
    unit_price: "",
    supplier_name: "",
    purchase_date: "",
    receipt_url: "",
  });
  const [showToast, setShowToast] = useState(false);

  const set = (key: keyof FormState, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  /* ── Projects query ── */
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await api.get<{ results: Project[] }>("/api/v1/projects/");
      return Array.isArray(res.results) ? res.results : [];
    },
  });

  const projects = Array.isArray(projectsData) ? projectsData : [];

  /* ── Create mutation ── */
  const createMutation = useMutation({
    mutationFn: (payload: InventoryPayload) =>
      api.post(
        `/api/v1/projects/${formData.project_id}/inventory/add/`,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-inventory"] });
      setShowToast(true);
      setTimeout(() => router.push("/provider/inventory"), 1500);
    },
    onError: (err: unknown) => {
      const e = err as { data?: { error?: string }; message?: string };
      alert(
        `Failed to add inventory: ${e.data?.error ?? e.message ?? "Unknown error"}`,
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id) {
      alert("Please select a project");
      return;
    }
    if (!formData.item_name || !formData.quantity) {
      alert("Item name and quantity are required");
      return;
    }

    const payload: InventoryPayload = {
      item_name: formData.item_name,
      quantity: parseFloat(formData.quantity),
      ...(formData.description && { description: formData.description }),
      ...(formData.unit && { unit: formData.unit }),
      ...(formData.unit_price && {
        unit_price: parseFloat(formData.unit_price),
      }),
      ...(formData.supplier_name && { supplier_name: formData.supplier_name }),
      ...(formData.purchase_date && { purchase_date: formData.purchase_date }),
      ...(formData.receipt_url && { receipt_url: formData.receipt_url }),
    };

    createMutation.mutate(payload);
  };

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
      {/* Toast — dark pill, #1ab189 checkmark, matches all other pages */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50" style={{ minWidth: "17rem" }}>
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
            <div className="flex-1">
              <p
                className="font-semibold"
                style={{ fontSize: "0.875rem", color: "white" }}
              >
                Inventory Added!
              </p>
              <p
                style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}
              >
                Redirecting to inventory list…
              </p>
            </div>
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
              className="font-bold flex items-center gap-2.5"
              style={{
                fontSize: "1.375rem",
                color: "var(--color-neutral-900)",
                lineHeight: 1.2,
              }}
            >
              <FontAwesomeIcon
                icon={faBoxOpen}
                style={{ color: "#1ab189", fontSize: "1.125rem" }}
              />
              Add Inventory Item
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Record materials used in your projects
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ padding: "1.75rem 2rem", maxWidth: "52rem", margin: "0 auto" }}
        className="space-y-5"
      >
        {/* Project selection */}
        <SectionCard
          title="Select Project"
          icon={<FontAwesomeIcon icon={faBriefcase} />}
        >
          <Field label="Project" required>
            <select
              value={formData.project_id}
              onChange={(e) => set("project_id", e.target.value)}
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
              <option value="">Choose a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                  {p.client ? ` – ${p.client.full_name}` : ""}
                </option>
              ))}
            </select>
          </Field>
        </SectionCard>

        {/* Item details */}
        <SectionCard
          title="Item Details"
          icon={<FontAwesomeIcon icon={faBoxOpen} />}
        >
          <div className="space-y-4">
            <Field label="Item Name" required>
              <input
                type="text"
                value={formData.item_name}
                onChange={(e) => set("item_name", e.target.value)}
                placeholder="e.g., Cement bags, PVC pipes"
                required
                style={baseInput}
                onFocus={onFocusIn}
                onBlur={onFocusOut}
              />
            </Field>

            <Field label="Description">
              <textarea
                value={formData.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Optional details about the item"
                rows={3}
                style={{ ...baseInput, resize: "none" }}
                onFocus={onFocusIn}
                onBlur={onFocusOut}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Quantity" required>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  required
                  style={baseInput}
                  onFocus={onFocusIn}
                  onBlur={onFocusOut}
                />
              </Field>
              <Field label="Unit (e.g., kg, pcs, liters)">
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => set("unit", e.target.value)}
                  placeholder="kg, bags, meters…"
                  style={baseInput}
                  onFocus={onFocusIn}
                  onBlur={onFocusOut}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Unit Price ($)">
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
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => set("unit_price", e.target.value)}
                    placeholder="0.00"
                    style={{ ...baseInput, paddingLeft: "2.25rem" }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </div>
              </Field>
              <Field label="Supplier Name">
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faStore}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      color: "var(--color-neutral-400)",
                      fontSize: "0.8rem",
                    }}
                  />
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => set("supplier_name", e.target.value)}
                    placeholder="e.g., ABC Hardware"
                    style={{ ...baseInput, paddingLeft: "2.25rem" }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Purchase Date">
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "#1ab189", fontSize: "0.8rem" }}
                  />
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => set("purchase_date", e.target.value)}
                    style={{ ...baseInput, paddingLeft: "2.25rem" }}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </div>
              </Field>
              <Field label="Receipt URL (optional)">
                <input
                  type="url"
                  value={formData.receipt_url}
                  onChange={(e) => set("receipt_url", e.target.value)}
                  placeholder="https://example.com/receipt.pdf"
                  style={baseInput}
                  onFocus={onFocusIn}
                  onBlur={onFocusOut}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/provider/inventory")}
            className="btn btn-ghost btn-md flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: "0.8rem" }} />
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn btn-primary btn-md flex items-center gap-2"
            style={{
              opacity: createMutation.isPending ? 0.6 : 1,
              minWidth: "9rem",
            }}
          >
            {createMutation.isPending ? (
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
                Add Item
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
