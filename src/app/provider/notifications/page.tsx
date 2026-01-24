"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheck,
  faCheckDouble,
  faTrash,
  faTimesCircle,
  faFileCheck,
  faSpinner,
  faExclamationTriangle,
  faInbox,
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
  faFileCircleCheck,
  faFlagCheckered,
  faUserTie,
  faInfo,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

// ==================================================================================
// TYPE DEFINITIONS
// ==================================================================================

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: number | null;
  is_read: boolean;
  read_at: string | null;
  priority: "low" | "normal" | "high";
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
  by_priority: {
    low: number;
    normal: number;
    high: number;
  };
}

// ==================================================================================
// ICON MAPPING
// ==================================================================================

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
  faTimesCircle,
  faFileCircleCheck,
  faExclamationTriangle,
};

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);

  // ==================================================================================
  // DATA FETCHING
  // ==================================================================================

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    isError: notificationsError,
  } = useQuery<NotificationsResponse>({
    queryKey: ["notifications", selectedFilter, selectedPriority, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());

      if (selectedFilter === "Unread") {
        params.append("is_read", "false");
      } else if (selectedFilter === "Read") {
        params.append("is_read", "true");
      }

      if (selectedPriority !== "All Priorities") {
        params.append("priority", selectedPriority.toLowerCase());
      }

      return api.get<NotificationsResponse>(
        `/api/v1/notifications/?${params.toString()}`,
      );
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery<NotificationStats>({
    queryKey: ["notification-stats"],
    queryFn: () => api.get<NotificationStats>("/api/v1/notifications/stats/"),
  });

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return api.patch(`/api/v1/notifications/${notificationId}/read/`, {
        is_read: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/v1/notifications/mark-all-read/");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      setSelectedNotifications([]);
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return api.delete(`/api/v1/notifications/${notificationId}/delete/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (notificationIds: number[]) => {
      return api.post("/api/v1/notifications/bulk-action/", {
        notification_ids: notificationIds,
        action: "delete",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      setSelectedNotifications([]);
    },
  });

  // Delete all read mutation
  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      return api.delete("/api/v1/notifications/delete-all-read/");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
  });

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleSelectNotification = (notificationId: number) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId],
    );
  };

  const handleSelectAll = () => {
    if (
      selectedNotifications.length === notificationsData?.results.length &&
      notificationsData
    ) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(
        notificationsData?.results.map((n) => n.id) || [],
      );
    }
  };

  const handleBulkDelete = async () => {
    if (
      selectedNotifications.length > 0 &&
      confirm(
        `Are you sure you want to delete ${selectedNotifications.length} notification(s)?`,
      )
    ) {
      await bulkDeleteMutation.mutateAsync(selectedNotifications);
    }
  };

  const handleDeleteAllRead = async () => {
    if (
      confirm(
        "Are you sure you want to delete all read notifications? This action cannot be undone.",
      )
    ) {
      await deleteAllReadMutation.mutateAsync();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "normal":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "low":
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
      default:
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
    }
  };

  const getNotificationIcon = (iconName: string) => {
    return iconMap[iconName] || faBell;
  };

  const getIconColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      red: "bg-red-100 text-red-600",
      yellow: "bg-yellow-100 text-yellow-600",
      purple: "bg-purple-100 text-purple-600",
      orange: "bg-orange-100 text-orange-600",
    };
    return colorMap[color] || "bg-neutral-100 text-neutral-600";
  };

  // ==================================================================================
  // LOADING & ERROR STATES
  // ==================================================================================

  const isLoading = notificationsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-primary-600 mb-4"
          />
          <p className="text-neutral-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (notificationsError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-red-600 text-2xl"
            />
          </div>
          <h2 className="heading-3 text-neutral-900 mb-2">
            Error Loading Notifications
          </h2>
          <p className="text-neutral-600 mb-4">
            Failed to load your notifications. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const notifications = notificationsData?.results || [];
  const hasNotifications = notifications.length > 0;

  // ==================================================================================
  // RENDER
  // ==================================================================================

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-neutral-900 mb-1">Notifications</h1>
            <p className="text-neutral-600 body-regular">
              Stay updated with your latest activities
            </p>
          </div>
          <div className="flex items-center gap-3">
            {statsData && statsData.unread > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="btn-secondary flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCheckDouble} />
                Mark All Read
              </button>
            )}
            {selectedNotifications.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="btn-danger flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete Selected ({selectedNotifications.length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Stats Cards */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faBell}
                    className="text-2xl text-blue-600"
                  />
                </div>
              </div>
              <h3 className="text-neutral-600 body-small mb-1">
                Total Notifications
              </h3>
              <p className="heading-3 text-neutral-900 mb-0">
                {statsData.total}
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-neutral-0 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-neutral-0/20 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faEnvelope} className="text-2xl" />
                </div>
              </div>
              <h3 className="text-neutral-0/80 body-small mb-1">Unread</h3>
              <p className="heading-2 mb-0">{statsData.unread}</p>
            </div>

            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="text-2xl text-red-600"
                  />
                </div>
              </div>
              <h3 className="text-neutral-600 body-small mb-1">
                High Priority
              </h3>
              <p className="heading-3 text-neutral-900 mb-0">
                {statsData.by_priority.high}
              </p>
            </div>

            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-2xl text-green-600"
                  />
                </div>
              </div>
              <h3 className="text-neutral-600 body-small mb-1">Read</h3>
              <p className="heading-3 text-neutral-900 mb-0">
                {statsData.total - statsData.unread}
              </p>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  title={
                    selectedNotifications.length === notifications.length
                      ? "Deselect All"
                      : "Select All"
                  }
                >
                  <FontAwesomeIcon
                    icon={
                      selectedNotifications.length === notifications.length
                        ? faCheckDouble
                        : faCheck
                    }
                    className="text-neutral-600"
                  />
                </button>

                <div className="h-6 w-px bg-neutral-200" />

                <div className="flex items-center gap-2">
                  {["All", "Unread", "Read"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setSelectedFilter(filter);
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        selectedFilter === filter
                          ? "bg-primary-600 text-neutral-0"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedPriority}
                    onChange={(e) => {
                      setSelectedPriority(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none pl-4 pr-10 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer"
                  >
                    <option>All Priorities</option>
                    <option>High</option>
                    <option>Normal</option>
                    <option>Low</option>
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
                  />
                </div>

                {statsData && statsData.total - statsData.unread > 0 && (
                  <button
                    onClick={handleDeleteAllRead}
                    disabled={deleteAllReadMutation.isPending}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Clear Read
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          {!hasNotifications ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faInbox}
                  className="text-4xl text-neutral-400"
                />
              </div>
              <h3 className="heading-4 text-neutral-900 mb-2">
                No notifications
              </h3>
              <p className="text-neutral-600">
                {selectedFilter === "Unread"
                  ? "You're all caught up!"
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-6 py-4 hover:bg-neutral-50 transition-colors ${
                    !notification.is_read ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-2 focus:ring-primary-500/20"
                    />

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconColorClasses(
                        notification.notification_color,
                      )}`}
                    >
                      <FontAwesomeIcon
                        icon={getNotificationIcon(
                          notification.notification_icon,
                        )}
                        className="text-xl"
                      />
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-neutral-900">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-primary-600 rounded-full" />
                          )}
                        </div>
                        <span className="text-neutral-500 text-sm whitespace-nowrap">
                          {notification.time_ago}
                        </span>
                      </div>
                      <p className="text-neutral-600 body-regular mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(
                            notification.priority,
                          )}`}
                        >
                          {notification.priority}
                        </span>
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
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="text-neutral-600"
                          />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              "Are you sure you want to delete this notification?",
                            )
                          ) {
                            deleteNotificationMutation.mutate(notification.id);
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="text-red-600"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {notificationsData && notificationsData.count > 20 && (
            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
              <p className="text-neutral-600 body-small">
                Showing {(currentPage - 1) * 20 + 1} to{" "}
                {Math.min(currentPage * 20, notificationsData.count)} of{" "}
                {notificationsData.count} notifications
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!notificationsData.previous}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!notificationsData.next}
                  className="btn-primary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
