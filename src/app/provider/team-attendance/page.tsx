"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardCheck,
  faCalendar,
  faUsers,
  faBriefcase,
  faChevronDown,
  faArrowLeft,
  faCheck,
  faTimes,
  faSpinner,
  faSave,
  faDownload,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faUserCheck,
  faUserXmark,
  faUserClock,
  faHouse,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// ==================================================================================
// TYPES & INTERFACES
// ==================================================================================

interface Project {
  id: number;
  project_name: string;
  client: {
    id: number;
    full_name: string;
  } | null;
  status: string;
}

interface Employee {
  id: number;
  full_name: string;
  initials: string;
  role: string;
  department: string;
  photo: string | null;
  is_active: boolean;
}

interface AttendanceRecord {
  employee_id: number;
  status: "present" | "absent" | "half_day" | "leave";
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
}

interface BulkAttendancePayload {
  attendance_date: string;
  records: AttendanceRecord[];
}

interface BulkAttendanceResponse {
  batch_id: string;
  records_created: number;
  records_updated: number;
  attendance_date: string;
  project_id: number;
  submitted_by: string;
  submitted_at: string;
  details: Array<{
    employee_id: number;
    employee_name: string;
    action: "created" | "updated" | "failed";
    attendance_id?: number;
    error?: string;
  }>;
}

interface AttendanceHistoryRecord {
  id: number;
  project: number;
  project_name: string;
  employee: number;
  employee_name: string;
  employee_role: string;
  employee_department: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: string | null;
  status: "present" | "absent" | "half_day" | "leave";
  notes: string;
  created_at: string;
}

// ==================================================================================
// API FUNCTIONS
// ==================================================================================

async function fetchProjects(): Promise<{ results: Project[] }> {
  const token = getAccessToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`${API_BASE_URL}/api/v1/projects/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to fetch projects");
  return response.json();
}

async function fetchProjectEmployees(
  projectId: number
): Promise<{ results: Employee[] }> {
  const token = getAccessToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/employees/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) throw new Error("Failed to fetch project employees");

  const data = await response.json();
  // Handle both array and object with results
  return Array.isArray(data) ? { results: data } : data;
}

async function submitBulkAttendance(
  projectId: number,
  payload: BulkAttendancePayload
): Promise<BulkAttendanceResponse> {
  const token = getAccessToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/attendance/bulk/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: `HTTP ${response.status} Error` };
    }

    let errorMessage = "Failed to submit attendance";
    if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (errorData.error) {
      errorMessage = errorData.error;
    } else if (typeof errorData === "object") {
      const fieldErrors = Object.entries(errorData)
        .map(([field, messages]) => {
          const msgArray = Array.isArray(messages) ? messages : [messages];
          return `${field}: ${msgArray.join(", ")}`;
        })
        .join("\n");
      if (fieldErrors) errorMessage = fieldErrors;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

async function fetchProjectAttendance(
  projectId: number,
  params?: {
    start_date?: string;
    end_date?: string;
    employee_id?: number;
    status?: string;
  }
): Promise<{ results: AttendanceHistoryRecord[] }> {
  const token = getAccessToken();
  if (!token) throw new Error("No authentication token found");

  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);
  if (params?.employee_id)
    queryParams.append("employee_id", params.employee_id.toString());
  if (params?.status) queryParams.append("status", params.status);

  const url = `${API_BASE_URL}/api/v1/projects/${projectId}/attendance/?${queryParams}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to fetch attendance history");

  const data = await response.json();
  return Array.isArray(data) ? { results: data } : data;
}

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================

