"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCheckCircle,
  faDownload,
  faPrint,
  faShare,
  faDollarSign,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faSpinner,
  faExclamationTriangle,
  faClock,
  faHashtag,
} from "@fortawesome/free-solid-svg-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

/* ─────────────────────────────────────────── */
/* Types                                        */
/* ─────────────────────────────────────────── */
interface Payment {
  id: number;
  amount: string;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  payment_type: "advance" | "milestone" | "final" | "other";
  payment_status: "pending" | "completed" | "failed";
  notes: string;
  created_at: string;
}

interface Client {
  id: number;
  full_name: string;
  user: { email: string; phone: string };
}

interface Project {
  id: number;
  project_name: string;
  description: string;
  client: Client | null;
  client_name?: string;
  site_address: string;
  total_cost: string;
  status: string;
  start_date: string;
  expected_end_date: string;
  created_at: string;
}

interface PaymentsResponse {
  count: number;
  results: Payment[];
}

/* ─────────────────────────────────────────── */
/* Helpers                                      */
/* ─────────────────────────────────────────── */
const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const PROJECT_STATUS_STYLES: Record<
  string,
  { background: string; color: string; border: string }
> = {
  completed: {
    background: "rgba(22,163,74,0.1)",
    color: "#16a34a",
    border: "1px solid rgba(22,163,74,0.2)",
  },
  in_progress: {
    background: "rgba(59,130,246,0.1)",
    color: "#2563eb",
    border: "1px solid rgba(59,130,246,0.2)",
  },
  pending: {
    background: "rgba(217,119,6,0.1)",
    color: "#d97706",
    border: "1px solid rgba(217,119,6,0.2)",
  },
  cancelled: {
    background: "rgba(239,68,68,0.1)",
    color: "#dc2626",
    border: "1px solid rgba(239,68,68,0.2)",
  },
  on_hold: {
    background: "rgba(249,115,22,0.1)",
    color: "#ea580c",
    border: "1px solid rgba(249,115,22,0.2)",
  },
};

const PAYMENT_STATUS_STYLES: Record<
  string,
  { bg: string; color: string; icon: any }
> = {
  completed: {
    bg: "rgba(22,163,74,0.1)",
    color: "#16a34a",
    icon: faCheckCircle,
  },
  pending: { bg: "rgba(217,119,6,0.1)", color: "#d97706", icon: faClock },
  failed: {
    bg: "rgba(239,68,68,0.1)",
    color: "#dc2626",
    icon: faExclamationTriangle,
  },
};

const formatStatus = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const formatPaymentType = (type: string) =>
  type.charAt(0).toUpperCase() + type.slice(1);

/* ─────────────────────────────────────────── */
/* Shared section card                          */
/* ─────────────────────────────────────────── */
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: "var(--color-neutral-0)",
        border: "1px solid var(--color-neutral-200)",
        padding: "1.375rem 1.5rem",
      }}
    >
      <h2
        className="font-semibold mb-5"
        style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Info row                                     */
