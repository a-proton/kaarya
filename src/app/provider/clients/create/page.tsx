"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faPlus,
  faCheckCircle,
  faLock,
  faEye,
  faEyeSlash,
  faKey,
  faSpinner,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { clientService, ClientCreateData } from "@/lib/clientService";
import { api } from "@/lib/api";

// Add Project interface
interface Project {
  id: number;
  name: string;
  status: string;
  project_name?: string; // in case API returns this instead
}

interface ProjectsResponse {
  results: Project[];
  count: number;
  next: string | null;
  previous: string | null;
}

export default function AddClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("+977");

  // Project assignment
  const [assignToProject, setAssignToProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  // Portal Credentials
  const [createPortalAccount, setCreatePortalAccount] = useState(true);
  const [clientPassword, setClientPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch projects for dropdown - FIXED TO USE api.get() LIKE VIEW PROJECT PAGE
  const { data: projectsData, isLoading: loadingProjects } =
    useQuery<ProjectsResponse>({
      queryKey: ["projects", "without-client"],
      queryFn: async () => {
        try {
          const response = await api.get<ProjectsResponse>(
            "/api/v1/projects/?without_client=true"
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
      enabled: assignToProject,
      retry: (failureCount, error: any) => {
        // Don't retry on 401
        if (error.status === 401) return false;
        return failureCount < 3;
      },
    });

  // Create client mutation
  const createMutation = useMutation({
    mutationFn: (data: ClientCreateData) => clientService.createClient(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      const successMessage =
        selectedProjectId && assignToProject
          ? `Client "${data.full_name}" created and assigned to project successfully!`
          : `Client "${data.full_name}" created successfully!`;

      alert(successMessage);
      router.push("/provider/clients");
    },
    onError: (error: any) => {
      const errorMessage =
        error.data?.detail || error.message || "Failed to create client";
      alert(`Error: ${errorMessage}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!clientName || !email || !phone) {
      alert("Please fill in all required fields");
      return;
    }

    if (createPortalAccount) {
      if (!clientPassword || clientPassword.length < 8) {
        alert("Password must be at least 8 characters long");
        return;
      }
      if (clientPassword !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }
    }

    if (assignToProject && !selectedProjectId) {
      alert("Please select a project to assign the client to");
      return;
    }

    // Build client data with project_id included
    const clientData: ClientCreateData = {
      full_name: clientName,
      email,
      phone,
      password: createPortalAccount ? clientPassword : undefined,
      city: city || undefined,
      state: state || undefined,
      address: address || undefined,
      postal_code: postalCode || undefined,
      country_code: countryCode,
      project_id: assignToProject ? selectedProjectId || undefined : undefined,
    };

    createMutation.mutate(clientData);
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isSubmitting = createMutation.isPending;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
            disabled={isSubmitting}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="text-neutral-600 text-lg"
            />
          </button>
          <div>
            <h1 className="heading-2 text-neutral-900">Add New Client</h1>
            <p className="text-neutral-600 body-regular mt-1">
              Create a new client profile and optionally assign to a project
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6 flex items-center gap-3">
                <FontAwesomeIcon icon={faUser} className="text-primary-600" />
                Basic Information
              </h2>

              <div className="space-y-5">
                {/* Client Name */}
                <div>
                  <label
                    htmlFor="clientName"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., John Smith"
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-primary-600 mr-2"
                      />
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@email.com"
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="text-primary-600 mr-2"
                      />
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+9779841234567"
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50"
                    />
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
                Address Information
              </h2>

              <div className="space-y-5">
                {/* Street Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main Street"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50"
                  />
                </div>

                {/* City, State, Postal Code */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Pokhara"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      State/Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Gandaki"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="postalCode"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="33700"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Project Assignment Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-4 text-neutral-900 flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faFolderOpen}
                    className="text-primary-600"
                  />
                  Project Assignment (Optional)
                </h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignToProject}
                    onChange={(e) => {
                      setAssignToProject(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedProjectId(null);
                      }
                    }}
                    disabled={isSubmitting}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-0 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-neutral-0 after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {assignToProject ? (
                <div className="space-y-5">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-700 text-sm">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      The client will be assigned to the selected project during
                      creation.
                    </p>
                  </div>

                  {/* Project Selection Dropdown */}
                  <div>
                    <label
                      htmlFor="projectSelect"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      <FontAwesomeIcon
                        icon={faFolderOpen}
                        className="text-primary-600 mr-2"
                      />
                      Select Project <span className="text-red-500">*</span>
                    </label>

                    {loadingProjects ? (
                      <div className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin text-primary-600"
                        />
                        <span className="text-neutral-600">
                          Loading projects...
                        </span>
                      </div>
                    ) : projectsData?.results &&
                      projectsData.results.length > 0 ? (
                      <select
                        id="projectSelect"
                        value={selectedProjectId || ""}
                        onChange={(e) =>
                          setSelectedProjectId(Number(e.target.value))
                        }
                        disabled={isSubmitting}
                        required={assignToProject}
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50"
                      >
                        <option value="">-- Select a project --</option>
                        {projectsData.results.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name || project.project_name} (
                            {project.status})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-700 text-sm">
                          No projects available without clients. Create a
                          project first or assign this client later.
                        </p>
                      </div>
                    )}

                    <p className="text-neutral-500 text-sm mt-1">
                      Only projects without assigned clients are shown
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-600">
                    Project assignment is disabled. You can assign the client to
                    a project later.
                  </p>
                  <p className="text-neutral-500 text-sm mt-2">
                    Enable the toggle above to assign to a project now
                  </p>
                </div>
              )}
            </div>

            {/* Client Portal Account Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-4 text-neutral-900 flex items-center gap-3">
                  <FontAwesomeIcon icon={faKey} className="text-primary-600" />
                  Client Portal Account
                </h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createPortalAccount}
                    onChange={(e) => setCreatePortalAccount(e.target.checked)}
                    disabled={isSubmitting}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-0 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-neutral-0 after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {createPortalAccount ? (
                <div className="space-y-5">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-700 text-sm">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      Client portal credentials will be created. The password
                      can be changed later.
                    </p>
                  </div>

                  {/* Portal Password */}
                  <div>
                    <label
                      htmlFor="clientPassword"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      <FontAwesomeIcon
                        icon={faLock}
                        className="text-primary-600 mr-2"
                      />
                      Portal Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="clientPassword"
                        value={clientPassword}
                        onChange={(e) => setClientPassword(e.target.value)}
                        placeholder="Create a secure password (min 8 characters)"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 pr-12 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <FontAwesomeIcon
                          icon={showPassword ? faEyeSlash : faEye}
                        />
                      </button>
                    </div>
                    <p className="text-neutral-500 text-sm mt-1">
                      Minimum 8 characters
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      <FontAwesomeIcon
                        icon={faLock}
                        className="text-primary-600 mr-2"
                      />
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 pr-12 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={isSubmitting}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <FontAwesomeIcon
                          icon={showConfirmPassword ? faEyeSlash : faEye}
                        />
                      </button>
                    </div>
                    {confirmPassword && clientPassword !== confirmPassword && (
                      <p className="text-red-600 text-sm mt-1">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-600">
                    Portal account creation is disabled. The client will not be
                    able to log in to their portal.
                  </p>
                  <p className="text-neutral-500 text-sm mt-2">
                    Enable the toggle above to create portal credentials
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 sticky top-8">
              <h3 className="heading-4 text-neutral-900 mb-6">
                Client Preview
              </h3>

              {/* Avatar Preview */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center text-3xl font-bold">
                  {clientName ? getInitials(clientName) : "?"}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="text-center pb-4 border-b border-neutral-100">
                  <p className="text-neutral-600 body-small mb-1">Name</p>
                  <p className="text-neutral-900 font-semibold">
                    {clientName || "Not specified"}
                  </p>
                </div>

                <div className="text-center pb-4 border-b border-neutral-100">
                  <p className="text-neutral-600 body-small mb-1">Email</p>
                  <p className="text-neutral-900 font-semibold truncate">
                    {email || "Not specified"}
                  </p>
                </div>

                <div className="text-center pb-4 border-b border-neutral-100">
                  <p className="text-neutral-600 body-small mb-1">Phone</p>
                  <p className="text-neutral-900 font-semibold">
                    {phone || "Not specified"}
                  </p>
                </div>

                <div className="text-center pb-4 border-b border-neutral-100">
                  <p className="text-neutral-600 body-small mb-1">Location</p>
                  <p className="text-neutral-900 font-semibold">
                    {city && state ? `${city}, ${state}` : "Not specified"}
                  </p>
                </div>

                {assignToProject &&
                  selectedProjectId &&
                  projectsData?.results && (
                    <div className="text-center pb-4 border-b border-neutral-100">
                      <p className="text-neutral-600 body-small mb-2">
                        Assigned Project
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon
                          icon={faFolderOpen}
                          className="text-primary-600"
                        />
                        <span className="text-primary-700 font-semibold text-sm">
                          {projectsData.results.find(
                            (p) => p.id === selectedProjectId
                          )?.name ||
                            projectsData.results.find(
                              (p) => p.id === selectedProjectId
                            )?.project_name}
                        </span>
                      </div>
                    </div>
                  )}

                {createPortalAccount && (
                  <div className="text-center">
                    <p className="text-neutral-600 body-small mb-2">
                      Portal Access
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <FontAwesomeIcon
                        icon={faKey}
                        className="text-primary-600"
                      />
                      <span className="text-primary-700 font-semibold text-sm">
                        Enabled
                      </span>
                    </div>
                  </div>
                )}
              </div>

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
                      Creating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} />
                      Add Client
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

              <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-primary-700 body-small">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  <strong>Tip:</strong> All fields marked with * are required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
