"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendar,
  faMapMarkerAlt,
  faUser,
  faFileAlt,
  faBriefcase,
  faCheckCircle,
  faTimes,
  faCheck,
  faDollarSign,
  faMoneyBill,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Client {
  id: number;
  full_name: string;
  user_email: string;
  user_phone: string;
  profile_image: string | null;
}

interface ServiceProvider {
  id: number;
  full_name: string;
  business_name: string;
  user_email: string;
  profile_image: string | null;
}

interface Project {
  id: number;
  project_name: string;
  description: string;
  site_address: string;
  status:
    | "not_started"
    | "in_progress"
    | "completed"
    | "on_hold"
    | "cancelled"
    | "pending";
  status_display: string;
  start_date: string;
  expected_end_date: string;
  actual_end_date: string | null;
  total_cost: string;
  advance_payment: string;
  balance_payment: string;
  client: Client | null;
  service_provider: ServiceProvider;
  milestone_count: number;
  created_at: string;
  updated_at: string;
}

interface UpdateProjectPayload {
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

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProjectPage({ params }: PageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [description, setDescription] = useState("");
  const [initialPaymentTaken, setInitialPaymentTaken] = useState(false);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch project data
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      try {
        const response = await api.get<Project>(
          `/api/v1/projects/${projectId}/`
        );
        return response;
      } catch (error: any) {
        // Handle 401 Unauthorized - redirect to login
        if (error.status === 401) {
          router.push("/login");
          throw new Error("Session expired. Please login again.");
        }
        throw error;
      }
    },
    enabled: !!projectId,
    retry: (failureCount, error: any) => {
      // Don't retry on 401
      if (error.status === 401) return false;
      return failureCount < 3;
    },
  });

  // Populate form when project data is loaded
  useEffect(() => {
    if (project) {
      setProjectName(project.project_name);
      setLocation(project.site_address);
      setProjectBudget(project.total_cost);
      setStartDate(project.start_date);
      setEndDate(project.expected_end_date);
      setStatus(project.status);
      setDescription(project.description);

      const advancePayment = parseFloat(project.advance_payment);
      if (advancePayment > 0) {
        setInitialPaymentTaken(true);
        setInitialPaymentAmount(advancePayment.toString());
      }
    }
  }, [project]);

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (payload: UpdateProjectPayload) => {
      try {
        // Using /update/ to match Django URL pattern
        const response = await api.put(
          `/api/v1/projects/${projectId}/update/`,
          payload
        );
        return response;
      } catch (error: any) {
        console.error("API Error:", error);
        console.error("Error data:", error.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Project updated:", data);
      showSuccessNotification("Project updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setTimeout(() => {
        router.push(`/provider/projects/${projectId}`);
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Full error:", error);
      const errorMessage =
        error.data?.detail ||
        error.data?.message ||
        error.message ||
        "Failed to update project. Check console for details.";
      alert(`Error: ${errorMessage}`);
    },
  });

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

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
    const advancePayment = initialPaymentTaken
      ? parseFloat(initialPaymentAmount) || 0
      : 0;
    const balancePayment = budgetValue - advancePayment;

    // Prepare payload matching the API structure
    const payload: UpdateProjectPayload = {
      project_name: projectName,
      description: description,
      site_address: location,
      status: status,
      start_date: startDate,
      expected_end_date: endDate,
      total_cost: budgetValue.toFixed(2),
      advance_payment: advancePayment.toFixed(2),
      balance_payment: balancePayment.toFixed(2),
    };

    console.log("Submitting update payload:", payload);

    // Submit to API
    updateProjectMutation.mutate(payload);
  };

  const handleCancel = () => {
    if (
      confirm(
        "Are you sure you want to cancel? All unsaved changes will be lost."
      )
    ) {
      router.push(`/provider/projects/${projectId}`);
    }
  };

  const initialPayment = parseFloat(initialPaymentAmount) || 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTimes} className="text-red-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Project
          </h3>
          <p className="text-red-700 mb-4">
            {error instanceof Error ? error.message : "Failed to load project"}
          </p>
          <button
            onClick={() => router.push("/provider/projects")}
            className="btn-primary"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

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
            onClick={() => router.push(`/provider/projects/${projectId}`)}
            className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
            aria-label="Go back"
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="text-neutral-600 text-lg"
            />
          </button>
          <div>
            <h1 className="heading-2 text-neutral-900">Edit Project</h1>
            <p className="text-neutral-600 body-regular mt-1">
              Update project details and information
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
                      Expected End Date <span className="text-red-500">*</span>
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
                Advance Payment
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
                      Advance payment received
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
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={updateProjectMutation.isPending}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProjectMutation.isPending ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                      />
                      Updating Project...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      Update Project
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={updateProjectMutation.isPending}
                  className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-700 body-small">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  <strong>Note:</strong> Changes will be saved immediately and
                  reflected across the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

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
