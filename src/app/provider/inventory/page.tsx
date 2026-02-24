"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faPenToSquare,
  faTimes,
  faSpinner,
  faBoxOpen,
  faCheck,
  faBriefcase,
  faSearch,
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

interface InventoryItem {
  id: number;
  project_id: number;
  project_name: string;
  client_name: string | null;
  item_name: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string | null;
  total_price: string | null;
  supplier_name: string;
  purchase_date: string | null;
  created_at: string;
}

/* ─────────────────────────────────────────── */
/* Shared input style                           */
/* ─────────────────────────────────────────── */
const baseInput: React.CSSProperties = {
  padding: "0.5rem 1rem",
  fontFamily: "var(--font-sans)",
  fontSize: "0.8125rem",
  color: "var(--color-neutral-900)",
  backgroundColor: "var(--color-neutral-0)",
  border: "1px solid var(--color-neutral-200)",
  borderRadius: "0.625rem",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
  appearance: "none" as const,
};

function onFocusIn(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
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
const formatCurrency = (value: string | null) => {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parseFloat(value));
};

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function InventoryListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  /* ── Queries ── */
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await api.get<{ results: Project[] }>("/api/v1/projects/");
      return Array.isArray(res.results) ? res.results : [];
    },
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ["all-inventory"],
    queryFn: async () => {
      const projects = Array.isArray(projectsData) ? projectsData : [];
      if (projects.length === 0) return [];
      const allItems: InventoryItem[] = [];
      for (const project of projects) {
        try {
          const res = await api.get<{
            results: Omit<InventoryItem, "project_name" | "client_name">[];
          }>(`/api/v1/projects/${project.id}/inventory/`);
          const enriched = (res.results || []).map((item) => ({
            ...item,
            project_id: project.id,
            project_name: project.project_name,
            client_name: project.client?.full_name ?? null,
          }));
          allItems.push(...enriched);
        } catch {
          // silently skip failed project inventory fetches
        }
      }
      return allItems;
    },
    enabled: !!projectsData,
  });

  const projects = Array.isArray(projectsData) ? projectsData : [];
  const allInventory = Array.isArray(inventoryData) ? inventoryData : [];

  const filtered = allInventory.filter((item) => {
    if (filterProject !== "all" && item.project_id.toString() !== filterProject)
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.item_name.toLowerCase().includes(q) ||
        item.supplier_name.toLowerCase().includes(q) ||
        item.project_name.toLowerCase().includes(q) ||
        (item.client_name?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  /* ── Delete mutation ── */
  const deleteMutation = useMutation({
    mutationFn: ({
      projectId,
      itemId,
    }: {
      projectId: number;
      itemId: number;
    }) =>
      api.delete(`/api/v1/projects/${projectId}/inventory/${itemId}/delete/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-inventory"] });
      notify("Inventory item deleted successfully!");
    },
    onError: (err: unknown) => {
      const e = err as { data?: { error?: string }; message?: string };
      alert(
        `Failed to delete: ${e.data?.error ?? e.message ?? "Unknown error"}`,
      );
    },
  });

  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDelete = (projectId: number, itemId: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`))
      deleteMutation.mutate({ projectId, itemId });
  };

  /* ── Loading ── */
  if (projectsLoading || inventoryLoading) {
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
            Loading inventory…
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
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: "1.375rem",
                color: "var(--color-neutral-900)",
                lineHeight: 1.2,
              }}
            >
              Inventory
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Manage materials across all your projects
            </p>
          </div>
          <button
            onClick={() => router.push("/provider/inventory/create")}
            className="btn btn-primary btn-md flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: "0.8rem" }} />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "0.875rem 2rem",
        }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--color-neutral-400)", fontSize: "0.75rem" }}
            />
            <input
              type="text"
              placeholder="Search items, suppliers, projects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...baseInput, paddingLeft: "2rem", width: "17rem" }}
              onFocus={onFocusIn}
              onBlur={onFocusOut}
            />
          </div>

          {/* Project filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{
              ...baseInput,
              width: "auto",
              cursor: "pointer",
              paddingRight: "2.25rem",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
            }}
            onFocus={onFocusIn}
            onBlur={onFocusOut}
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name}
              </option>
            ))}
          </select>

          {(searchQuery || filterProject !== "all") && (
            <span
              style={{ fontSize: "0.78rem", color: "var(--color-neutral-500)" }}
            >
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "1.75rem 2rem" }}>
        {filtered.length === 0 ? (
          /* Empty state */
          <div
            className="rounded-2xl p-14 text-center"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--color-neutral-100)" }}
            >
              <FontAwesomeIcon
                icon={faBoxOpen}
                style={{
                  fontSize: "1.5rem",
                  color: "var(--color-neutral-400)",
                }}
              />
            </div>
            <h3
              className="font-semibold mb-2"
              style={{
                fontSize: "1.0625rem",
                color: "var(--color-neutral-900)",
              }}
            >
              No Inventory Items
            </h3>
            <p
              className="mb-5"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-500)",
              }}
            >
              {searchQuery || filterProject !== "all"
                ? "Try adjusting your filters"
                : "Add your first inventory item to get started"}
            </p>
            {!searchQuery && filterProject === "all" && (
              <button
                onClick={() => router.push("/provider/inventory/create")}
                className="btn btn-primary btn-md flex items-center gap-2 mx-auto"
              >
                <FontAwesomeIcon icon={faPlus} style={{ fontSize: "0.8rem" }} />
                Add Inventory Item
              </button>
            )}
          </div>
        ) : (
          /* Table */
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
            }}
          >
            {/* Header row */}
            <div
              className="grid grid-cols-12 gap-4 items-center"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "var(--color-neutral-50)",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              {[
                { label: "Item", cols: "col-span-3" },
                { label: "Project", cols: "col-span-2" },
                { label: "Quantity", cols: "col-span-2" },
                { label: "Unit Price", cols: "col-span-2" },
                { label: "Total", cols: "col-span-2" },
                { label: "Actions", cols: "col-span-1 text-center" },
              ].map(({ label, cols }) => (
                <div
                  key={label}
                  className={`${cols} font-bold tracking-wider uppercase`}
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--color-neutral-400)",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 items-center"
                style={{
                  padding: "1rem 1.5rem",
                  borderTop:
                    idx === 0 ? "none" : "1px solid var(--color-neutral-100)",
                  transition: "background-color 120ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    "var(--color-neutral-50)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    "transparent";
                }}
              >
                {/* Item details */}
                <div className="col-span-3">
                  <h4
                    className="font-semibold"
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {item.item_name}
                  </h4>
                  {item.description && (
                    <p
                      className="mt-0.5 truncate"
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                  {item.supplier_name && (
                    <p
                      className="mt-0.5"
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-neutral-400)",
                      }}
                    >
                      Supplier: {item.supplier_name}
                    </p>
                  )}
                </div>

                {/* Project */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5">
                    <FontAwesomeIcon
                      icon={faBriefcase}
                      style={{
                        fontSize: "0.7rem",
                        color: "#1ab189",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="truncate"
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-neutral-700)",
                      }}
                    >
                      {item.project_name}
                    </span>
                  </div>
                  {item.client_name && (
                    <p
                      className="mt-0.5"
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-neutral-400)",
                      }}
                    >
                      Client: {item.client_name}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="col-span-2">
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-900)",
                      fontFamily: "monospace",
                    }}
                  >
                    {item.quantity}
                    {item.unit ? ` ${item.unit}` : ""}
                  </span>
                </div>

                {/* Unit price */}
                <div className="col-span-2">
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-700)",
                    }}
                  >
                    {formatCurrency(item.unit_price)}
                  </span>
                </div>

                {/* Total */}
                <div className="col-span-2">
                  <span
                    className="font-semibold"
                    style={{ fontSize: "0.9rem", color: "#1ab189" }}
                  >
                    {formatCurrency(item.total_price)}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-center gap-1.5">
                  <button
                    onClick={() =>
                      router.push(
                        `/provider/inventory/${item.id}/edit?projectId=${item.project_id}`,
                      )
                    }
                    title="Edit"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#1ab189",
                      padding: "0.375rem",
                      borderRadius: "0.5rem",
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "rgba(26,177,137,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "transparent";
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faPenToSquare}
                      style={{ fontSize: "0.8rem" }}
                    />
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(item.project_id, item.id, item.item_name)
                    }
                    disabled={deleteMutation.isPending}
                    title="Delete"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ef4444",
                      padding: "0.375rem",
                      borderRadius: "0.5rem",
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
                      style={{ fontSize: "0.8rem" }}
                    />
                  </button>
                </div>
              </div>
            ))}

            {/* Table footer summary */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: "0.875rem 1.5rem",
                backgroundColor: "var(--color-neutral-50)",
                borderTop: "1px solid var(--color-neutral-200)",
              }}
            >
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                {filtered.length} item{filtered.length !== 1 ? "s" : ""}
              </span>
              {(() => {
                const total = filtered.reduce(
                  (sum, i) =>
                    sum + (i.total_price ? parseFloat(i.total_price) : 0),
                  0,
                );
                return total > 0 ? (
                  <span
                    className="font-semibold"
                    style={{ fontSize: "0.875rem", color: "#1ab189" }}
                  >
                    Total:{" "}
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(total)}
                  </span>
                ) : null;
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
