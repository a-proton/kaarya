/**
 * Hooks for notification and message unread counts
 * Location: hooks/useNotificationCount.ts
 *
 * Usage:
 *   const { unreadNotifications, unreadMessages, total } = useProviderCounts();
 *   const { unreadNotifications, unreadMessages, total } = useClientCounts();
 *
 * Both hooks:
 *   - Poll every 30s while the tab is focused
 *   - Pause polling when the tab is hidden (saves requests)
 *   - Expose a manual `refresh()` to force re-fetch (e.g. after marking as read)
 *   - Return 0 safely on error so the UI never breaks
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UnreadNotificationResponse {
  unread_count: number;
}

interface UnreadMessagesResponse {
  total_unread: number;
  conversations_with_unread: number;
}

interface CountResult {
  unreadNotifications: number;
  unreadMessages: number;
  total: number;
  isLoading: boolean;
  refresh: () => void;
}

// ─────────────────────────────────────────────────────────────
// Internal: pause polling when tab is hidden
// ─────────────────────────────────────────────────────────────

function useIsTabVisible() {
  const [visible, setVisible] = useState(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true,
  );

  useEffect(() => {
    const handler = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return visible;
}

// ─────────────────────────────────────────────────────────────
// Internal: shared fetcher
// ─────────────────────────────────────────────────────────────

function useCounts(
  notificationKey: string,
  notificationUrl: string,
  messageKey: string,
  messageUrl: string,
): CountResult {
  const queryClient = useQueryClient();
  const tabVisible = useIsTabVisible();

  const POLL_INTERVAL = 30_000; // 30 seconds

  // ── Notification unread count ──────────────────────────────
  const { data: notifData, isLoading: notifLoading } =
    useQuery<UnreadNotificationResponse>({
      queryKey: [notificationKey],
      queryFn: () => api.get<UnreadNotificationResponse>(notificationUrl),
      refetchInterval: tabVisible ? POLL_INTERVAL : false,
      refetchIntervalInBackground: false,
      // Return stale data on error rather than throwing
      retry: 1,
      staleTime: 10_000,
    });

  // ── Message unread count ───────────────────────────────────
  const { data: msgData, isLoading: msgLoading } =
    useQuery<UnreadMessagesResponse>({
      queryKey: [messageKey],
      queryFn: () => api.get<UnreadMessagesResponse>(messageUrl),
      refetchInterval: tabVisible ? POLL_INTERVAL : false,
      refetchIntervalInBackground: false,
      retry: 1,
      staleTime: 10_000,
    });

  // ── Manual refresh ─────────────────────────────────────────
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [notificationKey] });
    queryClient.invalidateQueries({ queryKey: [messageKey] });
  }, [queryClient, notificationKey, messageKey]);

  const unreadNotifications = notifData?.unread_count ?? 0;
  const unreadMessages = msgData?.total_unread ?? 0;

  return {
    unreadNotifications,
    unreadMessages,
    total: unreadNotifications + unreadMessages,
    isLoading: notifLoading || msgLoading,
    refresh,
  };
}

// ─────────────────────────────────────────────────────────────
// Public hooks
// ─────────────────────────────────────────────────────────────

/**
 * For service provider layout / navbar
 */
export function useProviderCounts(): CountResult {
  return useCounts(
    "provider-notification-count",
    "/api/v1/notifications/unread-count/",
    "provider-message-count",
    "/api/v1/messages/conversations/unread-count/",
  );
}

/**
 * For client layout / navbar
 */
export function useClientCounts(): CountResult {
  return useCounts(
    "client-notification-count",
    "/api/v1/client/notifications/unread-count/",
    "client-message-count",
    "/api/v1/messages/conversations/unread-count/",
  );
}

// ─────────────────────────────────────────────────────────────
// Convenience: invalidate counts from anywhere after an action
// e.g. after marking notifications as read on the notifications page
// ─────────────────────────────────────────────────────────────

/**
 * Call this after marking provider notifications as read
 * so the navbar badge updates immediately without waiting for the poll.
 *
 * Example:
 *   const invalidate = useInvalidateProviderCounts();
 *   await markAllReadMutation.mutateAsync();
 *   invalidate();
 */
export function useInvalidateProviderCounts() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["provider-notification-count"],
    });
    queryClient.invalidateQueries({ queryKey: ["provider-message-count"] });
  }, [queryClient]);
}

/**
 * Call this after marking client notifications as read.
 */
export function useInvalidateClientCounts() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["client-notification-count"] });
    queryClient.invalidateQueries({ queryKey: ["client-message-count"] });
  }, [queryClient]);
}
