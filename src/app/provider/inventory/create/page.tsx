"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faTimes,
  faCheck,
  faSpinner,
  faBoxOpen,
  faDollarSign,
  faCalendar,
  faStore,
  faBriefcase,
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

export default function CreateInventoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    project_id: "",
    item_name: "",
    description: "",
    quantity: "",
    unit: "",
    unit_price: "",
    supplier_name: "",
    purchase_date: "",
    receipt_url: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await api.get<{ results: Project[] }>("/api/v1/projects/");
      return Array.isArray(res.results) ? res.results : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const projectId = formData.project_id;
      await api.post(`/api/v1/projects/${projectId}/inventory/add/`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-inventory"] });
      setShowSuccess(true);
      setTimeout(() => router.push("/provider/inventory"), 1500);
    },
    onError: (err: any) => {
      alert(`Failed to add inventory: ${err.data?.error || err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id) {
      alert("Please select a project");
      return;
    }
    if (!formData.item_name || !formData.quantity) {
      alert("Item name and quantity are required");
      return;
    }

    const payload: any = {
      item_name: formData.item_name,
      description: formData.description || undefined,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit || undefined,
      unit_price: formData.unit_price
        ? parseFloat(formData.unit_price)
        : undefined,
      supplier_name: formData.supplier_name || undefined,
      purchase_date: formData.purchase_date || undefined,
      receipt_url: formData.receipt_url || undefined,
    };

    createMutation.mutate(payload);
  };

  const projects = Array.isArray(projectsData) ? projectsData : [];

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {showSuccess && (
        <div className="fixed top-8 right-8 z-50 animate-slide-in-right">
          <div className="bg-green-600 text-neutral-0 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} />
            </div>
            <div>
              <p className="font-semibold">Inventory Added!</p>
              <p className="text-green-100 text-sm">
                Redirecting to inventory list...
              </p>
            </div>
          </div>
        </div>
      )}

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
            <h1 className="heading-2 text-neutral-900 flex items-center gap-3">
              <FontAwesomeIcon icon={faBoxOpen} className="text-primary-600" />
              Add Inventory Item
            </h1>
            <p className="text-neutral-600 body-regular mt-1">
              Record materials used in your projects
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Selection */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <label className="block text-neutral-700 font-semibold mb-3 body-small flex items-center gap-2">
              <FontAwesomeIcon
                icon={faBriefcase}
                className="text-primary-600"
              />
              Select Project <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.project_id}
                onChange={(e) =>
                  setFormData({ ...formData, project_id: e.target.value })
                }
                required
                className="w-full appearance-none px-4 py-3.5 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
              >
                <option value="">Choose a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name} – {p.client?.full_name || "No client"}
                  </option>
                ))}
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Item Details */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 space-y-5">
            <div>
              <label className="block text-neutral-700 font-semibold mb-2 body-small">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.item_name}
                onChange={(e) =>
                  setFormData({ ...formData, item_name: e.target.value })
                }
                placeholder="e.g., Cement bags, PVC pipes"
                required
                className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-semibold mb-2 body-small">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional details about the item"
                rows={3}
                className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Unit (e.g., kg, pcs, liters)
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="kg, bags, meters..."
                  className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Unit Price ($)
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_price: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Supplier Name
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faStore}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplier_name: e.target.value,
                      })
                    }
                    placeholder="e.g., ABC Hardware"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Purchase Date
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_date: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Receipt URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.receipt_url}
                  onChange={(e) =>
                    setFormData({ ...formData, receipt_url: e.target.value })
                  }
                  placeholder="https://example.com/receipt.pdf"
                  className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push("/provider/inventory")}
              className="px-6 py-3 border-2 border-neutral-200 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex items-center gap-2 min-w-[160px]"
            >
              {createMutation.isPending ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} />
                  Add Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
