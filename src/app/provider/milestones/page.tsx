"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faFilter,
  faSearch,
  faCalendar,
  faUser,
  faCheck,
  faTimes,
  faPlus,
  faPenToSquare,
  faEye,
  faTrash,
  faDollarSign,
  faSpinner,
  faExclamationTriangle,
  faClock,
  faFolder,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Define the API response structure
interface ApiMilestone {
  id: number;
  project: number;
  title: string;
  description: string;
  target_date: string | null; // API uses this instead of due_date
  completion_date: string | null;
  amount: string;
  status: "pending" | "in_progress" | "completed";
  status_display: string; // e.g., "Pending"
  milestone_order: number | null;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

interface Client {
  id: number;
  full_name: string;
  user_email: string;
}

interface Project {
  id: number;
  project_name: string;
  client: Client | null;
  start_date: string;
  expected_end_date: string;
}

// Frontend Milestone type - adapted to use API data
interface Milestone {
  id: number;
  project: number;
  project_name?: string;
  client_name?: string;
  title: string;
  description: string;
  due_date: string; // We'll map target_date to this for UI
  amount: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
  // Add any other fields you need for display
  status_display: string;
  completion_percentage: number;
}

interface MilestoneFormData {
  project: string;
  title: string;
  description: string;
  due_date: string;
  amount: string;
  status: "pending" | "in_progress" | "completed";
}

export default function ProviderMilestonesPage() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [viewingMilestone, setViewingMilestone] = useState<Milestone | null>(
    null
  );
  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormData>({
    project: "",
    title: "",
    description: "",
    due_date: "",
    amount: "",
    status: "pending",
  });

  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await api.get<{ results: Project[] }>(
        "/api/v1/projects/"
      );
      return response.results || [];
    },
  });

  // Fetch ALL milestones in one go — wait for projects first internally
  const {
    data: allMilestonesData,
    isLoading: milestonesLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["all-milestones"],
    queryFn: async () => {
      let projects: Project[] = [];
      if (projectsData && Array.isArray(projectsData)) {
        projects = projectsData;
      } else {
        const projRes = await api.get<{ results: Project[] }>(
          "/api/v1/projects/"
        );
        projects = projRes.results || [];
      }

      if (projects.length === 0) return [];

      const milestonesPromises = projects.map((project) =>
        api
          .get<{ results: ApiMilestone[] }>(
            `/api/v1/projects/${project.id}/milestones/`
          )
          .then((res) => {
            console.log(`Milestones for project ${project.id}:`, res);
            const results = res.results || [];
            // Add project ID to each milestone if it's missing
            return results.map((m) => ({
              ...m,
              project: m.project || project.id,
              amount: m.amount || "0",
            }));
          })
          .catch((err) => {
            console.error(
              `Error fetching milestones for project ${project.id}:`,
              err
            );
            return [];
          })
      );

      const milestonesArrays = await Promise.all(milestonesPromises);
      const allApiMilestones = milestonesArrays.flat();

      console.log("All fetched milestones:", allApiMilestones);

      // Transform API response to frontend Milestone type
      return allApiMilestones.map((milestone) => {
        const project = projects.find((p) => p.id === milestone.project);
        return {
          ...milestone,
          // Map API field to frontend field
          due_date:
            milestone.target_date ||
            milestone.completion_date ||
            new Date().toISOString().split("T")[0], // Fallback
          project_name: project?.project_name || "Unknown Project",
          client_name: project?.client?.full_name || "Unassigned",
          // Keep original API fields for display if needed
          status_display: milestone.status_display,
          completion_percentage: milestone.completion_percentage,
        };
      });
    },
    enabled: true, // Always run
  });

  // Mutations (unchanged)
  const createMilestoneMutation = useMutation({
    mutationFn: async (data: MilestoneFormData) => {
      const response = await api.post(
        `/api/v1/projects/${data.project}/milestones/create/`,
        {
          title: data.title,
          description: data.description,
          // Send due_date as target_date to API
          target_date: data.due_date,
          amount: data.amount,
          status: data.status,
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-milestones"] });
      showSuccessNotification("Milestone created successfully!");
      closeMilestoneModal();
    },
    onError: (error: any) => {
      alert(
        error.data?.detail || error.message || "Failed to create milestone"
      );
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<MilestoneFormData>;
    }) => {
      const response = await api.put(`/api/v1/milestones/${id}/update/`, {
        title: data.title,
        description: data.description,
        target_date: data.due_date, // Send as target_date
        amount: data.amount,
        status: data.status,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-milestones"] });
      showSuccessNotification("Milestone updated successfully!");
      closeMilestoneModal();
    },
    onError: (error: any) => {
      alert(
        error.data?.detail || error.message || "Failed to update milestone"
      );
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/milestones/${id}/delete/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-milestones"] });
      showSuccessNotification("Milestone deleted successfully!");
    },
    onError: (error: any) => {
      alert(
        error.data?.detail || error.message || "Failed to delete milestone"
      );
    },
  });

  const projects = Array.isArray(projectsData) ? projectsData : [];
  const milestones = Array.isArray(allMilestonesData) ? allMilestonesData : [];

  // Debug logs
  useEffect(() => {
    console.log("Projects:", projectsData);
    console.log("Raw API Milestones:", allMilestonesData);
    if (isError) console.error("Milestones fetch error:", error);
  }, [projectsData, allMilestonesData, isError, error]);

  const openMilestoneModal = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setMilestoneForm({
        project: milestone.project.toString(),
        title: milestone.title,
        description: milestone.description,
        due_date: milestone.due_date, // This is now target_date from API
        amount: milestone.amount,
        status: milestone.status,
      });
    } else {
      setEditingMilestone(null);
      setMilestoneForm({
        project: "",
        title: "",
        description: "",
        due_date: "",
        amount: "",
        status: "pending",
      });
    }
    setShowMilestoneModal(true);
  };

  const closeMilestoneModal = () => {
    setShowMilestoneModal(false);
    setEditingMilestone(null);
    setMilestoneForm({
      project: "",
      title: "",
      description: "",
      due_date: "",
      amount: "",
      status: "pending",
    });
  };

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const saveMilestone = () => {
    if (
      !milestoneForm.project ||
      !milestoneForm.title ||
      !milestoneForm.due_date ||
      !milestoneForm.amount
    ) {
      alert("Please fill in all required fields");
      return;
    }
    const amount = parseFloat(milestoneForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }
    if (editingMilestone) {
      updateMilestoneMutation.mutate({
        id: editingMilestone.id,
        data: milestoneForm,
      });
    } else {
      createMilestoneMutation.mutate(milestoneForm);
    }
  };

  const deleteMilestone = (id: number) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      deleteMilestoneMutation.mutate(id);
    }
  };

  const viewMilestone = (milestone: Milestone) => {
    setViewingMilestone(milestone);
  };

  const closeViewModal = () => {
    setViewingMilestone(null);
  };

  // Filter milestones
  const filteredMilestones = milestones.filter((milestone) => {
    const matchesProject =
      selectedProject === "all" ||
      milestone.project.toString() === selectedProject;
    const matchesStatus =
      selectedStatus === "all" || milestone.status === selectedStatus;
    const matchesSearch =
      searchQuery === "" ||
      milestone.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      milestone.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (milestone.project_name &&
        milestone.project_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));
    return matchesProject && matchesStatus && matchesSearch;
  });

  // Group milestones by project — with safe access
  const groupedMilestones = filteredMilestones.reduce((acc, milestone) => {
    const projectId = milestone.project?.toString();
    if (!projectId) return acc;
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(milestone);
    return acc;
  }, {} as { [key: string]: Milestone[] });

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[status as keyof typeof colors];
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: faExclamationTriangle,
      in_progress: faClock,
      completed: faCheck,
    };
    return icons[status as keyof typeof icons];
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
    };
    return texts[status as keyof typeof texts];
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "completed") return false;
    return new Date(dueDate) < new Date();
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numAmount);
  };

  const getProjectProgress = (projectId: string) => {
    const projectMilestones = milestones.filter(
      (m) => m.project.toString() === projectId
    );
    const completed = projectMilestones.filter(
      (m) => m.status === "completed"
    ).length;
    return projectMilestones.length > 0
      ? Math.round((completed / projectMilestones.length) * 100)
      : 0;
  };

  const selectedProjectData = projects.find(
    (p) => p.id.toString() === milestoneForm.project
  );

  const isLoading = projectsLoading || milestonesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading milestones...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTimes} className="text-red-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Milestones
          </h3>
          <p className="text-red-700 mb-4">Failed to load milestones</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Animation styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes slide-in-right {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            .animate-slide-in-right {
              animation: slide-in-right 0.3s ease-out;
            }
          `,
        }}
      />

      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed top-8 right-8 z-[60] animate-slide-in-right">
          <div className="bg-green-600 text-neutral-0 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faCheck} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-neutral-0 hover:text-neutral-200 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-neutral-900 mb-1">
              Milestones Management
            </h1>
            <p className="text-neutral-600 body-regular">
              Create milestones, track progress, and respond to client questions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openMilestoneModal()}
              className="btn-primary flex items-center gap-2 shadow-lg"
            >
              <FontAwesomeIcon icon={faPlus} />
              Create Milestone
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Filters and Search */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Project Filter */}
            <div>
              <label className="block text-neutral-700 font-semibold mb-2 body-small">
                <FontAwesomeIcon
                  icon={faFolder}
                  className="mr-2 text-primary-600"
                />
                Filter by Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_name}
                  </option>
                ))}
              </select>
            </div>
            {/* Status Filter */}
            <div>
              <label className="block text-neutral-700 font-semibold mb-2 body-small">
                <FontAwesomeIcon
                  icon={faFilter}
                  className="mr-2 text-primary-600"
                />
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            {/* Search */}
            <div>
              <label className="block text-neutral-700 font-semibold mb-2 body-small">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="mr-2 text-primary-600"
                />
                Search Milestones
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedProject !== "all" ||
            selectedStatus !== "all" ||
            searchQuery) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200 flex-wrap">
              <span className="text-neutral-600 text-sm font-medium">
                Active Filters:
              </span>
              {selectedProject !== "all" && (
                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium border border-primary-200">
                  {
                    projects.find((p) => p.id.toString() === selectedProject)
                      ?.project_name
                  }
                </span>
              )}
              {selectedStatus !== "all" && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                  {getStatusText(selectedStatus)}
                </span>
              )}
              {searchQuery && (
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                  Search: "{searchQuery}"
                </span>
              )}
            </div>
          )}
        </div>

        {/* Milestones List */}
        {filteredMilestones.length === 0 ? (
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="text-6xl text-neutral-300 mb-4"
            />
            <h3 className="heading-4 text-neutral-900 mb-2">
              No Milestones Found
            </h3>
            <p className="text-neutral-600 mb-4">
              {searchQuery ||
              selectedProject !== "all" ||
              selectedStatus !== "all"
                ? "Try adjusting your filters or search query"
                : "Get started by creating your first milestone"}
            </p>
            <button
              onClick={() => openMilestoneModal()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Create Milestone
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMilestones).map(
              ([projectId, projectMilestones]) => {
                const project = projects.find(
                  (p) => p.id.toString() === projectId
                );
                const progress = getProjectProgress(projectId);
                return (
                  <div
                    key={projectId}
                    className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden"
                  >
                    {/* Project Header */}
                    <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 border-b border-neutral-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h2 className="heading-4 text-neutral-900">
                            {project?.project_name}
                          </h2>
                          <p className="text-neutral-600 text-sm mt-1">
                            <FontAwesomeIcon icon={faUser} className="mr-1" />
                            Client: {project?.client?.full_name || "Unassigned"}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-neutral-600">
                          {
                            projectMilestones.filter(
                              (m) => m.status === "completed"
                            ).length
                          }{" "}
                          / {projectMilestones.length} Completed
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    {/* Milestones */}
                    <div className="divide-y divide-neutral-200">
                      {projectMilestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="p-6 hover:bg-neutral-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="heading-4 text-neutral-900">
                                  {milestone.title}
                                </h3>
                                <span
                                  className={`text-xs font-semibold px-2 py-1 border rounded flex items-center gap-1 ${getStatusBadgeColor(
                                    milestone.status
                                  )}`}
                                >
                                  <FontAwesomeIcon
                                    icon={getStatusIcon(milestone.status)}
                                  />
                                  {getStatusText(milestone.status)}
                                </span>
                                {isOverdue(
                                  milestone.due_date,
                                  milestone.status
                                ) && (
                                  <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 border border-red-200 rounded">
                                    Overdue
                                  </span>
                                )}
                              </div>
                              <p className="text-neutral-700 mb-3">
                                {milestone.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-neutral-600 flex-wrap">
                                <span className="flex items-center gap-1 font-semibold text-green-600">
                                  <FontAwesomeIcon
                                    icon={faDollarSign}
                                    className="text-xs"
                                  />
                                  {formatCurrency(milestone.amount)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FontAwesomeIcon
                                    icon={faCalendar}
                                    className="text-xs"
                                  />
                                  <span className="font-medium">Due:</span>{" "}
                                  {new Date(
                                    milestone.due_date
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => viewMilestone(milestone)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View details"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              <button
                                onClick={() => openMilestoneModal(milestone)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit milestone"
                              >
                                <FontAwesomeIcon icon={faPenToSquare} />
                              </button>
                              <button
                                onClick={() => deleteMilestone(milestone.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete milestone"
                                disabled={deleteMilestoneMutation.isPending}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="heading-4 text-neutral-900">
                  {editingMilestone ? "Edit Milestone" : "Create New Milestone"}
                </h3>
                <p className="text-neutral-600 text-sm mt-1">
                  {editingMilestone
                    ? "Update milestone details and payment amount"
                    : "Create a new milestone with payment amount"}
                </p>
              </div>
              <button
                onClick={closeMilestoneModal}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Project Selection */}
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={milestoneForm.project}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      project: e.target.value,
                    })
                  }
                  disabled={!!editingMilestone}
                  className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer disabled:bg-neutral-100"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_name} -{" "}
                      {project.client?.full_name || "No client"}
                    </option>
                  ))}
                </select>
                {selectedProjectData && (
                  <p className="mt-2 text-sm text-neutral-600">
                    Client:{" "}
                    <span className="font-semibold">
                      {selectedProjectData.client?.full_name || "Unassigned"}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Milestone Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={milestoneForm.title}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Initial Design Phase"
                  className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Description
                </label>
                <textarea
                  value={milestoneForm.description}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe this milestone..."
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Payment Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="number"
                      value={milestoneForm.amount}
                      onChange={(e) =>
                        setMilestoneForm({
                          ...milestoneForm,
                          amount: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={milestoneForm.due_date}
                    onChange={(e) =>
                      setMilestoneForm({
                        ...milestoneForm,
                        due_date: e.target.value,
                      })
                    }
                    min={selectedProjectData?.start_date}
                    max={selectedProjectData?.expected_end_date}
                    className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={milestoneForm.status}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      status: e.target.value as
                        | "pending"
                        | "in_progress"
                        | "completed",
                    })
                  }
                  className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
                >
                  <option value="pending">⚠ Pending</option>
                  <option value="in_progress">⏱ In Progress</option>
                  <option value="completed">✓ Completed</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm flex items-start gap-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <span>
                    This milestone will be visible to the client and payment
                    amount will be used for invoicing.
                  </span>
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={closeMilestoneModal}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
                disabled={
                  createMilestoneMutation.isPending ||
                  updateMilestoneMutation.isPending
                }
              >
                Cancel
              </button>
              <button
                onClick={saveMilestone}
                className="btn-primary flex items-center gap-2"
                disabled={
                  createMilestoneMutation.isPending ||
                  updateMilestoneMutation.isPending
                }
              >
                {createMilestoneMutation.isPending ||
                updateMilestoneMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    {editingMilestone ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={editingMilestone ? faCheckCircle : faPlus}
                    />
                    {editingMilestone ? "Update Milestone" : "Create Milestone"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Milestone Modal */}
      {viewingMilestone && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="heading-4 text-neutral-900">
                  Milestone Details
                </h3>
                <p className="text-neutral-600 text-sm mt-1">
                  {viewingMilestone.project_name} -{" "}
                  {viewingMilestone.client_name}
                </p>
              </div>
              <button
                onClick={closeViewModal}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-neutral-600 font-medium mb-2 body-small">
                  Title
                </label>
                <p className="text-neutral-900 font-semibold text-lg">
                  {viewingMilestone.title}
                </p>
              </div>
              {viewingMilestone.description && (
                <div>
                  <label className="block text-neutral-600 font-medium mb-2 body-small">
                    Description
                  </label>
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <p className="text-neutral-700 leading-relaxed">
                      {viewingMilestone.description}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-neutral-600 font-medium mb-2 body-small">
                    Payment Amount
                  </label>
                  <div className="flex items-center gap-2 text-neutral-900 font-bold text-2xl bg-green-50 p-4 rounded-lg border border-green-200">
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      className="text-green-600"
                    />
                    {formatCurrency(viewingMilestone.amount)}
                  </div>
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-2 body-small">
                    Due Date
                  </label>
                  <div className="flex items-center gap-2 text-neutral-900 font-medium bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="text-primary-600"
                    />
                    <span className="text-sm">
                      {new Date(viewingMilestone.due_date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-neutral-600 font-medium mb-2 body-small">
                  Status
                </label>
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border ${getStatusBadgeColor(
                    viewingMilestone.status
                  )}`}
                >
                  <FontAwesomeIcon
                    icon={getStatusIcon(viewingMilestone.status)}
                  />
                  {getStatusText(viewingMilestone.status)}
                </span>
              </div>
            </div>
            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  if (
                    confirm("Are you sure you want to delete this milestone?")
                  ) {
                    deleteMilestone(viewingMilestone.id);
                    closeViewModal();
                  }
                }}
                className="px-5 py-2.5 bg-red-600 text-neutral-0 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={deleteMilestoneMutation.isPending}
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeViewModal}
                  className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeViewModal();
                    openMilestoneModal(viewingMilestone);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                  Edit Milestone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
