"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faSave,
  faCheckCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService, ClientCreateData } from "@/lib/clientService";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const clientId = Number(params.id);

  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("+977");

  // Fetch client details
  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => clientService.getClientDetails(clientId),
    enabled: !!clientId,
  });

  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<ClientCreateData>) =>
      clientService.updateClient(clientId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      alert(`Client "${data.full_name}" updated successfully!`);
      router.push(`/provider/clients/${clientId}`);
    },
    onError: (error: any) => {
      const errorMessage =
        error.data?.detail || error.message || "Failed to update client";
      alert(`Error: ${errorMessage}`);
    },
  });

  // Populate form when client data is loaded
  useEffect(() => {
    if (client) {
      setClientName(client.full_name);
      setEmail(client.email);
      setPhone(client.phone);
      setAddress(client.address || "");
      setCity(client.city || "");
      setState(client.state || "");
      setPostalCode(client.postal_code || "");
      setCountryCode(client.country_code || "+977");
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName || !email || !phone) {
      alert("Please fill in all required fields");
      return;
    }

    // Only send changed fields
    const updates: Partial<ClientCreateData> = {};

    if (clientName !== client?.full_name) updates.full_name = clientName;
    if (email !== client?.email) updates.email = email;
    if (phone !== client?.phone) updates.phone = phone;
    if (address !== (client?.address || "")) updates.address = address;
    if (city !== (client?.city || "")) updates.city = city;
    if (state !== (client?.state || "")) updates.state = state;
    if (postalCode !== (client?.postal_code || ""))
      updates.postal_code = postalCode;
    if (countryCode !== (client?.country_code || "+977"))
      updates.country_code = countryCode;

    if (Object.keys(updates).length === 0) {
      alert("No changes to save");
      return;
    }

    updateMutation.mutate(updates);
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

  const isSubmitting = updateMutation.isPending;

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

  if (!client) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Client not found</p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
            <h1 className="heading-2 text-neutral-900">Edit Client</h1>
            <p className="text-neutral-600 body-regular mt-1">
              Update client information
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

                <div className="text-center">
                  <p className="text-neutral-600 body-small mb-2">Projects</p>
                  <p className="text-neutral-900 font-semibold text-lg">
                    {client.project_count}
                  </p>
                </div>
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} />
                      Save Changes
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
                  <strong>Note:</strong> Changes will be saved when you click
                  "Save Changes"
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
