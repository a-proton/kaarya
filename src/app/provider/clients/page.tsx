"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
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
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService } from "@/lib/clientService";

type TabFilter = "all" | "active" | "past" | "favorites";

export default function ClientsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch clients
  const { data, isLoading, error } = useQuery({
    queryKey: ["clients", searchQuery],
    queryFn: () => clientService.getClients(searchQuery, true),
    staleTime: 30000, // 30 seconds
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (clientId: number) => clientService.deleteClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

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

  const toggleFavorite = (clientId: number) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(clientId)) {
        newFavorites.delete(clientId);
      } else {
        newFavorites.add(clientId);
      }
      return newFavorites;
    });
  };

  const handleDelete = async (clientId: number, clientName: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${clientName}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(clientId);
        alert(`Client "${clientName}" deleted successfully`);
        setOpenDropdown(null);
      } catch (error) {
        alert("Failed to delete client. Please try again.");
      }
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

  const clients = data?.results || [];

  const filteredClients = clients.filter((client) => {
    if (activeTab === "favorites" && !favorites.has(client.id)) {
      return false;
    }
    // Note: Backend doesn't provide active/past status, using project_count as proxy
    if (activeTab === "active" && client.project_count === 0) {
      return false;
    }
    if (activeTab === "past" && client.project_count > 0) {
      return false;
    }
    return true;
  });

  const favoriteCount = Array.from(favorites).filter((id) =>
    clients.some((c) => c.id === id)
  ).length;

  const totalPages = Math.ceil(filteredClients.length / 6);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * 6,
    currentPage * 6
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading clients</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-4 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-neutral-900 mb-1">Clients</h1>
            <p className="text-neutral-600 body-regular">
              Build lasting relationships with your clients ({data?.count || 0}{" "}
              total)
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
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
          </div>
        </div>
      </div>

      {/* Main Content - List View */}
      <div className="p-4 md:p-8">
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {getInitials(client.full_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors whitespace-nowrap">
                              {client.full_name}
                            </h4>
                            <button
                              onClick={() => toggleFavorite(client.id)}
                              className="hover:scale-110 transition-transform flex-shrink-0"
                            >
                              <FontAwesomeIcon
                                icon={
                                  favorites.has(client.id)
                                    ? faSolidStar
                                    : faRegularStar
                                }
                                className={
                                  favorites.has(client.id)
                                    ? "text-yellow-500"
                                    : "text-neutral-300"
                                }
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

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

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faLocationDot}
                          className="text-neutral-400 text-sm flex-shrink-0"
                        />
                        <span className="text-neutral-700 whitespace-nowrap">
                          {client.city}, {client.state}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faFolder}
                          className="text-neutral-400 text-sm"
                        />
                        <span className="font-semibold text-neutral-900">
                          {client.project_count}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <div
                          className="relative"
                          ref={
                            openDropdown === client.id.toString()
                              ? dropdownRef
                              : null
                          }
                        >
                          <button
                            onClick={() =>
                              setOpenDropdown(
                                openDropdown === client.id.toString()
                                  ? null
                                  : client.id.toString()
                              )
                            }
                            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                          >
                            <FontAwesomeIcon
                              icon={faEllipsisVertical}
                              className="text-neutral-600"
                            />
                          </button>

                          {openDropdown === client.id.toString() && (
                            <div className="absolute right-0 mt-2 w-48 bg-neutral-0 rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                              <Link
                                href={`/provider/clients/${client.id}`}
                                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                              >
                                <FontAwesomeIcon
                                  icon={faEye}
                                  className="text-blue-600 w-4"
                                />
                                View Details
                              </Link>
                              <Link
                                href={`/provider/clients/${client.id}/edit`}
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
                                  handleDelete(client.id, client.full_name)
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
              >
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="text-neutral-600"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="heading-3 text-neutral-900 mb-2">
              No clients found
            </h3>
            <p className="text-neutral-600 body-regular mb-6">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by adding your first client"}
            </p>
            <Link href="/provider/clients/create" className="btn-primary">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add New Client
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
