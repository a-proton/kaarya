"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faPenToSquare,
  faTimes,
  faSpinner,
  faBoxOpen,
  faCheck,
  faBriefcase,
  faSearch,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Project {
  id: number;
  project_name: string;
  client: { full_name: string } | null;
}

interface InventoryItem {
  id: number;
  project_id: number;
  project_name: string;
  client_name: string | null;
  item_name: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string | null;
  total_price: string | null;
  supplier_name: string;
  purchase_date: string | null;
  created_at: string;
}

export default function InventoryListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch all projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await api.get<{ results: Project[] }>("/api/v1/projects/");
      return Array.isArray(res.results) ? res.results : [];
    },
  });

  // Fetch all inventory by fetching each project's inventory
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ["all-inventory"],
    queryFn: async () => {
      const projects = Array.isArray(projectsData) ? projectsData : [];
      if (projects.length === 0) return [];
      const allItems: InventoryItem[] = [];
      for (const project of projects) {
        try {
          const res = await api.get<{
            results: Omit<InventoryItem, "project_name" | "client_name">[];
          }>(`/api/v1/projects/${project.id}/inventory/`);
          const enriched = (res.results || []).map((item) => ({
            ...item,
            project_id: project.id,
            project_name: project.project_name,
            client_name: project.client?.full_name || null,
          }));
          allItems.push(...enriched);
        } catch (err) {
          console.warn(`Failed to fetch inventory for project ${project.id}`);
        }
      }
      return allItems;
    },
    enabled: !!projectsData,
  });

  const projects = Array.isArray(projectsData) ? projectsData : [];
  const allInventory = Array.isArray(inventoryData) ? inventoryData : [];

  const filteredInventory = allInventory.filter((item) => {
    if (
      filterProject !== "all" &&
      item.project_id.toString() !== filterProject
    ) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.item_name.toLowerCase().includes(q) ||
        item.supplier_name.toLowerCase().includes(q) ||
        item.project_name.toLowerCase().includes(q) ||
        (item.client_name && item.client_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({
      projectId,
      itemId,
    }: {
      projectId: number;
      itemId: number;
    }) => {
      await api.delete(
        `/api/v1/projects/${projectId}/inventory/${itemId}/delete/`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-inventory"] });
      showSuccessNotification("Inventory item deleted successfully!");
    },
    onError: (err: any) => {
      alert(`Failed to delete item: ${err.data?.error || err.message}`);
    },
  });

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleDelete = (
    projectId: number,
    itemId: number,
    itemName: string
  ) => {
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
      deleteMutation.mutate({ projectId, itemId });
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "—";
    const num = parseFloat(value);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isLoading = projectsLoading || inventoryLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading inventory...</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-2 text-neutral-900">Inventory</h1>
            <p className="text-neutral-600 body-regular mt-1">
              Manage materials across all your projects
            </p>
          </div>
          <button
            onClick={() => router.push("/provider/inventory/create")}
            className="btn-primary flex items-center gap-2 shadow-lg"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-0 px-8 py-4 border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"
            />
            <input
              type="text"
              placeholder="Search items, suppliers, or projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-neutral-0 border border-neutral-200 rounded-lg w-64 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small"
            />
          </div>
          <div className="relative">
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="p-8">
        {filteredInventory.length === 0 ? (
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon
                icon={faBoxOpen}
                className="text-neutral-400 text-2xl"
              />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No Inventory Items
            </h3>
            <p className="text-neutral-600 mb-6">
              {searchQuery || filterProject !== "all"
                ? "Try adjusting your filters"
                : "Add your first inventory item to get started"}
            </p>
            {!searchQuery && filterProject === "all" && (
              <button
                onClick={() => router.push("/provider/inventory/create")}
                className="btn-primary"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Inventory Item
              </button>
            )}
          </div>
        ) : (
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold text-sm">
              <div className="col-span-3">ITEM</div>
              <div className="col-span-2">PROJECT</div>
              <div className="col-span-2">QUANTITY</div>
              <div className="col-span-2">UNIT PRICE</div>
              <div className="col-span-2">TOTAL</div>
              <div className="col-span-1 text-center">ACTIONS</div>
            </div>
            <div className="divide-y divide-neutral-100">
              {filteredInventory.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-neutral-50 transition-colors group"
                >
                  <div className="col-span-3">
                    <h4 className="font-semibold text-neutral-900">
                      {item.item_name}
                    </h4>
                    {item.description && (
                      <p className="text-neutral-600 text-sm mt-1">
                        {item.description}
                      </p>
                    )}
                    <p className="text-neutral-500 text-xs mt-1">
                      Supplier: {item.supplier_name || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faBriefcase}
                        className="text-neutral-400 text-xs"
                      />
                      <span className="text-neutral-700">
                        {item.project_name}
                      </span>
                    </div>
                    {item.client_name && (
                      <p className="text-neutral-500 text-xs mt-1">
                        Client: {item.client_name}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="font-mono">
                      {item.quantity} {item.unit && <span>({item.unit})</span>}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    {formatCurrency(item.unit_price)}
                  </div>
                  <div className="col-span-2 flex items-center font-semibold">
                    {formatCurrency(item.total_price)}
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/provider/inventory/${item.id}/edit?projectId=${item.project_id}`
                          )
                        }
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(item.project_id, item.id, item.item_name)
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                        disabled={deleteMutation.isPending}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
