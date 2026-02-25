"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faFilter,
  faCalendar,
  faProjectDiagram,
  faChartLine,
  faUsers,
  faUserTie,
  faCheckCircle,
  faFilePdf,
  faFileExcel,
  faFileCsv,
  faSpinner,
  faPrint,
  faChevronDown,
  faTimes,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

// ========== INTERFACES ==========
interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: string;
  available_formats: string[];
}

interface ReportData {
  report_type: string;
  generated_at: string;
  summary: Record<string, unknown>;
  projects?: ProjectItem[];
  employees?: EmployeeItem[];
  clients?: ClientItem[];
  milestones?: MilestoneItem[];
  payment_details?: PaymentItem[];
}

interface ProjectItem {
  id?: number;
  name?: string;
  project_name?: string; // Django model uses project_name
  client?: string;
  status?: string;
  total_cost?: number;
  received?: number;
  balance?: number;
  completion?: string;
  milestones?: number;
}

interface EmployeeItem {
  id?: number;
  name?: string;
  role?: string;
  department?: string;
  hours_worked?: number;
  projects_assigned?: number;
  attendance?: {
    total_days?: number;
    present?: number;
    absent?: number;
    rate?: number;
  };
}

interface ClientItem {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  total_projects?: number;
  completed_projects?: number;
  total_revenue?: number;
  total_paid?: number;
  average_rating?: number;
  review_count?: number;
}

interface MilestoneItem {
  id?: number;
  project?: string;
  title?: string;
  status?: string;
  target_date?: string;
  completion_percentage?: number;
  is_overdue?: boolean;
  days_delayed?: number;
}

interface PaymentItem {
  date?: string;
  project?: string;
  type?: string;
  amount?: number;
  method?: string;
  transaction_id?: string;
}

interface ReportFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  client_id?: number;
  project_id?: number;
}

// ========== UTILITY: handle both plain arrays and DRF paginated { results: [] } ==========
function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as Record<string, unknown>).results)
  ) {
    return (data as { results: T[] }).results;
  }
  return [];
}

// ========== ICON MAPPING ==========
const iconMapping: Record<string, unknown> = {
  faProjectDiagram,
  faChartLine,
  faUsers,
  faUserTie,
  faCheckCircle,
};

// ========== HELPERS ==========
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Handles both `name` (report serializer) and `project_name` (Django model)
const getProjectName = (p: ProjectItem) => p.name ?? p.project_name ?? "N/A";

// ========== DESIGN TOKENS ==========
const GREEN = "#1ab189";
const GREEN_TINT = "rgba(26,177,137,0.10)";
const GREEN_RING = "rgba(26,177,137,0.18)";

const baseInput: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  border: "1px solid var(--color-neutral-200)",
  borderRadius: "0.625rem",
  fontSize: "0.875rem",
  background: "#fff",
  color: "var(--color-neutral-900)",
  outline: "none",
  transition: "box-shadow 0.15s",
};

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  pending: { background: "#fef3c7", color: "#92400e" },
  in_progress: { background: "#dbeafe", color: "#1e40af" },
  completed: { background: "#d1fae5", color: "#065f46" },
  on_hold: { background: "#ffedd5", color: "#9a3412" },
  cancelled: { background: "#fee2e2", color: "#991b1b" },
};

