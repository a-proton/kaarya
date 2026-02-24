"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPenToSquare,
  faTrash,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faFolder,
  faDollarSign,
  faCalendar,
  faExclamationTriangle,
  faSpinner,
  faCheckCircle,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService } from "@/lib/clientService";

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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

/* ─────────────────────────────────────────── */
/* Status badge                                */
/* ─────────────────────────────────────────── */
const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  pending: { bg: "#fefce8", color: "#a16207", label: "Pending" },
  not_started: {
    bg: "var(--color-neutral-100)",
    color: "var(--color-neutral-600)",
    label: "Not Started",
  },
  in_progress: { bg: "#eff6ff", color: "#1d4ed8", label: "In Progress" },
  completed: { bg: "#f0fdf4", color: "#15803d", label: "Completed" },
  on_hold: { bg: "#fff7ed", color: "#c2410c", label: "On Hold" },
  cancelled: { bg: "#fef2f2", color: "#b91c1c", label: "Cancelled" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? {
    bg: "var(--color-neutral-100)",
    color: "var(--color-neutral-600)",
    label: status,
  };
  return (
    <span
      style={{
        padding: "0.2rem 0.6rem",
        borderRadius: "9999px",
        fontSize: "0.72rem",
        fontWeight: 600,
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

/* ─────────────────────────────────────────── */
/* Info row                                    */
/* ─────────────────────────────────────────── */
function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
      >
        <span style={{ color: "#1ab189", fontSize: "0.8rem" }}>{icon}</span>
      </div>
      <div>
        <p
          className="font-semibold uppercase tracking-wider"
          style={{
            fontSize: "0.62rem",
            color: "var(--color-neutral-400)",
            marginBottom: "0.25rem",
          }}
        >
          {label}
        </p>
        <div
          style={{
            fontSize: "0.9rem",
            color: "var(--color-neutral-900)",
            fontWeight: 500,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function ViewClientPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const clientId = Number(params.id);

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
    data: client,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => clientService.getClientDetails(clientId),
    enabled: !!clientId,
  });

  /* ── Delete mutation ── */
  const deleteMutation = useMutation({
    mutationFn: () => clientService.deleteClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setShowDeleteModal(false);
      notify("Client deleted successfully");
      setTimeout(() => router.push("/provider/clients"), 1500);
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Error: ${e.data?.detail ?? e.message ?? "Failed to delete client"}`,
      );
      setShowDeleteModal(false);
    },
  });

  /* ── Loading / error ── */
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
            Loading client details…
          </p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <p className="mb-4" style={{ color: "#ef4444" }}>
            Client not found
          </p>
          <button
            onClick={() => router.push("/provider/clients")}
            className="btn btn-primary btn-md"
          >
            Back to Clients
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
                {client.full_name}
              </h1>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-neutral-500)",
                  marginTop: "0.125rem",
                }}
              >
                Client Details &amp; History
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push(`/provider/clients/${clientId}/edit`)}
              className="btn btn-secondary btn-md flex items-center gap-2"
            >
              <FontAwesomeIcon
                icon={faPenToSquare}
                style={{ fontSize: "0.8rem" }}
              />
              Edit Client
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
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
              <div className="flex justify-center mb-5">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center font-bold"
                  style={{
                    backgroundColor: "#1ab189",
                    color: "white",
                    fontSize: "2rem",
                  }}
                >
                  {getInitials(client.full_name)}
                </div>
              </div>

              {/* Name / email */}
              <div className="text-center mb-5">
                <h2
                  className="font-bold mb-1"
                  style={{
                    fontSize: "1.125rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {client.full_name}
                </h2>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-neutral-500)",
                  }}
                >
                  {client.email}
                </p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div
                  className="rounded-xl text-center p-4"
                  style={{
                    backgroundColor: "rgba(26,177,137,0.06)",
                    border: "1px solid rgba(26,177,137,0.2)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFolder}
                    style={{
                      color: "#1ab189",
                      fontSize: "1.25rem",
                      marginBottom: "0.5rem",
                    }}
                  />
                  <p
                    className="font-bold"
                    style={{
                      fontSize: "1.25rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {client.stats.total_projects}
                  </p>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Projects
                  </p>
                </div>
                <div
                  className="rounded-xl text-center p-4"
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    style={{
                      color: "#15803d",
                      fontSize: "1.25rem",
                      marginBottom: "0.5rem",
                    }}
                  />
                  <p
                    className="font-bold"
                    style={{
                      fontSize: "1rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {formatCurrency(client.stats.total_spent)}
                  </p>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Spent
                  </p>
                </div>
              </div>

              {/* Status */}
              <div
                className="rounded-xl text-center py-4"
                style={{ backgroundColor: "var(--color-neutral-50)" }}
              >
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--color-neutral-500)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Status
                </p>
                <span
                  className="inline-flex items-center font-semibold"
                  style={{
                    padding: "0.375rem 0.875rem",
                    borderRadius: "9999px",
                    fontSize: "0.8rem",
                    backgroundColor: client.is_active ? "#f0fdf4" : "#fef2f2",
                    color: client.is_active ? "#15803d" : "#b91c1c",
                  }}
                >
                  {client.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Contact information */}
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
                    icon={faUser}
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
                  Contact Information
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InfoRow
                  icon={<FontAwesomeIcon icon={faEnvelope} />}
                  label="Email"
                >
                  <a
                    href={`mailto:${client.email}`}
                    style={{ color: "#1ab189", textDecoration: "none" }}
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
                    {client.email}
                  </a>
                </InfoRow>
                <InfoRow
                  icon={<FontAwesomeIcon icon={faPhone} />}
                  label="Phone"
                >
                  <a
                    href={`tel:${client.phone}`}
                    style={{ color: "#1ab189", textDecoration: "none" }}
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
                    {client.phone}
                  </a>
                </InfoRow>
                <InfoRow
                  icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
                  label="Location"
                >
                  {client.city}, {client.state}
                </InfoRow>
                <InfoRow
                  icon={<FontAwesomeIcon icon={faCalendar} />}
                  label="Client Since"
                >
                  {new Date(client.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </InfoRow>
              </div>
            </div>

            {/* Address */}
            {client.address && (
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
                      icon={faMapMarkerAlt}
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
                    Address Details
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-neutral-400)",
                        marginBottom: "0.25rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Street Address
                    </p>
                    <p
                      className="font-medium"
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      {client.address}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "City", value: client.city },
                      { label: "State", value: client.state },
                      {
                        label: "Postal Code",
                        value: client.postal_code ?? "N/A",
                      },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--color-neutral-400)",
                            marginBottom: "0.25rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {label}
                        </p>
                        <p
                          className="font-medium"
                          style={{
                            fontSize: "0.9rem",
                            color: "var(--color-neutral-900)",
                          }}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Statistics */}
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
                    icon={faCheckCircle}
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
                  Project Statistics
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: "Total",
                    value: client.stats.total_projects,
                    bg: "var(--color-neutral-50)",
                    color: "var(--color-neutral-900)",
                    isText: false,
                  },
                  {
                    label: "Active",
                    value: client.stats.active_projects,
                    bg: "#eff6ff",
                    color: "#1d4ed8",
                    isText: false,
                  },
                  {
                    label: "Completed",
                    value: client.stats.completed_projects,
                    bg: "#f0fdf4",
                    color: "#15803d",
                    isText: false,
                  },
                  {
                    label: "Total Spent",
                    value: formatCurrency(client.stats.total_spent),
                    bg: "rgba(26,177,137,0.06)",
                    color: "#1ab189",
                    isText: true,
                  },
                ].map(({ label, value, bg, color, isText }) => (
                  <div
                    key={label}
                    className="rounded-xl text-center p-4"
                    style={{ backgroundColor: bg }}
                  >
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-neutral-500)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      className="font-bold"
                      style={{ fontSize: isText ? "1rem" : "1.5rem", color }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects list */}
            {client.projects && client.projects.length > 0 && (
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
                      icon={faFolder}
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
                    Projects ({client.projects.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {client.projects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-xl"
                      style={{
                        padding: "0.875rem 1rem",
                        border: "1px solid var(--color-neutral-200)",
                        transition: "background-color 120ms",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLDivElement
                        ).style.backgroundColor = "var(--color-neutral-50)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLDivElement
                        ).style.backgroundColor = "transparent";
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h3
                          className="font-semibold"
                          style={{
                            fontSize: "0.9rem",
                            color: "var(--color-neutral-900)",
                          }}
                        >
                          {project.name}
                        </h3>
                        <StatusBadge status={project.status} />
                      </div>
                      <div
                        className="flex items-center gap-4"
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        {project.start_date && (
                          <span className="flex items-center gap-1.5">
                            <FontAwesomeIcon
                              icon={faCalendar}
                              style={{ fontSize: "0.65rem" }}
                            />
                            {new Date(project.start_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        )}
                        <span
                          className="flex items-center gap-1.5 font-semibold"
                          style={{ color: "#15803d" }}
                        >
                          <FontAwesomeIcon
                            icon={faDollarSign}
                            style={{ fontSize: "0.65rem" }}
                          />
                          {formatCurrency(project.total_cost)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
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
                Delete Client?
              </h3>
              <p
                className="text-center mb-4"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                Are you sure you want to delete &quot;{client.full_name}&quot;?
                This action cannot be undone.
              </p>

              {client.project_count > 0 && (
                <div
                  className="rounded-xl flex items-start gap-3 px-4 py-3 mb-5"
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    style={{
                      color: "#ef4444",
                      fontSize: "0.8rem",
                      marginTop: "0.1rem",
                      flexShrink: 0,
                    }}
                  />
                  <p style={{ fontSize: "0.8rem", color: "#b91c1c" }}>
                    This client has {client.project_count} associated project
                    {client.project_count !== 1 ? "s" : ""}. The client will be
                    soft deleted (deactivated) to preserve project data.
                  </p>
                </div>
              )}

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
                      Delete Client
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
