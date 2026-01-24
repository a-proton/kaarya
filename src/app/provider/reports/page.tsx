"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faDownload,
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
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  [key: string]: any;
}

interface ReportFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  employee_id?: number;
  project_id?: number;
  client_id?: number;
}

interface Client {
  id: number;
  name: string;
  email: string;
}

// ========== ICON MAPPING ==========
const iconMapping: { [key: string]: any } = {
  faProjectDiagram: faProjectDiagram,
  faChartLine: faChartLine,
  faUsers: faUsers,
  faUserTie: faUserTie,
  faCheckCircle: faCheckCircle,
};

const formatIconMapping: { [key: string]: any } = {
  pdf: faFilePdf,
  excel: faFileExcel,
  csv: faFileCsv,
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

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }
  return "http://localhost:8000";
};

export default function ReportsPage() {
  const router = useRouter();

  // ========== STATE ==========
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    start_date: "2020-01-01",
    end_date: "2030-12-31",
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  // ========== AUTHENTICATION CHECK ==========
  useEffect(() => {
    if (!isAuthenticated()) {
      console.log("❌ Not authenticated, redirecting...");
      router.push("/login?type=service_provider&session=expired");
    } else {
      console.log("✅ User is authenticated");
    }
  }, [router]);

  // ========== API QUERIES ==========

  // Fetch available report types
  const {
    data: reportTypes,
    isLoading: typesLoading,
    error: typesError,
  } = useQuery({
    queryKey: ["report-types"],
    queryFn: async () => {
      if (!isAuthenticated()) {
        router.push("/login?type=service_provider&session=expired");
        throw new Error("Not authenticated");
      }
      console.log("🔍 Fetching report types...");
      const data = await api.get<ReportType[]>("/api/v1/reports/types/");
      console.log("✅ Report types received:", data);
      return data;
    },
    retry: 1,
  });

  // Fetch clients for dropdown
  const { data: clientsList } = useQuery({
    queryKey: ["clients-for-reports"],
    queryFn: async () => {
      if (!isAuthenticated()) {
        return [];
      }
      console.log("🔍 Fetching clients for reports...");
      const data = await api.get<Client[]>("/api/v1/reports/clients/");
      console.log("✅ Clients received:", data);
      return data;
    },
    retry: 1,
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      filters,
    }: {
      reportId: string;
      filters: ReportFilters;
    }) => {
      console.log("🔍 Generating report:", reportId, "with filters:", filters);

      const queryParams = new URLSearchParams();

      if (filters.start_date)
        queryParams.append("start_date", filters.start_date);
      if (filters.end_date) queryParams.append("end_date", filters.end_date);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.employee_id)
        queryParams.append("employee_id", filters.employee_id.toString());
      if (filters.project_id)
        queryParams.append("project_id", filters.project_id.toString());
      if (filters.client_id)
        queryParams.append("client_id", filters.client_id.toString());

      const data = await api.get<ReportData>(
        `/api/v1/reports/${reportId}/?${queryParams.toString()}`,
      );

      console.log("✅ Report data received:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("=== REPORT DATA RECEIVED ===");
      console.log("Report type:", data.report_type);
      console.log("Summary:", data.summary);
      console.log("Full data:", JSON.stringify(data, null, 2));
      console.log("========================");
      setReportData(data);
    },
    onError: (error: any) => {
      console.error("❌ Report generation error:", error);
      alert(error.message || "Failed to generate report");
    },
  });

  // Export report mutation
  const exportReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      format,
      filters,
    }: {
      reportId: string;
      format: string;
      filters: ReportFilters;
    }) => {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/v1/reports/${reportId}/export/`;

      console.log("📥 Exporting to:", url);

      let token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          format,
          ...filters,
        }),
      });

      // Handle 401 - try to refresh token
      if (response.status === 401) {
        console.log("🔄 Token expired, attempting refresh...");

        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("Session expired. Please log in again.");
        }

        try {
          const refreshResponse = await fetch(
            `${baseUrl}/api/v1/auth/token/refresh/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                refresh: refreshToken,
              }),
            },
          );

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem("accessToken", refreshData.access);

            // Retry the export with new token
            const retryResponse = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${refreshData.access}`,
              },
              body: JSON.stringify({
                format,
                ...filters,
              }),
            });

            if (!retryResponse.ok) {
              const error = await retryResponse
                .json()
                .catch(() => ({ error: "Export failed after token refresh" }));
              throw new Error(error.error || "Export failed");
            }

            const contentDisposition = retryResponse.headers.get(
              "content-disposition",
            );
            let filename = `report.${format === "excel" ? "xlsx" : format}`;
            if (contentDisposition) {
              const filenameMatch =
                contentDisposition.match(/filename="?(.+)"?/);
              if (filenameMatch) {
                filename = filenameMatch[1];
              }
            }

            const blob = await retryResponse.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            return;
          } else {
            throw new Error("Session expired. Please log in again.");
          }
        } catch (refreshError) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          router.push("/login?type=service_provider&session=expired");
          throw new Error("Session expired. Please log in again.");
        }
      }

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Export failed" }));
        throw new Error(error.error || "Export failed");
      }

      // Get filename from header or use default
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `report.${format === "excel" ? "xlsx" : format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      console.log("✅ Export successful");
      setExportingFormat(null);
    },
    onError: (error: any) => {
      console.error("❌ Export error:", error);
      setExportingFormat(null);
      alert(error.message || "Failed to export report");
    },
  });

  // ========== EVENT HANDLERS ==========

  const handleGenerateReport = (reportId: string) => {
    console.log("📊 Generating report:", reportId);
    setSelectedReport(reportId);
    setReportData(null);
    generateReportMutation.mutate({ reportId, filters });
  };

  const handleExport = (format: string) => {
    if (!selectedReport) return;
    console.log("📥 Exporting report in format:", format);
    setExportingFormat(format);
    exportReportMutation.mutate({
      reportId: selectedReport,
      format,
      filters,
    });
  };

  const handleFilterChange = (field: string, value: any) => {
    console.log("🔧 Filter changed:", field, "=", value);
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    console.log("✅ Applying filters:", filters);
    if (selectedReport) {
      generateReportMutation.mutate({ reportId: selectedReport, filters });
    }
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    console.log("🔄 Resetting filters");
    setFilters({
      start_date: "2020-01-01",
      end_date: "2030-12-31",
    });
  };

  // ========== RENDER FUNCTIONS ==========

  const renderSummaryCards = (summary: any) => {
    if (!summary) return null;

    if (reportData?.report_type === "Projects Summary") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="text-blue-600 text-sm font-semibold mb-1">
              Total Projects
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {summary.total_projects || 0}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="text-green-600 text-sm font-semibold mb-1">
              Total Revenue
            </div>
            <div className="text-3xl font-bold text-green-900">
              {formatCurrency(summary.total_revenue || 0)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="text-purple-600 text-sm font-semibold mb-1">
              Received
            </div>
            <div className="text-3xl font-bold text-purple-900">
              {formatCurrency(summary.total_received || 0)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="text-orange-600 text-sm font-semibold mb-1">
              Pending
            </div>
            <div className="text-3xl font-bold text-orange-900">
              {formatCurrency(summary.total_pending || 0)}
            </div>
          </div>
        </div>
      );
    }

    if (reportData?.report_type === "Financial Report") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="text-green-600 text-sm font-semibold mb-1">
              Total Income
            </div>
            <div className="text-3xl font-bold text-green-900">
              {formatCurrency(summary.total_income || 0)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="text-red-600 text-sm font-semibold mb-1">
              Total Expenses
            </div>
            <div className="text-3xl font-bold text-red-900">
              {formatCurrency(summary.total_expenses || 0)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="text-blue-600 text-sm font-semibold mb-1">
              Net Profit
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {formatCurrency(summary.net_profit || 0)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="text-purple-600 text-sm font-semibold mb-1">
              Profit Margin
            </div>
            <div className="text-3xl font-bold text-purple-900">
              {summary.profit_margin || 0}%
            </div>
          </div>
        </div>
      );
    }

    if (reportData?.report_type === "Employee Performance") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="text-blue-600 text-sm font-semibold mb-1">
              Total Employees
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {summary.total_employees || 0}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="text-green-600 text-sm font-semibold mb-1">
              Avg Attendance Rate
            </div>
            <div className="text-3xl font-bold text-green-900">
              {summary.avg_attendance_rate || 0}%
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="text-purple-600 text-sm font-semibold mb-1">
              Total Hours Worked
            </div>
            <div className="text-3xl font-bold text-purple-900">
              {(summary.total_hours_worked || 0).toLocaleString()}
            </div>
          </div>
        </div>
      );
    }

    if (reportData?.report_type === "Client Analysis") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="text-blue-600 text-sm font-semibold mb-1">
              Total Clients
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {summary.total_clients || 0}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="text-green-600 text-sm font-semibold mb-1">
              Total Revenue
            </div>
            <div className="text-3xl font-bold text-green-900">
              {formatCurrency(summary.total_revenue || 0)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="text-purple-600 text-sm font-semibold mb-1">
              Avg Revenue/Client
            </div>
            <div className="text-3xl font-bold text-purple-900">
              {formatCurrency(summary.avg_revenue_per_client || 0)}
            </div>
          </div>
        </div>
      );
    }

    if (reportData?.report_type === "Milestone Completion") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="text-blue-600 text-sm font-semibold mb-1">
              Total Milestones
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {summary.total_milestones || 0}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="text-green-600 text-sm font-semibold mb-1">
              Completed
            </div>
            <div className="text-3xl font-bold text-green-900">
              {summary.completed || 0}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="text-purple-600 text-sm font-semibold mb-1">
              Completion Rate
            </div>
            <div className="text-3xl font-bold text-purple-900">
              {summary.completion_rate || 0}%
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderProjectsTable = (projects: any[]) => {
    if (!projects || projects.length === 0) {
      return (
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-8 text-center">
          <p className="text-neutral-600">No projects found</p>
        </div>
      );
    }

    return (
      <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-secondary-50">
          <h3 className="heading-4">Project Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="text-left p-4 font-semibold text-neutral-700">
                  Project
                </th>
                <th className="text-left p-4 font-semibold text-neutral-700">
                  Client
                </th>
                <th className="text-left p-4 font-semibold text-neutral-700">
                  Status
                </th>
                <th className="text-right p-4 font-semibold text-neutral-700">
                  Total Cost
                </th>
                <th className="text-right p-4 font-semibold text-neutral-700">
                  Received
                </th>
                <th className="text-right p-4 font-semibold text-neutral-700">
                  Balance
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Completion
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr
                  key={project.id || index}
                  className="border-t border-neutral-200 hover:bg-neutral-50"
                >
                  <td className="p-4">
                    <div className="font-semibold text-neutral-900">
                      {project.name || "Unnamed Project"}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {project.milestones || "0"} milestones
                    </div>
                  </td>
                  <td className="p-4 text-neutral-700">
                    {project.client || "N/A"}
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {project.status || "Unknown"}
                    </span>
                  </td>
                  <td className="p-4 text-right font-semibold text-neutral-900">
                    {formatCurrency(project.total_cost || 0)}
                  </td>
                  <td className="p-4 text-right text-green-600 font-semibold">
                    {formatCurrency(project.received || 0)}
                  </td>
                  <td className="p-4 text-right text-orange-600 font-semibold">
                    {formatCurrency(project.balance || 0)}
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-semibold text-neutral-900">
                      {project.completion || "0%"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderEmployeeTable = (employees: any[]) => {
    if (!employees || employees.length === 0) {
      return (
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-8 text-center">
          <p className="text-neutral-600">No employees found</p>
        </div>
      );
    }

    return (
      <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-secondary-50">
          <h3 className="heading-4">Employee Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="text-left p-4 font-semibold text-neutral-700">
                  Employee
                </th>
                <th className="text-left p-4 font-semibold text-neutral-700">
                  Role
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Total Days
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Present
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Absent
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Attendance Rate
                </th>
                <th className="text-right p-4 font-semibold text-neutral-700">
                  Hours Worked
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Projects
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => (
                <tr
                  key={emp.id || index}
                  className="border-t border-neutral-200 hover:bg-neutral-50"
                >
                  <td className="p-4">
                    <div className="font-semibold text-neutral-900">
                      {emp.name || "Unknown"}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {emp.department || "N/A"}
                    </div>
                  </td>
                  <td className="p-4 text-neutral-700">{emp.role || "N/A"}</td>
                  <td className="p-4 text-center text-neutral-900">
                    {emp.attendance?.total_days || 0}
                  </td>
                  <td className="p-4 text-center text-green-600 font-semibold">
                    {emp.attendance?.present || 0}
                  </td>
                  <td className="p-4 text-center text-red-600 font-semibold">
                    {emp.attendance?.absent || 0}
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-semibold text-neutral-900">
                      {emp.attendance?.rate || 0}%
                    </span>
                  </td>
                  <td className="p-4 text-right font-semibold text-neutral-900">
                    {(emp.hours_worked || 0).toFixed(2)}
                  </td>
                  <td className="p-4 text-center text-blue-600 font-semibold">
                    {emp.projects_assigned || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderClientTable = (clients: any[]) => {
    if (!clients || clients.length === 0) {
      return (
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-8 text-center">
          <p className="text-neutral-600">No clients found</p>
        </div>
      );
    }

    return (
      <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-secondary-50">
          <h3 className="heading-4">Client Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="text-left p-4 font-semibold text-neutral-700">
                  Client
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Total Projects
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Completed
                </th>
                <th className="text-right p-4 font-semibold text-neutral-700">
                  Total Revenue
                </th>
                <th className="text-right p-4 font-semibold text-neutral-700">
                  Total Paid
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Avg Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr
                  key={client.id || index}
                  className="border-t border-neutral-200 hover:bg-neutral-50"
                >
                  <td className="p-4">
                    <div className="font-semibold text-neutral-900">
                      {client.name || "Unknown"}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {client.email || "N/A"}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {client.phone || "N/A"}
                    </div>
                  </td>
                  <td className="p-4 text-center text-neutral-900 font-semibold">
                    {client.total_projects || 0}
                  </td>
                  <td className="p-4 text-center text-green-600 font-semibold">
                    {client.completed_projects || 0}
                  </td>
                  <td className="p-4 text-right text-neutral-900 font-semibold">
                    {formatCurrency(client.total_revenue || 0)}
                  </td>
                  <td className="p-4 text-right text-green-600 font-semibold">
                    {formatCurrency(client.total_paid || 0)}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-semibold text-neutral-900">
                        {(client.average_rating || 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-neutral-500">
                        ({client.review_count || 0})
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMilestoneTable = (milestones: any[]) => {
    if (!milestones || milestones.length === 0) {
      return (
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-8 text-center">
          <p className="text-neutral-600">No milestones found</p>
        </div>
      );
    }

    return (
      <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-secondary-50">
          <h3 className="heading-4">Milestone Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="text-left p-4 font-semibold text-neutral-700">
                  Project
                </th>
                <th className="text-left p-4 font-semibold text-neutral-700">
                  Milestone
                </th>
                <th className="text-left p-4 font-semibold text-neutral-700">
                  Status
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Target Date
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Progress
                </th>
                <th className="text-center p-4 font-semibold text-neutral-700">
                  Overdue
                </th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone, index) => (
                <tr
                  key={milestone.id || index}
                  className="border-t border-neutral-200 hover:bg-neutral-50"
                >
                  <td className="p-4 text-neutral-900 font-semibold">
                    {milestone.project || "N/A"}
                  </td>
                  <td className="p-4 text-neutral-700">
                    {milestone.title || "N/A"}
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {milestone.status || "Unknown"}
                    </span>
                  </td>
                  <td className="p-4 text-center text-neutral-700">
                    {formatDate(milestone.target_date)}
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-semibold text-neutral-900">
                      {milestone.completion_percentage || 0}%
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {milestone.is_overdue ? (
                      <span className="text-red-600 font-semibold">
                        {milestone.days_delayed || 0} days
                      </span>
                    ) : (
                      <span className="text-green-600">On track</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    console.log("📊 Rendering report content for:", reportData.report_type);

    return (
      <div className="space-y-6">
        {/* Render summary cards */}
        {renderSummaryCards(reportData.summary)}

        {/* Projects Summary Report */}
        {reportData.report_type === "Projects Summary" &&
          reportData.projects &&
          reportData.projects.length > 0 &&
          renderProjectsTable(reportData.projects)}

        {/* Employee Performance Report */}
        {reportData.report_type === "Employee Performance" &&
          reportData.employees &&
          reportData.employees.length > 0 &&
          renderEmployeeTable(reportData.employees)}

        {/* Client Analysis Report */}
        {reportData.report_type === "Client Analysis" &&
          reportData.clients &&
          reportData.clients.length > 0 &&
          renderClientTable(reportData.clients)}

        {/* Milestone Completion Report */}
        {reportData.report_type === "Milestone Completion" &&
          reportData.milestones &&
          reportData.milestones.length > 0 &&
          renderMilestoneTable(reportData.milestones)}

        {/* Financial Report - Payment Details */}
        {reportData.report_type === "Financial Report" &&
          reportData.payment_details &&
          reportData.payment_details.length > 0 && (
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
              <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-secondary-50">
                <h3 className="heading-4">Payment Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="text-left p-4 font-semibold text-neutral-700">
                        Date
                      </th>
                      <th className="text-left p-4 font-semibold text-neutral-700">
                        Project
                      </th>
                      <th className="text-left p-4 font-semibold text-neutral-700">
                        Type
                      </th>
                      <th className="text-right p-4 font-semibold text-neutral-700">
                        Amount
                      </th>
                      <th className="text-left p-4 font-semibold text-neutral-700">
                        Method
                      </th>
                      <th className="text-left p-4 font-semibold text-neutral-700">
                        Transaction ID
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.payment_details.map(
                      (payment: any, idx: number) => (
                        <tr
                          key={idx}
                          className="border-t border-neutral-200 hover:bg-neutral-50"
                        >
                          <td className="p-4 text-neutral-700">
                            {formatDate(payment.date)}
                          </td>
                          <td className="p-4 text-neutral-900 font-semibold">
                            {payment.project || "N/A"}
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {payment.type || "Unknown"}
                            </span>
                          </td>
                          <td className="p-4 text-right font-semibold text-green-600">
                            {formatCurrency(payment.amount || 0)}
                          </td>
                          <td className="p-4 text-neutral-700">
                            {payment.method || "N/A"}
                          </td>
                          <td className="p-4 text-neutral-700">
                            {payment.transaction_id || "N/A"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    );
  };

  // ========== LOADING & ERROR STATES ==========

  if (typesLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (typesError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-red-600 text-2xl"
            />
            <h3 className="text-red-800 font-semibold">
              Error Loading Reports
            </h3>
          </div>
          <p className="text-red-600 mb-4">
            {(typesError as any)?.message || "Unknown error"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary w-full"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-neutral-900 mb-1">Reports</h1>
            <p className="text-neutral-600 body-regular">
              Generate comprehensive reports for your business
            </p>
          </div>

          {selectedReport && reportData && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faFilter} />
                Filters
                <FontAwesomeIcon
                  icon={showFilters ? faChevronUp : faChevronDown}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Filters Panel */}
        {showFilters && selectedReport && (
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-4">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="mr-2 text-primary-600"
                  />
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.start_date || ""}
                  onChange={(e) =>
                    handleFilterChange("start_date", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="mr-2 text-primary-600"
                  />
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.end_date || ""}
                  onChange={(e) =>
                    handleFilterChange("end_date", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {selectedReport === "projects-summary" && (
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Status
                  </label>
                  <select
                    value={filters.status || ""}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
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

              {selectedReport === "client-analysis" && clientsList && (
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    <FontAwesomeIcon
                      icon={faUserTie}
                      className="mr-2 text-primary-600"
                    />
                    Select Client
                  </label>
                  <select
                    value={filters.client_id || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "client_id",
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                  >
                    <option value="">All Clients</option>
                    {clientsList.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleApplyFilters} className="btn-primary">
                Apply Filters
              </button>
              <button onClick={handleResetFilters} className="btn-secondary">
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Report Type Selection */}
        {!selectedReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes?.map((reportType) => (
              <div
                key={reportType.id}
                className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleGenerateReport(reportType.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={iconMapping[reportType.icon]}
                      className="text-2xl text-primary-600"
                    />
                  </div>
                </div>

                <h3 className="heading-4 mb-2">{reportType.name}</h3>
                <p className="text-neutral-600 text-sm mb-4">
                  {reportType.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {reportType.available_formats.map((format) => (
                    <span
                      key={format}
                      className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-semibold flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={formatIconMapping[format]} />
                      {format.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Report View */}
        {selectedReport && (
          <div>
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedReport(null);
                      setReportData(null);
                    }}
                    className="text-neutral-600 hover:text-neutral-900"
                  >
                    ← Back to Reports
                  </button>
                  <div className="h-6 w-px bg-neutral-300"></div>
                  <h2 className="heading-3">
                    {reportTypes?.find((r) => r.id === selectedReport)?.name}
                  </h2>
                </div>

                {reportData && (
                  <div className="flex items-center gap-3">
                    {reportTypes
                      ?.find((r) => r.id === selectedReport)
                      ?.available_formats.map((format) => (
                        <button
                          key={format}
                          onClick={() => handleExport(format)}
                          disabled={exportingFormat === format}
                          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                        >
                          {exportingFormat === format ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <FontAwesomeIcon icon={formatIconMapping[format]} />
                          )}
                          Export {format.toUpperCase()}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {reportData && (
                <div className="text-sm text-neutral-600">
                  Generated: {formatDateTime(reportData.generated_at)}
                </div>
              )}
            </div>

            {generateReportMutation.isPending && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-neutral-600">Generating report...</p>
              </div>
            )}

            {!generateReportMutation.isPending &&
              reportData &&
              renderReportContent()}

            {!generateReportMutation.isPending && !reportData && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
                <FontAwesomeIcon
                  icon={faFileAlt}
                  className="text-6xl text-neutral-300 mb-4"
                />
                <h3 className="heading-4 text-neutral-900 mb-2">
                  No Report Generated
                </h3>
                <p className="text-neutral-600">
                  Click "Apply Filters" to generate this report
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

