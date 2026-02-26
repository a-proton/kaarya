"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPaperPlane,
  faImage,
  faVideo,
  faEllipsisVertical,
  faCheck,
  faCheckDouble,
  faTimes,
  faPlus,
  faSpinner,
  faExclamationTriangle,
  faCloudUpload,
  faUserCircle,
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { uploadMessageMedia } from "@/lib/storageService";
import { useInvalidateProviderCounts } from "@/hooks/useNotificationCount"; // ← added

// ==================================================================================
// TYPE DEFINITIONS
// ==================================================================================

interface Message {
  id: number;
  senderId: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "video" | "file";
  mediaUrl?: string | null;
  fileName?: string | null;
  status: "sent" | "delivered" | "read";
  conversation: number;
  sender: { id: number; email: string; user_type: string };
  sender_name: string;
  sender_image: string | null;
  sender_type: string;
  message_text: string;
  message_type: string;
  file_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  is_guest?: boolean;
}

interface Conversation {
  id: number;
  name: string;
  initials: string;
  type: "client" | "inquiry";
  avatar?: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  color: string;
  service_provider_name: string;
  service_provider_image: string | null;
  client_name_display: string;
  client_image: string | null;
  last_message: {
    text: string;
    sender_type: string;
    created_at: string;
  } | null;
  last_message_at: string;
  is_active: boolean;
  created_at: string;
  is_guest?: boolean;
  guest_email?: string;
  guest_phone?: string;
}

interface MessageCreateData {
  message_text?: string;
  message_type?: "text" | "image" | "video" | "file";
  file_url?: string;
}

interface MediaPreviewFile {
  file: File;
  type: string;
  url: string;
  name: string;
  uploadStatus?: "pending" | "uploading" | "uploaded" | "failed";
  uploadedUrl?: string;
  error?: string;
}

// ==================================================================================
// HELPER FUNCTIONS
// ==================================================================================

const AVATAR_COLORS = [
  "#1ab189",
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];

const mapConversationFromBackend = (
  conv: Record<string, unknown>,
): Conversation => {
  const isGuest = conv.type === "inquiry" || !conv.client;
  const name = isGuest
    ? (conv.client_name as string) ||
      (conv.client_name_display as string) ||
      "Guest User"
    : (conv.client_name_display as string) ||
      (conv.service_provider_name as string) ||
      "Unknown";
  const avatar = isGuest
    ? null
    : (conv.client_image as string | null) ||
      (conv.service_provider_image as string | null) ||
      null;
  const initials =
    name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "GU";
  const id = conv.id as number;
  const color = AVATAR_COLORS[id % AVATAR_COLORS.length];
  const lastMsg = conv.last_message as {
    text: string;
    sender_type: string;
    created_at: string;
  } | null;

  return {
    id,
    name,
    initials,
    type: isGuest ? "inquiry" : "client",
    avatar,
    lastMessage:
      (conv.lastMessage as string) || lastMsg?.text || "No messages yet",
    lastMessageTime: formatTime(
      (conv.last_message_at as string) || (conv.created_at as string),
    ),
    unreadCount: (conv.unreadCount as number) || 0,
    isOnline: false,
    color,
    service_provider_name: (conv.service_provider_name as string) || "",
    service_provider_image:
      (conv.service_provider_image as string | null) || null,
    client_name_display: (conv.client_name_display as string) || name,
    client_image: (conv.client_image as string | null) || null,
    last_message: lastMsg,
    last_message_at: (conv.last_message_at as string) || "",
    is_active: (conv.is_active as boolean) ?? true,
    created_at: (conv.created_at as string) || "",
    is_guest: isGuest,
    guest_email: isGuest
      ? (conv.client_email as string) ||
        (conv.guest_email as string) ||
        undefined
      : undefined,
    guest_phone: isGuest
      ? (conv.client_phone as string) ||
        (conv.guest_phone as string) ||
        undefined
      : undefined,
  };
};