/* ─────────────────────────────────────────── */
function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: any;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--color-primary-light)" }}
      >
        <FontAwesomeIcon
          icon={icon}
          style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}
        />
      </div>
      <div className="min-w-0">
        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--color-neutral-500)",
            marginBottom: "0.125rem",
          }}
        >
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="font-semibold block truncate"
            style={{
              fontSize: "0.875rem",
              color: "var(--color-neutral-900)",
              textDecoration: "none",
            }}
          >
            {value || "—"}
          </a>
        ) : (
          <p
            className="font-semibold"
            style={{ fontSize: "0.875rem", color: "var(--color-neutral-900)" }}
          >
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function EarningsViewPage() {
  const router = useRouter();
  // ✅ FIX: use useSearchParams() instead of typeof window / window.location.search
  // The old approach caused a server/client hydration mismatch
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");

  /* ── Queries ── */
  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErrorData,
  } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: () => {
      if (!projectId) throw new Error("No project ID provided");
      return api.get<Project>(`/api/v1/projects/${projectId}/`);
    },
    enabled: !!projectId,
  });

  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    isError: paymentsError,
  } = useQuery<PaymentsResponse>({
    queryKey: ["payments", projectId],
    queryFn: () => {
      if (!projectId) throw new Error("No project ID provided");
      return api.get<PaymentsResponse>(
        `/api/v1/projects/${projectId}/payments/`,
      );
    },
    enabled: !!projectId,
  });

  /* ── Derived data (declared before early returns so hooks order is stable) ── */
  const payments = paymentsData?.results ?? [];
  const totalPaid = payments
    .filter((p) => p.payment_status === "completed")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalBudget = parseFloat(project?.total_cost || "0");
  const remainingAmount = totalBudget - totalPaid;
  const progressPercentage =
    totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

  const clientName =
    project?.client?.full_name || project?.client_name || "Not assigned";
  const clientEmail = project?.client?.user?.email || "";
  const clientPhone = project?.client?.user?.phone || "";

  /* ── Handlers ── */
  const handleDownload = async () => {
    if (!project) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFontSize(22);
      doc.text("Payment Report", 105, 20, { align: "center" });
      doc.setFontSize(14);
      doc.text("Project Information", 20, 35);
      doc.setFontSize(11);
      doc.text(`Project Name: ${project.project_name}`, 25, 45);
      doc.text(`Project ID: #${project.id}`, 25, 52);
      doc.text(`Client: ${clientName}`, 25, 59);
      doc.text(`Status: ${formatStatus(project.status)}`, 25, 66);
      doc.text(
        `Start Date: ${new Date(project.start_date).toLocaleDateString()}`,
        25,
        73,
      );
      doc.text(
        `Expected End: ${new Date(project.expected_end_date).toLocaleDateString()}`,
        25,
        80,
      );

      doc.setFontSize(14);
      doc.text("Financial Summary", 20, 95);
      doc.setFontSize(11);
      doc.text(`Total Budget: $${fmt(totalBudget)}`, 25, 105);
      doc.text(`Total Paid: $${fmt(totalPaid)}`, 25, 112);
      doc.text(`Balance: $${fmt(remainingAmount)}`, 25, 119);
      doc.text(`Payment Progress: ${progressPercentage.toFixed(1)}%`, 25, 126);

      doc.setFontSize(14);
      doc.text("Payment History", 20, 140);

      if (payments.length === 0) {
        doc.setFontSize(10);
        doc.text("No payments recorded yet", 25, 150);
      } else {
        let yPos = 150;
        payments.forEach((payment, index) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(10);
          doc.setFont(undefined as any, "bold");
          doc.text(`Payment #${index + 1}`, 25, yPos);
          doc.setFont(undefined as any, "normal");
          doc.text(`Amount: $${fmt(parseFloat(payment.amount))}`, 30, yPos + 6);
          doc.text(
            `Date: ${new Date(payment.payment_date).toLocaleDateString()}`,
            30,
            yPos + 12,
          );
          doc.text(
            `Type: ${formatPaymentType(payment.payment_type)}`,
            30,
            yPos + 18,
          );
          doc.text(`Method: ${payment.payment_method}`, 30, yPos + 24);
          doc.text(`Status: ${payment.payment_status}`, 30, yPos + 30);
          if (payment.transaction_id) {
            doc.text(
              `Transaction ID: ${payment.transaction_id}`,
              30,
              yPos + 36,
            );
            yPos += 42;
          } else {
            yPos += 36;
          }
          if (payment.notes) {
            const lines = doc.splitTextToSize(`Notes: ${payment.notes}`, 160);
            doc.text(lines, 30, yPos);
            yPos += lines.length * 6 + 6;
          } else {
            yPos += 6;
          }
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
          105,
          285,
          { align: "center" },
        );
      }

      doc.save(
        `${project.project_name.replace(/\s+/g, "_")}_payment_report_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error generating PDF. Please try again.");
    }
  };

  const handlePrint = () => window.print();

  const handleShare = () => {
    if (navigator.share && project) {
      navigator
        .share({
          title: project.project_name,
          text: `Payment details for ${project.project_name}`,
          url: window.location.href,
        })
        .catch((err) => console.log("Share failed:", err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  /* ── Loading ── */
  if (projectLoading || paymentsLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="animate-spin mb-4"
            style={{ fontSize: "2rem", color: "var(--color-primary)" }}
          />
          <p
            className="font-medium"
            style={{ fontSize: "0.9rem", color: "var(--color-neutral-500)" }}
          >
            Loading project details…
          </p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (projectError || paymentsError || !project || !projectId) {
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
              icon={faExclamationTriangle}
              style={{ color: "#ef4444", width: "1.25rem" }}
            />
          </div>
          <h2
            className="font-semibold mb-2"
            style={{ fontSize: "1.1rem", color: "var(--color-neutral-900)" }}
          >
            {!projectId ? "No project selected" : "Something went wrong"}
          </h2>
          <p
            className="mb-5"
            style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}
          >
            {!projectId
              ? "No project ID provided"
              : projectErrorData instanceof Error
                ? projectErrorData.message
                : "Project not found"}
          </p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary btn-md mx-auto"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--color-neutral-50)",
        padding: "1.75rem 2rem",
      }}
    >
      {/* Page heading */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 font-semibold mb-2 transition-opacity hover:opacity-70"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: "0.8rem",
              color: "var(--color-primary)",
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ width: "0.6rem" }} />
            Back to Earnings
          </button>
          <p
            className="font-medium mb-0.5"
            style={{ fontSize: "0.8rem", color: "var(--color-neutral-500)" }}
          >
            Finance · Project #{project.id}
          </p>
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: "1.625rem", color: "var(--color-neutral-900)" }}
          >
            {project.project_name}
          </h1>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--color-neutral-500)",
              marginTop: "0.25rem",
            }}
          >
            Started{" "}
            {new Date(project.start_date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            style={{
              padding: "0.25rem 0.625rem",
              borderRadius: "9999px",
              fontSize: "0.65rem",
              fontWeight: 700,
              ...(PROJECT_STATUS_STYLES[project.status] ??
                PROJECT_STATUS_STYLES.pending),
            }}
          >
            {formatStatus(project.status)}
          </span>
          <button
            onClick={handleShare}
            className="btn btn-ghost btn-md flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faShare} style={{ fontSize: "0.8rem" }} />
            Share
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-ghost btn-md flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPrint} style={{ fontSize: "0.8rem" }} />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="btn btn-primary btn-md flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faDownload} style={{ fontSize: "0.8rem" }} />
            Download Report
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Financial summary */}
          <SectionCard title="Project Summary">
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                {
                  label: "Total Budget",
                  value: `$${fmt(totalBudget)}`,
                  bg: "var(--color-primary-light)",
                  iconBg: "var(--color-primary)",
                  color: "var(--color-neutral-900)",
                  icon: faDollarSign,
                },
                {
                  label: "Earned",
                  value: `$${fmt(totalPaid)}`,
                  bg: "rgba(22,163,74,0.08)",
                  iconBg: "#16a34a",
                  color: "#16a34a",
                  icon: faCheckCircle,
                },
                {
                  label: "Remaining",
                  value: `$${fmt(remainingAmount)}`,
                  bg: "rgba(249,115,22,0.08)",
                  iconBg: "#ea580c",
                  color: "#ea580c",
                  icon: faClock,
                },
              ].map(({ label, value, bg, iconBg, color, icon }) => (
                <div
                  key={label}
                  className="rounded-xl p-4"
                  style={{ backgroundColor: bg }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: iconBg }}
                    >
                      <FontAwesomeIcon
                        icon={icon}
                        style={{ color: "white", fontSize: "0.75rem" }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      {label}
                    </p>
                  </div>
                  <p
                    className="font-bold"
                    style={{ fontSize: "1.25rem", color }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-neutral-500)",
                    fontWeight: 500,
                  }}
                >
                  Payment Progress
                </span>
                <span
                  className="font-semibold"
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {progressPercentage.toFixed(0)}%
                </span>
              </div>
              <div
                className="rounded-full overflow-hidden"
                style={{
                  height: "0.5rem",
                  backgroundColor: "var(--color-neutral-100)",
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(progressPercentage, 100)}%`,
                    backgroundColor: "var(--color-primary)",
                  }}
                />
              </div>
            </div>

            {project.description && (
              <div>
                <p
                  className="font-semibold mb-1"
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  Description
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-600)",
                    lineHeight: 1.6,
                  }}
                >
                  {project.description}
                </p>
              </div>
            )}
          </SectionCard>

          {/* Payment history */}
          <SectionCard title="Payment History">
            {payments.length === 0 ? (
              <div className="text-center py-10">
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
                  💳
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-400)",
                  }}
                >
                  No payments recorded yet
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {payments.map((payment) => {
                    const pStyle =
                      PAYMENT_STATUS_STYLES[payment.payment_status] ??
                      PAYMENT_STATUS_STYLES.pending;
                    return (
                      <div
                        key={payment.id}
                        className="rounded-xl p-4"
                        style={{
                          backgroundColor: "var(--color-neutral-50)",
                          border: "1px solid var(--color-neutral-200)",
                          transition: "border-color 120ms, box-shadow 120ms",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLDivElement
                          ).style.borderColor = "var(--color-primary)";
                          (e.currentTarget as HTMLDivElement).style.boxShadow =
                            "0 4px 12px rgba(0,0,0,0.06)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLDivElement
                          ).style.borderColor = "var(--color-neutral-200)";
                          (e.currentTarget as HTMLDivElement).style.boxShadow =
                            "none";
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: pStyle.bg }}
                            >
                              <FontAwesomeIcon
                                icon={pStyle.icon}
                                style={{
                                  color: pStyle.color,
                                  fontSize: "1rem",
                                }}
                              />
                            </div>
                            <div>
                              <p
                                className="font-bold"
                                style={{
                                  fontSize: "1.125rem",
                                  color: "var(--color-neutral-900)",
                                }}
                              >
                                ${fmt(parseFloat(payment.amount))}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--color-neutral-500)",
                                }}
                              >
                                {formatPaymentType(payment.payment_type)} ·{" "}
                                {payment.payment_method}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className="font-medium"
                              style={{
                                fontSize: "0.8125rem",
                                color: "var(--color-neutral-900)",
                                marginBottom: "0.25rem",
                              }}
                            >
                              {new Date(
                                payment.payment_date,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <span
                              style={{
                                padding: "0.15rem 0.5rem",
                                borderRadius: "9999px",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                backgroundColor: pStyle.bg,
                                color: pStyle.color,
                              }}
                            >
                              {formatStatus(payment.payment_status)}
                            </span>
                          </div>
                        </div>

                        {payment.transaction_id && (
                          <div
                            className="flex items-center gap-1.5 mt-2"
                            style={{ paddingLeft: "3.25rem" }}
                          >
                            <FontAwesomeIcon
                              icon={faHashtag}
                              style={{
                                color: "var(--color-neutral-400)",
                                fontSize: "0.65rem",
                              }}
                            />
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-neutral-400)",
                              }}
                            >
                              {payment.transaction_id}
                            </span>
                          </div>
                        )}

                        {payment.notes && (
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--color-neutral-600)",
                              marginTop: "0.5rem",
                              paddingLeft: "3.25rem",
                            }}
                          >
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div
                  className="flex items-center justify-between mt-5 pt-4"
                  style={{ borderTop: "1px solid var(--color-neutral-200)" }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-600)",
                    }}
                  >
                    Total Received
                  </span>
                  <span
                    className="font-bold"
                    style={{ fontSize: "1.125rem", color: "#16a34a" }}
                  >
                    ${fmt(totalPaid)}
                  </span>
                </div>
              </>
            )}
          </SectionCard>
        </div>

        {/* Right — sidebar */}
        <div className="space-y-4">
          {/* Client info */}
          <div
            className="rounded-2xl"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              padding: "1.375rem 1.25rem",
            }}
          >
            <h2
              className="font-semibold mb-4"
              style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
            >
              Client Information
            </h2>
            <div className="space-y-3">
              <InfoRow icon={faUser} label="Client Name" value={clientName} />
              {clientEmail && (
                <InfoRow
                  icon={faEnvelope}
                  label="Email"
                  value={clientEmail}
                  href={`mailto:${clientEmail}`}
                />
              )}
              {clientPhone && (
                <InfoRow
                  icon={faPhone}
                  label="Phone"
                  value={clientPhone}
                  href={`tel:${clientPhone}`}
                />
              )}
              <InfoRow
                icon={faMapMarkerAlt}
                label="Site Address"
                value={project.site_address || "—"}
              />
            </div>
          </div>

          {/* Project details */}
          <div
            className="rounded-2xl"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              padding: "1.375rem 1.25rem",
            }}
          >
            <h2
              className="font-semibold mb-4"
              style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
            >
              Project Details
            </h2>
            <div className="space-y-3">
              {[
                { label: "Project ID", value: `#${project.id}` },
                {
                  label: "Start Date",
                  value: new Date(project.start_date).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  ),
                },
                {
                  label: "Expected End",
                  value: new Date(project.expected_end_date).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" },
                  ),
                },
              ].map(({ label, value }, idx, arr) => (
                <div
                  key={label}
                  className="flex items-center justify-between"
                  style={{
                    paddingBottom: idx < arr.length - 1 ? "0.75rem" : 0,
                    borderBottom:
                      idx < arr.length - 1
                        ? "1px solid var(--color-neutral-100)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-neutral-500)",
                  }}
                >
                  Status
                </span>
                <span
                  style={{
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    ...(PROJECT_STATUS_STYLES[project.status] ??
                      PROJECT_STATUS_STYLES.pending),
                  }}
                >
                  {formatStatus(project.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="rounded-2xl"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              padding: "1.375rem 1.25rem",
            }}
          >
            <h2
              className="font-semibold mb-4"
              style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
            >
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                {
                  icon: faDownload,
                  label: "Download Report",
                  onClick: handleDownload,
                },
                { icon: faPrint, label: "Print Details", onClick: handlePrint },
                {
                  icon: faShare,
                  label: "Share with Client",
                  onClick: handleShare,
                },
              ].map(({ icon, label, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="flex items-center gap-2.5 w-full rounded-xl font-medium"
                  style={{
                    padding: "0.6rem 0.875rem",
                    backgroundColor: "transparent",
                    color: "var(--color-neutral-700)",
                    border: "1px solid var(--color-neutral-200)",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 120ms, border-color 120ms",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "var(--color-primary-light)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--color-neutral-200)";
                  }}
                >
                  <FontAwesomeIcon
                    icon={icon}
                    style={{ color: "var(--color-primary)", width: "0.875rem" }}
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
