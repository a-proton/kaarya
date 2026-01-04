"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faTableCells,
  faList,
  faChevronDown,
  faStar as faSolidStar,
  faFolder,
  faMessage,
  faPhone,
  faLocationDot,
  faEllipsisVertical,
  faEye,
  faPenToSquare,
  faTrash,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// Types
interface Client {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  location: string;
  projectCount: number;
  totalRevenue: number;
  tags: string[];
  lastContact: string;
  isFavorite: boolean;
  avatarColor: string;
}

type ViewMode = "grid" | "list";
type TabFilter = "all" | "active" | "past" | "favorites";

export default function ClientsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectCountFilter, setProjectCountFilter] =
    useState("All Project Counts");
  const [revenueFilter, setRevenueFilter] = useState("All Revenue");
  const [contactFilter, setContactFilter] = useState("Last Contact");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock data
  const clients: Client[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      initials: "SJ",
      email: "sarah.j@email.com",
      phone: "(555) 234-5678",
      location: "Brooklyn, NY",
      projectCount: 8,
      totalRevenue: 12400,

      tags: ["Repeat Client", "High Value", "Residential"],
      lastContact: "2 days ago",
      isFavorite: true,
      avatarColor: "bg-primary-600",
    },
    {
      id: "2",
      name: "David Martinez",
      initials: "DM",
      email: "d.martinez@email.com",
      phone: "(555) 567-8901",
      location: "Manhattan, NY",
      projectCount: 3,
      totalRevenue: 5800,

      tags: ["Active", "Commercial"],
      lastContact: "5 hours ago",
      isFavorite: false,
      avatarColor: "bg-secondary-600",
    },
    {
      id: "3",
      name: "Jennifer White",
      initials: "JW",
      email: "jwhite@email.com",
      phone: "(555) 890-1234",
      location: "Queens, NY",
      projectCount: 12,
      totalRevenue: 18900,

      tags: ["Repeat Client", "High Value", "Residential"],
      lastContact: "1 week ago",
      isFavorite: true,
      avatarColor: "bg-yellow-600",
    },
    {
      id: "4",
      name: "Michael Brown",
      initials: "MB",
      email: "mbrown@email.com",
      phone: "(555) 345-6789",
      location: "Bronx, NY",
      projectCount: 5,
      totalRevenue: 9200,

      tags: ["Repeat Client", "Residential"],
      lastContact: "3 days ago",
      isFavorite: false,
      avatarColor: "bg-purple-600",
    },
    {
      id: "5",
      name: "Lisa Garcia",
      initials: "LG",
      email: "lgarcia@email.com",
      phone: "(555) 678-9012",
      location: "Staten Island, NY",
      projectCount: 15,
      totalRevenue: 24500,

      tags: ["High Value", "Commercial", "Repeat Client"],
      lastContact: "1 day ago",
      isFavorite: true,
      avatarColor: "bg-blue-600",
    },
    {
      id: "6",
      name: "Robert Thompson",
      initials: "RT",
      email: "rthompson@email.com",
      phone: "(555) 901-2345",
      location: "Long Island, NY",
      projectCount: 6,
      totalRevenue: 11300,

      tags: ["Active", "Residential"],
      lastContact: "4 hours ago",
      isFavorite: false,
      avatarColor: "bg-green-600",
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFavorite = (clientId: string) => {
    // In real app, this would update the backend
    console.log("Toggle favorite for client:", clientId);
  };

  const handleAction = (
    action: string,
    clientId: string,
    clientName: string
  ) => {
    setOpenDropdown(null);
    if (action === "view") alert(`Viewing client: ${clientName}`);
    else if (action === "update") alert(`Updating client: ${clientName}`);
    else if (
      action === "delete" &&
      confirm(`Are you sure you want to delete "${clientName}"?`)
    ) {
      alert(`Deleted client: ${clientName}`);
    }
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
      default:
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
    }
  };

  const filteredClients = clients.filter((client) => {
    if (activeTab === "favorites" && !client.isFavorite) {
      return false;
    }
    if (activeTab === "active" && !client.tags.includes("Active")) {
      return false;
    }
    if (activeTab === "past" && client.tags.includes("Active")) {
      return false;
    }
    if (
      searchQuery &&
      !client.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const favoriteCount = clients.filter((c) => c.isFavorite).length;
  const totalPages = Math.ceil(filteredClients.length / 6);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * 6,
    currentPage * 6
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-4 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-neutral-900 mb-1">Clients</h1>
            <p className="text-neutral-600 body-regular">
              Build lasting relationships with your clients
            </p>
          </div>
          <Link
            href={"/provider/clients/create"}
            className="btn-primary flex items-center justify-center gap-2 shadow-lg"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add New Client
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-4 md:px-8 overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max">
          <button
            onClick={() => setActiveTab("all")}
            className={`py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "all"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            All Clients
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "active"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "past"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`py-4 border-b-2 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "favorites"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <FontAwesomeIcon icon={faSolidStar} className="text-sm" />
            Favorites
            <span className="px-2 py-0.5 bg-yellow-500 text-neutral-0 rounded-full text-xs font-semibold">
              {favoriteCount}
            </span>
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-neutral-0 px-4 md:px-8 py-4 border-b border-neutral-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left side - Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 overflow-x-auto pb-2 sm:pb-0">
            {/* Search */}
            <div className="relative min-w-[250px]">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"
              />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-neutral-0 border border-neutral-200 rounded-lg w-full focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small"
              />
            </div>

            {/* Filters - Scrollable on mobile */}
            <div className="flex items-center gap-3 overflow-x-auto">
              {/* Project Count Filter */}
              <div className="relative">
                <select
                  value={projectCountFilter}
                  onChange={(e) => setProjectCountFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer whitespace-nowrap"
                >
                  <option>All Project Counts</option>
                  <option>1-5 Projects</option>
                  <option>6-10 Projects</option>
                  <option>10+ Projects</option>
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
                />
              </div>

              {/* Revenue Filter */}
              <div className="relative">
                <select
                  value={revenueFilter}
                  onChange={(e) => setRevenueFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer whitespace-nowrap"
                >
                  <option>All Revenue</option>
                  <option>Under $10k</option>
                  <option>$10k - $20k</option>
                  <option>$20k+</option>
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
                />
              </div>

              {/* Last Contact Filter */}
              <div className="relative">
                <select
                  value={contactFilter}
                  onChange={(e) => setContactFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer whitespace-nowrap"
                >
                  <option>Last Contact</option>
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Right side - View Controls */}
          <div className="flex items-center justify-end gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-50 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-neutral-0 text-primary-600 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                aria-label="List view"
              >
                <FontAwesomeIcon icon={faList} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-neutral-0 text-primary-600 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                aria-label="Grid view"
              >
                <FontAwesomeIcon icon={faTableCells} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-8">
        {viewMode === "list" ? (
          /* List View - Horizontal Scrolling Table */
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600 whitespace-nowrap">
                      CLIENT
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600 whitespace-nowrap">
                      CONTACT
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600 whitespace-nowrap">
                      LOCATION
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600 whitespace-nowrap">
                      PROJECTS
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600 whitespace-nowrap">
                      REVENUE
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600 whitespace-nowrap">
                      TAGS
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-600 whitespace-nowrap">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {paginatedClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-neutral-50 transition-colors group"
                    >
                      {/* Client */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${client.avatarColor} text-neutral-0 flex items-center justify-center font-semibold text-sm flex-shrink-0`}
                          >
                            {client.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors whitespace-nowrap">
                                {client.name}
                              </h4>
                              <button
                                onClick={() => toggleFavorite(client.id)}
                                className="hover:scale-110 transition-transform flex-shrink-0"
                                aria-label={
                                  client.isFavorite
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }
                              ></button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-neutral-700 text-sm whitespace-nowrap">
                            {client.email}
                          </span>
                          <span className="text-neutral-600 text-sm whitespace-nowrap">
                            {client.phone}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faLocationDot}
                            className="text-neutral-400 text-sm flex-shrink-0"
                          />
                          <span className="text-neutral-700 whitespace-nowrap">
                            {client.location}
                          </span>
                        </div>
                      </td>

                      {/* Projects */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faFolder}
                            className="text-neutral-400 text-sm"
                          />
                          <span className="font-semibold text-neutral-900">
                            {client.projectCount}
                          </span>
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-neutral-900 whitespace-nowrap">
                          ${client.totalRevenue.toLocaleString()}
                        </span>
                      </td>

                      {/* Tags */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {client.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${getTagColor(
                                tag
                              )}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {client.tags.length > 2 && (
                            <span className="text-neutral-500 text-xs whitespace-nowrap">
                              +{client.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <div
                            className="relative"
                            ref={
                              openDropdown === client.id ? dropdownRef : null
                            }
                          >
                            <button
                              onClick={() =>
                                setOpenDropdown(
                                  openDropdown === client.id ? null : client.id
                                )
                              }
                              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                              aria-label="Actions"
                            >
                              <FontAwesomeIcon
                                icon={faEllipsisVertical}
                                className="text-neutral-600"
                              />
                            </button>

                            {openDropdown === client.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-neutral-0 rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                                <Link
                                  href={"/provider/clients/view"}
                                  onClick={() =>
                                    handleAction("view", client.id, client.name)
                                  }
                                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                                >
                                  <FontAwesomeIcon
                                    icon={faEye}
                                    className="text-blue-600 w-4"
                                  />
                                  View Details
                                </Link>
                                <Link
                                  href={"/provider/clients/edit"}
                                  onClick={() =>
                                    handleAction(
                                      "update",
                                      client.id,
                                      client.name
                                    )
                                  }
                                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                                >
                                  <FontAwesomeIcon
                                    icon={faPenToSquare}
                                    className="text-green-600 w-4"
                                  />
                                  Edit Client
                                </Link>
                                <button
                                  onClick={() =>
                                    handleAction(
                                      "delete",
                                      client.id,
                                      client.name
                                    )
                                  }
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                >
                                  <FontAwesomeIcon
                                    icon={faTrash}
                                    className="w-4"
                                  />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-neutral-600 text-sm">
                Showing {(currentPage - 1) * 6 + 1}-
                {Math.min(currentPage * 6, filteredClients.length)} of{" "}
                {filteredClients.length} clients
              </p>
              <div className="flex items-center justify-center sm:justify-end gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    className="text-neutral-600"
                  />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === i + 1
                        ? "bg-primary-600 text-neutral-0"
                        : "bg-neutral-0 text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="text-neutral-600"
                  />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedClients.map((client) => (
              <div
                key={client.id}
                className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-500 transition-all cursor-pointer group relative"
              >
                {/* Favorite Star */}
                <button
                  onClick={() => toggleFavorite(client.id)}
                  className="absolute top-4 right-4 text-xl hover:scale-110 transition-transform"
                  aria-label={
                    client.isFavorite
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  <FontAwesomeIcon
                    icon={client.isFavorite ? faSolidStar : faRegularStar}
                    className={
                      client.isFavorite ? "text-yellow-500" : "text-neutral-300"
                    }
                  />
                </button>

                {/* Avatar */}
                <div className="flex justify-center mb-4">
                  <div
                    className={`w-20 h-20 rounded-full ${client.avatarColor} text-neutral-0 flex items-center justify-center text-2xl font-bold`}
                  >
                    {client.initials}
                  </div>
                </div>

                {/* Client Info */}
                <div className="text-center mb-4">
                  <h3 className="heading-4 text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {client.name}
                  </h3>
                  <p className="text-neutral-600 text-sm mb-1">
                    {client.email}
                  </p>
                  <p className="text-neutral-600 text-sm mb-2">
                    {client.phone}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-neutral-500 text-sm">
                    <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
                    <span>{client.location}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-neutral-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-neutral-600 text-sm mb-1">
                      <FontAwesomeIcon icon={faFolder} className="text-xs" />
                      <span className="font-semibold text-neutral-900">
                        {client.projectCount}
                      </span>
                    </div>
                    <p className="text-neutral-500 text-xs">Projects</p>
                  </div>
                  <div className="text-center border-x border-neutral-100">
                    <div className="flex items-center justify-center gap-1 text-neutral-600 text-sm mb-1">
                      <span className="font-semibold text-neutral-900">
                        ${client.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-neutral-500 text-xs">Total</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {client.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded text-xs font-medium border ${getTagColor(
                        tag
                      )}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Last Contact */}
                <p className="text-neutral-500 text-sm text-center mb-4">
                  Last contact: {client.lastContact}
                </p>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button className="flex items-center justify-center gap-1 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium">
                    <FontAwesomeIcon icon={faFolder} className="text-xs" />
                  </button>
                  <button className="flex items-center justify-center gap-1 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm">
                    <FontAwesomeIcon icon={faMessage} />
                  </button>
                  <button className="flex items-center justify-center gap-1 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm">
                    <FontAwesomeIcon icon={faPhone} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="heading-3 text-neutral-900 mb-2">
              No clients found
            </h3>
            <p className="text-neutral-600 body-regular mb-6">
              Try adjusting your filters or search query
            </p>
            <button className="btn-primary">Clear Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
