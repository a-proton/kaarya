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
  faStar,
  faBriefcase,
  faFolder,
  faDollarSign,
  faCalendar,
  faGlobe,
  faExclamationTriangle,
  faMessage,
  faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  location: string;
  company: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  projectCount: number;
  totalRevenue: number;

  tags: string[];
  notes: string;
  joinedDate: string;
  lastContact: string;
  avatarColor: string;
}

export default function ViewClientPage() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sample client data - replace with actual data fetching
  const client: Client = {
    id: "1",
    name: "Sarah Johnson",
    initials: "SJ",
    email: "sarah.j@email.com",
    phone: "(555) 234-5678",
    location: "Brooklyn, NY",
    company: "Johnson Properties LLC",
    website: "https://www.johnsonproperties.com",
    address: "456 Park Avenue",
    city: "Brooklyn",
    state: "NY",
    zipCode: "11201",
    projectCount: 8,
    totalRevenue: 124500,

    tags: ["Repeat Client", "High Value", "Residential"],
    notes:
      "Excellent client with multiple successful projects. Prefers modern designs and has a keen eye for detail. Very responsive and pays on time. Looking to start another renovation project in Q2.",
    joinedDate: "2023-01-15",
    lastContact: "2 days ago",
    avatarColor: "bg-primary-600",
  };

  const handleDelete = () => {
    console.log("Deleting client:", client.id);
    setShowDeleteModal(false);
    router.push("/provider/clients");
  };

  const handleEdit = () => {
    router.push(`/provider/clients/edit `);
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

  return (
    <div className="min-h-screen bg-neutral-50">
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
              <h1 className="heading-2 text-neutral-900">{client.name}</h1>
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
                <div
                  className={`w-32 h-32 rounded-full ${client.avatarColor} text-neutral-0 flex items-center justify-center text-4xl font-bold`}
                >
                  {client.initials}
                </div>
              </div>

              {/* Name and Company */}
              <div className="text-center mb-6">
                <h2 className="heading-3 text-neutral-900 mb-2">
                  {client.name}
                </h2>
                {client.company && (
                  <p className="text-neutral-600 body-regular flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faBriefcase} className="text-sm" />
                    {client.company}
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <FontAwesomeIcon
                    icon={faFolder}
                    className="text-primary-600 text-xl mb-2"
                  />
                  <p className="heading-4 text-neutral-900 mb-1">
                    {client.projectCount}
                  </p>
                  <p className="text-neutral-600 text-sm">Projects</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="text-green-600 text-xl mb-2"
                  />
                  <p className="heading-4 text-neutral-900 mb-1">
                    ${(client.totalRevenue / 1000).toFixed(0)}k
                  </p>
                  <p className="text-neutral-600 text-sm">Revenue</p>
                </div>
              </div>

              {/* Tags */}
              {client.tags.length > 0 && (
                <div className="mb-6">
                  <p className="text-neutral-600 font-semibold mb-3 text-sm">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getTagColor(
                          tag
                        )}`}
                      >
                        {tag}
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
                  Call Client
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

                {client.website && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon
                        icon={faGlobe}
                        className="text-primary-600"
                      />
                    </div>
                    <div>
                      <p className="text-neutral-600 body-small mb-1">
                        Website
                      </p>
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-900 font-semibold hover:text-primary-600 transition-colors"
                      >
                        {client.website.replace("https://", "")}
                      </a>
                    </div>
                  </div>
                )}

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
                      {client.location}
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
                    <p className="text-neutral-600 body-small mb-1">Zip Code</p>
                    <p className="text-neutral-900 font-semibold">
                      {client.zipCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Activity Card */}
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-6 flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faCalendar}
                  className="text-primary-600"
                />
                Client Activity
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-600 body-small mb-2">
                    Client Since
                  </p>
                  <p className="text-neutral-900 font-semibold text-lg">
                    {new Date(client.joinedDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-600 body-small mb-2">
                    Last Contact
                  </p>
                  <p className="text-neutral-900 font-semibold text-lg">
                    {client.lastContact}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            {client.notes && (
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
                    {client.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Projects Summary Card */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl border border-primary-200 p-6">
              <h2 className="heading-4 text-neutral-900 mb-4 flex items-center gap-3">
                <FontAwesomeIcon icon={faFolder} className="text-primary-600" />
                Projects Overview
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-neutral-600 body-small mb-1">
                    Total Projects
                  </p>
                  <p className="heading-3 text-neutral-900">
                    {client.projectCount}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-600 body-small mb-1">
                    Total Revenue
                  </p>
                  <p className="heading-3 text-neutral-900">
                    ${client.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
              <button className="w-full mt-4 btn-primary flex items-center justify-center gap-2">
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
                Delete Client?
              </h3>
              <p className="text-neutral-600 text-center mb-6">
                Are you sure you want to delete "{client.name}"? This action
                cannot be undone and will permanently remove all client data and
                project associations.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  Warning: This will affect {client.projectCount} associated
                  projects
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-5 py-3 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-5 py-3 bg-red-600 text-neutral-0 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Delete Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