// ========== SUB-COMPONENTS ==========
function StatusBadge({ status }: { status: string }) {
  const key = status?.toLowerCase().replace(/\s+/g, "_");
  const s = STATUS_STYLES[key] ?? { background: "#f3f4f6", color: "#374151" };
  return (
    <span
      style={{
        ...s,
        borderRadius: "9999px",
        padding: "0.2rem 0.75rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {status ?? "Unknown"}
    </span>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: "1.25rem 1.5rem",
        borderBottom: "1px solid var(--color-neutral-200)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "0.5rem",
          background: GREEN_TINT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesomeIcon
          icon={faFileAlt}
          style={{ color: GREEN, fontSize: 14 }}
        />
      </div>
      <h3
        style={{
          fontWeight: 700,
          fontSize: "1rem",
          color: "var(--color-neutral-900)",
          margin: 0,
        }}
      >
        {title}
      </h3>
    </div>
  );
}

// ========== MAIN PAGE ==========
export default function ReportsPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    start_date: "2024-01-01",
    end_date: new Date().toISOString().split("T")[0],
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?type=service_provider&session=expired");
    }
  }, [router]);

  // ========== QUERIES ==========
  const { data: reportTypes, isLoading: typesLoading } = useQuery({
    queryKey: ["report-types"],
    queryFn: async () => {
      const data = await api.get<unknown>("/api/v1/reports/types/");
      return extractArray<ReportType>(data);
    },
    retry: 1,
  });

  const { data: clientsList } = useQuery({
    queryKey: ["clients-for-reports"],
    queryFn: async () => {
      const data = await api.get<unknown>("/api/v1/reports/clients/");
      return extractArray<ClientItem>(data);
    },
    retry: 1,
  });

  const { data: projectsList } = useQuery({
    queryKey: ["projects-for-reports"],
    queryFn: async () => {
      const data = await api.get<unknown>("/api/v1/projects/");
      return extractArray<ProjectItem>(data);
    },
    retry: 1,
  });

  // Safe arrays — always plain arrays even if query hasn't resolved yet
  const safeReportTypes = reportTypes ?? [];
  const safeClients = clientsList ?? [];
  const safeProjects = projectsList ?? [];

  // ========== GENERATE REPORT ==========
  const handleGenerateReport = async (reportId: string) => {
    setSelectedReport(reportId);
    setReportData(null);
    setIsGenerating(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.start_date)
        queryParams.append("start_date", filters.start_date);
      if (filters.end_date) queryParams.append("end_date", filters.end_date);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.client_id)
        queryParams.append("client_id", filters.client_id.toString());
      if (filters.project_id)
        queryParams.append("project_id", filters.project_id.toString());

      const data = await api.get<ReportData>(
        `/api/v1/reports/${reportId}/?${queryParams.toString()}`,
      );
      setReportData(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate report";
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    if (selectedReport) handleGenerateReport(selectedReport);
  };

  const handleResetFilters = () => {
    setFilters({
      start_date: "2024-01-01",
      end_date: new Date().toISOString().split("T")[0],
    });
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    ...baseInput,
    boxShadow: focusedInput === field ? `0 0 0 3px ${GREEN_RING}` : "none",
    borderColor: focusedInput === field ? GREEN : "var(--color-neutral-200)",
  });

  const focusHandlers = (field: string) => ({
    onFocus: () => setFocusedInput(field),
    onBlur: () => setFocusedInput(null),
  });

  // ========== EXPORT: PDF ==========
  const exportToPDF = () => {
    if (!reportData) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.setTextColor(26, 177, 137);
      doc.text(reportData.report_type, pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Generated: ${formatDateTime(reportData.generated_at)}`,
        pageWidth / 2,
        28,
        { align: "center" },
      );

      let yPos = 40;

      if (reportData.summary) {
        doc.setFontSize(13);
        doc.setTextColor(26, 177, 137);
        doc.text("Summary", 14, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(0);
        Object.entries(reportData.summary).forEach(([key, value]) => {
          const label = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          doc.text(`${label}: ${value}`, 14, yPos);
          yPos += 6;
        });
        yPos += 5;
      }

      const headStyles = {
        fillColor: [26, 177, 137] as [number, number, number],
      };

      if (reportData.projects?.length) {
        autoTable(doc, {
          startY: yPos,
          head: [
            [
              "Project",
              "Client",
              "Status",
              "Total Cost",
              "Received",
              "Balance",
            ],
          ],
          body: reportData.projects.map((p) => [
            getProjectName(p),
            p.client ?? "N/A",
            p.status ?? "N/A",
            formatCurrency(p.total_cost ?? 0),
            formatCurrency(p.received ?? 0),
            formatCurrency(p.balance ?? 0),
          ]),
          theme: "grid",
          headStyles,
        });
      }
      if (reportData.employees?.length) {
        autoTable(doc, {
          startY: yPos,
          head: [
            ["Name", "Role", "Attendance Rate", "Hours Worked", "Projects"],
          ],
          body: reportData.employees.map((e) => [
            e.name ?? "N/A",
            e.role ?? "N/A",
            `${e.attendance?.rate ?? 0}%`,
            (e.hours_worked ?? 0).toFixed(2),
            e.projects_assigned ?? 0,
          ]),
          theme: "grid",
          headStyles,
        });
      }
      if (reportData.clients?.length) {
        autoTable(doc, {
          startY: yPos,
          head: [["Client", "Projects", "Revenue", "Paid", "Rating"]],
          body: reportData.clients.map((c) => [
            c.name ?? "N/A",
            c.total_projects ?? 0,
            formatCurrency(c.total_revenue ?? 0),
            formatCurrency(c.total_paid ?? 0),
            `${(c.average_rating ?? 0).toFixed(1)} ★`,
          ]),
          theme: "grid",
          headStyles,
        });
      }
      if (reportData.milestones?.length) {
        autoTable(doc, {
          startY: yPos,
          head: [["Project", "Milestone", "Status", "Progress", "Target Date"]],
          body: reportData.milestones.map((m) => [
            m.project ?? "N/A",
            m.title ?? "N/A",
            m.status ?? "N/A",
            `${m.completion_percentage ?? 0}%`,
            formatDate(m.target_date ?? ""),
          ]),
          theme: "grid",
          headStyles,
        });
      }
      if (reportData.payment_details?.length) {
        autoTable(doc, {
          startY: yPos,
          head: [["Date", "Project", "Type", "Amount", "Method"]],
          body: reportData.payment_details.map((p) => [
            formatDate(p.date ?? ""),
            p.project ?? "N/A",
            p.type ?? "N/A",
            formatCurrency(p.amount ?? 0),
            p.method ?? "N/A",
          ]),
          theme: "grid",
          headStyles,
        });
      }

      doc.save(
        `${reportData.report_type.replace(/\s+/g, "_")}_${Date.now()}.pdf`,
      );
    } catch {
      alert("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // ========== EXPORT: EXCEL ==========
  const exportToExcel = () => {
    if (!reportData) return;
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      if (reportData.summary) {
        const summaryData = Object.entries(reportData.summary).map(
          ([key, value]) => ({
            Metric: key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            Value: value,
          }),
        );
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(summaryData),
          "Summary",
        );
      }
      if (reportData.projects?.length)
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(reportData.projects),
          "Projects",
        );
      if (reportData.employees?.length)
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(reportData.employees),
          "Employees",
        );
      if (reportData.clients?.length)
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(reportData.clients),
          "Clients",
        );
      if (reportData.milestones?.length)
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(reportData.milestones),
          "Milestones",
        );
      if (reportData.payment_details?.length)
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(reportData.payment_details),
          "Payments",
        );

      XLSX.writeFile(
        wb,
        `${reportData.report_type.replace(/\s+/g, "_")}_${Date.now()}.xlsx`,
      );
    } catch {
      alert("Failed to generate Excel file");
    } finally {
      setIsExporting(false);
    }
  };

  // ========== EXPORT: CSV ==========
  const exportToCSV = () => {
    if (!reportData) return;
    setIsExporting(true);
    try {
      let csv = `${reportData.report_type}\nGenerated: ${formatDateTime(reportData.generated_at)}\n\n`;

      if (reportData.summary) {
        csv += "SUMMARY\n";
        Object.entries(reportData.summary).forEach(([k, v]) => {
          csv += `${k.replace(/_/g, " ")},${v}\n`;
        });
        csv += "\n";
      }
      if (reportData.projects?.length) {
        csv += "PROJECTS\nName,Client,Status,Total Cost,Received,Balance\n";
        reportData.projects.forEach((p) => {
          csv += `"${getProjectName(p)}","${p.client ?? ""}","${p.status ?? ""}",${p.total_cost ?? 0},${p.received ?? 0},${p.balance ?? 0}\n`;
        });
        csv += "\n";
      }
      if (reportData.employees?.length) {
        csv += "EMPLOYEES\nName,Role,Attendance Rate,Hours Worked,Projects\n";
        reportData.employees.forEach((e) => {
          csv += `"${e.name ?? ""}","${e.role ?? ""}",${e.attendance?.rate ?? 0}%,${e.hours_worked ?? 0},${e.projects_assigned ?? 0}\n`;
        });
        csv += "\n";
      }
      if (reportData.clients?.length) {
        csv += "CLIENTS\nName,Projects,Revenue,Paid,Rating\n";
        reportData.clients.forEach((c) => {
          csv += `"${c.name ?? ""}",${c.total_projects ?? 0},${c.total_revenue ?? 0},${c.total_paid ?? 0},${c.average_rating ?? 0}\n`;
        });
        csv += "\n";
      }
      if (reportData.milestones?.length) {
        csv += "MILESTONES\nProject,Title,Status,Progress,Target Date\n";
        reportData.milestones.forEach((m) => {
          csv += `"${m.project ?? ""}","${m.title ?? ""}","${m.status ?? ""}",${m.completion_percentage ?? 0}%,${m.target_date ?? ""}\n`;
        });
      }

      saveAs(
        new Blob([csv], { type: "text/csv;charset=utf-8;" }),
        `${reportData.report_type.replace(/\s+/g, "_")}_${Date.now()}.csv`,
      );
    } catch {
      alert("Failed to generate CSV");
    } finally {
      setIsExporting(false);
    }
  };

  // ========== SUMMARY CARDS ==========
  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;
    const s = reportData.summary as Record<string, number>;

    type CardDef = { label: string; value: string | number };
    let cards: CardDef[] = [];

    if (reportData.report_type === "Projects Summary") {
      cards = [
        { label: "Total Projects", value: s.total_projects ?? 0 },
        { label: "Total Revenue", value: formatCurrency(s.total_revenue ?? 0) },
        { label: "Received", value: formatCurrency(s.total_received ?? 0) },
        { label: "Pending", value: formatCurrency(s.total_pending ?? 0) },
      ];
    } else if (reportData.report_type === "Financial Report") {
      cards = [
        { label: "Total Income", value: formatCurrency(s.total_income ?? 0) },
        {
          label: "Total Expenses",
          value: formatCurrency(s.total_expenses ?? 0),
        },
        { label: "Net Profit", value: formatCurrency(s.net_profit ?? 0) },
        { label: "Profit Margin", value: `${s.profit_margin ?? 0}%` },
      ];
    } else if (reportData.report_type === "Employee Performance") {
      cards = [
        { label: "Total Employees", value: s.total_employees ?? 0 },
        { label: "Avg Attendance", value: `${s.avg_attendance_rate ?? 0}%` },
        {
          label: "Total Hours",
          value: (s.total_hours_worked ?? 0).toLocaleString(),
        },
      ];
    } else if (reportData.report_type === "Client Analysis") {
      cards = [
        { label: "Total Clients", value: s.total_clients ?? 0 },
        { label: "Total Revenue", value: formatCurrency(s.total_revenue ?? 0) },
        {
          label: "Avg Revenue/Client",
          value: formatCurrency(s.avg_revenue_per_client ?? 0),
        },
      ];
    } else if (reportData.report_type === "Milestone Completion") {
      cards = [
        { label: "Total Milestones", value: s.total_milestones ?? 0 },
        { label: "Completed", value: s.completed ?? 0 },
        { label: "Completion Rate", value: `${s.completion_rate ?? 0}%` },
      ];
    }

    if (!cards.length) return null;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cards.length}, 1fr)`,
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {cards.map((card, idx) => (
          <div
            key={idx}
            style={{
              background: "#fff",
              border: "1px solid var(--color-neutral-200)",
              borderRadius: "1rem",
              padding: "1.5rem",
              borderTop: `3px solid ${GREEN}`,
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-neutral-500)",
                marginBottom: "0.375rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--color-neutral-900)",
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ========== DATA TABLE ==========
  const renderDataTable = () => {
    if (!reportData) return null;

    let headers: string[] = [];
    let rows: (string | number | React.ReactNode)[][] = [];
    let title = "";

    if (reportData.projects?.length) {
      title = "Projects";
      headers = [
        "Project",
        "Client",
        "Status",
        "Total Cost",
        "Received",
        "Balance",
        "Completion",
      ];
      rows = reportData.projects.map((p) => [
        <span key="name" style={{ fontWeight: 600 }}>
          {getProjectName(p)}
        </span>,
        p.client ?? "N/A",
        <StatusBadge key="status" status={p.status ?? ""} />,
        formatCurrency(p.total_cost ?? 0),
        <span key="recv" style={{ color: "#065f46", fontWeight: 600 }}>
          {formatCurrency(p.received ?? 0)}
        </span>,
        <span key="bal" style={{ color: "#92400e", fontWeight: 600 }}>
          {formatCurrency(p.balance ?? 0)}
        </span>,
        p.completion ?? "0%",
      ]);
    } else if (reportData.employees?.length) {
      title = "Employee Performance";
      headers = [
        "Name",
        "Role",
        "Department",
        "Present / Absent",
        "Attendance",
        "Hours",
        "Projects",
      ];
      rows = reportData.employees.map((e) => [
        <span key="name" style={{ fontWeight: 600 }}>
          {e.name ?? "N/A"}
        </span>,
        e.role ?? "N/A",
        e.department ?? "N/A",
        <span key="pa">
          {e.attendance?.present ?? 0} / {e.attendance?.absent ?? 0}
        </span>,
        `${e.attendance?.rate ?? 0}%`,
        (e.hours_worked ?? 0).toFixed(2),
        e.projects_assigned ?? 0,
      ]);
    } else if (reportData.clients?.length) {
      title = "Client Analysis";
      headers = [
        "Client",
        "Email",
        "Projects",
        "Completed",
        "Revenue",
        "Paid",
        "Rating",
      ];
      rows = reportData.clients.map((c) => [
        <span key="name" style={{ fontWeight: 600 }}>
          {c.name ?? "N/A"}
        </span>,
        c.email ?? "N/A",
        c.total_projects ?? 0,
        <span key="comp" style={{ color: "#065f46", fontWeight: 600 }}>
          {c.completed_projects ?? 0}
        </span>,
        formatCurrency(c.total_revenue ?? 0),
        <span key="paid" style={{ color: "#065f46", fontWeight: 600 }}>
          {formatCurrency(c.total_paid ?? 0)}
        </span>,
        <span key="rating">
          ⭐ {(c.average_rating ?? 0).toFixed(1)}{" "}
          <span
            style={{ color: "var(--color-neutral-400)", fontSize: "0.75rem" }}
          >
            ({c.review_count ?? 0})
          </span>
        </span>,
      ]);
    } else if (reportData.milestones?.length) {
      title = "Milestone Completion";
      headers = [
        "Project",
        "Milestone",
        "Status",
        "Progress",
        "Target Date",
        "Overdue",
      ];
      rows = reportData.milestones.map((m) => [
        <span key="proj" style={{ fontWeight: 600 }}>
          {m.project ?? "N/A"}
        </span>,
        m.title ?? "N/A",
        <StatusBadge key="status" status={m.status ?? ""} />,
        `${m.completion_percentage ?? 0}%`,
        formatDate(m.target_date ?? ""),
        m.is_overdue ? (
          <span key="ov" style={{ color: "#991b1b", fontWeight: 600 }}>
            {m.days_delayed ?? 0}d late
          </span>
        ) : (
          <span key="ov" style={{ color: "#065f46" }}>
            On track
          </span>
        ),
      ]);
    } else if (reportData.payment_details?.length) {
      title = "Payment Details";
      headers = [
        "Date",
        "Project",
        "Type",
        "Amount",
        "Method",
        "Transaction ID",
      ];
      rows = reportData.payment_details.map((p) => [
        formatDate(p.date ?? ""),
        <span key="proj" style={{ fontWeight: 600 }}>
          {p.project ?? "N/A"}
        </span>,
        <span
          key="type"
          style={{
            background: GREEN_TINT,
            color: GREEN,
            borderRadius: 9999,
            padding: "0.15rem 0.6rem",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          {p.type ?? "N/A"}
        </span>,
        <span key="amt" style={{ color: "#065f46", fontWeight: 600 }}>
          {formatCurrency(p.amount ?? 0)}
        </span>,
        p.method ?? "N/A",
        <span key="tid" style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
          {p.transaction_id ?? "N/A"}
        </span>,
      ]);
    }

    if (!rows.length) return null;

    return (
      <div
        style={{
          background: "#fff",
          borderRadius: "1rem",
          border: "1px solid var(--color-neutral-200)",
          overflow: "hidden",
        }}
      >
        <SectionHeader title={title} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-neutral-50)" }}>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: "var(--color-neutral-600)",
                      borderBottom: "1px solid var(--color-neutral-200)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={ri}
                  style={{
                    borderBottom: "1px solid var(--color-neutral-100)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--color-neutral-50)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      style={{
                        padding: "0.875rem 1rem",
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-700)",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ========== LOADING ==========
  if (typesLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-neutral-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: `3px solid ${GREEN}`,
              borderTopColor: "transparent",
              margin: "0 auto 1rem",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "var(--color-neutral-600)" }}>Loading reports…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const currentReportType = safeReportTypes.find(
    (r) => r.id === selectedReport,
  );
  const showProjectFilter =
    selectedReport === "projects-summary" ||
    selectedReport === "milestone-completion" ||
    selectedReport === "financial-report";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-neutral-50)" }}>
      {/* ── Header ── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.5rem 2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          {/* Left */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}
          >
            {selectedReport && (
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setReportData(null);
                  setShowFilters(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.25rem 0",
                }}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back
              </button>
            )}
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--color-neutral-900)",
                  margin: 0,
                }}
              >
                {selectedReport
                  ? (currentReportType?.name ?? "Report")
                  : "Reports"}
              </h1>
              {!selectedReport && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-500)",
                    margin: "0.125rem 0 0",
                  }}
                >
                  Generate comprehensive business reports
                </p>
              )}
              {reportData && (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-neutral-400)",
                    margin: "0.125rem 0 0",
                  }}
                >
                  Generated: {formatDateTime(reportData.generated_at)}
                </p>
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          {selectedReport && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="btn btn-secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <FontAwesomeIcon icon={faFilter} />
                Filters
                <FontAwesomeIcon
                  icon={faChevronDown}
                  style={{
                    fontSize: "0.75rem",
                    transition: "transform 0.2s",
                    transform: showFilters ? "rotate(180deg)" : "none",
                  }}
                />
              </button>

              {reportData && (
                <>
                  <button
                    onClick={() => window.print()}
                    className="btn btn-secondary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    <FontAwesomeIcon icon={faPrint} /> Print
                  </button>
                  <button
                    onClick={exportToCSV}
                    disabled={isExporting}
                    className="btn btn-secondary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faFileCsv}
                      style={{ color: "#16a34a" }}
                    />{" "}
                    CSV
                  </button>
                  <button
                    onClick={exportToExcel}
                    disabled={isExporting}
                    className="btn btn-secondary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faFileExcel}
                      style={{ color: "#15803d" }}
                    />{" "}
                    Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="btn btn-primary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    {isExporting ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faFilePdf} />
                    )}
                    PDF
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem" }}>
        {/* ── Filters Panel ── */}
        {showFilters && selectedReport && (
          <div
            style={{
              background: "#fff",
              borderRadius: "1rem",
              border: "1px solid var(--color-neutral-200)",
              marginBottom: "1.5rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "0.5rem",
                    background: GREEN_TINT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFilter}
                    style={{ color: GREEN, fontSize: 13 }}
                  />
                </div>
                <span
                  style={{ fontWeight: 700, color: "var(--color-neutral-900)" }}
                >
                  Filter Report
                </span>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-400)",
                  fontSize: "1rem",
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div
              style={{
                padding: "1.5rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              {/* Start Date */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-neutral-700)",
                    marginBottom: "0.375rem",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCalendar}
                    style={{ marginRight: 6, color: GREEN }}
                  />
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.start_date ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, start_date: e.target.value }))
                  }
                  style={inputStyle("start_date")}
                  {...focusHandlers("start_date")}
                />
              </div>

              {/* End Date */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-neutral-700)",
                    marginBottom: "0.375rem",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCalendar}
                    style={{ marginRight: 6, color: GREEN }}
                  />
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.end_date ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, end_date: e.target.value }))
                  }
                  style={inputStyle("end_date")}
                  {...focusHandlers("end_date")}
                />
              </div>

              {/* Status — projects-summary only */}
              {selectedReport === "projects-summary" && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-neutral-700)",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={filters.status ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, status: e.target.value }))
                    }
                    style={{ ...inputStyle("status"), cursor: "pointer" }}
                    {...focusHandlers("status")}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              )}

              {/* Client — client-analysis only */}
              {selectedReport === "client-analysis" && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-neutral-700)",
                      marginBottom: "0.375rem",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faUserTie}
                      style={{ marginRight: 6, color: GREEN }}
                    />
                    Client
                  </label>
                  <select
                    value={filters.client_id ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        client_id: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      }))
                    }
                    style={{ ...inputStyle("client_id"), cursor: "pointer" }}
                    {...focusHandlers("client_id")}
                  >
                    <option value="">All Clients</option>
                    {safeClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.email ? ` (${c.email})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Project — projects-summary, milestone-completion, financial-report */}
              {showProjectFilter && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-neutral-700)",
                      marginBottom: "0.375rem",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faProjectDiagram}
                      style={{ marginRight: 6, color: GREEN }}
                    />
                    Project (Detailed)
                  </label>
                  <select
                    value={filters.project_id ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        project_id: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      }))
                    }
                    style={{ ...inputStyle("project_id"), cursor: "pointer" }}
                    {...focusHandlers("project_id")}
                  >
                    <option value="">All Projects</option>
                    {safeProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {getProjectName(p)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--color-neutral-100)",
                background: "var(--color-neutral-50)",
                display: "flex",
                gap: "0.75rem",
              }}
            >
              <button onClick={handleApplyFilters} className="btn btn-primary">
                Apply Filters
              </button>
              <button
                onClick={handleResetFilters}
                className="btn btn-secondary"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* ── Report Type Grid ── */}
        {!selectedReport && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {safeReportTypes.map((rt) => (
              <div
                key={rt.id}
                onClick={() => handleGenerateReport(rt.id)}
                style={{
                  background: "#fff",
                  border: "1px solid var(--color-neutral-200)",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 8px 24px rgba(0,0,0,0.08)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = GREEN;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--color-neutral-200)";
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "0.625rem",
                    background: GREEN_TINT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <FontAwesomeIcon
                    icon={iconMapping[rt.icon] as never}
                    style={{ color: GREEN, fontSize: 18 }}
                  />
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--color-neutral-900)",
                    marginBottom: "0.375rem",
                  }}
                >
                  {rt.name}
                </h3>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-neutral-500)",
                    marginBottom: "1rem",
                    lineHeight: 1.5,
                  }}
                >
                  {rt.description}
                </p>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}
                >
                  {(rt.available_formats ?? []).map((fmt) => (
                    <span
                      key={fmt}
                      style={{
                        background: "var(--color-neutral-100)",
                        color: "var(--color-neutral-600)",
                        borderRadius: 9999,
                        padding: "0.2rem 0.65rem",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Report View ── */}
        {selectedReport && (
          <div ref={printRef}>
            {isGenerating && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "1rem",
                  border: "1px solid var(--color-neutral-200)",
                  padding: "4rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    border: `3px solid ${GREEN}`,
                    borderTopColor: "transparent",
                    margin: "0 auto 1rem",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <p style={{ color: "var(--color-neutral-500)" }}>
                  Generating report…
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {!isGenerating && reportData && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                {renderSummaryCards()}
                {renderDataTable()}
              </div>
            )}

            {!isGenerating && !reportData && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "1rem",
                  border: "1px solid var(--color-neutral-200)",
                  padding: "4rem",
                  textAlign: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={faFileAlt}
                  style={{
                    fontSize: 48,
                    color: "var(--color-neutral-200)",
                    marginBottom: "1rem",
                  }}
                />
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--color-neutral-900)",
                    marginBottom: "0.375rem",
                  }}
                >
                  No Data Available
                </h3>
                <p
                  style={{
                    color: "var(--color-neutral-500)",
                    fontSize: "0.875rem",
                  }}
                >
                  Use <strong>Filters</strong> to adjust the date range or
                  parameters, then regenerate.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body > *:not([data-print]) { display: none; }
          .btn, button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