const mapMessageFromBackend = (msg: Record<string, unknown>): Message => ({
  id: msg.id as number,
  senderId: msg.sender_type as string,
  content: (msg.message_text as string) || "",
  timestamp: msg.created_at as string,
  type: (msg.message_type as Message["type"]) || "text",
  mediaUrl: msg.file_url as string | null,
  fileName: null,
  status: (msg.is_read as boolean) ? "read" : "delivered",
  conversation: msg.conversation as number,
  sender: msg.sender as { id: number; email: string; user_type: string },
  sender_name: msg.sender_name as string,
  sender_image: (msg.sender_image as string | null) || null,
  sender_type: msg.sender_type as string,
  message_text: (msg.message_text as string) || "",
  message_type: (msg.message_type as string) || "text",
  file_url: (msg.file_url as string | null) || null,
  is_read: (msg.is_read as boolean) || false,
  read_at: (msg.read_at as string | null) || null,
  created_at: msg.created_at as string,
  is_guest: (msg.is_guest as boolean) || false,
});

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const invalidateProviderCounts = useInvalidateProviderCounts(); // ← added
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaPreviewFile | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showGuestInfo, setShowGuestInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Queries ──
  const {
    data: conversationsData = [],
    isLoading: conversationsLoading,
    isError: conversationsError,
  } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await api.get<Record<string, unknown>[]>(
        "/api/v1/messages/conversations/",
      );
      return response.map(mapConversationFromBackend);
    },
    refetchInterval: 5000,
  });

  const {
    data: messagesData,
    isLoading: messagesLoading,
    isError: messagesError,
  } = useQuery<Message[]>({
    queryKey: ["messages", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const response = await api.get<{
        results: Record<string, unknown>[];
        count: number;
        next: string | null;
        previous: string | null;
      }>(`/api/v1/messages/conversations/${selectedConversationId}/messages/`);
      return response.results
        .map(mapMessageFromBackend)
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
    },
    enabled: !!selectedConversationId,
    refetchInterval: 3000,
  });

  const { data: unreadData } = useQuery<{
    total_unread: number;
    conversations_with_unread: number;
  }>({
    queryKey: ["unread-count"],
    queryFn: () =>
      api.get<{ total_unread: number; conversations_with_unread: number }>(
        "/api/v1/messages/conversations/unread-count/",
      ),
    refetchInterval: 5000,
  });

  // ── Send mutation ──
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      messageData: MessageCreateData;
      previewFile: MediaPreviewFile | null;
    }) => {
      if (!selectedConversationId) throw new Error("No conversation selected");
      let finalData = { ...data.messageData };

      if (data.previewFile) {
        setIsUploadingMedia(true);
        setPreviewFile((prev) =>
          prev ? { ...prev, uploadStatus: "uploading" } : null,
        );
        try {
          const result = await uploadMessageMedia(data.previewFile.file, {
            folder: `messages/${selectedConversationId}`,
          });
          if (result.success && result.publicUrl) {
            setPreviewFile((prev) =>
              prev
                ? {
                    ...prev,
                    uploadStatus: "uploaded",
                    uploadedUrl: result.publicUrl,
                  }
                : null,
            );
            finalData.file_url = result.publicUrl;
          } else {
            throw new Error(result.error || "Upload failed");
          }
        } catch (err) {
          setPreviewFile((prev) =>
            prev
              ? {
                  ...prev,
                  uploadStatus: "failed",
                  error: err instanceof Error ? err.message : "Upload failed",
                }
              : null,
          );
          setIsUploadingMedia(false);
          throw new Error(
            `Media upload failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
        setIsUploadingMedia(false);
      }

      return api.post(
        `/api/v1/messages/conversations/${selectedConversationId}/messages/send/`,
        finalData,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["messages", selectedConversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      setMessageInput("");
      setPreviewFile(null);
      setShowMediaPreview(false);
      setIsUploadingMedia(false);
    },
    onError: (err: unknown) => {
      setIsUploadingMedia(false);
      const e = err as { message?: string; data?: { detail?: string } };
      alert(
        `Failed to send message: ${e.message ?? e.data?.detail ?? "Unknown error"}`,
      );
    },
  });

  // ── Mark read mutation ──
  // onSuccess: invalidates both the local unread-count query AND the navbar
  // provider-message-count query so the sidebar badge decreases immediately
  const markReadMutation = useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/v1/messages/conversations/${id}/mark-read/`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      invalidateProviderCounts(); // ← this makes the navbar badge decrease instantly
    },
  });

  // ── Handlers ──
  const handleSendMessage = () => {
    if (!messageInput.trim() && !previewFile) return;
    sendMessageMutation.mutate({
      messageData: {
        message_text: messageInput.trim(),
        message_type: previewFile
          ? previewFile.type.startsWith("image")
            ? "image"
            : previewFile.type.startsWith("video")
              ? "video"
              : "file"
          : "text",
      },
      previewFile,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      alert("Please select a valid image or video file");
      return;
    }
    const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File is too large. Maximum ${isVideo ? "100" : "5"}MB.`);
      return;
    }
    const fileUrl = URL.createObjectURL(file);
    setPreviewFile({
      file,
      type: file.type,
      url: fileUrl,
      name: file.name,
      uploadStatus: "pending",
    });
    setShowMediaPreview(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelPreview = () => {
    if (previewFile) URL.revokeObjectURL(previewFile.url);
    setPreviewFile(null);
    setShowMediaPreview(false);
    setIsUploadingMedia(false);
  };

  const handleConversationSelect = (id: number) => {
    setSelectedConversationId(id);
    setShowGuestInfo(false);
    const conv = conversationsData.find((c) => c.id === id);
    if (conv && conv.unreadCount > 0) markReadMutation.mutate(id);
  };

  const getMessageStatus = (status: Message["status"]) => {
    if (status === "sent")
      return (
        <FontAwesomeIcon
          icon={faCheck}
          style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.7)" }}
        />
      );
    if (status === "delivered")
      return (
        <FontAwesomeIcon
          icon={faCheckDouble}
          style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.7)" }}
        />
      );
    return (
      <FontAwesomeIcon
        icon={faCheckDouble}
        style={{ fontSize: "0.6rem", color: "#93c5fd" }}
      />
    );
  };

  const messages = messagesData ?? [];
  const currentConversation = conversationsData.find(
    (c) => c.id === selectedConversationId,
  );
  const filteredConversations = conversationsData.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Loading / Error ──
  if (conversationsLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
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
            Loading conversations…
          </p>
        </div>
      </div>
    );
  }

  if (conversationsError) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center max-w-md px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#fef2f2" }}
          >
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              style={{ color: "#ef4444", fontSize: "1.5rem" }}
            />
          </div>
          <h2
            className="font-bold mb-2"
            style={{ fontSize: "1.25rem", color: "var(--color-neutral-900)" }}
          >
            Error Loading Conversations
          </h2>
          <p
            className="mb-6"
            style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)" }}
          >
            Failed to load your conversations. Please try again.
          </p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["conversations"] })
            }
            className="btn btn-primary btn-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // RENDER
  // ==================================================================================
  return (
    <div
      className="flex overflow-hidden"
      style={{ height: "100vh", backgroundColor: "var(--color-neutral-50)" }}
    >
      {/* Upload progress toast */}
      {isUploadingMedia && (
        <div className="fixed top-5 right-5 z-[60]">
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-3.5"
            style={{
              backgroundColor: "var(--color-neutral-900)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
              minWidth: "17rem",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#1ab189" }}
            >
              <FontAwesomeIcon
                icon={faCloudUpload}
                className="animate-pulse"
                style={{ color: "white", fontSize: "0.75rem" }}
              />
            </div>
            <div>
              <p
                className="font-semibold"
                style={{ fontSize: "0.875rem", color: "white" }}
              >
                Uploading to Cloud…
              </p>
              <p
                style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}
              >
                Please wait while your file uploads
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className="flex-1 flex overflow-hidden"
        style={{ maxWidth: "1920px", margin: "0 auto", width: "100%" }}
      >
        {/* ── Main Chat Area ── */}
        {selectedConversationId ? (
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              borderRight: "1px solid var(--color-neutral-200)",
            }}
          >
            {/* Chat header */}
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                padding: "1rem 1.5rem",
                backgroundColor: "var(--color-neutral-0)",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {currentConversation?.avatar ? (
                    <img
                      src={currentConversation.avatar}
                      alt={currentConversation.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                      style={{
                        backgroundColor:
                          currentConversation?.type === "inquiry"
                            ? "#f97316"
                            : (currentConversation?.color ?? "#1ab189"),
                        color: "white",
                        fontSize: "0.875rem",
                      }}
                    >
                      {currentConversation?.initials}
                    </div>
                  )}
                  {currentConversation?.type === "client" &&
                    currentConversation.isOnline && (
                      <div
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                        style={{
                          backgroundColor: "#22c55e",
                          borderColor: "white",
                        }}
                      />
                    )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className="font-semibold"
                      style={{
                        fontSize: "0.9375rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      {currentConversation?.name}
                    </h2>
                    {currentConversation?.type === "inquiry" && (
                      <span
                        className="rounded-full font-semibold"
                        style={{
                          padding: "0.15rem 0.5rem",
                          fontSize: "0.65rem",
                          backgroundColor: "#fff7ed",
                          border: "1px solid #fed7aa",
                          color: "#c2410c",
                        }}
                      >
                        Guest
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    {currentConversation?.type === "inquiry"
                      ? "Guest inquiry · Not registered"
                      : currentConversation?.isOnline
                        ? "Online"
                        : "Offline"}
                  </p>
                </div>
              </div>

              {/* Guest info button */}
              {currentConversation?.type === "inquiry" && (
                <button
                  onClick={() => setShowGuestInfo((v) => !v)}
                  className="flex items-center gap-2 rounded-xl font-semibold"
                  style={{
                    padding: "0.5rem 0.875rem",
                    backgroundColor: showGuestInfo
                      ? "#fff7ed"
                      : "var(--color-neutral-50)",
                    border: "1px solid #fed7aa",
                    color: "#c2410c",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "#fff7ed";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = showGuestInfo
                      ? "#fff7ed"
                      : "var(--color-neutral-50)";
                  }}
                >
                  <FontAwesomeIcon
                    icon={faUserCircle}
                    style={{ fontSize: "0.8rem" }}
                  />
                  Guest Info
                </button>
              )}
            </div>

            {/* Guest info panel */}
            {showGuestInfo && currentConversation?.type === "inquiry" && (
              <div
                className="flex-shrink-0"
                style={{
                  backgroundColor: "#fff7ed",
                  borderBottom: "1px solid #fed7aa",
                  padding: "1rem 1.5rem",
                }}
              >
                <h3
                  className="font-semibold flex items-center gap-2 mb-3"
                  style={{ fontSize: "0.875rem", color: "#9a3412" }}
                >
                  <FontAwesomeIcon
                    icon={faUserCircle}
                    style={{ fontSize: "0.8rem" }}
                  />
                  Guest Contact Information
                </h3>
                <div className="space-y-2 mb-4">
                  {[
                    {
                      icon: faUserCircle,
                      label: "Name",
                      value: currentConversation.name,
                      href: undefined,
                    },
                    ...(currentConversation.guest_email
                      ? [
                          {
                            icon: faEnvelope,
                            label: "Email",
                            value: currentConversation.guest_email,
                            href: `mailto:${currentConversation.guest_email}`,
                          },
                        ]
                      : []),
                    ...(currentConversation.guest_phone
                      ? [
                          {
                            icon: faPhone,
                            label: "Phone",
                            value: currentConversation.guest_phone,
                            href: `tel:${currentConversation.guest_phone}`,
                          },
                        ]
                      : []),
                  ].map(({ icon, label, value, href }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2"
                      style={{ fontSize: "0.8125rem" }}
                    >
                      <FontAwesomeIcon
                        icon={icon}
                        style={{
                          color: "#ea580c",
                          fontSize: "0.75rem",
                          width: "0.875rem",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        className="font-semibold"
                        style={{ color: "#9a3412" }}
                      >
                        {label}:
                      </span>
                      {href ? (
                        <a
                          href={href}
                          style={{ color: "#c2410c", textDecoration: "none" }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLAnchorElement
                            ).style.textDecoration = "underline";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLAnchorElement
                            ).style.textDecoration = "none";
                          }}
                        >
                          {value}
                        </a>
                      ) : (
                        <span style={{ color: "#9a3412" }}>{value}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Email notification info */}
                <div
                  className="rounded-xl flex items-start gap-3 px-4 py-3"
                  style={{
                    backgroundColor: "white",
                    border: "1px solid #fed7aa",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    style={{
                      color: "#ea580c",
                      fontSize: "0.8rem",
                      marginTop: "0.1rem",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p
                      className="font-semibold mb-0.5"
                      style={{ fontSize: "0.8rem", color: "#9a3412" }}
                    >
                      📧 Email Notifications Active
                    </p>
                    <p style={{ fontSize: "0.72rem", color: "#c2410c" }}>
                      This guest will receive your replies via email at{" "}
                      <strong>{currentConversation.guest_email}</strong>. They
                      can respond by contacting you directly.
                    </p>
                  </div>
                </div>
                <p
                  className="mt-3 italic"
                  style={{ fontSize: "0.72rem", color: "#c2410c" }}
                >
                  💡 This user submitted a guest inquiry and hasn&apos;t
                  registered yet.
                </p>
              </div>
            )}

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ padding: "1.25rem 1.5rem" }}
            >
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin"
                    style={{ fontSize: "2rem", color: "#1ab189" }}
                  />
                </div>
              ) : messagesError ? (
                <div className="flex items-center justify-center h-full">
                  <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>
                    Failed to load messages
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: "var(--color-neutral-100)" }}
                  >
                    <FontAwesomeIcon
                      icon={faPaperPlane}
                      style={{
                        fontSize: "1.5rem",
                        color: "var(--color-neutral-400)",
                      }}
                    />
                  </div>
                  <p
                    className="font-semibold mb-1"
                    style={{ color: "var(--color-neutral-700)" }}
                  >
                    No messages yet
                  </p>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    {currentConversation?.type === "inquiry"
                      ? "Reply to this guest inquiry to start the conversation"
                      : "Start the conversation by sending a message"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isMine = message.sender_type === "service_provider";
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div style={{ maxWidth: "70%" }}>
                          {message.type === "text" && (
                            <div
                              className="whitespace-pre-wrap break-words"
                              style={{
                                padding: "0.625rem 1rem",
                                borderRadius: "1rem",
                                borderBottomRightRadius: isMine
                                  ? "0.25rem"
                                  : "1rem",
                                borderBottomLeftRadius: isMine
                                  ? "1rem"
                                  : "0.25rem",
                                backgroundColor: isMine
                                  ? "#1ab189"
                                  : "var(--color-neutral-100)",
                                color: isMine
                                  ? "white"
                                  : "var(--color-neutral-900)",
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                              }}
                            >
                              {message.content}
                            </div>
                          )}

                          {message.type === "image" && (
                            <div
                              style={{
                                borderRadius: "1rem",
                                overflow: "hidden",
                                borderBottomRightRadius: isMine
                                  ? "0.25rem"
                                  : "1rem",
                                borderBottomLeftRadius: isMine
                                  ? "1rem"
                                  : "0.25rem",
                              }}
                            >
                              {message.content && (
                                <div
                                  style={{
                                    padding: "0.5rem 1rem",
                                    backgroundColor: isMine
                                      ? "#1ab189"
                                      : "var(--color-neutral-100)",
                                    color: isMine
                                      ? "white"
                                      : "var(--color-neutral-900)",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {message.content}
                                </div>
                              )}
                              {message.mediaUrl ? (
                                <img
                                  src={message.mediaUrl}
                                  alt="Shared image"
                                  className="max-w-full h-auto cursor-pointer"
                                  style={{ display: "block" }}
                                  onClick={() =>
                                    window.open(message.mediaUrl!, "_blank")
                                  }
                                  onMouseEnter={(e) => {
                                    (
                                      e.currentTarget as HTMLImageElement
                                    ).style.opacity = "0.9";
                                  }}
                                  onMouseLeave={(e) => {
                                    (
                                      e.currentTarget as HTMLImageElement
                                    ).style.opacity = "1";
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-64 h-48 flex items-center justify-center"
                                  style={{
                                    backgroundColor: "var(--color-neutral-200)",
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={faImage}
                                    style={{
                                      fontSize: "3rem",
                                      color: "var(--color-neutral-400)",
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {message.type === "video" && (
                            <div
                              style={{
                                borderRadius: "1rem",
                                overflow: "hidden",
                                borderBottomRightRadius: isMine
                                  ? "0.25rem"
                                  : "1rem",
                                borderBottomLeftRadius: isMine
                                  ? "1rem"
                                  : "0.25rem",
                              }}
                            >
                              {message.content && (
                                <div
                                  style={{
                                    padding: "0.5rem 1rem",
                                    backgroundColor: isMine
                                      ? "#1ab189"
                                      : "var(--color-neutral-100)",
                                    color: isMine
                                      ? "white"
                                      : "var(--color-neutral-900)",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {message.content}
                                </div>
                              )}
                              <video
                                src={message.mediaUrl ?? ""}
                                controls
                                className="max-w-full h-auto"
                              />
                            </div>
                          )}

                          {/* Timestamp + status */}
                          <div
                            className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <span
                              style={{
                                fontSize: "0.65rem",
                                color: "var(--color-neutral-400)",
                              }}
                            >
                              {formatTime(message.timestamp)}
                            </span>
                            {isMine && getMessageStatus(message.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Media preview */}
            {showMediaPreview && previewFile && (
              <div
                className="flex-shrink-0"
                style={{
                  padding: "0.75rem 1.5rem",
                  borderTop: "1px solid var(--color-neutral-200)",
                  backgroundColor: "var(--color-neutral-50)",
                }}
              >
                <div
                  className="flex items-center gap-3 rounded-xl"
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "var(--color-neutral-0)",
                    border: "1px solid var(--color-neutral-200)",
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    {previewFile.type.startsWith("image") ? (
                      <img
                        src={previewFile.url}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: "var(--color-neutral-100)" }}
                      >
                        <FontAwesomeIcon
                          icon={faVideo}
                          style={{
                            fontSize: "1.25rem",
                            color: "var(--color-neutral-600)",
                          }}
                        />
                      </div>
                    )}
                    {previewFile.uploadStatus &&
                      previewFile.uploadStatus !== "pending" && (
                        <div
                          className="absolute inset-0 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                        >
                          {previewFile.uploadStatus === "uploading" && (
                            <FontAwesomeIcon
                              icon={faSpinner}
                              className="animate-spin"
                              style={{ color: "white", fontSize: "1rem" }}
                            />
                          )}
                          {previewFile.uploadStatus === "uploaded" && (
                            <FontAwesomeIcon
                              icon={faCheck}
                              style={{ color: "#86efac", fontSize: "1rem" }}
                            />
                          )}
                          {previewFile.uploadStatus === "failed" && (
                            <FontAwesomeIcon
                              icon={faTimes}
                              style={{ color: "#f87171", fontSize: "1rem" }}
                            />
                          )}
                        </div>
                      )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold truncate"
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      {previewFile.name}
                    </p>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      {previewFile.type.startsWith("image") ? "Image" : "Video"}
                      {previewFile.uploadStatus === "uploading" &&
                        " · Uploading…"}
                      {previewFile.uploadStatus === "uploaded" &&
                        " · Uploaded!"}
                      {previewFile.uploadStatus === "failed" &&
                        ` · ${previewFile.error ?? "Upload failed"}`}
                    </p>
                  </div>

                  <button
                    onClick={cancelPreview}
                    disabled={isUploadingMedia}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: isUploadingMedia ? "not-allowed" : "pointer",
                      padding: "0.375rem",
                      color: "var(--color-neutral-500)",
                      opacity: isUploadingMedia ? 0.4 : 1,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "var(--color-neutral-900)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "var(--color-neutral-500)";
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faTimes}
                      style={{ fontSize: "0.875rem" }}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Message input */}
            <div
              className="flex-shrink-0 flex items-end gap-3"
              style={{
                padding: "0.875rem 1.5rem",
                borderTop: "1px solid var(--color-neutral-200)",
                backgroundColor: "var(--color-neutral-0)",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sendMessageMutation.isPending || isUploadingMedia}
                title="Attach image or video"
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.75rem",
                  border: "1px solid var(--color-neutral-200)",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  color: "var(--color-neutral-600)",
                  flexShrink: 0,
                  opacity:
                    sendMessageMutation.isPending || isUploadingMedia ? 0.4 : 1,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--color-neutral-50)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                }}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  style={{ fontSize: "0.875rem" }}
                />
              </button>

              {/* Textarea */}
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !sendMessageMutation.isPending &&
                    !isUploadingMedia
                  ) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sendMessageMutation.isPending || isUploadingMedia}
                placeholder={
                  currentConversation?.type === "inquiry"
                    ? "Reply to guest inquiry…"
                    : "Type a message…"
                }
                rows={1}
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem",
                  color: "var(--color-neutral-900)",
                  backgroundColor: "var(--color-neutral-50)",
                  border: "1px solid var(--color-neutral-200)",
                  borderRadius: "0.75rem",
                  outline: "none",
                  resize: "none",
                  transition: "border-color 150ms, box-shadow 150ms",
                  opacity:
                    sendMessageMutation.isPending || isUploadingMedia ? 0.6 : 1,
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
              />

              {/* Send button */}
              <button
                onClick={handleSendMessage}
                disabled={
                  sendMessageMutation.isPending ||
                  isUploadingMedia ||
                  (!messageInput.trim() && !previewFile)
                }
                className="flex items-center gap-2 font-semibold rounded-xl flex-shrink-0"
                style={{
                  padding: "0.625rem 1.25rem",
                  backgroundColor: "#1ab189",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  transition: "opacity 150ms",
                  opacity:
                    sendMessageMutation.isPending ||
                    isUploadingMedia ||
                    (!messageInput.trim() && !previewFile)
                      ? 0.5
                      : 1,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#159e7a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#1ab189";
                }}
              >
                {isUploadingMedia ? (
                  <>
                    <FontAwesomeIcon
                      icon={faCloudUpload}
                      className="animate-pulse"
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    Uploading…
                  </>
                ) : sendMessageMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    Sending…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={faPaperPlane}
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div
            className="flex-1 hidden lg:flex flex-col items-center justify-center"
            style={{ backgroundColor: "var(--color-neutral-50)" }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
            >
              <FontAwesomeIcon
                icon={faPaperPlane}
                style={{ fontSize: "2rem", color: "#1ab189" }}
              />
            </div>
            <h3
              className="font-bold mb-2"
              style={{ fontSize: "1.25rem", color: "var(--color-neutral-900)" }}
            >
              Select a conversation
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-500)",
              }}
            >
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}

        {/* ── Sidebar: Conversations List ── */}
        <div
          className="flex flex-col overflow-hidden flex-shrink-0"
          style={{
            width: "clamp(20rem, 26rem, 28rem)",
            backgroundColor: "var(--color-neutral-0)",
            borderLeft: "1px solid var(--color-neutral-200)",
          }}
        >
          {/* Sidebar header */}
          <div
            className="flex-shrink-0"
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--color-neutral-200)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-bold"
                style={{
                  fontSize: "1.125rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                Conversations
              </h2>
              {(unreadData?.total_unread ?? 0) > 0 && (
                <span
                  className="font-bold rounded-full"
                  style={{
                    padding: "0.2rem 0.6rem",
                    backgroundColor: "#ef4444",
                    color: "white",
                    fontSize: "0.7rem",
                  }}
                >
                  {unreadData!.total_unread}
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  color: "var(--color-neutral-400)",
                  fontSize: "0.75rem",
                }}
              />
              <input
                type="text"
                placeholder="Search conversations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 1rem 0.5rem 2.125rem",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  color: "var(--color-neutral-900)",
                  backgroundColor: "var(--color-neutral-50)",
                  border: "1px solid var(--color-neutral-200)",
                  borderRadius: "0.625rem",
                  outline: "none",
                  transition: "border-color 150ms, box-shadow 150ms",
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
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <FontAwesomeIcon
                  icon={faSearch}
                  style={{
                    fontSize: "2.5rem",
                    color: "var(--color-neutral-300)",
                    marginBottom: "0.75rem",
                  }}
                />
                <p
                  className="font-semibold"
                  style={{ color: "var(--color-neutral-600)" }}
                >
                  No conversations found
                </p>
                {searchQuery && (
                  <p
                    className="mt-1"
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversationId === conv.id;
                const isGuest = conv.type === "inquiry";
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleConversationSelect(conv.id)}
                    style={{
                      padding: "0.875rem 1.25rem",
                      borderBottom: "1px solid var(--color-neutral-100)",
                      cursor: "pointer",
                      backgroundColor: isSelected
                        ? "rgba(26,177,137,0.06)"
                        : "transparent",
                      borderRight: isSelected
                        ? "3px solid #1ab189"
                        : "3px solid transparent",
                      transition: "background-color 120ms",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (
                          e.currentTarget as HTMLDivElement
                        ).style.backgroundColor = "var(--color-neutral-50)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (
                          e.currentTarget as HTMLDivElement
                        ).style.backgroundColor = "transparent";
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {conv.avatar ? (
                          <img
                            src={conv.avatar}
                            alt={conv.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                            style={{
                              backgroundColor: isGuest ? "#f97316" : conv.color,
                              color: "white",
                              fontSize: "0.875rem",
                            }}
                          >
                            {conv.initials}
                          </div>
                        )}
                        {conv.type === "client" && conv.isOnline && (
                          <div
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                            style={{
                              backgroundColor: "#22c55e",
                              borderColor: "white",
                            }}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + time */}
                        <div className="flex items-start justify-between mb-0.5">
                          <h3
                            className="font-semibold truncate"
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--color-neutral-900)",
                            }}
                          >
                            {conv.name}
                          </h3>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--color-neutral-400)",
                              flexShrink: 0,
                              marginLeft: "0.5rem",
                            }}
                          >
                            {conv.lastMessageTime}
                          </span>
                        </div>

                        {/* Last message */}
                        <p
                          className="truncate mb-2"
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--color-neutral-500)",
                          }}
                        >
                          {conv.lastMessage}
                        </p>

                        {/* Badges */}
                        <div className="flex items-center gap-2">
                          {conv.unreadCount > 0 && (
                            <span
                              className="font-bold rounded-full"
                              style={{
                                padding: "0.1rem 0.45rem",
                                backgroundColor: "#1ab189",
                                color: "white",
                                fontSize: "0.6rem",
                              }}
                            >
                              {conv.unreadCount}
                            </span>
                          )}
                          <span
                            className="rounded-full font-semibold ml-auto"
                            style={{
                              padding: "0.15rem 0.5rem",
                              fontSize: "0.63rem",
                              backgroundColor: isGuest
                                ? "#fff7ed"
                                : "rgba(26,177,137,0.08)",
                              border: `1px solid ${isGuest ? "#fed7aa" : "rgba(26,177,137,0.25)"}`,
                              color: isGuest ? "#c2410c" : "#1ab189",
                            }}
                          >
                            {isGuest ? "Guest Inquiry" : "Registered Client"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