export default function AttendancePage() {
  const queryClient = useQueryClient();

  // State
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"mark" | "history">("mark");

  // ==================================================================================
  // QUERIES
  // ==================================================================================

  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  // Fetch employees for selected project
  const {
    data: employeesData,
    isLoading: employeesLoading,
    isError: employeesError,
  } = useQuery({
    queryKey: ["project-employees", selectedProject],
    queryFn: () => fetchProjectEmployees(Number(selectedProject)),
    enabled: !!selectedProject,
  });

  // Fetch attendance history for selected project
  const { data: attendanceHistoryData, isLoading: historyLoading } = useQuery({
    queryKey: ["project-attendance", selectedProject],
    queryFn: () => fetchProjectAttendance(Number(selectedProject)),
    enabled: !!selectedProject && viewMode === "history",
  });

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================

  const submitAttendanceMutation = useMutation({
    mutationFn: async (data: BulkAttendancePayload & { projectId: number }) => {
      return submitBulkAttendance(data.projectId, {
        attendance_date: data.attendance_date,
        records: data.records,
      });
    },
    onSuccess: (response) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["project-attendance", selectedProject],
      });

      // Show success notification
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Log details
      console.log("✅ Attendance submitted successfully:", response);
      console.log(
        `📊 Created: ${response.records_created}, Updated: ${response.records_updated}`
      );

      // Reset form
      resetForm();
    },
    onError: (error: Error) => {
      console.error("❌ Attendance submission error:", error);
      alert(error.message || "Failed to submit attendance");
    },
  });

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    setAttendanceRecords([]);
  };

  const updateAttendanceStatus = (
    employeeId: number,
    status: AttendanceRecord["status"]
  ) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.employee_id === employeeId ? { ...record, status } : record
      )
    );
  };

  const updateAttendanceField = (
    employeeId: number,
    field: keyof AttendanceRecord,
    value: string
  ) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.employee_id === employeeId
          ? { ...record, [field]: value }
          : record
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) {
      alert("Please select a project");
      return;
    }

    if (attendanceRecords.length === 0) {
      alert("No team members to mark attendance for");
      return;
    }

    // Submit attendance
    await submitAttendanceMutation.mutateAsync({
      projectId: Number(selectedProject),
      attendance_date: attendanceDate,
      records: attendanceRecords,
    });
  };

  const resetForm = () => {
    setAttendanceRecords([]);
    // Don't reset project/date, user might want to submit another batch
  };

  const exportAttendance = () => {
    alert("Exporting attendance data to CSV...");
    // TODO: Implement CSV export
  };

  // ==================================================================================
  // DERIVED STATE
  // ==================================================================================

  const projects = projectsData?.results || [];
  const employees = employeesData?.results || [];
  const attendanceHistory = attendanceHistoryData?.results || [];

  const selectedProjectData = projects.find(
    (p) => p.id.toString() === selectedProject
  );

  // Initialize attendance records when employees load
  if (
    selectedProject &&
    employees.length > 0 &&
    attendanceRecords.length === 0
  ) {
    const initialRecords: AttendanceRecord[] = employees.map((employee) => ({
      employee_id: employee.id,
      status: "present",
      check_in_time: "09:00",
      check_out_time: "17:00",
      notes: "",
    }));
    setAttendanceRecords(initialRecords);
  }

  // Calculate statistics
  const calculateStats = () => {
    const stats = {
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      total: attendanceRecords.length,
    };

    attendanceRecords.forEach((record) => {
      switch (record.status) {
        case "present":
          stats.present++;
          break;
        case "absent":
          stats.absent++;
          break;
        case "half_day":
          stats.halfDay++;
          break;
        case "leave":
          stats.leave++;
          break;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  // Group attendance history by date
  const groupedHistory = attendanceHistory.reduce((acc, record) => {
    const date = record.attendance_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, AttendanceHistoryRecord[]>);

  const historyDates = Object.keys(groupedHistory).sort().reverse();

  // Filter history
  const filteredDates = searchQuery
    ? historyDates.filter((date) => {
        const records = groupedHistory[date];
        return records.some(
          (r) =>
            r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.project_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : historyDates;

  const totalPages = Math.ceil(filteredDates.length / 5);
  const paginatedDates = filteredDates.slice(
    (currentPage - 1) * 5,
    currentPage * 5
  );

  // Helper functions
  const getStatusIcon = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return faUserCheck;
      case "absent":
        return faUserXmark;
      case "half_day":
        return faUserClock;
      case "leave":
        return faHouse;
    }
  };

  const getStatusColor = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-700 border-green-300 hover:bg-green-200";
      case "absent":
        return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200";
      case "half_day":
        return "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200";
      case "leave":
        return "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200";
    }
  };

  const getStatusBadgeColor = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return "bg-green-50 text-green-700 border-green-200";
      case "absent":
        return "bg-red-50 text-red-700 border-red-200";
      case "half_day":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "leave":
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getStatusLabel = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return "Present";
      case "absent":
        return "Absent";
      case "half_day":
        return "Half Day";
      case "leave":
        return "On Leave";
    }
  };

  // ==================================================================================
  // LOADING STATE
  // ==================================================================================

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // RENDER
  // ==================================================================================

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
            aria-label="Go back"
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="text-neutral-600 text-lg"
            />
          </button>
          <div className="flex-1">
            <h1 className="heading-2 text-neutral-900 flex items-center gap-3">
              <FontAwesomeIcon
                icon={faClipboardCheck}
                className="text-primary-600"
              />
              Attendance Management
            </h1>
            <p className="text-neutral-600 body-regular mt-1">
              Track team member attendance for projects
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setViewMode("mark")}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              viewMode === "mark"
                ? "bg-primary-600 text-neutral-0 shadow-md"
                : "bg-neutral-0 text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <FontAwesomeIcon icon={faClipboardCheck} className="mr-2" />
            Mark Attendance
          </button>
          <button
            onClick={() => setViewMode("history")}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              viewMode === "history"
                ? "bg-primary-600 text-neutral-0 shadow-md"
                : "bg-neutral-0 text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <FontAwesomeIcon icon={faCalendar} className="mr-2" />
            Attendance History
            {attendanceHistory.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary-500 text-neutral-0 rounded-full text-xs">
                {historyDates.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-8 right-8 z-50 animate-slide-in-right">
          <div className="bg-green-600 text-neutral-0 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} />
            </div>
            <div>
              <p className="font-semibold">Attendance Saved Successfully!</p>
              <p className="text-green-100 text-sm">
                All records have been submitted
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 max-w-7xl mx-auto">
        {viewMode === "mark" ? (
          /* Mark Attendance View */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project & Date Selection */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Selection */}
                <div>
                  <label
                    htmlFor="project"
                    className="block text-neutral-700 font-semibold mb-3 body-small flex items-center gap-2"
                  >
                    <FontAwesomeIcon
                      icon={faBriefcase}
                      className="text-primary-600"
                    />
                    Select Project <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="project"
                      value={selectedProject}
                      onChange={(e) => handleProjectChange(e.target.value)}
                      required
                      className="w-full appearance-none px-4 py-3.5 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                    >
                      <option value="">Choose a project...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project_name} -{" "}
                          {project.client?.full_name || "No client"}
                        </option>
                      ))}
                    </select>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                  </div>
                  {selectedProjectData && (
                    <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                      <p className="text-primary-700 text-sm">
                        <span className="font-semibold">Client:</span>{" "}
                        {selectedProjectData.client?.full_name || "Unassigned"}
                      </p>
                      <p className="text-primary-700 text-sm">
                        <span className="font-semibold">Team Size:</span>{" "}
                        {employees.length} members
                      </p>
                    </div>
                  )}
                </div>

                {/* Date Selection */}
                <div>
                  <label
                    htmlFor="date"
                    className="block text-neutral-700 font-semibold mb-3 body-small flex items-center gap-2"
                  >
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="text-primary-600"
                    />
                    Attendance Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full px-4 py-3.5 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                  <p className="mt-3 text-neutral-500 text-sm flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                    {new Date(attendanceDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            {selectedProject && attendanceRecords.length > 0 && (
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl border border-primary-200 p-6">
                <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faUsers}
                    className="text-primary-600"
                  />
                  Attendance Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-neutral-0 rounded-lg p-4 border border-neutral-200">
                    <p className="text-neutral-600 text-sm mb-1">Total Team</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {stats.total}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-green-700 text-sm mb-1">Present</p>
                    <p className="text-2xl font-bold text-green-700">
                      {stats.present}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-red-700 text-sm mb-1">Absent</p>
                    <p className="text-2xl font-bold text-red-700">
                      {stats.absent}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-yellow-700 text-sm mb-1">Half Day</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {stats.halfDay}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-blue-700 text-sm mb-1">On Leave</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {stats.leave}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Employees */}
            {selectedProject && employeesLoading && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="text-primary-600 text-4xl mb-4 animate-spin"
                />
                <p className="text-neutral-600 font-medium">
                  Loading team members...
                </p>
              </div>
            )}

            {/* Error Loading Employees */}
            {selectedProject && employeesError && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-12 text-center">
                <FontAwesomeIcon
                  icon={faTimes}
                  className="text-red-600 text-4xl mb-4"
                />
                <p className="text-red-600 font-medium">
                  Failed to load team members
                </p>
              </div>
            )}

            {/* Team Members Attendance */}
            {selectedProject &&
            !employeesLoading &&
            !employeesError &&
            employees.length > 0 ? (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
                <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
                  <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faUsers}
                      className="text-primary-600"
                    />
                    Team Members ({employees.length})
                  </h3>
                </div>

                <div className="divide-y divide-neutral-100">
                  {employees.map((employee) => {
                    const record = attendanceRecords.find(
                      (r) => r.employee_id === employee.id
                    );
                    if (!record) return null;

                    return (
                      <div
                        key={employee.id}
                        className="p-6 hover:bg-neutral-50 transition-colors"
                      >
                        {/* Member Info */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center font-semibold text-lg flex-shrink-0">
                            {employee.initials}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900 text-lg">
                              {employee.full_name}
                            </h4>
                            <p className="text-neutral-600 text-sm">
                              {employee.role} • {employee.department}
                            </p>
                          </div>
                        </div>

                        {/* Attendance Status Buttons */}
                        <div className="mb-4">
                          <label className="block text-neutral-700 font-medium mb-2 text-sm">
                            Attendance Status
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                updateAttendanceStatus(employee.id, "present")
                              }
                              className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                                record.status === "present"
                                  ? "bg-green-600 text-neutral-0 border-green-600 shadow-md"
                                  : getStatusColor("present")
                              }`}
                            >
                              <FontAwesomeIcon icon={faUserCheck} />
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateAttendanceStatus(employee.id, "absent")
                              }
                              className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                                record.status === "absent"
                                  ? "bg-red-600 text-neutral-0 border-red-600 shadow-md"
                                  : getStatusColor("absent")
                              }`}
                            >
                              <FontAwesomeIcon icon={faUserXmark} />
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateAttendanceStatus(employee.id, "half_day")
                              }
                              className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                                record.status === "half_day"
                                  ? "bg-yellow-600 text-neutral-0 border-yellow-600 shadow-md"
                                  : getStatusColor("half_day")
                              }`}
                            >
                              <FontAwesomeIcon icon={faUserClock} />
                              Half Day
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateAttendanceStatus(employee.id, "leave")
                              }
                              className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                                record.status === "leave"
                                  ? "bg-blue-600 text-neutral-0 border-blue-600 shadow-md"
                                  : getStatusColor("leave")
                              }`}
                            >
                              <FontAwesomeIcon icon={faHouse} />
                              On Leave
                            </button>
                          </div>
                        </div>

                        {/* Time Fields (only for present or half_day) */}
                        {(record.status === "present" ||
                          record.status === "half_day") && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-neutral-700 font-medium mb-2 text-sm">
                                Check-in Time
                              </label>
                              <input
                                type="time"
                                value={record.check_in_time || ""}
                                onChange={(e) =>
                                  updateAttendanceField(
                                    employee.id,
                                    "check_in_time",
                                    e.target.value
                                  )
                                }
                                className="w-full px-4 py-2.5 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-neutral-700 font-medium mb-2 text-sm">
                                Check-out Time
                              </label>
                              <input
                                type="time"
                                value={record.check_out_time || ""}
                                onChange={(e) =>
                                  updateAttendanceField(
                                    employee.id,
                                    "check_out_time",
                                    e.target.value
                                  )
                                }
                                className="w-full px-4 py-2.5 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                              />
                            </div>
                          </div>
                        )}

                        {/* Notes Field */}
                        <div>
                          <label className="block text-neutral-700 font-medium mb-2 text-sm">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={record.notes || ""}
                            onChange={(e) =>
                              updateAttendanceField(
                                employee.id,
                                "notes",
                                e.target.value
                              )
                            }
                            placeholder="Add any additional notes or remarks..."
                            rows={2}
                            className="w-full px-4 py-2.5 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              selectedProject &&
              !employeesLoading &&
              !employeesError &&
              employees.length === 0 && (
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
                  <FontAwesomeIcon
                    icon={faUsers}
                    className="text-5xl text-neutral-300 mb-4"
                  />
                  <p className="text-neutral-600 font-medium">
                    No team members assigned to this project
                  </p>
                  <p className="text-neutral-500 text-sm mt-2">
                    Please assign employees to this project first
                  </p>
                </div>
              )
            )}

            {/* Submit Button */}
            {selectedProject && employees.length > 0 && (
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to discard attendance data?"
                      )
                    ) {
                      setSelectedProject("");
                      setAttendanceRecords([]);
                    }
                  }}
                  className="px-6 py-3 border-2 border-neutral-200 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitAttendanceMutation.isPending}
                  className="btn-primary-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-center"
                >
                  {submitAttendanceMutation.isPending ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} />
                      Save Attendance
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Helper Tips */}
            {!selectedProject && (
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl border border-primary-200 p-6">
                <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faClipboardCheck}
                    className="text-primary-600"
                  />
                  Quick Guide
                </h3>
                <ul className="space-y-2 text-neutral-700 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>Select a project to view its team members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>
                      Mark attendance status for each team member (Present,
                      Absent, Half Day, or On Leave)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>
                      Add check-in and check-out times for present members
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>
                      Add optional notes for special circumstances or remarks
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </form>
        ) : (
          /* Attendance History View */
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Search by employee or project name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>
                <button
                  onClick={exportAttendance}
                  className="btn-primary flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Export
                </button>
              </div>
            </div>

            {/* Loading History */}
            {historyLoading && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="text-primary-600 text-4xl mb-4 animate-spin"
                />
                <p className="text-neutral-600 font-medium">
                  Loading attendance history...
                </p>
              </div>
            )}

            {/* History List */}
            {!historyLoading && paginatedDates.length > 0 ? (
              <div className="space-y-4">
                {paginatedDates.map((date) => {
                  const records = groupedHistory[date];
                  const presentCount = records.filter(
                    (r) => r.status === "present"
                  ).length;
                  const absentCount = records.filter(
                    (r) => r.status === "absent"
                  ).length;

                  return (
                    <div
                      key={date}
                      className="bg-neutral-0 rounded-xl border border-neutral-200 hover:border-primary-500 transition-all overflow-hidden"
                    >
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center font-semibold text-sm">
                                {selectedProjectData?.project_name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-neutral-900">
                                  {selectedProjectData?.project_name}
                                </h3>
                                <p className="text-neutral-500 text-sm">
                                  {selectedProjectData?.client?.full_name ||
                                    "No client"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-neutral-600 text-sm mb-1">
                              <FontAwesomeIcon
                                icon={faCalendar}
                                className="text-xs"
                              />
                              <span>
                                {new Date(date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                            <p className="text-neutral-600 text-xs mb-1">
                              Total
                            </p>
                            <p className="text-lg font-bold text-neutral-900">
                              {records.length}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <p className="text-green-700 text-xs mb-1">
                              Present
                            </p>
                            <p className="text-lg font-bold text-green-700">
                              {presentCount}
                            </p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <p className="text-red-700 text-xs mb-1">Absent</p>
                            <p className="text-lg font-bold text-red-700">
                              {absentCount}
                            </p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-blue-700 text-xs mb-1">Others</p>
                            <p className="text-lg font-bold text-blue-700">
                              {records.length - presentCount - absentCount}
                            </p>
                          </div>
                        </div>

                        {/* Team Members Details */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                            Team Members
                          </h4>
                          <div className="space-y-2">
                            {records.map((record) => {
                              const employee = employees.find(
                                (e) => e.id === record.employee
                              );

                              return (
                                <div
                                  key={record.id}
                                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center font-semibold text-xs">
                                      {employee?.initials ||
                                        record.employee_name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                    </div>
                                    <div>
                                      <p className="font-medium text-neutral-900 text-sm">
                                        {record.employee_name}
                                      </p>
                                      <p className="text-neutral-500 text-xs">
                                        {record.employee_role}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {record.check_in_time &&
                                      record.check_out_time && (
                                        <span className="text-neutral-600 text-xs">
                                          {record.check_in_time} -{" "}
                                          {record.check_out_time}
                                        </span>
                                      )}
                                    <span
                                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusBadgeColor(
                                        record.status
                                      )}`}
                                    >
                                      <FontAwesomeIcon
                                        icon={getStatusIcon(record.status)}
                                        className="mr-1"
                                      />
                                      {getStatusLabel(record.status)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-neutral-0 rounded-xl border border-neutral-200 px-6 py-4">
                    <p className="text-neutral-600 text-sm">
                      Showing {(currentPage - 1) * 5 + 1}-
                      {Math.min(currentPage * 5, filteredDates.length)} of{" "}
                      {filteredDates.length} records
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                      >
                        <FontAwesomeIcon
                          icon={faChevronLeft}
                          className="text-neutral-600"
                        />
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === i + 1
                              ? "bg-primary-600 text-neutral-0"
                              : "bg-neutral-0 text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                      >
                        <FontAwesomeIcon
                          icon={faChevronRight}
                          className="text-neutral-600"
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !historyLoading && (
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
                  <FontAwesomeIcon
                    icon={faClipboardCheck}
                    className="text-5xl text-neutral-300 mb-4"
                  />
                  <p className="text-neutral-600 font-medium">
                    No attendance records found
                  </p>
                  <p className="text-neutral-500 text-sm mt-2">
                    {selectedProject
                      ? "Start marking attendance to see records here"
                      : "Select a project to view attendance history"}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
