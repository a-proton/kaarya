"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheck,
  faCheckDouble,
  faTrash,
  faTimesCircle,
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
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
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
// DESIGN TOKENS
// ==================================================================================

const ICON_COLOR_STYLES: Record<string, { bg: string; color: string }> = {
  blue: { bg: "rgba(59,130,246,0.1)", color: "#2563eb" },
  green: { bg: "rgba(26,177,137,0.1)", color: "#1ab189" },
  red: { bg: "rgba(239,68,68,0.1)", color: "#dc2626" },
  yellow: { bg: "rgba(217,119,6,0.1)", color: "#d97706" },
  purple: { bg: "rgba(139,92,246,0.1)", color: "#7c3aed" },
  orange: { bg: "rgba(249,115,22,0.1)", color: "#ea580c" },
};

const PRIORITY_STYLES: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  high: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  normal: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  low: { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
};

// ==================================================================================
// HELPERS
// ==================================================================================

const getNotificationIcon = (iconName: string) => iconMap[iconName] || faBell;

const getIconStyle = (color: string) =>
  ICON_COLOR_STYLES[color] ?? { bg: "rgba(26,177,137,0.1)", color: "#1ab189" };

const getPriorityStyle = (priority: string) =>
  PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.low;

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
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // ==================================================================================
  // TOAST
  // ==================================================================================

  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ==================================================================================
  // DATA FETCHING
  // ==================================================================================

  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    isError: notificationsError,
  } = useQuery<NotificationsResponse>({
    queryKey: ["notifications", selectedFilter, selectedPriority, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      if (selectedFilter === "Unread") params.append("is_read", "false");
      else if (selectedFilter === "Read") params.append("is_read", "true");
      if (selectedPriority !== "All Priorities")
        params.append("priority", selectedPriority.toLowerCase());
      return api.get<NotificationsResponse>(
        `/api/v1/notifications/?${params.toString()}`,
      );
    },
  });

  const { data: statsData } = useQuery<NotificationStats>({
    queryKey: ["notification-stats"],
    queryFn: () => api.get<NotificationStats>("/api/v1/notifications/stats/"),
  });

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      api.patch(`/api/v1/notifications/${notificationId}/read/`, {
        is_read: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post("/api/v1/notifications/mark-all-read/"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      setSelectedNotifications([]);
      notify("All notifications marked as read");
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: number) =>
      api.delete(`/api/v1/notifications/${notificationId}/delete/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      notify("Notification deleted");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (notificationIds: number[]) =>
      api.post("/api/v1/notifications/bulk-action/", {
        notification_ids: notificationIds,
        action: "delete",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      setSelectedNotifications([]);
      notify("Selected notifications deleted");
    },
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: () => api.delete("/api/v1/notifications/delete-all-read/"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      notify("All read notifications cleared");
    },
  });

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleSelectNotification = (id: number) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notificationsData?.results.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(
        notificationsData?.results.map((n) => n.id) || [],
      );
    }
  };

  const handleBulkDelete = () => {
    if (
      selectedNotifications.length > 0 &&
      confirm(`Delete ${selectedNotifications.length} notification(s)?`)
    ) {
      bulkDeleteMutation.mutate(selectedNotifications);
    }
  };

  const handleDeleteAllRead = () => {
    if (confirm("Delete all read notifications? This cannot be undone.")) {
      deleteAllReadMutation.mutate();
    }
  };

  // ==================================================================================
  // LOADING / ERROR
  // ==================================================================================

  if (notificationsLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="animate-spin mb-3"
            style={{ fontSize: "2rem", color: "#1ab189" }}
          />
          <p
            style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}
          >
            Loading notifications…
          </p>
        </div>
      </div>
    );
  }

  if (notificationsError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#fef2f2" }}
          >
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              style={{ color: "#ef4444", fontSize: "1.1rem" }}
            />
          </div>
          <p className="mb-4" style={{ color: "#ef4444" }}>
            Failed to load notifications
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const notifications = notificationsData?.results || [];
  const hasNotifications = notifications.length > 0;
  const allSelected =
    notifications.length > 0 &&
    selectedNotifications.length === notifications.length;

  // ==================================================================================
  // RENDER
  // ==================================================================================

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-neutral-50)" }}
    >
      {/* Toast */}
      {showToast && (
        <div
          className="fixed top-5 right-5 z-[60]"
          style={{ minWidth: "17rem" }}
        >
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-3.5"
            style={{
              backgroundColor: "var(--color-neutral-900)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#1ab189" }}
            >
              <FontAwesomeIcon
                icon={faCheck}
                style={{ color: "white", fontSize: "0.6rem" }}
              />
            </div>
            <p
              className="flex-1 font-medium"
              style={{ fontSize: "0.875rem", color: "white" }}
            >
              {toastMsg}
            </p>
            <button
              onClick={() => setShowToast(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                padding: 0,
              }}
            >
              <FontAwesomeIcon icon={faTimes} style={{ fontSize: "0.75rem" }} />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.125rem 2rem",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: "1.375rem",
                color: "var(--color-neutral-900)",
                lineHeight: 1.2,
              }}
            >
              Notifications
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Stay updated with your latest activities
              {statsData?.unread ? (
                <span
                  className="ml-2 font-semibold rounded-full px-2 py-0.5"
                  style={{
                    fontSize: "0.7rem",
                    backgroundColor: "#1ab189",
                    color: "white",
                  }}
                >
                  {statsData.unread} unread
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {statsData && statsData.unread > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="btn btn-ghost btn-md flex items-center gap-2"
                style={{ opacity: markAllReadMutation.isPending ? 0.6 : 1 }}
              >
                <FontAwesomeIcon
                  icon={faCheckDouble}
                  style={{ fontSize: "0.8rem" }}
                />
                Mark All Read
              </button>
            )}
            {selectedNotifications.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="btn btn-md flex items-center gap-2"
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  opacity: bulkDeleteMutation.isPending ? 0.6 : 1,
                  cursor: bulkDeleteMutation.isPending
                    ? "not-allowed"
                    : "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#fee2e2";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#fef2f2";
                }}
              >
                <FontAwesomeIcon
                  icon={faTrash}
                  style={{ fontSize: "0.8rem" }}
                />
                Delete ({selectedNotifications.length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "1.75rem 2rem" }}>
        {/* Stats Cards */}
        {statsData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Total",
                value: statsData.total,
                iconBg: "rgba(59,130,246,0.1)",
                iconColor: "#2563eb",
                icon: faBell,
              },
              {
                label: "Unread",
                value: statsData.unread,
                iconBg: "rgba(26,177,137,0.1)",
                iconColor: "#1ab189",
                icon: faEnvelope,
                highlight: statsData.unread > 0,
              },
              {
                label: "High Priority",
                value: statsData.by_priority.high,
                iconBg: "rgba(239,68,68,0.1)",
                iconColor: "#dc2626",
                icon: faExclamationTriangle,
              },
              {
                label: "Read",
                value: statsData.total - statsData.unread,
                iconBg: "rgba(22,163,74,0.1)",
                iconColor: "#16a34a",
                icon: faCheckCircle,
              },
            ].map(({ label, value, iconBg, iconColor, icon, highlight }) => (
              <div
                key={label}
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: "var(--color-neutral-0)",
                  border: highlight
                    ? "1px solid rgba(26,177,137,0.3)"
                    : "1px solid var(--color-neutral-200)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: iconBg }}
                >
                  <FontAwesomeIcon
                    icon={icon}
                    style={{ color: iconColor, fontSize: "1rem" }}
                  />
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-neutral-500)",
                    marginBottom: "0.25rem",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: "1.375rem",
                    fontWeight: 700,
                    color: highlight ? "#1ab189" : "var(--color-neutral-900)",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Main Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--color-neutral-0)",
            border: "1px solid var(--color-neutral-200)",
          }}
        >
          {/* Toolbar */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap"
            style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid var(--color-neutral-200)",
            }}
          >
            {/* Left — select all + filter tabs */}
            <div className="flex items-center gap-3">
              {/* Select all checkbox */}
              <button
                onClick={handleSelectAll}
                title={allSelected ? "Deselect all" : "Select all"}
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "0.5rem",
                  border: allSelected
                    ? "2px solid #1ab189"
                    : "1px solid var(--color-neutral-200)",
                  backgroundColor: allSelected ? "#1ab189" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 120ms",
                }}
              >
                {allSelected && (
                  <FontAwesomeIcon
                    icon={faCheck}
                    style={{ color: "white", fontSize: "0.65rem" }}
                  />
                )}
              </button>

              <div
                style={{
                  width: "1px",
                  height: "1.25rem",
                  backgroundColor: "var(--color-neutral-200)",
                }}
              />

              {/* Filter tabs */}
              <div className="flex items-center" style={{ gap: "0.25rem" }}>
                {["All", "Unread", "Read"].map((filter) => {
                  const active = selectedFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => {
                        setSelectedFilter(filter);
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "none",
                        backgroundColor: active ? "#1ab189" : "transparent",
                        color: active ? "white" : "var(--color-neutral-600)",
                        transition: "background-color 120ms, color 120ms",
                      }}
                      onMouseEnter={(e) => {
                        if (!active)
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "var(--color-neutral-100)";
                      }}
                      onMouseLeave={(e) => {
                        if (!active)
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "transparent";
                      }}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right — priority filter + clear read */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedPriority}
                  onChange={(e) => {
                    setSelectedPriority(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    appearance: "none",
                    padding: "0.4rem 2.25rem 0.4rem 0.875rem",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.8125rem",
                    color: "var(--color-neutral-700)",
                    backgroundColor: "var(--color-neutral-0)",
                    border: "1px solid var(--color-neutral-200)",
                    borderRadius: "0.625rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#1ab189";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(26,177,137,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-neutral-200)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option>All Priorities</option>
                  <option>High</option>
                  <option>Normal</option>
                  <option>Low</option>
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    color: "var(--color-neutral-400)",
                    fontSize: "0.65rem",
                  }}
                />
              </div>

              {statsData && statsData.total - statsData.unread > 0 && (
                <button
                  onClick={handleDeleteAllRead}
                  disabled={deleteAllReadMutation.isPending}
                  className="btn btn-ghost btn-md flex items-center gap-2"
                  style={{
                    color: "#dc2626",
                    opacity: deleteAllReadMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faTrash}
                    style={{ fontSize: "0.75rem" }}
                  />
                  Clear Read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {!hasNotifications ? (
            <div className="text-center" style={{ padding: "4rem 2rem" }}>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "var(--color-neutral-100)" }}
              >
                <FontAwesomeIcon
                  icon={faInbox}
                  style={{
                    fontSize: "1.5rem",
                    color: "var(--color-neutral-400)",
                  }}
                />
              </div>
              <h3
                className="font-semibold mb-1"
                style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
              >
                {selectedFilter === "Unread"
                  ? "You're all caught up!"
                  : "No notifications"}
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                {selectedFilter === "Unread"
                  ? "No unread notifications at the moment."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, idx) => {
                const iconStyle = getIconStyle(notification.notification_color);
                const priorityStyle = getPriorityStyle(notification.priority);
                const isSelected = selectedNotifications.includes(
                  notification.id,
                );
                const isLast = idx === notifications.length - 1;

                return (
                  <div
                    key={notification.id}
                    style={{
                      borderBottom: isLast
                        ? "none"
                        : "1px solid var(--color-neutral-100)",
                      backgroundColor: !notification.is_read
                        ? "rgba(26,177,137,0.03)"
                        : "transparent",
                      transition: "background-color 120ms",
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLDivElement
                      ).style.backgroundColor = "var(--color-neutral-50)";
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLDivElement
                      ).style.backgroundColor = !notification.is_read
                        ? "rgba(26,177,137,0.03)"
                        : "transparent";
                    }}
                  >
                    <div
                      className="flex items-start gap-4"
                      style={{ padding: "1rem 1.5rem" }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() =>
                          handleSelectNotification(notification.id)
                        }
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                          borderRadius: "0.375rem",
                          border: isSelected
                            ? "2px solid #1ab189"
                            : "1px solid var(--color-neutral-300)",
                          backgroundColor: isSelected
                            ? "#1ab189"
                            : "transparent",
                          cursor: "pointer",
                          flexShrink: 0,
                          marginTop: "0.25rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 120ms",
                        }}
                      >
                        {isSelected && (
                          <FontAwesomeIcon
                            icon={faCheck}
                            style={{ color: "white", fontSize: "0.55rem" }}
                          />
                        )}
                      </button>

                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: iconStyle.bg }}
                      >
                        <FontAwesomeIcon
                          icon={getNotificationIcon(
                            notification.notification_icon,
                          )}
                          style={{
                            color: iconStyle.color,
                            fontSize: "0.95rem",
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 min-w-0"
                        style={{
                          cursor: notification.action_url
                            ? "pointer"
                            : "default",
                        }}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4
                              className="font-semibold truncate"
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--color-neutral-900)",
                              }}
                            >
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <span
                                className="flex-shrink-0"
                                style={{
                                  width: "0.5rem",
                                  height: "0.5rem",
                                  borderRadius: "9999px",
                                  backgroundColor: "#1ab189",
                                  display: "inline-block",
                                }}
                              />
                            )}
                          </div>
                          <span
                            className="flex-shrink-0 whitespace-nowrap"
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-neutral-400)",
                            }}
                          >
                            {notification.time_ago}
                          </span>
                        </div>

                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--color-neutral-600)",
                            marginTop: "0.25rem",
                            lineHeight: 1.5,
                          }}
                        >
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span
                            style={{
                              padding: "0.15rem 0.5rem",
                              borderRadius: "9999px",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              backgroundColor: priorityStyle.bg,
                              color: priorityStyle.color,
                              border: `1px solid ${priorityStyle.border}`,
                              textTransform: "capitalize",
                            }}
                          >
                            {notification.priority}
                          </span>
                        </div>
                      </div>

                      {/* Row Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                            title="Mark as read"
                            style={{
                              width: "2rem",
                              height: "2rem",
                              borderRadius: "0.5rem",
                              border: "none",
                              backgroundColor: "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--color-neutral-400)",
                              transition: "background-color 120ms, color 120ms",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.backgroundColor = "rgba(26,177,137,0.1)";
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.color = "#1ab189";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.backgroundColor = "transparent";
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.color = "var(--color-neutral-400)";
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faCheck}
                              style={{ fontSize: "0.75rem" }}
                            />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this notification?")) {
                              deleteNotificationMutation.mutate(
                                notification.id,
                              );
                            }
                          }}
                          title="Delete"
                          style={{
                            width: "2rem",
                            height: "2rem",
                            borderRadius: "0.5rem",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-neutral-300)",
                            transition: "background-color 120ms, color 120ms",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = "#fef2f2";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "#dc2626";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = "transparent";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "var(--color-neutral-300)";
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            style={{ fontSize: "0.75rem" }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {notificationsData && notificationsData.count > 20 && (
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{
                padding: "0.875rem 1.5rem",
                borderTop: "1px solid var(--color-neutral-200)",
              }}
            >
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                Showing {(currentPage - 1) * 20 + 1}–
                {Math.min(currentPage * 20, notificationsData.count)} of{" "}
                {notificationsData.count} notifications
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!notificationsData.previous}
                  className="btn btn-ghost btn-md"
                  style={{ opacity: !notificationsData.previous ? 0.4 : 1 }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!notificationsData.next}
                  className="btn btn-primary btn-md"
                  style={{ opacity: !notificationsData.next ? 0.4 : 1 }}
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
