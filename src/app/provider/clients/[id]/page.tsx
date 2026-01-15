"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPenToSquare,
  faTrash,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faFolder,
  faDollarSign,
  faCalendar,
  faExclamationTriangle,
  faSpinner,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService } from "@/lib/clientService";

export default function ViewClientPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const clientId = Number(params.id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch client details
  const {
    data: client,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => clientService.getClientDetails(clientId),
    enabled: !!clientId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => clientService.deleteClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      alert(`Client deleted successfully`);
      router.push("/provider/clients");
    },
    onError: (error: any) => {
      const errorMessage =
        error.data?.detail || error.message || "Failed to delete client";
      alert(`Error: ${errorMessage}`);
      setShowDeleteModal(false);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleEdit = () => {
    router.push(`/provider/clients/${clientId}/edit`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      pending: {
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        label: "Pending",
      },
      not_started: {
        color: "bg-neutral-100 text-neutral-700 border-neutral-200",
        label: "Not Started",
      },
      in_progress: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        label: "In Progress",
      },
      completed: {
        color: "bg-green-100 text-green-700 border-green-200",
        label: "Completed",
      },
      on_hold: {
        color: "bg-orange-100 text-orange-700 border-orange-200",
        label: "On Hold",
      },
      cancelled: {
        color: "bg-red-100 text-red-700 border-red-200",
        label: "Cancelled",
      },
    };

    const statusInfo = statusMap[status] || {
      color: "bg-neutral-100 text-neutral-600 border-neutral-200",
      label: status,
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium border ${statusInfo.color}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Client not found</p>
          <button
            onClick={() => router.push("/provider/clients")}
            className="btn-primary"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                className="text-neutral-600 text-lg"
              />
            </button>
            <div>
              <h1 className="heading-2 text-neutral-900">{client.full_name}</h1>
              <p className="text-neutral-600 body-regular mt-1">
                Client Details & History
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleEdit}
              className="btn-secondary flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPenToSquare} />
              Edit Client
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-5 py-3 bg-red-600 text-neutral-0 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faTrash} />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Client Overview */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 sticky top-8">
              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center text-4xl font-bold">
                  {getInitials(client.full_name)}
                </div>
              </div>

              {/* Name */}
              <div className="text-center mb-6">
                <h2 className="heading-3 text-neutral-900 mb-2">
                  {client.full_name}
                </h2>
                <p className="text-neutral-600 body-regular">{client.email}</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <FontAwesomeIcon
                    icon={faFolder}
                    className="text-primary-600 text-xl mb-2"
                  />
                  <p className="heading-4 text-neutral-900 mb-1">
                    {client.stats.total_projects}
                  </p>
                  <p className="text-neutral-600 text-sm">Projects</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="text-green-600 text-xl mb-2"
                  />
                  <p className="heading-4 text-neutral-900 mb-1">
                    {formatCurrency(client.stats.total_spent)}
                  </p>
                  <p className="text-neutral-600 text-sm">Spent</p>
                </div>
              </div>

              {/* Status */}
              <div className="text-center mb-6 p-4 bg-neutral-50 rounded-lg">
                <p className="text-neutral-600 text-sm mb-2">Status</p>
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    client.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {client.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6 flex items-center gap-3">
                <FontAwesomeIcon icon={faUser} className="text-primary-600" />
                Contact Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-primary-600"
                    />
                  </div>
                  <div>
                    <p className="text-neutral-600 body-small mb-1">Email</p>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-neutral-900 font-semibold hover:text-primary-600 transition-colors"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faPhone}
                      className="text-primary-600"
                    />
                  </div>
                  <div>
                    <p className="text-neutral-600 body-small mb-1">Phone</p>
                    <a
                      href={`tel:${client.phone}`}
                      className="text-neutral-900 font-semibold hover:text-primary-600 transition-colors"
                    >
                      {client.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="text-primary-600"
                    />
                  </div>
                  <div>
                    <p className="text-neutral-600 body-small mb-1">Location</p>
                    <p className="text-neutral-900 font-semibold">
                      {client.city}, {client.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="text-primary-600"
                    />
                  </div>
                  <div>
                    <p className="text-neutral-600 body-small mb-1">
                      Client Since
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {new Date(client.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            {client.address && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <h2 className="heading-4 text-neutral-900 mb-6 flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="text-primary-600"
                  />
                  Address Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-neutral-600 body-small mb-1">
                      Street Address
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {client.address}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-neutral-600 body-small mb-1">City</p>
                      <p className="text-neutral-900 font-semibold">
                        {client.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-600 body-small mb-1">State</p>
                      <p className="text-neutral-900 font-semibold">
                        {client.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-600 body-small mb-1">
                        Postal Code
                      </p>
                      <p className="text-neutral-900 font-semibold">
                        {client.postal_code || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6 flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-primary-600"
                />
                Project Statistics
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-50 rounded-lg text-center">
                  <p className="text-neutral-600 body-small mb-2">Total</p>
                  <p className="text-neutral-900 font-semibold text-2xl">
                    {client.stats.total_projects}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-neutral-600 body-small mb-2">Active</p>
                  <p className="text-blue-600 font-semibold text-2xl">
                    {client.stats.active_projects}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-neutral-600 body-small mb-2">Completed</p>
                  <p className="text-green-600 font-semibold text-2xl">
                    {client.stats.completed_projects}
                  </p>
                </div>
                <div className="p-4 bg-primary-50 rounded-lg text-center">
                  <p className="text-neutral-600 body-small mb-2">
                    Total Spent
                  </p>
                  <p className="text-primary-600 font-semibold text-lg">
                    {formatCurrency(client.stats.total_spent)}
                  </p>
                </div>
              </div>
            </div>

            {/* Projects List */}
            {client.projects && client.projects.length > 0 && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <h2 className="heading-4 text-neutral-900 mb-6 flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faFolder}
                    className="text-primary-600"
                  />
                  Projects ({client.projects.length})
                </h2>

                <div className="space-y-4">
                  {client.projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-neutral-900">
                          {project.name}
                        </h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        {project.start_date && (
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faCalendar}
                              className="text-xs"
                            />
                            {new Date(project.start_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-semibold text-green-600">
                          <FontAwesomeIcon
                            icon={faDollarSign}
                            className="text-xs"
                          />
                          {formatCurrency(project.total_cost)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-red-600 text-xl"
                />
              </div>
              <h3 className="heading-4 text-neutral-900 text-center mb-2">
                Delete Client?
              </h3>
              <p className="text-neutral-600 text-center mb-6">
                Are you sure you want to delete "{client.full_name}"? This
                action cannot be undone.
              </p>

              {client.project_count > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    This client has {client.project_count} associated project
                    {client.project_count !== 1 ? "s" : ""}. The client will be
                    soft deleted (deactivated) to preserve project data.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-5 py-3 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-5 py-3 bg-red-600 text-neutral-0 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faTrash} />
                      Delete Client
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
