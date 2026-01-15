"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPenToSquare,
  faTrash,
  faUser,
  faEnvelope,
  faPhone,
  faBriefcase,
  faIdCard,
  faCalendar,
  faMapMarkerAlt,
  faFileAlt,
  faDollarSign,
  faExclamationTriangle,
  faUserGroup,
  faMessage,
  faFolder,
  faSpinner,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface TeamMember {
  id: number;
  full_name: string;
  initials: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employee_id: string;
  status: "active" | "inactive" | "on_leave";
  join_date: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  emergency_contact: string;
  emergency_phone: string;
  salary: string;
  skills: string[];
  notes: string;
  photo: string | null;
  is_active: boolean;
  projects_count: number;
  current_projects: Array<{ id: number; name: string }>;
  created_at: string;
  updated_at: string;
}

export default function ViewTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const employeeId = params.id as string;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch employee details
  const {
    data: member,
    isLoading,
    isError,
    error,
  } = useQuery<TeamMember>({
    queryKey: ["team-member", employeeId],
    queryFn: async () => {
      const response = await api.get<TeamMember>(
        `/api/v1/employees/${employeeId}/`
      );
      return response;
    },
    enabled: !!employeeId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/v1/employees/${employeeId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      showSuccessNotification("Team member deleted successfully");
      setTimeout(() => {
        router.push("/provider/teams");
      }, 1000);
    },
    onError: (error: any) => {
      alert(`Failed to delete team member: ${error.message}`);
    },
  });

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteModal(false);
  };

  const handleEdit = () => {
    router.push(`/provider/teams/${employeeId}/edit`);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-700 border-green-200",
      inactive: "bg-neutral-100 text-neutral-600 border-neutral-200",
      on_leave: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const getSkillColor = (skill: string) => {
    const colors: { [key: string]: string } = {
      Electrical: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Plumbing: "bg-blue-100 text-blue-700 border-blue-200",
      HVAC: "bg-orange-100 text-orange-700 border-orange-200",
      Carpentry: "bg-amber-100 text-amber-700 border-amber-200",
      "Project Management": "bg-primary-50 text-primary-700 border-primary-200",
      Supervision: "bg-purple-100 text-purple-700 border-purple-200",
      Design: "bg-pink-100 text-pink-700 border-pink-200",
      Landscaping: "bg-green-100 text-green-700 border-green-200",
    };
    return (
      colors[skill] || "bg-neutral-100 text-neutral-600 border-neutral-200"
    );
  };

  const formatStatusDisplay = (status: string) => {
    const displays: { [key: string]: string } = {
      active: "Active",
      inactive: "Inactive",
      on_leave: "On Leave",
    };
    return displays[status] || status;
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numAmount);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading team member details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !member) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTimes} className="text-red-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Team Member
          </h3>
          <p className="text-red-700 mb-4">
            {error instanceof Error ? error.message : "Team member not found"}
          </p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
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
              <h1 className="heading-2 text-neutral-900">{member.full_name}</h1>
              <p className="text-neutral-600 body-regular mt-1">
                Team Member Details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleEdit}
              className="btn-secondary flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPenToSquare} />
              Edit Member
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
          {/* Sidebar - Member Overview */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 sticky top-8">
              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center text-4xl font-bold">
                  {member.initials}
                </div>
              </div>

              {/* Name and Role */}
              <div className="text-center mb-6">
                <h2 className="heading-3 text-neutral-900 mb-2">
                  {member.full_name}
                </h2>
                <p className="text-neutral-600 body-regular mb-1">
                  {member.role}
                </p>
                <p className="text-neutral-500 text-sm">{member.department}</p>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center mb-6 pb-6 border-b border-neutral-100">
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getStatusBadgeColor(
                    member.status
                  )}`}
                >
                  {formatStatusDisplay(member.status)}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <FontAwesomeIcon
                    icon={faFolder}
                    className="text-primary-600 text-xl mb-2"
                  />
                  <p className="heading-4 text-neutral-900 mb-1">
                    {member.projects_count}
                  </p>
                  <p className="text-neutral-600 text-sm">Projects</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="text-blue-600 text-xl mb-2"
                  />
                  <p className="heading-4 text-neutral-900 mb-1">
                    {member.join_date
                      ? new Date().getFullYear() -
                        new Date(member.join_date).getFullYear()
                      : 0}
                    y
                  </p>
                  <p className="text-neutral-600 text-sm">Tenure</p>
                </div>
              </div>

              {/* Skills */}
              {member.skills && member.skills.length > 0 && (
                <div className="mb-6">
                  <p className="text-neutral-600 font-semibold mb-3 text-sm">
                    Skills & Certifications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getSkillColor(
                          skill
                        )}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-neutral-0 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                  <FontAwesomeIcon icon={faMessage} />
                  Send Message
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-0 border-2 border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium">
                  <FontAwesomeIcon icon={faPhone} />
                  Call Member
                </button>
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
                      href={`mailto:${member.email}`}
                      className="text-neutral-900 font-semibold hover:text-primary-600 transition-colors"
                    >
                      {member.email || "N/A"}
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
                      href={`tel:${member.phone}`}
                      className="text-neutral-900 font-semibold hover:text-primary-600 transition-colors"
                    >
                      {member.phone || "N/A"}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-primary-600"
                    />
                  </div>
                  <div>
                    <p className="text-neutral-600 body-small mb-1">
                      Emergency Contact
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {member.emergency_contact || "N/A"}
                    </p>
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
                    <p className="text-neutral-600 body-small mb-1">
                      Emergency Phone
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {member.emergency_phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6 flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faBriefcase}
                  className="text-primary-600"
                />
                Employment Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faIdCard}
                      className="text-primary-600"
                    />
                  </div>
                  <div>
                    <p className="text-neutral-600 body-small mb-1">
                      Employee ID
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {member.employee_id || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faBriefcase}
                      className="text-primary-600"
                    />
                  </div>
                  <div>
                    <p className="text-neutral-600 body-small mb-1">
                      Department
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {member.department || "N/A"}
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
                      Join Date
                    </p>
                    <p className="text-neutral-900 font-semibold">
                      {member.join_date
                        ? new Date(member.join_date).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      className="text-primary-600"
                    />
                  </div>
                  <div>
                    <p className="text-neutral-600 body-small mb-1">Salary</p>
                    <p className="text-neutral-900 font-semibold">
                      {member.salary ? formatCurrency(member.salary) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Card */}
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
                    {member.address || "N/A"}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-neutral-600 body-small mb-1">City</p>
                    <p className="text-neutral-900 font-semibold">
                      {member.city || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600 body-small mb-1">State</p>
                    <p className="text-neutral-900 font-semibold">
                      {member.state || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600 body-small mb-1">Zip Code</p>
                    <p className="text-neutral-900 font-semibold">
                      {member.zip_code || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            {member.notes && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <h2 className="heading-4 text-neutral-900 mb-4 flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faFileAlt}
                    className="text-primary-600"
                  />
                  Notes
                </h2>
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <p className="text-neutral-700 body-regular leading-relaxed whitespace-pre-wrap">
                    {member.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Projects Summary Card */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl border border-primary-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-4 flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faUserGroup}
                  className="text-primary-600"
                />
                Project Assignments
              </h2>
              <div className="mb-4">
                <p className="text-neutral-600 body-small mb-1">
                  Active Projects
                </p>
                <p className="heading-3 text-neutral-900">
                  {member.projects_count}
                </p>
              </div>
              {member.current_projects &&
                member.current_projects.length > 0 && (
                  <div className="mb-4">
                    <p className="text-neutral-600 body-small mb-2">
                      Current Assignments:
                    </p>
                    <div className="space-y-2">
                      {member.current_projects.map((project) => (
                        <div
                          key={project.id}
                          className="bg-neutral-0 rounded-lg p-3 border border-neutral-200"
                        >
                          <p className="text-neutral-900 font-semibold">
                            {project.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              <button className="w-full btn-primary flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faFolder} />
                View All Projects
              </button>
            </div>
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
                Delete Team Member?
              </h3>
              <p className="text-neutral-600 text-center mb-6">
                Are you sure you want to delete &quot;{member.full_name}&quot;?
                This action cannot be undone and will permanently remove all
                member data and project assignments.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  Warning: This will affect {member.projects_count} assigned
                  projects
                </p>
              </div>

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
                      Delete Member
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
