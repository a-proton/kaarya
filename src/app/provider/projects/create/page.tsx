"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faTrash,
  faCalendar,
  faMapMarkerAlt,
  faUser,
  faFileAlt,
  faBriefcase,
  faCheckCircle,
  faPenToSquare,
  faEye,
  faMoneyBill,
  faTimes,
  faCheck,
  faExclamationTriangle,
  faDollarSign,
  faUsers,
  faSpinner,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  amount: number;
  status: "pending" | "in_progress" | "completed";
}

interface MilestoneFormData {
  title: string;
  description: string;
  dueDate: string;
  amount: string;
  status: "pending" | "in_progress" | "completed";
}

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  color: string;
}

interface CreateProjectPayload {
  project_name: string;
  description: string;
  site_address: string;
  status: string;
  start_date: string;
  expected_end_date: string;
  total_cost: string;
  advance_payment: string;
  balance_payment: string;
}

interface CreateMilestonePayload {
  title: string;
  description: string;
  due_date: string;
  amount: string;
  status: "pending" | "in_progress" | "completed";
}

// Mock team members data
const availableTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Michael Rodriguez",
    initials: "MR",
    role: "Lead Electrician",
    department: "Technical",
    color: "bg-primary-600",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    initials: "SJ",
    role: "Project Manager",
    department: "Operations",
    color: "bg-secondary-600",
  },
  {
    id: "3",
    name: "John Davis",
    initials: "JD",
    role: "Carpenter",
    department: "Technical",
    color: "bg-yellow-600",
  },
  {
    id: "4",
    name: "Emily Chen",
    initials: "EC",
    role: "Interior Designer",
    department: "Design",
    color: "bg-purple-600",
  },
  {
    id: "5",
    name: "Robert Miller",
    initials: "RM",
    role: "HVAC Specialist",
    department: "Technical",
    color: "bg-green-600",
  },
  {
    id: "6",
    name: "Amanda Wilson",
    initials: "AW",
    role: "Plumber",
    department: "Technical",
    color: "bg-blue-600",
  },
  {
    id: "7",
    name: "David Brown",
    initials: "DB",
    role: "Supervisor",
    department: "Operations",
    color: "bg-orange-600",
  },
  {
    id: "8",
    name: "Lisa Anderson",
    initials: "LA",
    role: "Landscaper",
    department: "Outdoor Services",
    color: "bg-teal-600",
  },
];

