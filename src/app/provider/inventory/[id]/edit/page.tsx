"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSave,
  faTimes,
  faSpinner,
  faBoxOpen,
  faDollarSign,
  faCalendar,
  faStore,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface InventoryItem {
  id: number;
  item_name: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string | null;
  total_price: string | null;
  supplier_name: string;
  purchase_date: string | null;
  receipt_url: string | null;
}

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const itemId = Number(params.id);
  const projectId = Number(searchParams.get("projectId"));

  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    quantity: "",
    unit: "",
    unit_price: "",
    supplier_name: "",
    purchase_date: "",
    receipt_url: "",
  });

  const [initialLoaded, setInitialLoaded] = useState(false);

  // Fetch current item
  const { data: itemData, isLoading } = useQuery({
    queryKey: ["inventory-item", projectId, itemId],
    queryFn: async () => {
      const res = await api.get<{ results: InventoryItem[] }>(
        `/api/v1/projects/${projectId}/inventory/`
      );
      const item = (res.results || []).find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");
      return item;
    },
    enabled: !!projectId && !!itemId,
  });

  useEffect(() => {
    if (itemData && !initialLoaded) {
      setFormData({
        item_name: itemData.item_name,
        description: itemData.description || "",
        quantity: itemData.quantity,
        unit: itemData.unit || "",
        unit_price: itemData.unit_price || "",
        supplier_name: itemData.supplier_name || "",
        purchase_date: itemData.purchase_date || "",
        receipt_url: itemData.receipt_url || "",
      });
      setInitialLoaded(true);
    }
  }, [itemData, initialLoaded]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.patch(
        `/api/v1/projects/${projectId}/inventory/${itemId}/`,
        payload
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-inventory"] });
      router.push("/provider/inventory");
    },
    onError: (err: any) => {
      alert(`Failed to update: ${err.data?.error || err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading item...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.push("/provider/inventory")}
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
              Edit Inventory Item
            </h1>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
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
                  Receipt URL
                </label>
                <input
                  type="url"
                  value={formData.receipt_url}
                  onChange={(e) =>
                    setFormData({ ...formData, receipt_url: e.target.value })
                  }
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
              disabled={updateMutation.isPending}
              className="btn-primary flex items-center gap-2 min-w-[160px]"
            >
              {updateMutation.isPending ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
