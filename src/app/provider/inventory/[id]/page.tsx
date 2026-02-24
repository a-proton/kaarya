"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBoxOpen,
  faDollarSign,
  faCalendar,
  faStore,
  faBriefcase,
  faUser,
  faPenToSquare,
  faTrash,
  faTimes,
  faSpinner,
  faCheck,
  faExclamationTriangle,
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
  created_at: string;
  updated_at: string;
}

interface Project {
  id: number;
  project_name: string;
  client: { full_name: string } | null;
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

const formatDate = (dateString: string | null) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/* ─────────────────────────────────────────── */
/* Detail row                                  */
/* ─────────────────────────────────────────── */
function DetailRow({
  icon,
  label,
  children,
  border = true,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      style={{
        paddingBottom: border ? "1.25rem" : 0,
        marginBottom: border ? "1.25rem" : 0,
        borderBottom: border ? "1px solid var(--color-neutral-100)" : "none",
      }}
    >
      <p
        className="font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
        style={{ fontSize: "0.65rem", color: "var(--color-neutral-400)" }}
      >
        {icon && (
          <span style={{ color: "#1ab189", fontSize: "0.7rem" }}>{icon}</span>
        )}
        {label}
      </p>
      <div
        style={{
          fontSize: "0.9375rem",
          color: "var(--color-neutral-900)",
          fontWeight: 500,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function ViewInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const itemId = Number(params.id);
  const projectId = Number(searchParams.get("projectId"));

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!projectId || isNaN(projectId)) {
      alert("Invalid or missing projectId. Redirecting to inventory list.");
      router.push("/provider/inventory");
    }
  }, [projectId, router]);

  /* ── Queries ── */
  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.get<Project>(`/api/v1/projects/${projectId}/`),
    enabled: !!projectId,
  });

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ["project-inventory", projectId],
    queryFn: async () => {
      const res = await api.get<{ results: InventoryItem[] }>(
        `/api/v1/projects/${projectId}/inventory/`,
      );
      return res.results ?? [];
    },
    enabled: !!projectId,
  });

  const currentItem = inventoryData?.find((item) => item.id === itemId);

  /* ── Delete mutation ── */
  const deleteMutation = useMutation({
    mutationFn: () =>
      api.delete(`/api/v1/projects/${projectId}/inventory/${itemId}/delete/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-inventory"] });
      setShowDeleteModal(false);
      notify("Inventory item deleted successfully!");
      setTimeout(() => router.push("/provider/inventory"), 1500);
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
            Loading inventory item…
          </p>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!currentItem) {
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
            Item Not Found
          </h3>
          <p
            className="mb-5"
            style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}
          >
            The requested inventory item could not be found.
          </p>
          <button
            onClick={() => router.push("/provider/inventory")}
            className="btn btn-primary btn-md"
          >
            Go to Inventory List
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
              Inventory Item Details
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              {projectData?.project_name ?? "Project"} · {currentItem.item_name}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{ padding: "1.75rem 2rem", maxWidth: "52rem", margin: "0 auto" }}
      >
        {/* Project info banner — teal tint */}
        {projectData && (
          <div
            className="flex items-center gap-4 rounded-2xl mb-5"
            style={{
              padding: "1rem 1.25rem",
              backgroundColor: "rgba(26,177,137,0.06)",
              border: "1px solid rgba(26,177,137,0.2)",
            }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0"
              style={{
                backgroundColor: "#1ab189",
                color: "white",
                fontSize: "1rem",
              }}
            >
              {projectData.project_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faBriefcase}
                  style={{ color: "#1ab189", fontSize: "0.75rem" }}
                />
                <h3
                  className="font-semibold"
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {projectData.project_name}
                </h3>
              </div>
              {projectData.client && (
                <p
                  className="flex items-center gap-1.5 mt-0.5"
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-neutral-600)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faUser}
                    style={{ fontSize: "0.65rem" }}
                  />
                  Client: {projectData.client.full_name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Main card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--color-neutral-0)",
            border: "1px solid var(--color-neutral-200)",
          }}
        >
          {/* Card header — flat neutral-50 background */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--color-neutral-200)",
              backgroundColor: "var(--color-neutral-50)",
            }}
          >
            <div>
              <h2
                className="font-bold"
                style={{
                  fontSize: "1.1875rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                {currentItem.item_name}
              </h2>
              {currentItem.description && (
                <p
                  className="mt-0.5"
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-500)",
                  }}
                >
                  {currentItem.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() =>
                  router.push(
                    `/provider/inventory/${itemId}/edit?projectId=${projectId}`,
                  )
                }
                className="btn btn-secondary btn-md flex items-center gap-2"
              >
                <FontAwesomeIcon
                  icon={faPenToSquare}
                  style={{ fontSize: "0.8rem" }}
                />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={deleteMutation.isPending}
                className="btn btn-md flex items-center gap-2"
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#dc2626";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#ef4444";
                }}
              >
                <FontAwesomeIcon
                  icon={faTrash}
                  style={{ fontSize: "0.8rem" }}
                />
                Delete
              </button>
            </div>
          </div>

          {/* Card body */}
          <div style={{ padding: "1.5rem" }}>
            <DetailRow label="Quantity & Unit">
              <span className="font-bold" style={{ fontSize: "1.125rem" }}>
                {currentItem.quantity}
                {currentItem.unit && (
                  <span
                    style={{
                      marginLeft: "0.375rem",
                      fontSize: "0.9rem",
                      color: "var(--color-neutral-500)",
                      fontWeight: 400,
                    }}
                  >
                    ({currentItem.unit})
                  </span>
                )}
              </span>
            </DetailRow>

            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              style={{
                paddingBottom: "1.25rem",
                marginBottom: "1.25rem",
                borderBottom: "1px solid var(--color-neutral-100)",
              }}
            >
              <DetailRow
                icon={<FontAwesomeIcon icon={faDollarSign} />}
                label="Unit Price"
                border={false}
              >
                <span className="font-semibold">
                  {formatCurrency(currentItem.unit_price)}
                </span>
              </DetailRow>
              <DetailRow
                icon={<FontAwesomeIcon icon={faDollarSign} />}
                label="Total Price"
                border={false}
              >
                <span
                  className="font-bold"
                  style={{ fontSize: "1.25rem", color: "#1ab189" }}
                >
                  {formatCurrency(currentItem.total_price)}
                </span>
              </DetailRow>
            </div>

            <DetailRow
              icon={<FontAwesomeIcon icon={faStore} />}
              label="Supplier"
            >
              {currentItem.supplier_name || (
                <span
                  style={{
                    color: "var(--color-neutral-400)",
                    fontStyle: "italic",
                    fontWeight: 400,
                  }}
                >
                  Not specified
                </span>
              )}
            </DetailRow>

            <DetailRow
              icon={<FontAwesomeIcon icon={faCalendar} />}
              label="Purchase Date"
              border={!!currentItem.receipt_url}
            >
              {formatDate(currentItem.purchase_date)}
            </DetailRow>

            {currentItem.receipt_url && (
              <DetailRow label="Receipt" border={false}>
                <a
                  href={currentItem.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold"
                  style={{
                    color: "#1ab189",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLAnchorElement
                    ).style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLAnchorElement
                    ).style.textDecoration = "none";
                  }}
                >
                  View Receipt ↗
                </a>
              </DetailRow>
            )}

            {/* Timestamps */}
            <div
              style={{
                paddingTop: "1rem",
                marginTop: "1rem",
                borderTop: "1px solid var(--color-neutral-100)",
              }}
            >
              {[
                {
                  label: "Created",
                  value: new Date(currentItem.created_at).toLocaleString(
                    "en-US",
                  ),
                },
                {
                  label: "Last Updated",
                  value: new Date(currentItem.updated_at).toLocaleString(
                    "en-US",
                  ),
                },
              ].map(({ label, value }) => (
                <p
                  key={label}
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-neutral-400)",
                    marginBottom: "0.25rem",
                  }}
                >
                  {label}:{" "}
                  <span style={{ color: "var(--color-neutral-500)" }}>
                    {value}
                  </span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal — matches pattern from ViewProjectPage */}
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
                Delete Item?
              </h3>
              <p
                className="text-center mb-6"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                Are you sure you want to delete &quot;{currentItem.item_name}
                &quot;? This action cannot be undone.
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
