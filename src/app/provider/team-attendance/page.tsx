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
  faCircleHalfStroke,
  faBed,
  faSpinner,
  faSave,
  faDownload,
  faFilter,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faUserCheck,
  faUserXmark,
  faUserClock,
  faHouse,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  client: string;
  category: string;
  teamMembers: string[];
}

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  color: string;
}

interface AttendanceRecord {
  memberId: string;
  status: "present" | "absent" | "half-day" | "on-leave";
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

interface DailyAttendance {
  id: string;
  projectId: string;
  date: string;
  records: AttendanceRecord[];
  submittedBy: string;
  submittedAt: Date;
}

export default function AttendancePage() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedAttendance, setSavedAttendance] = useState<DailyAttendance[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"mark" | "history">("mark");

  // Sample projects
  const projects: Project[] = [
    {
      id: "1",
      name: "Kitchen Renovation",
      client: "Sarah Johnson",
      category: "Renovation",
      teamMembers: ["1", "2", "3", "6"],
    },
    {
      id: "2",
      name: "Bathroom Upgrade",
      client: "David Martinez",
      category: "Plumbing",
      teamMembers: ["3", "5", "7"],
    },
    {
      id: "3",
      name: "Electrical Panel Upgrade",
      client: "Jennifer White",
      category: "Electrical",
      teamMembers: ["2", "5", "6"],
    },
    {
      id: "4",
      name: "HVAC System Installation",
      client: "Michael Brown",
      category: "HVAC",
      teamMembers: ["4", "5", "7"],
    },
    {
      id: "5",
      name: "Garden & Landscape Design",
      client: "Robert Anderson",
      category: "Landscaping",
      teamMembers: ["7", "1"],
    },
  ];

  // All team members
  const allTeamMembers: TeamMember[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      initials: "SJ",
      role: "Project Manager",
      department: "Operations",
      color: "bg-primary-600",
    },
    {
      id: "2",
      name: "Michael Rodriguez",
      initials: "MR",
      role: "Electrician",
      department: "Technical",
      color: "bg-secondary-600",
    },
    {
      id: "3",
      name: "Jennifer Davis",
      initials: "JD",
      role: "Plumber",
      department: "Technical",
      color: "bg-yellow-600",
    },
    {
      id: "4",
      name: "David Martinez",
      initials: "DM",
      role: "HVAC Specialist",
      department: "Technical",
      color: "bg-purple-600",
    },
    {
      id: "5",
      name: "Jennifer White",
      initials: "JW",
      role: "Supervisor",
      department: "Operations",
      color: "bg-blue-600",
    },
    {
      id: "6",
      name: "Thomas Kim",
      initials: "TK",
      role: "Carpenter",
      department: "Technical",
      color: "bg-green-600",
    },
    {
      id: "7",
      name: "Robert Anderson",
      initials: "RA",
      role: "Landscaper",
      department: "Outdoor Services",
      color: "bg-teal-600",
    },
  ];

  // Get team members for selected project
  const selectedProjectData = projects.find((p) => p.id === selectedProject);
  const projectTeamMembers = selectedProjectData
    ? allTeamMembers.filter((member) =>
        selectedProjectData.teamMembers.includes(member.id)
      )
    : [];

  // Initialize attendance records when project is selected
  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      const initialRecords: AttendanceRecord[] = project.teamMembers.map(
        (memberId) => ({
          memberId,
          status: "present",
          checkInTime: "09:00",
          checkOutTime: "17:00",
          notes: "",
        })
      );
      setAttendanceRecords(initialRecords);
    }
  };

  const updateAttendanceStatus = (
    memberId: string,
    status: AttendanceRecord["status"]
  ) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.memberId === memberId ? { ...record, status } : record
      )
    );
  };

  const updateAttendanceField = (
    memberId: string,
    field: keyof AttendanceRecord,
    value: string
  ) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.memberId === memberId ? { ...record, [field]: value } : record
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) {
      alert("Please select a project");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newAttendance: DailyAttendance = {
        id: Date.now().toString(),
        projectId: selectedProject,
        date: attendanceDate,
        records: attendanceRecords,
        submittedBy: "Current User",
        submittedAt: new Date(),
      };

      setSavedAttendance((prev) => [newAttendance, ...prev]);
      console.log("Attendance Submitted:", newAttendance);

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setIsSubmitting(false);
    }, 1500);
  };

  const getStatusIcon = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return faUserCheck;
      case "absent":
        return faUserXmark;
      case "half-day":
        return faUserClock;
      case "on-leave":
        return faHouse;
    }
  };

  const getStatusColor = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-700 border-green-300 hover:bg-green-200";
      case "absent":
        return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200";
      case "half-day":
        return "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200";
      case "on-leave":
        return "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200";
    }
  };

  const getStatusBadgeColor = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return "bg-green-50 text-green-700 border-green-200";
      case "absent":
        return "bg-red-50 text-red-700 border-red-200";
      case "half-day":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "on-leave":
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getStatusLabel = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return "Present";
      case "absent":
        return "Absent";
      case "half-day":
        return "Half Day";
      case "on-leave":
        return "On Leave";
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const stats = {
      present: 0,
      absent: 0,
      halfDay: 0,
      onLeave: 0,
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
        case "half-day":
          stats.halfDay++;
          break;
        case "on-leave":
          stats.onLeave++;
          break;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  // Filter history
  const filteredHistory = savedAttendance.filter((attendance) => {
    const project = projects.find((p) => p.id === attendance.projectId);
    if (searchQuery && project) {
      return project.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const totalPages = Math.ceil(filteredHistory.length / 5);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * 5,
    currentPage * 5
  );

  const exportAttendance = () => {
    alert("Exporting attendance data to CSV...");
    // Implementation for CSV export would go here
  };

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
            {savedAttendance.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary-500 text-neutral-0 rounded-full text-xs">
                {savedAttendance.length}
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
                          {project.name} - {project.client}
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
                        <span className="font-semibold">Category:</span>{" "}
                        {selectedProjectData.category}
                      </p>
                      <p className="text-primary-700 text-sm">
                        <span className="font-semibold">Team Size:</span>{" "}
                        {selectedProjectData.teamMembers.length} members
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
                      {stats.onLeave}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Team Members Attendance */}
            {selectedProject && projectTeamMembers.length > 0 ? (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
                <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
                  <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faUsers}
                      className="text-primary-600"
                    />
                    Team Members ({projectTeamMembers.length})
                  </h3>
                </div>

                <div className="divide-y divide-neutral-100">
                  {projectTeamMembers.map((member) => {
                    const record = attendanceRecords.find(
                      (r) => r.memberId === member.id
                    );
                    if (!record) return null;

                    return (
                      <div
                        key={member.id}
                        className="p-6 hover:bg-neutral-50 transition-colors"
                      >
                        {/* Member Info */}
                        <div className="flex items-start gap-4 mb-4">
                          <div
                            className={`w-14 h-14 rounded-full ${member.color} text-neutral-0 flex items-center justify-center font-semibold text-lg flex-shrink-0`}
                          >
                            {member.initials}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900 text-lg">
                              {member.name}
                            </h4>
                            <p className="text-neutral-600 text-sm">
                              {member.role} • {member.department}
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
                                updateAttendanceStatus(member.id, "present")
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
                                updateAttendanceStatus(member.id, "absent")
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
                                updateAttendanceStatus(member.id, "half-day")
                              }
                              className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                                record.status === "half-day"
                                  ? "bg-yellow-600 text-neutral-0 border-yellow-600 shadow-md"
                                  : getStatusColor("half-day")
                              }`}
                            >
                              <FontAwesomeIcon icon={faUserClock} />
                              Half Day
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateAttendanceStatus(member.id, "on-leave")
                              }
                              className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                                record.status === "on-leave"
                                  ? "bg-blue-600 text-neutral-0 border-blue-600 shadow-md"
                                  : getStatusColor("on-leave")
                              }`}
                            >
                              <FontAwesomeIcon icon={faHouse} />
                              On Leave
                            </button>
                          </div>
                        </div>

                        {/* Time Fields (only for present or half-day) */}
                        {(record.status === "present" ||
                          record.status === "half-day") && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-neutral-700 font-medium mb-2 text-sm">
                                Check-in Time
                              </label>
                              <input
                                type="time"
                                value={record.checkInTime || ""}
                                onChange={(e) =>
                                  updateAttendanceField(
                                    member.id,
                                    "checkInTime",
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
                                value={record.checkOutTime || ""}
                                onChange={(e) =>
                                  updateAttendanceField(
                                    member.id,
                                    "checkOutTime",
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
                                member.id,
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
              selectedProject && (
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
                  <FontAwesomeIcon
                    icon={faUsers}
                    className="text-5xl text-neutral-300 mb-4"
                  />
                  <p className="text-neutral-600 font-medium">
                    No team members assigned to this project
                  </p>
                </div>
              )
            )}

            {/* Submit Button */}
            {selectedProject && projectTeamMembers.length > 0 && (
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
                  disabled={isSubmitting}
                  className="btn-primary-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-center"
                >
                  {isSubmitting ? (
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
                    placeholder="Search by project name..."
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

            {/* History List */}
            {paginatedHistory.length > 0 ? (
              <div className="space-y-4">
                {paginatedHistory.map((attendance) => {
                  const project = projects.find(
                    (p) => p.id === attendance.projectId
                  );
                  const presentCount = attendance.records.filter(
                    (r) => r.status === "present"
                  ).length;
                  const absentCount = attendance.records.filter(
                    (r) => r.status === "absent"
                  ).length;

                  return (
                    <div
                      key={attendance.id}
                      className="bg-neutral-0 rounded-xl border border-neutral-200 hover:border-primary-500 transition-all overflow-hidden"
                    >
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center font-semibold text-sm">
                                {project?.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-neutral-900">
                                  {project?.name}
                                </h3>
                                <p className="text-neutral-500 text-sm">
                                  {project?.client}
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
                                {new Date(attendance.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                            <p className="text-neutral-500 text-xs">
                              Submitted by {attendance.submittedBy}
                            </p>
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                            <p className="text-neutral-600 text-xs mb-1">
                              Total
                            </p>
                            <p className="text-lg font-bold text-neutral-900">
                              {attendance.records.length}
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
                              {attendance.records.length -
                                presentCount -
                                absentCount}
                            </p>
                          </div>
                        </div>

                        {/* Team Members Details */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                            Team Members
                          </h4>
                          <div className="space-y-2">
                            {attendance.records.map((record) => {
                              const member = allTeamMembers.find(
                                (m) => m.id === record.memberId
                              );
                              if (!member) return null;

                              return (
                                <div
                                  key={record.memberId}
                                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-8 h-8 rounded-full ${member.color} text-neutral-0 flex items-center justify-center font-semibold text-xs`}
                                    >
                                      {member.initials}
                                    </div>
                                    <div>
                                      <p className="font-medium text-neutral-900 text-sm">
                                        {member.name}
                                      </p>
                                      <p className="text-neutral-500 text-xs">
                                        {member.role}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {record.checkInTime &&
                                      record.checkOutTime && (
                                        <span className="text-neutral-600 text-xs">
                                          {record.checkInTime} -{" "}
                                          {record.checkOutTime}
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
                      {Math.min(currentPage * 5, filteredHistory.length)} of{" "}
                      {filteredHistory.length} records
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
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
                <FontAwesomeIcon
                  icon={faClipboardCheck}
                  className="text-5xl text-neutral-300 mb-4"
                />
                <p className="text-neutral-600 font-medium">
                  No attendance records found
                </p>
                <p className="text-neutral-500 text-sm mt-2">
                  Start marking attendance to see records here
                </p>
              </div>
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
