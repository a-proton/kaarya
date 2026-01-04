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
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  amount: number;
  status: "pending" | "in-progress" | "completed";
}

interface MilestoneFormData {
  title: string;
  description: string;
  dueDate: string;
  amount: string;
  status: "pending" | "in-progress" | "completed";
}

export default function EditProjectPage() {
  const router = useRouter();

  // Sample existing project data
  const existingProject = {
    id: "1",
    name: "Kitchen Renovation",
    location: "123 Main Street, New York, NY",
    clientName: "Sarah Johnson",
    projectBudget: "$75,000",
    startDate: "2024-01-15",
    endDate: "2024-02-28",
    category: "Renovation",
    description:
      "Complete kitchen renovation including new cabinets, countertops, appliances, and electrical work. The project involves removing old fixtures, updating plumbing, installing modern lighting, and creating an open-concept design that flows into the dining area.",
    initialPaymentTaken: true,
    initialPaymentAmount: "15000",
    milestones: [
      {
        id: "1",
        title: "Demolition Complete",
        description: "Remove old cabinets, countertops, and fixtures",
        dueDate: "2024-01-20",
        amount: 8000,
        status: "completed" as const,
      },
      {
        id: "2",
        title: "Electrical & Plumbing Rough-In",
        description: "Install new electrical wiring and plumbing lines",
        dueDate: "2024-02-05",
        amount: 12000,
        status: "in-progress" as const,
      },
      {
        id: "3",
        title: "Cabinet Installation",
        description: "Install new custom cabinets and hardware",
        dueDate: "2024-02-15",
        amount: 18000,
        status: "pending" as const,
      },
    ],
  };

  const [projectName, setProjectName] = useState(existingProject.name);
  const [location, setLocation] = useState(existingProject.location);
  const [clientName, setClientName] = useState(existingProject.clientName);
  const [projectBudget, setProjectBudget] = useState(
    existingProject.projectBudget
  );
  const [startDate, setStartDate] = useState(existingProject.startDate);
  const [endDate, setEndDate] = useState(existingProject.endDate);
  const [category, setCategory] = useState(existingProject.category);
  const [description, setDescription] = useState(existingProject.description);
  const [initialPaymentTaken, setInitialPaymentTaken] = useState(
    existingProject.initialPaymentTaken
  );
  const [initialPaymentAmount, setInitialPaymentAmount] = useState(
    existingProject.initialPaymentAmount
  );
  const [milestones, setMilestones] = useState<Milestone[]>(
    existingProject.milestones
  );
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
      "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[status];
  };

  const getStatusIcon = (status: Milestone["status"]) => {
    const icons = {
      pending: faExclamationTriangle,
      "in-progress": faCheckCircle,
      completed: faCheck,
    };
    return icons[status];
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const projectData = {
      id: existingProject.id,
      projectName,
      location,
      clientName,
      projectBudget,
      startDate,
      endDate,
      category,
      description,
      initialPaymentTaken,
      initialPaymentAmount: initialPayment,
      milestones,
      totalProjectValue,
    };
    console.log("Updated Project Data:", projectData);
    showSuccessNotification("Project updated successfully!");
    setTimeout(() => {
      router.push(`/provider/projects/${existingProject.id}`);
    }, 1500);
  };

  const handleCancel = () => {
    if (
      confirm(
        "Are you sure you want to cancel? All unsaved changes will be lost."
      )
    ) {
      router.back();
    }
  };

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
            onClick={() => router.back()}
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
              Update project information and milestones
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

                <div>
                  <label
                    htmlFor="clientName"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-primary-600 mr-2"
                    />
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., John Smith"
                    required
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                <div>
                  <label
                    htmlFor="projectBudget"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    <FontAwesomeIcon
                      icon={faMoneyBill}
                      className="text-primary-600 mr-2"
                    />
                    Project Estimated Budget{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="projectBudget"
                    value={projectBudget}
                    onChange={(e) => setProjectBudget(e.target.value)}
                    placeholder="e.g., $50,000"
                    required
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

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
                Initial Payment
              </h2>

              <div className="space-y-5">
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
                      Check this if you've received an initial deposit/advance
                      payment from the client
                    </p>
                  </div>
                </div>

                {initialPaymentTaken && (
                  <div>
                    <label
                      htmlFor="initialPaymentAmount"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      Payment Amount <span className="text-red-500">*</span>
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
                      <p className="mt-2 text-green-600 text-sm font-medium flex items-center gap-2">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Initial payment: {formatCurrency(initialPayment)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Milestones Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-4 text-neutral-900 flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-primary-600"
                  />
                  Project Milestones & Payments
                  {milestones.length > 0 && (
                    <span className="text-sm font-normal text-neutral-500">
                      ({milestones.length})
                    </span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => openMilestoneModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-neutral-0 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add Milestone
                </button>
              </div>

              {milestones.length > 0 ? (
                <div className="space-y-3">
                  {milestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-primary-500 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 text-primary-600 font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-neutral-900 mb-1">
                            {milestone.title}
                          </h4>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-primary-600 font-semibold text-sm flex items-center gap-1">
                              <FontAwesomeIcon
                                icon={faDollarSign}
                                className="text-xs"
                              />
                              {formatCurrency(milestone.amount)}
                            </span>
                            <span className="text-neutral-400">•</span>
                            <span className="text-neutral-500 text-sm flex items-center gap-1">
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
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold border flex items-center gap-1 ${getStatusBadgeColor(
                                milestone.status
                              )}`}
                            >
                              <FontAwesomeIcon
                                icon={getStatusIcon(milestone.status)}
                                className="text-xs"
                              />
                              {milestone.status === "in-progress"
                                ? "In Progress"
                                : milestone.status.charAt(0).toUpperCase() +
                                  milestone.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => viewMilestone(milestone)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label="View milestone"
                          title="View details"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openMilestoneModal(milestone)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          aria-label="Edit milestone"
                          title="Edit milestone"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMilestone(milestone.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete milestone"
                          title="Delete milestone"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-primary-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-700">
                        Total Milestone Payments:
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalMilestoneAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-5xl mb-4 opacity-30"
                  />
                  <p className="body-regular">No milestones added yet</p>
                  <p className="body-small mt-2">
                    Click "Add Milestone" to create milestones with payment
                    amounts
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 sticky top-8">
              <h3 className="heading-4 text-neutral-900 mb-4">
                Project Summary
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 pb-4 border-b border-neutral-100">
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
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}`
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-primary-600 mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-neutral-600 body-small mb-1">
                      Milestones
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {milestones.length}{" "}
                      {milestones.length === 1 ? "milestone" : "milestones"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              {(totalProjectValue > 0 || initialPayment > 0) && (
                <div className="mb-6 p-4 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
                  <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      className="text-primary-600"
                    />
                    Payment Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    {initialPayment > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">
                          Initial Payment:
                        </span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(initialPayment)}
                        </span>
                      </div>
                    )}
                    {totalMilestoneAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Milestones:</span>
                        <span className="font-semibold text-neutral-900">
                          {formatCurrency(totalMilestoneAmount)}
                        </span>
                      </div>
                    )}
                    {totalProjectValue > 0 && (
                      <>
                        <div className="border-t border-primary-200 my-2"></div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-700">
                            Total Project Value:
                          </span>
                          <span className="text-xl font-bold text-primary-600">
                            {formatCurrency(totalProjectValue)}
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
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full btn-secondary"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-700 body-small">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  <strong>Note:</strong> Changes will be saved when you click
                  "Save Changes"
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Add/Edit Milestone Modal */}
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
                    : "Create a milestone with payment amount"}
                </p>
              </div>
              <button
                onClick={closeMilestoneModal}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Close modal"
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
                  className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
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
                  className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
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
                      className="w-full pl-10 pr-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
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
                    className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
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
                      status: e.target.value as Milestone["status"],
                    })
                  }
                  className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                >
                  <option value="pending">⚠ Pending</option>
                  <option value="in-progress">⏱ In Progress</option>
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
                    Payment amount will be used to track project finances and
                    generate invoices for the client.
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
                  Review milestone information and payment
                </p>
              </div>
              <button
                onClick={closeViewModal}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Close modal"
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
                    <p className="text-neutral-700 body-regular leading-relaxed">
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
                  {viewingMilestone.status === "in-progress"
                    ? "In Progress"
                    : viewingMilestone.status.charAt(0).toUpperCase() +
                      viewingMilestone.status.slice(1)}
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
    </div>
  );
}
