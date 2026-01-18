"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faDownload,
  faEye,
  faCheckCircle,
  faExclamationCircle,
  faClock,
  faCalendar,
  faReceipt,
  faFileInvoice,
  faDollarSign,
  faChartPie,
  faFilter,
  faTimes,
  faChevronDown,
  faSpinner,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Payment {
  id: number;
  project: number;
  amount: string;
  payment_date: string;
  payment_method?: string;
  transaction_id?: string;
  payment_type: "advance" | "milestone" | "final" | "other";
  payment_status: "pending" | "completed" | "failed";
  receipt_url?: string;
  notes?: string;
  posted_by_name: string;
  created_at: string;
}

interface Project {
  id: number;
  project_name: string;
  total_cost: string | null;
  advance_payment: string | null;
  balance_payment: string | null;
  status: string;
  service_provider: {
    id: number;
    full_name: string;
    business_name?: string;
    profile_image?: string;
  };
}

export default function ClientPaymentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Fetch projects
  const {
    data: projectsResponse,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => {
      if (!isAuthenticated()) {
        router.push("/login?type=client&session=expired");
        throw new Error("Not authenticated");
      }
      return api.get<{ count: number; results: Project[] }>(
        "/api/v1/projects/",
      );
    },
  });

  // Extract projects array from response
  const projects = projectsResponse?.results || [];

  // Fetch payments for selected project
  const {
    data: paymentsResponse,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useQuery({
    queryKey: ["project-payments", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return { count: 0, results: [] };
      return api.get<{ count: number; results: Payment[] }>(
        `/api/v1/projects/${selectedProject}/payments/`,
      );
    },
    enabled: !!selectedProject,
  });

  // Extract payments array from response
  const paymentsData = paymentsResponse?.results || [];

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (paymentData: {
      amount: number;
      payment_date: string;
      payment_method?: string;
      transaction_id?: string;
      payment_type: string;
      payment_status: string;
      receipt_url?: string;
      notes?: string;
    }) => {
      if (!selectedProject) throw new Error("No project selected");

      // Clean up the data - remove empty strings for optional fields
      const cleanedData = {
        amount: paymentData.amount,
        payment_date: paymentData.payment_date,
        payment_type: paymentData.payment_type,
        payment_status: paymentData.payment_status,
        ...(paymentData.payment_method &&
          paymentData.payment_method.trim() !== "" && {
            payment_method: paymentData.payment_method,
          }),
        ...(paymentData.transaction_id &&
          paymentData.transaction_id.trim() !== "" && {
            transaction_id: paymentData.transaction_id,
          }),
        ...(paymentData.receipt_url &&
          paymentData.receipt_url.trim() !== "" && {
            receipt_url: paymentData.receipt_url,
          }),
        ...(paymentData.notes &&
          paymentData.notes.trim() !== "" && {
            notes: paymentData.notes,
          }),
      };

      return api.post(
        `/api/v1/projects/${selectedProject}/payments/record/`,
        cleanedData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-payments"] });
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      setShowPaymentModal(false);
      setPaymentError(null);
    },
    onError: (error: any) => {
      console.error("Payment recording failed:", error);

      // Extract error message from different possible error formats
      let errorMessage = "Failed to record payment";

      if (error?.response?.data) {
        const errorData = error.response.data;

        // Handle DRF validation errors
        if (typeof errorData === "object") {
          if (errorData.error) {
            errorMessage = errorData.error;
          } else {
            // Handle field-specific errors
            const fieldErrors = Object.entries(errorData)
              .map(([field, errors]) => {
                if (Array.isArray(errors)) {
                  return `${field}: ${errors.join(", ")}`;
                }
                return `${field}: ${errors}`;
              })
              .join("; ");
            errorMessage = fieldErrors || errorMessage;
          }
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setPaymentError(errorMessage);
    },
  });

  // Set first project as default
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  const currentProject = projects.find((p) => p.id === selectedProject);

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "$0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: Payment["payment_status"]) => {
    const styles = {
      completed: "bg-green-50 text-green-700 border-green-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      failed: "bg-red-50 text-red-700 border-red-200",
    };
    const icons = {
      completed: faCheckCircle,
      pending: faClock,
      failed: faExclamationCircle,
    };
    const labels = {
      completed: "Paid",
      pending: "Pending",
      failed: "Failed",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}
      >
        <FontAwesomeIcon icon={icons[status]} className="text-xs" />
        {labels[status]}
      </span>
    );
  };

  const filteredPayments =
    filterStatus === "all"
      ? paymentsData
      : paymentsData.filter((p) => p.payment_status === filterStatus);

  const handleViewInvoice = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowInvoiceModal(true);
  };

  const handleRecordPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPaymentError(null);

    const formData = new FormData(e.currentTarget);

    const amount = formData.get("amount") as string;
    if (!amount || parseFloat(amount) <= 0) {
      setPaymentError("Amount must be greater than 0");
      return;
    }

    recordPaymentMutation.mutate({
      amount: parseFloat(amount),
      payment_date: formData.get("payment_date") as string,
      payment_method: formData.get("payment_method") as string,
      transaction_id: formData.get("transaction_id") as string,
      payment_type: formData.get("payment_type") as string,
      payment_status: "completed",
      notes: formData.get("notes") as string,
    });
  };

  const totalPaid =
    paymentsData
      .filter((p) => p.payment_status === "completed")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  const totalCost = currentProject?.total_cost
    ? parseFloat(currentProject.total_cost)
    : 0;
  const amountDue = totalCost - totalPaid;
  const progressPercentage = totalCost > 0 ? (totalPaid / totalCost) * 100 : 0;

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="w-8 h-8 text-primary-600"
        />
      </div>
    );
  }

  if (projectsError || projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-neutral-600">No projects found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-2 text-neutral-900 mb-1">
              Payments & Invoices
            </h1>
            <p className="text-neutral-600 body-regular">
              Track your project costs and payment history
            </p>
          </div>
          <button
            onClick={() => {
              setShowPaymentModal(true);
              setPaymentError(null);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Record Payment
          </button>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Project Selector */}
        {projects.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Project
            </label>
            <select
              value={selectedProject || ""}
              onChange={(e) => setSelectedProject(Number(e.target.value))}
              className="w-full md:w-96 px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Project Cost Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Project Cost */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-neutral-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faChartPie} className="text-2xl" />
              </div>
              <div>
                <p className="text-neutral-100 text-sm font-medium">
                  Total Project Cost
                </p>
                <p className="text-xs text-neutral-200">
                  {currentProject?.project_name}
                </p>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">
              {formatCurrency(totalCost)}
            </p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-100">Payment Progress</span>
                <span className="font-semibold">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Amount Paid */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-green-600 text-2xl"
                />
              </div>
              <div>
                <p className="text-neutral-600 text-sm font-medium">
                  Amount Paid
                </p>
                <p className="text-xs text-neutral-500">Completed payments</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(totalPaid)}
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-600 text-xs"
              />
              <span>
                {
                  paymentsData.filter((p) => p.payment_status === "completed")
                    .length
                }{" "}
                payments completed
              </span>
            </div>
          </div>

          {/* Amount Due */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faExclamationCircle}
                  className="text-yellow-600 text-2xl"
                />
              </div>
              <div>
                <p className="text-neutral-600 text-sm font-medium">
                  Amount Due
                </p>
                <p className="text-xs text-neutral-500">Remaining balance</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-600 mb-2">
              {formatCurrency(amountDue)}
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <FontAwesomeIcon
                icon={faClock}
                className="text-yellow-600 text-xs"
              />
              <span>
                {
                  paymentsData.filter((p) => p.payment_status !== "completed")
                    .length
                }{" "}
                pending
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200">
          {/* Header with Filter */}
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-3 text-neutral-900 flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faReceipt}
                  className="text-primary-600"
                />
                Payment History
                <span className="text-sm font-normal text-neutral-500">
                  ({filteredPayments.length})
                </span>
              </h2>

              {/* Filter Dropdown */}
              <div className="flex items-center gap-3">
                <label className="text-neutral-600 font-medium text-sm flex items-center gap-2">
                  <FontAwesomeIcon icon={faFilter} />
                  Filter:
                </label>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none px-4 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm cursor-pointer pr-10"
                  >
                    <option value="all">All Payments</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment List */}
          <div className="divide-y divide-neutral-200">
            {paymentsLoading ? (
              <div className="p-12 text-center">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="w-8 h-8 text-primary-600"
                />
              </div>
            ) : filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-6 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Payment Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon
                          icon={faFileInvoice}
                          className="text-primary-600 text-xl"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-neutral-900">
                            {payment.payment_type.charAt(0).toUpperCase() +
                              payment.payment_type.slice(1)}{" "}
                            Payment
                          </h3>
                          {getStatusBadge(payment.payment_status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faCalendar}
                              className="text-xs"
                            />
                            {formatDate(payment.payment_date)}
                          </span>
                          {payment.payment_method && (
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon
                                icon={faCreditCard}
                                className="text-xs"
                              />
                              {payment.payment_method}
                            </span>
                          )}
                        </div>
                        {payment.transaction_id && (
                          <p className="text-xs text-neutral-500 mt-1">
                            Transaction ID: {payment.transaction_id}
                          </p>
                        )}
                        {payment.notes && (
                          <p className="text-sm text-neutral-600 mt-2">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Amount and Actions */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-neutral-900">
                          {formatCurrency(payment.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewInvoice(payment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-neutral-500">
                <FontAwesomeIcon
                  icon={faReceipt}
                  className="text-5xl mb-4 opacity-30"
                />
                <p className="font-medium">No payments found</p>
                <p className="text-sm mt-2">
                  {filterStatus === "all"
                    ? "Record your first payment"
                    : "Try adjusting your filter"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="heading-4 text-neutral-900">Record Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentError(null);
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {/* Error Display */}
              {paymentError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationCircle} />
                    {paymentError}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    name="payment_date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Payment Type *
                  </label>
                  <select
                    name="payment_type"
                    required
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="advance">Advance</option>
                    <option value="milestone">Milestone</option>
                    <option value="final">Final</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Payment Method
                  </label>
                  <input
                    type="text"
                    name="payment_method"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Credit Card, Bank Transfer, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Transaction ID
                </label>
                <input
                  type="text"
                  name="transaction_id"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Optional transaction reference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Additional payment details..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentError(null);
                  }}
                  className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {recordPaymentMutation.isPending ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Recording...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showInvoiceModal && selectedPayment && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="heading-4 text-neutral-900">Payment Details</h3>
                <p className="text-neutral-600 text-sm mt-1">
                  {currentProject?.project_name}
                </p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-start justify-between mb-8 pb-8 border-b border-neutral-200">
                <div>
                  <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                    PAYMENT RECEIPT
                  </h2>
                  <p className="text-neutral-600">ID: {selectedPayment.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-neutral-600 text-sm mb-1">Date</p>
                  <p className="font-semibold text-neutral-900">
                    {formatDate(selectedPayment.payment_date)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-neutral-200">
                <div>
                  <p className="text-neutral-600 text-sm font-semibold mb-2">
                    FROM
                  </p>
                  <p className="font-semibold text-neutral-900">
                    {currentProject?.service_provider.business_name ||
                      currentProject?.service_provider.full_name}
                  </p>
                  <p className="text-neutral-600 text-sm">Service Provider</p>
                </div>
                <div>
                  <p className="text-neutral-600 text-sm font-semibold mb-2">
                    PAYMENT BY
                  </p>
                  <p className="font-semibold text-neutral-900">
                    {selectedPayment.posted_by_name}
                  </p>
                  <p className="text-neutral-600 text-sm">Client</p>
                </div>
              </div>

              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 text-neutral-600 text-sm font-semibold">
                        DESCRIPTION
                      </th>
                      <th className="text-right py-3 text-neutral-600 text-sm font-semibold">
                        AMOUNT
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-100">
                      <td className="py-4 text-neutral-900">
                        {selectedPayment.payment_type.charAt(0).toUpperCase() +
                          selectedPayment.payment_type.slice(1)}{" "}
                        Payment - {currentProject?.project_name}
                      </td>
                      <td className="py-4 text-right font-semibold text-neutral-900">
                        {formatCurrency(selectedPayment.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="flex items-center justify-between py-3 border-t-2 border-neutral-900">
                    <span className="font-bold text-neutral-900 text-lg">
                      TOTAL
                    </span>
                    <span className="font-bold text-neutral-900 text-2xl">
                      {formatCurrency(selectedPayment.amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-neutral-700">
                    Payment Status:
                  </span>
                  {getStatusBadge(selectedPayment.payment_status)}
                </div>
                {selectedPayment.payment_method && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-neutral-600 text-sm">
                      Payment Method:
                    </span>
                    <span className="font-medium text-neutral-900 text-sm">
                      {selectedPayment.payment_method}
                    </span>
                  </div>
                )}
                {selectedPayment.transaction_id && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-neutral-600 text-sm">
                      Transaction ID:
                    </span>
                    <span className="font-mono text-neutral-900 text-sm">
                      {selectedPayment.transaction_id}
                    </span>
                  </div>
                )}
                {selectedPayment.notes && (
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <p className="text-neutral-600 text-sm mb-1">Notes:</p>
                    <p className="text-neutral-900 text-sm">
                      {selectedPayment.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  Thank you for your payment! This receipt has been recorded in
                  the project history.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
