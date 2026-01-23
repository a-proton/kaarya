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
  faChevronDown,
  faChevronUp,
  faTimes,
  faPrint,
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
  summary: any;
  projects?: any[];
  employees?: any[];
  clients?: any[];
  milestones?: any[];
  payment_details?: any[];
  [key: string]: any;
}

interface ReportFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  client_id?: number;
}

// ========== ICON MAPPING ==========
const iconMapping: { [key: string]: any } = {
  faProjectDiagram: faProjectDiagram,
  faChartLine: faChartLine,
  faUsers: faUsers,
  faUserTie: faUserTie,
  faCheckCircle: faCheckCircle,
};

// ========== HELPER FUNCTIONS ==========
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function ReportsPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  // ========== STATE ==========
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    start_date: "2024-01-01",
    end_date: new Date().toISOString().split("T")[0],
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ========== AUTHENTICATION CHECK ==========
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?type=service_provider&session=expired");
    }
  }, [router]);

  // ========== API QUERIES ==========
  const { data: reportTypes, isLoading: typesLoading } = useQuery({
    queryKey: ["report-types"],
    queryFn: async () => {
      const data = await api.get<ReportType[]>("/api/v1/reports/types/");
      return data;
    },
    retry: 1,
  });

  const { data: clientsList } = useQuery({
    queryKey: ["clients-for-reports"],
    queryFn: async () => {
      const data = await api.get<any[]>("/api/v1/reports/clients/");
      return data;
    },
    retry: 1,
  });

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

      const data = await api.get<ReportData>(
        `/api/v1/reports/${reportId}/?${queryParams.toString()}`,
      );

      setReportData(data);
    } catch (error: any) {
      alert(error.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  // ========== EXPORT TO PDF ==========
  const exportToPDF = () => {
    if (!reportData) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175);
      doc.text(reportData.report_type, pageWidth / 2, 20, { align: "center" });

      // Generated date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Generated: ${formatDate(reportData.generated_at)}`,
        pageWidth / 2,
        28,
        {
          align: "center",
        },
      );

      let yPos = 40;

      // Summary Section
      if (reportData.summary) {
        doc.setFontSize(14);
        doc.setTextColor(30, 64, 175);
        doc.text("Summary", 14, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(0);
        const summary = reportData.summary;
        Object.keys(summary).forEach((key) => {
          const label = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          let value = summary[key];
          if (
            (typeof value === "number" && key.includes("revenue")) ||
            key.includes("income") ||
            key.includes("expense") ||
            key.includes("profit") ||
            key.includes("paid")
          ) {
            value = formatCurrency(value);
          }
          doc.text(`${label}: ${value}`, 14, yPos);
          yPos += 6;
        });
        yPos += 5;
      }

      // Projects Table
      if (reportData.projects && reportData.projects.length > 0) {
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
          body: reportData.projects.map((p: any) => [
            p.name || "N/A",
            p.client || "N/A",
            p.status || "N/A",
            formatCurrency(p.total_cost || 0),
            formatCurrency(p.received || 0),
            formatCurrency(p.balance || 0),
          ]),
          theme: "grid",
          headStyles: { fillColor: [30, 64, 175] },
        });
      }

      // Employees Table
      if (reportData.employees && reportData.employees.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [
            ["Name", "Role", "Attendance Rate", "Hours Worked", "Projects"],
          ],
          body: reportData.employees.map((e: any) => [
            e.name || "N/A",
            e.role || "N/A",
            `${e.attendance?.rate || 0}%`,
            (e.hours_worked || 0).toFixed(2),
            e.projects_assigned || 0,
          ]),
          theme: "grid",
          headStyles: { fillColor: [30, 64, 175] },
        });
      }

      // Clients Table
      if (reportData.clients && reportData.clients.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Client", "Projects", "Revenue", "Paid", "Rating"]],
          body: reportData.clients.map((c: any) => [
            c.name || "N/A",
            c.total_projects || 0,
            formatCurrency(c.total_revenue || 0),
            formatCurrency(c.total_paid || 0),
            `${(c.average_rating || 0).toFixed(1)} ★`,
          ]),
          theme: "grid",
          headStyles: { fillColor: [30, 64, 175] },
        });
      }

      // Milestones Table
      if (reportData.milestones && reportData.milestones.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Project", "Milestone", "Status", "Progress", "Target Date"]],
          body: reportData.milestones.map((m: any) => [
            m.project || "N/A",
            m.title || "N/A",
            m.status || "N/A",
            `${m.completion_percentage || 0}%`,
            formatDate(m.target_date),
          ]),
          theme: "grid",
          headStyles: { fillColor: [30, 64, 175] },
        });
      }

      // Payment Details Table
      if (reportData.payment_details && reportData.payment_details.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Date", "Project", "Type", "Amount", "Method"]],
          body: reportData.payment_details.map((p: any) => [
            formatDate(p.date),
            p.project || "N/A",
            p.type || "N/A",
            formatCurrency(p.amount || 0),
            p.method || "N/A",
          ]),
          theme: "grid",
          headStyles: { fillColor: [30, 64, 175] },
        });
      }

      doc.save(
        `${reportData.report_type.replace(/\s+/g, "_")}_${Date.now()}.pdf`,
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // ========== EXPORT TO EXCEL ==========
  const exportToExcel = () => {
    if (!reportData) return;
    setIsExporting(true);

    try {
      const wb = XLSX.utils.book_new();

      // Summary Sheet
      if (reportData.summary) {
        const summaryData = Object.entries(reportData.summary).map(
          ([key, value]) => ({
            Metric: key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            Value: value,
          }),
        );
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
      }

      // Projects Sheet
      if (reportData.projects && reportData.projects.length > 0) {
        const projectsSheet = XLSX.utils.json_to_sheet(reportData.projects);
        XLSX.utils.book_append_sheet(wb, projectsSheet, "Projects");
      }

      // Employees Sheet
      if (reportData.employees && reportData.employees.length > 0) {
        const employeesSheet = XLSX.utils.json_to_sheet(reportData.employees);
        XLSX.utils.book_append_sheet(wb, employeesSheet, "Employees");
      }

      // Clients Sheet
      if (reportData.clients && reportData.clients.length > 0) {
        const clientsSheet = XLSX.utils.json_to_sheet(reportData.clients);
        XLSX.utils.book_append_sheet(wb, clientsSheet, "Clients");
      }

      // Milestones Sheet
      if (reportData.milestones && reportData.milestones.length > 0) {
        const milestonesSheet = XLSX.utils.json_to_sheet(reportData.milestones);
        XLSX.utils.book_append_sheet(wb, milestonesSheet, "Milestones");
      }

      // Payment Details Sheet
      if (reportData.payment_details && reportData.payment_details.length > 0) {
        const paymentsSheet = XLSX.utils.json_to_sheet(
          reportData.payment_details,
        );
        XLSX.utils.book_append_sheet(wb, paymentsSheet, "Payments");
      }

      const fileName = `${reportData.report_type.replace(/\s+/g, "_")}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Excel generation error:", error);
      alert("Failed to generate Excel file");
    } finally {
      setIsExporting(false);
    }
  };

  // ========== EXPORT TO CSV ==========
  const exportToCSV = () => {
    if (!reportData) return;
    setIsExporting(true);

    try {
      let csvContent = `${reportData.report_type}\nGenerated: ${formatDate(reportData.generated_at)}\n\n`;

      // Summary
      if (reportData.summary) {
        csvContent += "SUMMARY\n";
        Object.entries(reportData.summary).forEach(([key, value]) => {
          csvContent += `${key.replace(/_/g, " ")},${value}\n`;
        });
        csvContent += "\n";
      }

      // Projects
      if (reportData.projects && reportData.projects.length > 0) {
        csvContent += "PROJECTS\n";
        csvContent += "Name,Client,Status,Total Cost,Received,Balance\n";
        reportData.projects.forEach((p: any) => {
          csvContent += `"${p.name || "N/A"}","${p.client || "N/A"}","${p.status || "N/A"}",${p.total_cost || 0},${p.received || 0},${p.balance || 0}\n`;
        });
        csvContent += "\n";
      }

      // Employees
      if (reportData.employees && reportData.employees.length > 0) {
        csvContent += "EMPLOYEES\n";
        csvContent += "Name,Role,Attendance Rate,Hours Worked,Projects\n";
        reportData.employees.forEach((e: any) => {
          csvContent += `"${e.name || "N/A"}","${e.role || "N/A"}",${e.attendance?.rate || 0}%,${e.hours_worked || 0},${e.projects_assigned || 0}\n`;
        });
        csvContent += "\n";
      }

      // Clients
      if (reportData.clients && reportData.clients.length > 0) {
        csvContent += "CLIENTS\n";
        csvContent += "Name,Projects,Revenue,Paid,Rating\n";
        reportData.clients.forEach((c: any) => {
          csvContent += `"${c.name || "N/A"}",${c.total_projects || 0},${c.total_revenue || 0},${c.total_paid || 0},${c.average_rating || 0}\n`;
        });
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      saveAs(
        blob,
        `${reportData.report_type.replace(/\s+/g, "_")}_${Date.now()}.csv`,
      );
    } catch (error) {
      console.error("CSV generation error:", error);
      alert("Failed to generate CSV");
    } finally {
      setIsExporting(false);
    }
  };

  // ========== PRINT ==========
  const handlePrint = () => {
    window.print();
  };

  // ========== RENDER SUMMARY CARDS ==========
  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;

    const summary = reportData.summary;
    const cards = [];

    if (reportData.report_type === "Projects Summary") {
      cards.push(
        {
          label: "Total Projects",
          value: summary.total_projects || 0,
          color: "blue",
        },
        {
          label: "Total Revenue",
          value: formatCurrency(summary.total_revenue || 0),
          color: "green",
        },
        {
          label: "Received",
          value: formatCurrency(summary.total_received || 0),
          color: "purple",
        },
        {
          label: "Pending",
          value: formatCurrency(summary.total_pending || 0),
          color: "orange",
        },
      );
    } else if (reportData.report_type === "Financial Report") {
      cards.push(
        {
          label: "Total Income",
          value: formatCurrency(summary.total_income || 0),
          color: "green",
        },
        {
          label: "Total Expenses",
          value: formatCurrency(summary.total_expenses || 0),
          color: "red",
        },
        {
          label: "Net Profit",
          value: formatCurrency(summary.net_profit || 0),
          color: "blue",
        },
        {
          label: "Profit Margin",
          value: `${summary.profit_margin || 0}%`,
          color: "purple",
        },
      );
    } else if (reportData.report_type === "Employee Performance") {
      cards.push(
        {
          label: "Total Employees",
          value: summary.total_employees || 0,
          color: "blue",
        },
        {
          label: "Avg Attendance",
          value: `${summary.avg_attendance_rate || 0}%`,
          color: "green",
        },
        {
          label: "Total Hours",
          value: (summary.total_hours_worked || 0).toLocaleString(),
          color: "purple",
        },
      );
    } else if (reportData.report_type === "Client Analysis") {
      cards.push(
        {
          label: "Total Clients",
          value: summary.total_clients || 0,
          color: "blue",
        },
        {
          label: "Total Revenue",
          value: formatCurrency(summary.total_revenue || 0),
          color: "green",
        },
        {
          label: "Avg Revenue/Client",
          value: formatCurrency(summary.avg_revenue_per_client || 0),
          color: "purple",
        },
      );
    } else if (reportData.report_type === "Milestone Completion") {
      cards.push(
        {
          label: "Total Milestones",
          value: summary.total_milestones || 0,
          color: "blue",
        },
        { label: "Completed", value: summary.completed || 0, color: "green" },
        {
          label: "Completion Rate",
          value: `${summary.completion_rate || 0}%`,
          color: "purple",
        },
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br from-${card.color}-50 to-${card.color}-100 rounded-xl p-6 border border-${card.color}-200`}
          >
            <div
              className={`text-${card.color}-600 text-sm font-semibold mb-1`}
            >
              {card.label}
            </div>
            <div className={`text-3xl font-bold text-${card.color}-900`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ========== RENDER DATA TABLE ==========
  const renderDataTable = () => {
    if (!reportData) return null;

    let headers: string[] = [];
    let rows: any[][] = [];
    let title = "";

    if (reportData.projects && reportData.projects.length > 0) {
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
      rows = reportData.projects.map((p: any) => [
        p.name || "N/A",
        p.client || "N/A",
        p.status || "N/A",
        formatCurrency(p.total_cost || 0),
        formatCurrency(p.received || 0),
        formatCurrency(p.balance || 0),
        p.completion || "0%",
      ]);
    } else if (reportData.employees && reportData.employees.length > 0) {
      title = "Employees";
      headers = [
        "Name",
        "Role",
        "Department",
        "Attendance",
        "Hours",
        "Projects",
      ];
      rows = reportData.employees.map((e: any) => [
        e.name || "N/A",
        e.role || "N/A",
        e.department || "N/A",
        `${e.attendance?.rate || 0}%`,
        (e.hours_worked || 0).toFixed(2),
        e.projects_assigned || 0,
      ]);
    } else if (reportData.clients && reportData.clients.length > 0) {
      title = "Clients";
      headers = ["Client", "Email", "Projects", "Revenue", "Paid", "Rating"];
      rows = reportData.clients.map((c: any) => [
        c.name || "N/A",
        c.email || "N/A",
        c.total_projects || 0,
        formatCurrency(c.total_revenue || 0),
        formatCurrency(c.total_paid || 0),
        `${(c.average_rating || 0).toFixed(1)} ★`,
      ]);
    } else if (reportData.milestones && reportData.milestones.length > 0) {
      title = "Milestones";
      headers = [
        "Project",
        "Milestone",
        "Status",
        "Progress",
        "Target Date",
        "Overdue",
      ];
      rows = reportData.milestones.map((m: any) => [
        m.project || "N/A",
        m.title || "N/A",
        m.status || "N/A",
        `${m.completion_percentage || 0}%`,
        formatDate(m.target_date),
        m.is_overdue ? `${m.days_delayed || 0} days` : "No",
      ]);
    } else if (
      reportData.payment_details &&
      reportData.payment_details.length > 0
    ) {
      title = "Payment Details";
      headers = [
        "Date",
        "Project",
        "Type",
        "Amount",
        "Method",
        "Transaction ID",
      ];
      rows = reportData.payment_details.map((p: any) => [
        formatDate(p.date),
        p.project || "N/A",
        p.type || "N/A",
        formatCurrency(p.amount || 0),
        p.method || "N/A",
        p.transaction_id || "N/A",
      ]);
    }

    if (rows.length === 0) return null;

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="text-left p-4 font-semibold text-gray-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="p-4 text-gray-700">
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

  // ========== LOADING STATE ==========
  if (typesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Reports</h1>
            <p className="text-gray-600">
              Generate comprehensive business reports
            </p>
          </div>

          {selectedReport && reportData && (
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPrint} />
                Print
              </button>
              <button
                onClick={exportToCSV}
                disabled={isExporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faFileCsv} />
                CSV
              </button>
              <button
                onClick={exportToExcel}
                disabled={isExporting}
                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 flex items-center gap-2 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faFileExcel} />
                Excel
              </button>
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isExporting ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faFilePdf} />
                )}
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Report Type Selection */}
        {!selectedReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes?.map((reportType) => (
              <div
                key={reportType.id}
                onClick={() => handleGenerateReport(reportType.id)}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FontAwesomeIcon
                    icon={iconMapping[reportType.icon]}
                    className="text-2xl text-blue-600"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {reportType.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {reportType.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {reportType.available_formats.map((format) => (
                    <span
                      key={format}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold"
                    >
                      {format.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report View */}
        {selectedReport && (
          <div ref={printRef}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 print:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setReportData(null);
                  }}
                  className="text-gray-600 hover:text-gray-900 print:hidden"
                >
                  ← Back to Reports
                </button>
                <h2 className="text-2xl font-bold text-gray-900">
                  {reportTypes?.find((r) => r.id === selectedReport)?.name}
                </h2>
                <div className="w-32"></div>
              </div>

              {reportData && (
                <p className="text-sm text-gray-600">
                  Generated: {formatDate(reportData.generated_at)}
                </p>
              )}
            </div>

            {isGenerating && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating report...</p>
              </div>
            )}

            {!isGenerating && reportData && (
              <div className="space-y-6">
                {renderSummaryCards()}
                {renderDataTable()}
              </div>
            )}

            {!isGenerating && !reportData && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <FontAwesomeIcon
                  icon={faFileAlt}
                  className="text-6xl text-gray-300 mb-4"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Data
                </h3>
                <p className="text-gray-600">Failed to load report data</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