export default function CreateProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [initialPaymentTaken, setInitialPaymentTaken] = useState(false);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormData>({
    title: "",
    description: "",
    dueDate: "",
    amount: "",
    status: "pending",
  });
  const [viewingMilestone, setViewingMilestone] = useState<Milestone | null>(
    null
  );
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);
  const [isCreatingMilestones, setIsCreatingMilestones] = useState(false);

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      try {
        const response = await api.post("/api/v1/projects/create/", payload);
        return response;
      } catch (error: any) {
        console.error("API Error:", error);
        console.error("Error data:", error.data);
        console.error("Error status:", error.status);
        throw error;
      }
    },
    onSuccess: async (data: any) => {
      console.log("Project created:", data);
      setCreatedProjectId(data.id);

      // If there are milestones, create them
      if (milestones.length > 0 && data.id) {
        await createMilestonesForProject(data.id);
      } else {
        // No milestones, just show success and redirect
        showSuccessNotification("Project created successfully!");
        setTimeout(() => {
          router.push("/provider/projects");
        }, 1500);
      }
    },
    onError: (error: any) => {
      console.error("Full error:", error);
      const errorMessage =
        error.data?.detail ||
        error.data?.message ||
        error.message ||
        "Failed to create project. Check console for details.";
      alert(`Error: ${errorMessage}`);
    },
  });

  // Function to create milestones after project is created
  const createMilestonesForProject = async (projectId: number) => {
    setIsCreatingMilestones(true);
    let successCount = 0;
    let failCount = 0;

    for (const milestone of milestones) {
      try {
        const payload: CreateMilestonePayload = {
          title: milestone.title,
          description: milestone.description,
          due_date: milestone.dueDate,
          amount: milestone.amount.toString(),
          status: milestone.status,
        };

        await api.post(
          `/api/v1/projects/${projectId}/milestones/create/`,
          payload
        );
        successCount++;
      } catch (error) {
        console.error(`Failed to create milestone: ${milestone.title}`, error);
        failCount++;
      }
    }

    setIsCreatingMilestones(false);

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["all-milestones"] });

    if (failCount === 0) {
      showSuccessNotification(
        `Project and ${successCount} milestone${
          successCount !== 1 ? "s" : ""
        } created successfully!`
      );
    } else {
      showSuccessNotification(
        `Project created! ${successCount} milestone${
          successCount !== 1 ? "s" : ""
        } created, ${failCount} failed.`
      );
    }

    setTimeout(() => {
      router.push("/provider/projects");
    }, 2000);
  };

  const openMilestoneModal = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setMilestoneForm({
        title: milestone.title,
        description: milestone.description,
        dueDate: milestone.dueDate,
        amount: milestone.amount.toString(),
        status: milestone.status,
      });
    } else {
      setEditingMilestone(null);
      setMilestoneForm({
        title: "",
        description: "",
        dueDate: "",
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
      title: "",
      description: "",
      dueDate: "",
      amount: "",
      status: "pending",
    });
  };

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const saveMilestone = () => {
    if (
      !milestoneForm.title ||
      !milestoneForm.dueDate ||
      !milestoneForm.amount
    ) {
      alert("Please fill in all required fields including payment amount");
      return;
    }

    const amount = parseFloat(milestoneForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (editingMilestone) {
      setMilestones(
        milestones.map((m) =>
          m.id === editingMilestone.id ? { ...m, ...milestoneForm, amount } : m
        )
      );
      showSuccessNotification("Milestone updated successfully!");
    } else {
      const newMilestone: Milestone = {
        id: Date.now().toString(),
        title: milestoneForm.title,
        description: milestoneForm.description,
        dueDate: milestoneForm.dueDate,
        amount,
        status: milestoneForm.status,
      };
      setMilestones([...milestones, newMilestone]);
      showSuccessNotification("Milestone added successfully!");
    }
    closeMilestoneModal();
  };

  const deleteMilestone = (id: string) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      setMilestones(milestones.filter((m) => m.id !== id));
      showSuccessNotification("Milestone deleted successfully!");
    }
  };

  const viewMilestone = (milestone: Milestone) => {
    setViewingMilestone(milestone);
  };

  const closeViewModal = () => {
    setViewingMilestone(null);
  };

  const getStatusBadgeColor = (status: Milestone["status"]) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[status];
  };

  const getStatusIcon = (status: Milestone["status"]) => {
    const icons = {
      pending: faExclamationTriangle,
      in_progress: faClock,
      completed: faCheck,
    };
    return icons[status];
  };

  const getStatusText = (status: Milestone["status"]) => {
    const texts = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
    };
    return texts[status];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const initialPayment = parseFloat(initialPaymentAmount) || 0;
  const totalProjectValue = totalMilestoneAmount + initialPayment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!projectName || !location || !startDate || !endDate || !projectBudget) {
      alert("Please fill in all required fields");
      return;
    }

    // Parse project budget to number
    const budgetValue = parseFloat(projectBudget.replace(/[^0-9.-]+/g, ""));
    if (isNaN(budgetValue) || budgetValue <= 0) {
      alert("Please enter a valid project budget");
      return;
    }

    // Calculate balance payment
    const advancePayment = initialPaymentTaken ? initialPayment : 0;
    const balancePayment = budgetValue - advancePayment;

    // Prepare payload matching the API structure
    const payload: CreateProjectPayload = {
      project_name: projectName,
      description: description || `${category} project at ${location}`,
      site_address: location,
      status: status,
      start_date: startDate,
      expected_end_date: endDate,
      total_cost: budgetValue.toFixed(2),
      advance_payment: advancePayment.toFixed(2),
      balance_payment: balancePayment.toFixed(2),
    };

    console.log("Submitting payload:", payload);

    // Submit to API
    createProjectMutation.mutate(payload);
  };

  const handleCancel = () => {
    if (
      confirm(
        "Are you sure you want to cancel? All unsaved changes will be lost."
      )
    ) {
      router.push("/provider/projects");
    }
  };

  const toggleTeamMember = (memberId: string) => {
    if (selectedTeamMembers.includes(memberId)) {
      setSelectedTeamMembers(
        selectedTeamMembers.filter((id) => id !== memberId)
      );
    } else {
      setSelectedTeamMembers([...selectedTeamMembers, memberId]);
    }
  };

  const isSubmitting = createProjectMutation.isPending || isCreatingMilestones;

  return (
    <div className="min-h-screen bg-neutral-50">
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
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.push("/provider/projects")}
            className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
            aria-label="Go back"
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="text-neutral-600 text-lg"
            />
          </button>
          <div>
            <h1 className="heading-2 text-neutral-900">Create New Project</h1>
            <p className="text-neutral-600 body-regular mt-1">
              Fill in the details to create your project
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Information Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6 flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faBriefcase}
                  className="text-primary-600"
                />
                Project Information
              </h2>

              <div className="space-y-5">
                {/* Project Name */}
                <div>
                  <label
                    htmlFor="projectName"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Kitchen Renovation"
                    required
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                  >
                    <option value="">Select a category</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Landscaping">Landscaping</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    Project Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <p className="text-neutral-500 text-xs mt-1">
                    Select the current status of the project
                  </p>
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="text-primary-600 mr-2"
                    />
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., 123 Main Street, New York, NY"
                    required
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                {/* Client Name */}
                <div>
                  <label
                    htmlFor="clientName"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-primary-600 mr-2"
                    />
                    Client Name
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., John Smith (Optional - can be assigned later)"
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                  <p className="text-neutral-500 text-xs mt-1">
                    Client can be assigned later if not available now
                  </p>
                </div>

                {/* Project Budget */}
                <div>
                  <label
                    htmlFor="projectBudget"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    <FontAwesomeIcon
                      icon={faMoneyBill}
                      className="text-primary-600 mr-2"
                    />
                    Project Total Cost <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                      $
                    </span>
                    <input
                      type="number"
                      id="projectBudget"
                      value={projectBudget}
                      onChange={(e) => setProjectBudget(e.target.value)}
                      placeholder="50000"
                      min="0"
                      step="0.01"
                      required
                      className="w-full pl-8 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      <FontAwesomeIcon
                        icon={faCalendar}
                        className="text-primary-600 mr-2"
                      />
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      <FontAwesomeIcon
                        icon={faCalendar}
                        className="text-primary-600 mr-2"
                      />
                      End Date (Estimated){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      required
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    <FontAwesomeIcon
                      icon={faFileAlt}
                      className="text-primary-600 mr-2"
                    />
                    Project Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed description of the project..."
                    rows={4}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Initial Payment Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6 flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  className="text-primary-600"
                />
                Initial Payment (Advance)
              </h2>

              <div className="space-y-5">
                {/* Payment Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="initialPayment"
                    checked={initialPaymentTaken}
                    onChange={(e) => {
                      setInitialPaymentTaken(e.target.checked);
                      if (!e.target.checked) setInitialPaymentAmount("");
                    }}
                    className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="initialPayment"
                      className="text-neutral-900 font-semibold block cursor-pointer"
                    >
                      Initial payment received
                    </label>
                    <p className="text-neutral-600 text-sm mt-1">
                      Check this if you've received an advance payment from the
                      client
                    </p>
                  </div>
                </div>

                {/* Amount Input */}
                {initialPaymentTaken && (
                  <div>
                    <label
                      htmlFor="initialPaymentAmount"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      Advance Payment Amount{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faDollarSign}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                      />
                      <input
                        type="number"
                        id="initialPaymentAmount"
                        value={initialPaymentAmount}
                        onChange={(e) =>
                          setInitialPaymentAmount(e.target.value)
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required={initialPaymentTaken}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                    {initialPayment > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-green-600 text-sm font-medium flex items-center gap-2">
                          <FontAwesomeIcon icon={faCheckCircle} />
                          Advance payment: {formatCurrency(initialPayment)}
                        </p>
                        {projectBudget && (
                          <p className="text-blue-600 text-sm font-medium flex items-center gap-2">
                            <FontAwesomeIcon icon={faMoneyBill} />
                            Balance payment:{" "}
                            {formatCurrency(
                              parseFloat(
                                projectBudget.replace(/[^0-9.-]+/g, "")
                              ) - initialPayment
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Team Assignment Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-4 flex items-center gap-3">
                <FontAwesomeIcon icon={faUsers} className="text-primary-600" />
                Assign Team Members
                <span className="text-sm font-normal text-neutral-500">
                  (Optional)
                </span>
              </h2>
              <p className="text-neutral-600 text-sm mb-4">
                Select team members to assign to this project. You can also add
                them later.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => toggleTeamMember(member.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTeamMembers.includes(member.id)
                        ? "border-primary-500 bg-primary-50"
                        : "border-neutral-200 hover:border-neutral-300 bg-neutral-0"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${member.color} text-neutral-0 flex items-center justify-center font-semibold flex-shrink-0`}
                      >
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-sm text-neutral-600 truncate">
                          {member.role}
                        </p>
                      </div>
                      {selectedTeamMembers.includes(member.id) && (
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-primary-600 flex-shrink-0"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedTeamMembers.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm font-medium">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    {selectedTeamMembers.length} team member
                    {selectedTeamMembers.length !== 1 ? "s" : ""} selected
                  </p>
                </div>
              )}
            </div>

            {/* Milestones Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-4 text-neutral-900 flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-primary-600"
                  />
                  Project Milestones
                  <span className="text-sm font-normal text-neutral-500">
                    (Optional)
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => openMilestoneModal()}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add Milestone
                </button>
              </div>

              {milestones.length === 0 ? (
                <div className="text-center py-8 px-4 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-neutral-300 text-4xl mb-3"
                  />
                  <p className="text-neutral-600 mb-3">
                    No milestones added yet
                  </p>
                  <button
                    type="button"
                    onClick={() => openMilestoneModal()}
                    className="btn-secondary text-sm"
                  >
                    Add First Milestone
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-neutral-900">
                              {milestone.title}
                            </h4>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 border rounded ${getStatusBadgeColor(
                                milestone.status
                              )}`}
                            >
                              {getStatusText(milestone.status)}
                            </span>
                          </div>
                          {milestone.description && (
                            <p className="text-neutral-600 text-sm mb-2">
                              {milestone.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
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
                              {new Date(milestone.dueDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            type="button"
                            onClick={() => viewMilestone(milestone)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openMilestoneModal(milestone)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit milestone"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMilestone(milestone.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete milestone"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Milestone Summary */}
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-neutral-900">
                        Total Milestone Value:
                      </span>
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(totalMilestoneAmount)}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600">
                      {milestones.length} milestone
                      {milestones.length !== 1 ? "s" : ""} • Average:{" "}
                      {formatCurrency(totalMilestoneAmount / milestones.length)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 sticky top-8">
              <h3 className="heading-4 text-neutral-900 mb-4">
                Project Summary
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faBriefcase}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">
                      Project Name
                    </p>
                    <p className="text-neutral-900 font-semibold truncate">
                      {projectName || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">Client</p>
                    <p className="text-neutral-900 font-semibold truncate">
                      {clientName || "To be assigned"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">Location</p>
                    <p className="text-neutral-900 font-semibold truncate">
                      {location || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">Status</p>
                    <span
                      className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold border ${
                        status === "pending"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                          : status === "not_started"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                          : status === "in_progress"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : status === "completed"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : status === "on_hold"
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : status === "cancelled"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-neutral-100 text-neutral-600 border-neutral-200"
                      }`}
                    >
                      {status === "not_started"
                        ? "Not Started"
                        : status === "in_progress"
                        ? "In Progress"
                        : status === "on_hold"
                        ? "On Hold"
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faMoneyBill}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">
                      Total Cost
                    </p>
                    <p className="text-neutral-900 font-semibold truncate">
                      {projectBudget
                        ? formatCurrency(
                            parseFloat(projectBudget.replace(/[^0-9.-]+/g, ""))
                          )
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faUsers}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">
                      Team Members
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {selectedTeamMembers.length === 0
                        ? "None assigned"
                        : `${selectedTeamMembers.length} member${
                            selectedTeamMembers.length !== 1 ? "s" : ""
                          }`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 body-small mb-1">
                      Milestones
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {milestones.length === 0
                        ? "None added"
                        : `${milestones.length} milestone${
                            milestones.length !== 1 ? "s" : ""
                          }`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-neutral-600 body-small mb-1">Duration</p>
                    <p className="text-neutral-900 font-semibold">
                      {startDate && endDate
                        ? `${new Date(startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })} - ${new Date(endDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}`
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              {projectBudget && (
                <div className="mb-6 p-4 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
                  <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      className="text-primary-600"
                    />
                    Payment Breakdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Total Cost:</span>
                      <span className="font-semibold text-neutral-900">
                        {formatCurrency(
                          parseFloat(projectBudget.replace(/[^0-9.-]+/g, ""))
                        )}
                      </span>
                    </div>
                    {initialPaymentTaken && initialPayment > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-600">
                            Advance Payment:
                          </span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(initialPayment)}
                          </span>
                        </div>
                        <div className="border-t border-primary-200 my-2"></div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-700">
                            Balance Payment:
                          </span>
                          <span className="text-lg font-bold text-primary-600">
                            {formatCurrency(
                              parseFloat(
                                projectBudget.replace(/[^0-9.-]+/g, "")
                              ) - initialPayment
                            )}
                          </span>
                        </div>
                      </>
                    )}
                    {milestones.length > 0 && (
                      <>
                        <div className="border-t border-primary-200 my-2"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-600">
                            Milestone Total:
                          </span>
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(totalMilestoneAmount)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                      />
                      {isCreatingMilestones
                        ? "Creating Milestones..."
                        : "Creating Project..."}
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} />
                      Create Project
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-700 body-small">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  <strong>Note:</strong>{" "}
                  {milestones.length > 0
                    ? `Project will be created with ${
                        milestones.length
                      } milestone${milestones.length !== 1 ? "s" : ""}.`
                    : "You can add milestones now or after creating the project."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Create/Edit Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="heading-4 text-neutral-900">
                  {editingMilestone ? "Edit Milestone" : "Add New Milestone"}
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
                  placeholder="e.g., Foundation Complete"
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
                    value={milestoneForm.dueDate}
                    onChange={(e) =>
                      setMilestoneForm({
                        ...milestoneForm,
                        dueDate: e.target.value,
                      })
                    }
                    min={startDate}
                    max={endDate}
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
                    This milestone will be created when you submit the project
                    form.
                  </span>
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={closeMilestoneModal}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveMilestone}
                className="btn-primary flex items-center gap-2"
              >
                <FontAwesomeIcon
                  icon={editingMilestone ? faCheckCircle : faPlus}
                />
                {editingMilestone ? "Update Milestone" : "Add Milestone"}
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
                  Review milestone information
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
                      {new Date(viewingMilestone.dueDate).toLocaleDateString(
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
