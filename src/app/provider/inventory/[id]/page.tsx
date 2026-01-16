"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBoxOpen,
  faDollarSign,
  faCalendar,
  faStore,
  faBriefcase,
  faUser,
  faPenToSquare,
  faTrash,
  faTimes,
  faSpinner,
  faCheck,
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
  created_at: string;
  updated_at: string;
}

interface Project {
  id: number;
  project_name: string;
  client: { full_name: string } | null;
}

export default function ViewInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const itemId = Number(params.id);
  const projectId = Number(searchParams.get("projectId"));

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!projectId || isNaN(projectId)) {
      alert("Invalid or missing projectId. Redirecting to inventory list.");
      router.push("/provider/inventory");
    }
  }, [projectId, router]);

  // Fetch project info
  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await api.get<Project>(`/api/v1/projects/${projectId}/`);
      return res;
    },
    enabled: !!projectId,
  });

  // Fetch inventory items for project and find current item
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ["project-inventory", projectId],
    queryFn: async () => {
      const res = await api.get<{ results: InventoryItem[] }>(
        `/api/v1/projects/${projectId}/inventory/`
      );
      return res.results || [];
    },
    enabled: !!projectId,
  });

  const currentItem = inventoryData?.find((item) => item.id === itemId);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(
        `/api/v1/projects/${projectId}/inventory/${itemId}/delete/`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-inventory"] });
      showSuccessNotification("Inventory item deleted successfully!");
      setTimeout(() => router.push("/provider/inventory"), 1500);
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

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${currentItem?.item_name}"?\nThis action cannot be undone.`
      )
    ) {
      deleteMutation.mutate();
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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading inventory item...</p>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTimes} className="text-red-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Item Not Found
          </h3>
          <p className="text-red-700 mb-4">
            The requested inventory item could not be found.
          </p>
          <button
            onClick={() => router.push("/provider/inventory")}
            className="btn-primary"
          >
            Go to Inventory List
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
              Inventory Item Details
            </h1>
            <p className="text-neutral-600 body-regular mt-1">
              {projectData?.project_name || "Project"} • {currentItem.item_name}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto">
        {/* Project Info Banner */}
        {projectData && (
          <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center font-bold text-lg">
              {projectData.project_name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">
                {projectData.project_name}
              </h3>
              {projectData.client && (
                <p className="text-neutral-600 text-sm flex items-center gap-1">
                  <FontAwesomeIcon icon={faUser} className="text-xs" />
                  Client: {projectData.client.full_name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Item Details Card */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-6 py-5 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h2 className="heading-3 text-neutral-900">
                {currentItem.item_name}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    router.push(
                      `/provider/inventory/${itemId}/edit?projectId=${projectId}`
                    )
                  }
                  className="btn-primary flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2.5 bg-red-600 text-neutral-0 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Delete
                </button>
              </div>
            </div>
            {currentItem.description && (
              <p className="text-neutral-600 mt-2 body-regular">
                {currentItem.description}
              </p>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-neutral-600 font-medium mb-2 body-small">
                Quantity & Unit
              </label>
              <div className="text-neutral-900 text-lg font-semibold">
                {currentItem.quantity}{" "}
                {currentItem.unit && <span>({currentItem.unit})</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-neutral-600 font-medium mb-2 body-small">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="mr-2 text-primary-600"
                  />
                  Unit Price
                </label>
                <div className="text-neutral-900 text-lg font-semibold">
                  {formatCurrency(currentItem.unit_price)}
                </div>
              </div>
              <div>
                <label className="block text-neutral-600 font-medium mb-2 body-small">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="mr-2 text-green-600"
                  />
                  Total Price
                </label>
                <div className="text-neutral-900 text-lg font-semibold">
                  {formatCurrency(currentItem.total_price)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-neutral-600 font-medium mb-2 body-small">
                <FontAwesomeIcon
                  icon={faStore}
                  className="mr-2 text-primary-600"
                />
                Supplier
              </label>
              <div className="text-neutral-900">
                {currentItem.supplier_name || "— Not specified"}
              </div>
            </div>

            <div>
              <label className="block text-neutral-600 font-medium mb-2 body-small">
                <FontAwesomeIcon
                  icon={faCalendar}
                  className="mr-2 text-primary-600"
                />
                Purchase Date
              </label>
              <div className="text-neutral-900">
                {formatDate(currentItem.purchase_date)}
              </div>
            </div>

            {currentItem.receipt_url && (
              <div>
                <label className="block text-neutral-600 font-medium mb-2 body-small">
                  Receipt
                </label>
                <a
                  href={currentItem.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline font-medium"
                >
                  View Receipt
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-100 text-sm text-neutral-500">
              <p>
                Created:{" "}
                {new Date(currentItem.created_at).toLocaleString("en-US")}
              </p>
              <p>
                Last Updated:{" "}
                {new Date(currentItem.updated_at).toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
