"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faStar,
  faPlus,
  faTimes,
  faCheckCircle,
  faBriefcase,
  faDollarSign,
  faLock,
  faEye,
  faEyeSlash,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddClientPage() {
  const router = useRouter();

  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [website, setWebsite] = useState("");
  const [budget, setBudget] = useState("");

  // Client Portal Credentials
  const [createPortalAccount, setCreatePortalAccount] = useState(true);
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  const predefinedTags = [
    "Repeat Client",
    "High Value",
    "Residential",
    "Commercial",
    "Active",
    "VIP",
  ];

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "Repeat Client":
        return "bg-green-100 text-green-700 border-green-200";
      case "High Value":
        return "bg-primary-50 text-primary-700 border-primary-200";
      case "Residential":
        return "bg-neutral-100 text-neutral-700 border-neutral-200";
      case "Commercial":
        return "bg-neutral-100 text-neutral-700 border-neutral-200";
      case "Active":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "VIP":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate portal credentials if enabled
    if (createPortalAccount) {
      if (!clientEmail) {
        alert("Please provide an email for the client portal account");
        return;
      }
      if (!clientPassword || clientPassword.length < 8) {
        alert("Password must be at least 8 characters long");
        return;
      }
      if (clientPassword !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }
    }

    const clientData = {
      clientName,
      email,
      phone,
      location,

      tags,
      notes,
      company,
      address,
      city,
      state,
      zipCode,
      website,
      budget,
      portalAccount: createPortalAccount
        ? {
            email: clientEmail,
            password: clientPassword,
            sendWelcomeEmail,
          }
        : null,
    };
    console.log("Client Data:", clientData);
    alert("Client added successfully! Portal credentials have been created.");
    router.push("/provider/clients");
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

  return (
    <div className="min-h-screen bg-neutral-50">
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
            <h1 className="heading-2 text-neutral-900">Add New Client</h1>
            <p className="text-neutral-600 body-regular mt-1">
              Create a new client profile
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Takes 2 columns */}
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
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                {/* Company */}
                <div>
                  <label
                    htmlFor="company"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    <FontAwesomeIcon
                      icon={faBriefcase}
                      className="text-primary-600 mr-2"
                    />
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g., Smith Construction LLC"
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
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
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
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
                      placeholder="(555) 123-4567"
                      required
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label
                    htmlFor="website"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.example.com"
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
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
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                {/* City, State, Zip */}
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
                      placeholder="New York"
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="NY"
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="zipCode"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      Zip Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="10001"
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                </div>

                {/* Quick Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    Quick Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Brooklyn, NY"
                    required
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                  <p className="text-neutral-500 text-sm mt-2">
                    Short location for quick reference
                  </p>
                </div>
              </div>
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
                      Create login credentials for your client to access their
                      dedicated portal where they can view project updates,
                      messages, and documents.
                    </p>
                  </div>

                  {/* Portal Email */}
                  <div>
                    <label
                      htmlFor="clientEmail"
                      className="block text-neutral-700 font-semibold mb-2 body-small"
                    >
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-primary-600 mr-2"
                      />
                      Portal Email Address{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="clientEmail"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@email.com"
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                    <p className="text-neutral-500 text-sm mt-1">
                      This email will be used for portal login
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
                        placeholder="Create a secure password"
                        className="w-full px-4 py-3 pr-12 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
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
                        className="w-full px-4 py-3 pr-12 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
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

                  {/* Send Welcome Email */}
                  <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="sendWelcomeEmail"
                      checked={sendWelcomeEmail}
                      onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                      className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500/20"
                    />
                    <label
                      htmlFor="sendWelcomeEmail"
                      className="flex-1 cursor-pointer"
                    >
                      <p className="text-neutral-900 font-semibold">
                        Send Welcome Email
                      </p>
                      <p className="text-neutral-600 text-sm">
                        Send login credentials and welcome message to the client
                      </p>
                    </label>
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

            {/* Additional Details Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6 flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-primary-600"
                />
                Additional Details
              </h2>

              <div className="space-y-5">
                {/* Budget */}
                <div>
                  <label
                    htmlFor="budget"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    <FontAwesomeIcon
                      icon={faDollarSign}
                      className="text-primary-600 mr-2"
                    />
                    Expected Budget
                  </label>
                  <input
                    type="text"
                    id="budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g., $50,000"
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-neutral-700 font-semibold mb-3 body-small">
                    Tags
                  </label>

                  {/* Predefined Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {predefinedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        disabled={tags.includes(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          tags.includes(tag)
                            ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                            : "bg-neutral-0 text-neutral-700 border-neutral-200 hover:border-primary-500 hover:text-primary-600"
                        }`}
                      >
                        {tags.includes(tag) ? "✓ " : "+ "}
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* Custom Tag Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      placeholder="Add custom tag..."
                      className="flex-1 px-4 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small"
                    />
                    <button
                      type="button"
                      onClick={() => addTag(tagInput)}
                      className="px-4 py-2 bg-primary-600 text-neutral-0 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>

                  {/* Selected Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-2 ${getTagColor(
                            tag
                          )}`}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:scale-110 transition-transform"
                          >
                            <FontAwesomeIcon
                              icon={faTimes}
                              className="text-xs"
                            />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-neutral-700 font-semibold mb-2 body-small"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes about this client..."
                    rows={4}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
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

                {company && (
                  <div className="text-center pb-4 border-b border-neutral-100">
                    <p className="text-neutral-600 body-small mb-1">Company</p>
                    <p className="text-neutral-900 font-semibold">{company}</p>
                  </div>
                )}

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
                    {location || "Not specified"}
                  </p>
                </div>

                {tags.length > 0 && (
                  <div className="text-center">
                    <p className="text-neutral-600 body-small mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-1 rounded text-xs font-medium border ${getTagColor(
                            tag
                          )}`}
                        >
                          {tag}
                        </span>
                      ))}
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
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add Client
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full btn-secondary"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-primary-700 body-small">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  <strong>Tip:</strong> Add relevant tags to easily filter and
                  categorize your clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
