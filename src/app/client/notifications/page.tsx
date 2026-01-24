"use client";

/**
 * Client Notifications Page - UPDATED WITH PROPER API INTEGRATION
 * Location: app/(client)/client/notifications/page.tsx
 *
 * Full-featured notifications page for clients with:
 * - Real-time notification display
 * - Filtering (all/unread/read, priority)
 * - Bulk operations (mark all read, delete selected, clear read)
 * - Statistics dashboard
 * - Auto-refresh
 * - Navigation to related content
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faFolderPlus,
  faEdit,
  faCheckCircle,
  faUserPlus,
  faCalendarPlus,
  faCalendarCheck,
  faCalendarTimes,
  faCalendar,
  faClock,
  faDollarSign,
  faKey,
  faUser,
  faEnvelope,
  faStar,
  faFlagCheckered,
  faUserTie,
  faInfo,
  faExclamationTriangle,
  faTimesCircle,
  faInbox,
  faTrash,
  faCheck,
  faTimes,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

// TypeScript interfaces
interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  priority: string;
  action_url: string | null;
  created_at: string;
  time_ago: string;
  notification_icon: string;
  notification_color: string;
}

interface NotificationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

// Icon mapping for FontAwesome
const iconMap: Record<string, any> = {
  faFolderPlus,
  faEdit,
  faCheckCircle,
  faUserPlus,
  faCalendarPlus,
  faCalendarCheck,
  faCalendarTimes,
  faCalendar,
  faClock,
  faDollarSign,
  faKey,
  faUser,
  faEnvelope,
  faStar,
  faFlagCheckered,
  faUserTie,
  faInfo,
  faBell,
  faExclamationTriangle,
  faTimesCircle,
};

export default function ClientNotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "unread" | "read"
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?type=client&session=expired");
    }
  }, [router]);

  // Fetch notifications with filters
  const {
    data: notificationsData,
    isLoading,
    error,
  } = useQuery<NotificationsResponse>({
    queryKey: [
      "client-notifications",
      selectedFilter,
      priorityFilter,
      currentPage,
    ],
    queryFn: async () => {
      if (!isAuthenticated()) {
        router.push("/login?type=client&session=expired");
        throw new Error("Not authenticated");
      }

      const params = new URLSearchParams();
      params.append("page", currentPage.toString());

      if (selectedFilter === "unread") params.append("is_read", "false");
      if (selectedFilter === "read") params.append("is_read", "true");
      if (priorityFilter) params.append("priority", priorityFilter);

      const data = await api.get<NotificationsResponse>(
        `/api/v1/client/notifications/?${params}`,
      );

      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch stats
  const { data: stats } = useQuery<NotificationStats>({
    queryKey: ["client-notification-stats"],
    queryFn: async () => {
      if (!isAuthenticated()) {
        throw new Error("Not authenticated");
      }

      const data = await api.get<NotificationStats>(
        "/api/v1/client/notifications/stats/",
      );
      return data;
    },
    refetchInterval: 30000,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const data = await api.patch(
        `/api/v1/client/notifications/${notificationId}/read/`,
        {
          is_read: true,
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["client-notification-stats"],
      });
      queryClient.invalidateQueries({ queryKey: ["client-unread-count"] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const data = await api.post(
        "/api/v1/client/notifications/mark-all-read/",
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["client-notification-stats"],
      });
      queryClient.invalidateQueries({ queryKey: ["client-unread-count"] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await api.delete(
        `/api/v1/client/notifications/${notificationId}/delete/`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["client-notification-stats"],
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (notificationIds: number[]) => {
      const data = await api.post("/api/v1/client/notifications/bulk-action/", {
        notification_ids: notificationIds,
        action: "delete",
      });
      return data;
    },
    onSuccess: () => {
      setSelectedNotifications([]);
      queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["client-notification-stats"],
      });
    },
  });

  // Delete all read mutation
  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      const data = await api.delete(
        "/api/v1/client/notifications/delete-all-read/",
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["client-notification-stats"],
      });
    },
  });

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }

    // Navigate if action URL exists
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (id: number) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((nId) => nId !== id) : [...prev, id],
    );
  };

  // Select all notifications on current page
  const toggleSelectAll = () => {
    if (!notificationsData) return;

    const allIds = notificationsData.results.map((n) => n.id);
    if (selectedNotifications.length === allIds.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(allIds);
    }
  };

  const notifications = notificationsData?.results || [];
  const hasNotifications = notifications.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">
            Error Loading Notifications
          </h3>
          <p className="text-red-600">
            {(error as any)?.message || "Unknown error"}
          </p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["client-notifications"],
              })
            }
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Notifications
          </h1>
          <p className="text-neutral-600">
            Stay updated with your projects and messages
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats?.total || 0}
                </p>
              </div>
              <FontAwesomeIcon
                icon={faBell}
                className="text-2xl text-neutral-400"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1">Unread</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.unread || 0}
                </p>
              </div>
              <FontAwesomeIcon
                icon={faEnvelope}
                className="text-2xl text-white/80"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">High Priority</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats?.by_priority?.high || 0}
                </p>
              </div>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-2xl text-red-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Read</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {(stats?.total || 0) - (stats?.unread || 0)}
                </p>
              </div>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-2xl text-green-500"
              />
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-neutral-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === "all"
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setSelectedFilter("unread");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === "unread"
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => {
                  setSelectedFilter("read");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === "read"
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Read
              </button>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">Priority:</label>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markAllReadMutation.isPending ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  "Mark All Read"
                )}
              </button>

              {selectedNotifications.length > 0 && (
                <button
                  onClick={() =>
                    bulkDeleteMutation.mutate(selectedNotifications)
                  }
                  disabled={bulkDeleteMutation.isPending}
                  className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkDeleteMutation.isPending ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    `Delete Selected (${selectedNotifications.length})`
                  )}
                </button>
              )}

              <button
                onClick={() => deleteAllReadMutation.mutate()}
                disabled={deleteAllReadMutation.isPending}
                className="px-4 py-2 bg-neutral-500 text-white text-sm rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteAllReadMutation.isPending ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  "Clear Read"
                )}
              </button>
            </div>
          </div>

          {/* Select All */}
          {hasNotifications && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    notifications.length > 0 &&
                    selectedNotifications.length === notifications.length
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">
                  Select all on this page
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          {!hasNotifications ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <FontAwesomeIcon
                icon={faInbox}
                className="text-5xl text-neutral-300 mb-4"
              />
              <p className="text-lg font-medium text-neutral-900 mb-1">
                No notifications
              </p>
              <p className="text-neutral-600 text-center">
                You're all caught up! Check back later for new updates.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {notifications.map((notification) => {
                const Icon = iconMap[notification.notification_icon] || faBell;
                const isSelected = selectedNotifications.includes(
                  notification.id,
                );

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 hover:bg-neutral-50 transition-colors ${
                      !notification.is_read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleNotificationSelection(notification.id)
                      }
                      className="mt-1 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />

                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        notification.notification_color === "blue"
                          ? "bg-blue-100"
                          : notification.notification_color === "green"
                            ? "bg-green-100"
                            : notification.notification_color === "red"
                              ? "bg-red-100"
                              : notification.notification_color === "yellow"
                                ? "bg-yellow-100"
                                : notification.notification_color === "purple"
                                  ? "bg-purple-100"
                                  : notification.notification_color === "orange"
                                    ? "bg-orange-100"
                                    : "bg-neutral-100"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={Icon}
                        className={`text-lg ${
                          notification.notification_color === "blue"
                            ? "text-blue-600"
                            : notification.notification_color === "green"
                              ? "text-green-600"
                              : notification.notification_color === "red"
                                ? "text-red-600"
                                : notification.notification_color === "yellow"
                                  ? "text-yellow-600"
                                  : notification.notification_color === "purple"
                                    ? "text-purple-600"
                                    : notification.notification_color ===
                                        "orange"
                                      ? "text-orange-600"
                                      : "text-neutral-600"
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3
                          className={`font-medium ${
                            notification.is_read
                              ? "text-neutral-700"
                              : "text-neutral-900"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {notification.priority === "high" && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                            High Priority
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm mb-2 ${
                          notification.is_read
                            ? "text-neutral-500"
                            : "text-neutral-700"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span>{notification.time_ago}</span>
                        {!notification.is_read && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Unread
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsReadMutation.mutate(notification.id);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotificationMutation.mutate(notification.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {hasNotifications && notificationsData && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!notificationsData.previous}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-sm text-neutral-600">
                Page {currentPage} • {notificationsData.count} total
              </span>

              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!notificationsData.next}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
