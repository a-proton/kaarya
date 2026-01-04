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
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

interface Payment {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
  paymentMethod?: string;
  transactionId?: string;
}

interface ProjectCost {
  projectName: string;
  totalCost: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
}

export default function ClientPaymentsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Mock project cost data
  const projectCost: ProjectCost = {
    projectName: "Kitchen Remodel",
    totalCost: 45000,
    amountPaid: 27000,
    amountDue: 18000,
    currency: "USD",
  };

  // Mock payment history
  const payments: Payment[] = [
    {
      id: "1",
      invoiceNumber: "INV-2025-001",
      description: "Initial Deposit - Kitchen Remodel",
      amount: 15000,
      date: "2025-01-05",
      status: "paid",
      paymentMethod: "Credit Card",
      transactionId: "TXN-458920",
    },
    {
      id: "2",
      invoiceNumber: "INV-2025-002",
      description: "Milestone 1 - Foundation & Electrical Work",
      amount: 12000,
      date: "2025-01-15",
      status: "paid",
      paymentMethod: "Bank Transfer",
      transactionId: "TXN-458921",
    },
    {
      id: "3",
      invoiceNumber: "INV-2025-003",
      description: "Milestone 2 - Cabinet Installation",
      amount: 10000,
      date: "2025-01-25",
      status: "pending",
    },
    {
      id: "4",
      invoiceNumber: "INV-2025-004",
      description: "Final Payment - Project Completion",
      amount: 8000,
      date: "2025-02-10",
      status: "pending",
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: projectCost.currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: Payment["status"]) => {
    const styles = {
      paid: "bg-green-50 text-green-700 border-green-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      overdue: "bg-red-50 text-red-700 border-red-200",
    };
    const icons = {
      paid: faCheckCircle,
      pending: faClock,
      overdue: faExclamationCircle,
    };
    const labels = {
      paid: "Paid",
      pending: "Pending",
      overdue: "Overdue",
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
      ? payments
      : payments.filter((p) => p.status === filterStatus);

  const handleViewInvoice = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowInvoiceModal(true);
  };

  const handleDownloadInvoice = (payment: Payment) => {
    console.log("Downloading invoice:", payment.invoiceNumber);
    alert(`Downloading invoice ${payment.invoiceNumber}`);
  };

  const handleMakePayment = (payment: Payment) => {
    console.log("Making payment for:", payment.invoiceNumber);
    alert(`Redirecting to payment gateway for ${payment.invoiceNumber}`);
  };

  const progressPercentage =
    (projectCost.amountPaid / projectCost.totalCost) * 100;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div>
          <h1 className="heading-2 text-neutral-900 mb-1">
            Payments & Invoices
          </h1>
          <p className="text-neutral-600 body-regular">
            Track your project costs and payment history
          </p>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
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
                  {projectCost.projectName}
                </p>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">
              {formatCurrency(projectCost.totalCost)}
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
              {formatCurrency(projectCost.amountPaid)}
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-600 text-xs"
              />
              <span>
                {payments.filter((p) => p.status === "paid").length} payments
                completed
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
                <p className="text-xs text-neutral-500">Pending payments</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-600 mb-2">
              {formatCurrency(projectCost.amountDue)}
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <FontAwesomeIcon
                icon={faClock}
                className="text-yellow-600 text-xs"
              />
              <span>
                {payments.filter((p) => p.status !== "paid").length} pending
                invoices
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
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Active Filter Indicator */}
            {filterStatus !== "all" && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-600 text-sm">Active filter:</span>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium border border-primary-200">
                  {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                  <button
                    onClick={() => setFilterStatus("all")}
                    className="hover:text-primary-900"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* Payment List */}
          <div className="divide-y divide-neutral-200">
            {filteredPayments.length > 0 ? (
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
                            {payment.description}
                          </h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faFileInvoice}
                              className="text-xs"
                            />
                            {payment.invoiceNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faCalendar}
                              className="text-xs"
                            />
                            {formatDate(payment.date)}
                          </span>
                          {payment.paymentMethod && (
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon
                                icon={faCreditCard}
                                className="text-xs"
                              />
                              {payment.paymentMethod}
                            </span>
                          )}
                        </div>
                        {payment.transactionId && (
                          <p className="text-xs text-neutral-500 mt-1">
                            Transaction ID: {payment.transactionId}
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
                          title="View invoice"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(payment)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download invoice"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                        {payment.status === "pending" && (
                          <button
                            onClick={() => handleMakePayment(payment)}
                            className="px-4 py-2 bg-primary-600 text-neutral-0 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                          >
                            Pay Now
                          </button>
                        )}
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
                <p className="text-sm mt-2">Try adjusting your filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon
                icon={faCreditCard}
                className="text-blue-600 text-xl"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Payment Information
              </h3>
              <p className="text-blue-700 text-sm mb-3">
                Payments are processed securely through our payment gateway. You
                can pay using credit card, debit card, or bank transfer.
              </p>
              <div className="flex items-center gap-4 text-sm text-blue-600">
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  Secure payments
                </span>
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  Instant receipts
                </span>
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  Multiple payment methods
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Invoice Modal */}
      {showInvoiceModal && selectedPayment && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="heading-4 text-neutral-900">Invoice Details</h3>
                <p className="text-neutral-600 text-sm mt-1">
                  {selectedPayment.invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            {/* Invoice Content */}
            <div className="p-8">
              {/* Invoice Header */}
              <div className="flex items-start justify-between mb-8 pb-8 border-b border-neutral-200">
                <div>
                  <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                    INVOICE
                  </h2>
                  <p className="text-neutral-600">
                    {selectedPayment.invoiceNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-neutral-600 text-sm mb-1">Date Issued</p>
                  <p className="font-semibold text-neutral-900">
                    {formatDate(selectedPayment.date)}
                  </p>
                </div>
              </div>

              {/* From/To Section */}
              <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-neutral-200">
                <div>
                  <p className="text-neutral-600 text-sm font-semibold mb-2">
                    FROM
                  </p>
                  <p className="font-semibold text-neutral-900">
                    Michael Rodriguez
                  </p>
                  <p className="text-neutral-600 text-sm">
                    Licensed Electrician
                  </p>
                  <p className="text-neutral-600 text-sm">+1 (555) 123-4567</p>
                  <p className="text-neutral-600 text-sm">
                    michael@contractor.com
                  </p>
                </div>
                <div>
                  <p className="text-neutral-600 text-sm font-semibold mb-2">
                    TO
                  </p>
                  <p className="font-semibold text-neutral-900">John Smith</p>
                  <p className="text-neutral-600 text-sm">
                    {projectCost.projectName}
                  </p>
                  <p className="text-neutral-600 text-sm">
                    john.smith@email.com
                  </p>
                </div>
              </div>

              {/* Invoice Items */}
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
                        {selectedPayment.description}
                      </td>
                      <td className="py-4 text-right font-semibold text-neutral-900">
                        {formatCurrency(selectedPayment.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total */}
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

              {/* Status */}
              <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-700">
                    Payment Status:
                  </span>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                {selectedPayment.paymentMethod && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-neutral-600 text-sm">
                      Payment Method:
                    </span>
                    <span className="font-medium text-neutral-900 text-sm">
                      {selectedPayment.paymentMethod}
                    </span>
                  </div>
                )}
                {selectedPayment.transactionId && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-neutral-600 text-sm">
                      Transaction ID:
                    </span>
                    <span className="font-mono text-neutral-900 text-sm">
                      {selectedPayment.transactionId}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  Thank you for your business! If you have any questions about
                  this invoice, please contact your service provider.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadInvoice(selectedPayment)}
                className="btn-primary flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} />
                Download Invoice
              </button>
              {selectedPayment.status === "pending" && (
                <button
                  onClick={() => {
                    setShowInvoiceModal(false);
                    handleMakePayment(selectedPayment);
                  }}
                  className="px-5 py-2.5 bg-green-600 text-neutral-0 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faCreditCard} />
                  Pay Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
