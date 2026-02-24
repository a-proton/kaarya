"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSave,
  faTimes,
  faSpinner,
  faBoxOpen,
  faDollarSign,
  faCalendar,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

/* ─────────────────────────────────────────── */
/* Types                                        */
/* ─────────────────────────────────────────── */
interface InventoryItem {
  id: number;
  item_name: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string | null;
  total_price: string | null;
  supplier_name: string;
  purchase_date: string | null;
  receipt_url: string | null;
}

interface FormState {
  item_name: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  supplier_name: string;
  purchase_date: string;
  receipt_url: string;
}

interface UpdatePayload {
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
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
) {
  e.currentTarget.style.borderColor = "#1ab189";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,177,137,0.12)";
}
function onFocusOut(
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
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

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const itemId = Number(params.id);
  const projectId = Number(searchParams.get("projectId"));

  const [formData, setFormData] = useState<FormState>({
    item_name: "",
    description: "",
    quantity: "",
    unit: "",
    unit_price: "",
    supplier_name: "",
    purchase_date: "",
    receipt_url: "",
  });
  const [initialLoaded, setInitialLoaded] = useState(false);

  const set = (key: keyof FormState, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  /* ── Query ── */
  const { data: itemData, isLoading } = useQuery({
    queryKey: ["inventory-item", projectId, itemId],
    queryFn: async () => {
      const res = await api.get<{ results: InventoryItem[] }>(
        `/api/v1/projects/${projectId}/inventory/`,
      );
      const item = (res.results ?? []).find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");
      return item;
    },
    enabled: !!projectId && !!itemId,
  });

  useEffect(() => {
    if (itemData && !initialLoaded) {
      setFormData({
        item_name: itemData.item_name,
        description: itemData.description ?? "",
        quantity: itemData.quantity,
        unit: itemData.unit ?? "",
        unit_price: itemData.unit_price ?? "",
        supplier_name: itemData.supplier_name ?? "",
        purchase_date: itemData.purchase_date ?? "",
        receipt_url: itemData.receipt_url ?? "",
      });
      setInitialLoaded(true);
    }
  }, [itemData, initialLoaded]);

  /* ── Mutation ── */
  const updateMutation = useMutation({
    mutationFn: (payload: UpdatePayload) =>
      api.patch(`/api/v1/projects/${projectId}/inventory/${itemId}/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-inventory"] });
      router.push("/provider/inventory");
    },
    onError: (err: unknown) => {
      const e = err as { data?: { error?: string }; message?: string };
      alert(
        `Failed to update: ${e.data?.error ?? e.message ?? "Unknown error"}`,
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpdatePayload = {
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
    updateMutation.mutate(payload);
  };

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
            Loading item…
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
            onClick={() => router.push("/provider/inventory")}
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
              Edit Inventory Item
            </h1>
            {itemData && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-neutral-500)",
                  marginTop: "0.125rem",
                }}
              >
                Editing{" "}
                <span
                  style={{ color: "var(--color-neutral-700)", fontWeight: 600 }}
                >
                  {itemData.item_name}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ padding: "1.75rem 2rem", maxWidth: "52rem", margin: "0 auto" }}
      >
        <div
          className="rounded-2xl"
          style={{
            backgroundColor: "var(--color-neutral-0)",
            border: "1px solid var(--color-neutral-200)",
            padding: "1.5rem",
          }}
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
            >
              <FontAwesomeIcon
                icon={faBoxOpen}
                style={{ color: "#1ab189", fontSize: "0.875rem" }}
              />
            </div>
            <h2
              className="font-semibold"
              style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
            >
              Item Details
            </h2>
          </div>

          <div className="space-y-4">
            <Field label="Item Name" required>
              <input
                type="text"
                value={formData.item_name}
                onChange={(e) => set("item_name", e.target.value)}
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
              <Field label="Unit">
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
              <Field label="Receipt URL">
                <input
                  type="url"
                  value={formData.receipt_url}
                  onChange={(e) => set("receipt_url", e.target.value)}
                  style={baseInput}
                  onFocus={onFocusIn}
                  onBlur={onFocusOut}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-5">
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
            disabled={updateMutation.isPending}
            className="btn btn-primary btn-md flex items-center gap-2"
            style={{
              opacity: updateMutation.isPending ? 0.6 : 1,
              minWidth: "10rem",
            }}
          >
            {updateMutation.isPending ? (
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
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
