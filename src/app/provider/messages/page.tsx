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
  sender: {
    id: number;
    email: string;
    user_type: string;
  };
  sender_name: string;
  sender_image: string | null;
  sender_type: string;
  message_text: string;
  message_type: string;
  file_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  is_guest?: boolean; // ✅ NEW: Flag for guest messages
}

interface Conversation {
  id: number;
  name: string;
  initials: string;
  type: "client" | "inquiry"; // ✅ UPDATED: Now properly uses "inquiry" for guests
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
  // ✅ NEW: Guest inquiry fields
  is_guest?: boolean;
  guest_email?: string;
  guest_phone?: string;
}

interface MessageCreateData {
  message_text?: string;
  message_type?: "text" | "image" | "video" | "file";
  file_url?: string;
}

interface ConversationCreateData {
  service_provider_id?: number;
  client_id?: number;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  initial_message?: string;
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

const mapConversationFromBackend = (conv: any): Conversation => {
  // ✅ UPDATED: Properly detect guest inquiries
  const isGuest = conv.type === "inquiry" || !conv.client;

  const name = isGuest
    ? conv.client_name || conv.client_name_display || "Guest User"
    : conv.client_name_display || conv.service_provider_name || "Unknown";

  const avatar = isGuest
    ? null // Guests don't have avatars
    : conv.client_image || conv.service_provider_image || null;

  const initials =
    name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "GU";

  const colors = [
    "bg-primary-600",
    "bg-secondary-600",
    "bg-purple-600",
    "bg-yellow-600",
    "bg-blue-600",
    "bg-pink-600",
  ];
  const color = colors[conv.id % colors.length];

  return {
    id: conv.id,
    name,
    initials,
    type: isGuest ? "inquiry" : "client", // ✅ FIXED: Properly set type
    avatar,
    lastMessage:
      conv.lastMessage || conv.last_message?.text || "No messages yet",
    lastMessageTime: formatTime(conv.last_message_at || conv.created_at),
    unreadCount: conv.unreadCount || 0,
    isOnline: false, // Guests are never online
    color,
    service_provider_name: conv.service_provider_name,
    service_provider_image: conv.service_provider_image,
    client_name_display: conv.client_name_display || name,
    client_image: conv.client_image,
    last_message: conv.last_message,
    last_message_at: conv.last_message_at,
    is_active: conv.is_active,
    created_at: conv.created_at,
    is_guest: isGuest,
    guest_email: isGuest ? conv.client_email || conv.guest_email : undefined,
    guest_phone: isGuest ? conv.client_phone || conv.guest_phone : undefined,
  };
};

const mapMessageFromBackend = (msg: any): Message => {
  return {
    id: msg.id,
    senderId: msg.sender_type,
    content: msg.message_text || "",
    timestamp: msg.created_at,
    type: msg.message_type || "text",
    mediaUrl: msg.file_url,
    fileName: null,
    status: msg.is_read ? "read" : "delivered",
    conversation: msg.conversation,
    sender: msg.sender,
    sender_name: msg.sender_name,
    sender_image: msg.sender_image,
    sender_type: msg.sender_type,
    message_text: msg.message_text,
    message_type: msg.message_type,
    file_url: msg.file_url,
    is_read: msg.is_read,
    read_at: msg.read_at,
    created_at: msg.created_at,
    is_guest: msg.is_guest || false, // ✅ NEW: Track if message is from guest
  };
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
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
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaPreviewFile | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showGuestInfo, setShowGuestInfo] = useState(false); // ✅ NEW: Toggle guest info panel
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ==================================================================================
  // DATA FETCHING WITH TANSTACK QUERY
  // ==================================================================================

  const {
    data: conversationsData = [],
    isLoading: conversationsLoading,
    isError: conversationsError,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await api.get("/api/v1/messages/conversations/");
      return response.map(mapConversationFromBackend);
    },
    refetchInterval: 5000,
  });

  const {
    data: messagesData,
    isLoading: messagesLoading,
    isError: messagesError,
  } = useQuery({
    queryKey: ["messages", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const response = await api.get<{
        results: any[];
        count: number;
        next: string | null;
        previous: string | null;
      }>(`/api/v1/messages/conversations/${selectedConversationId}/messages/`);
      const mappedMessages = response.results.map(mapMessageFromBackend);
      return mappedMessages.sort(
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
    queryFn: async () => {
      return api.get<{
        total_unread: number;
        conversations_with_unread: number;
      }>("/api/v1/messages/conversations/unread-count/");
    },
    refetchInterval: 5000,
  });

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================

  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      messageData: MessageCreateData;
      previewFile: MediaPreviewFile | null;
    }) => {
      if (!selectedConversationId) throw new Error("No conversation selected");

      let finalMessageData = { ...data.messageData };

      if (data.previewFile) {
        console.log("📤 Uploading media to Supabase...");
        setIsUploadingMedia(true);

        setPreviewFile((prev) =>
          prev ? { ...prev, uploadStatus: "uploading" } : null,
        );

        try {
          const uploadResult = await uploadMessageMedia(data.previewFile.file, {
            folder: `messages/${selectedConversationId}`,
          });

          if (uploadResult.success && uploadResult.publicUrl) {
            console.log("✅ Upload successful:", uploadResult.publicUrl);

            setPreviewFile((prev) =>
              prev
                ? {
                    ...prev,
                    uploadStatus: "uploaded",
                    uploadedUrl: uploadResult.publicUrl,
                  }
                : null,
            );

            finalMessageData.file_url = uploadResult.publicUrl;
          } else {
            throw new Error(uploadResult.error || "Upload failed");
          }
        } catch (error) {
          console.error("❌ Upload failed:", error);

          setPreviewFile((prev) =>
            prev
              ? {
                  ...prev,
                  uploadStatus: "failed",
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : null,
          );

          setIsUploadingMedia(false);
          throw new Error(
            `Media upload failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          );
        }

        setIsUploadingMedia(false);
      }

      console.log("📝 Sending message to backend:", finalMessageData);
      return api.post(
        `/api/v1/messages/conversations/${selectedConversationId}/messages/send/`,
        finalMessageData,
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
    onError: (error: any) => {
      setIsUploadingMedia(false);
      alert(
        `Failed to send message: ${
          error.message || error.data?.detail || "Unknown error"
        }`,
      );
    },
  });

  const markConversationReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return api.post(
        `/api/v1/messages/conversations/${conversationId}/mark-read/`,
        {},
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  const handleSendMessage = () => {
    if (!messageInput.trim() && !previewFile) return;

    const messageData: MessageCreateData = {
      message_text: messageInput.trim(),
      message_type: previewFile
        ? previewFile.type.startsWith("image")
          ? "image"
          : previewFile.type.startsWith("video")
            ? "video"
            : "file"
        : "text",
    };

    sendMessageMutation.mutate({
      messageData,
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
      const maxSizeMB = isVideo ? 100 : 5;
      alert(`File is too large. Maximum size is ${maxSizeMB}MB`);
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cancelPreview = () => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
    setShowMediaPreview(false);
    setIsUploadingMedia(false);
  };

  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversationId(conversationId);
    setShowGuestInfo(false); // Reset guest info panel
    const conversation = conversationsData.find((c) => c.id === conversationId);
    if (conversation && conversation.unreadCount > 0) {
      markConversationReadMutation.mutate(conversationId);
    }
  };

  const getMessageStatus = (status: Message["status"]) => {
    if (status === "sent")
      return <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />;
    if (status === "delivered")
      return (
        <FontAwesomeIcon
          icon={faCheckDouble}
          className="w-3 h-3 text-neutral-400"
        />
      );
    return (
      <FontAwesomeIcon
        icon={faCheckDouble}
        className="w-3 h-3 text-primary-600"
      />
    );
  };

  // ✅ UPDATED: Better badge labels and colors
  const getTypeBadge = (type: Conversation["type"]) => {
    if (type === "inquiry") return "Guest Inquiry";
    return "Registered Client";
  };

  const getTypeBadgeColor = (type: Conversation["type"]) => {
    if (type === "inquiry")
      return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-primary-50 text-primary-700 border-primary-200";
  };

  const filteredConversations = conversationsData.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentConversation = conversationsData.find(
    (c) => c.id === selectedConversationId,
  );

  const messages = messagesData || [];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ==================================================================================
  // LOADING & ERROR STATES
  // ==================================================================================

  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="w-8 h-8 text-primary-600 mb-4"
          />
          <p className="text-neutral-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (conversationsError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center max-w-md px-6">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="w-16 h-16 text-red-500 mb-4"
          />
          <h2 className="heading-3 text-neutral-900 mb-2">
            Error Loading Conversations
          </h2>
          <p className="body-regular text-neutral-600 mb-6">
            Failed to load your conversations. Please try again.
          </p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["conversations"] })
            }
            className="btn-primary"
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
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1920px] mx-auto w-full overflow-hidden">
        {/* Header - Only visible on mobile */}
        <div className="lg:hidden bg-white border-b border-neutral-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="heading-2 text-neutral-900">Messages</h1>
            {unreadData && unreadData.total_unread > 0 && (
              <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                {unreadData.total_unread} unread
              </span>
            )}
          </div>
        </div>

        {/* Upload Progress Toast */}
        {isUploadingMedia && (
          <div className="fixed top-8 right-8 z-50 animate-slide-in-right">
            <div className="bg-blue-600 text-neutral-0 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
              <FontAwesomeIcon
                icon={faSpinner}
                className="animate-spin text-xl"
              />
              <div>
                <p className="font-semibold">Uploading to Cloud...</p>
                <p className="text-blue-100 text-sm">
                  Please wait while your file is being uploaded
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area - CENTER/LEFT */}
        {selectedConversationId ? (
          <div className="flex-1 flex flex-col bg-white lg:border-r border-neutral-200 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {currentConversation?.avatar ? (
                    <img
                      src={currentConversation.avatar}
                      alt={currentConversation.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full ${
                        currentConversation?.type === "inquiry"
                          ? "bg-orange-500"
                          : currentConversation?.color
                      } flex items-center justify-center text-white font-semibold`}
                    >
                      {currentConversation?.initials}
                    </div>
                  )}
                  {/* ✅ UPDATED: Guests never show online */}
                  {currentConversation?.type === "client" &&
                    currentConversation?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-neutral-900">
                      {currentConversation?.name}
                    </h2>
                    {/* ✅ NEW: Show inquiry badge in header */}
                    {currentConversation?.type === "inquiry" && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                        Guest
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">
                    {currentConversation?.type === "inquiry"
                      ? "Guest inquiry - Not registered"
                      : currentConversation?.isOnline
                        ? "Online"
                        : "Offline"}
                  </p>
                </div>
              </div>

              {/* ✅ NEW: Show guest info button for inquiries */}
              {currentConversation?.type === "inquiry" && (
                <button
                  onClick={() => setShowGuestInfo(!showGuestInfo)}
                  className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faUserCircle} className="mr-2" />
                  Guest Info
                </button>
              )}
            </div>

            {/* ✅ NEW: Guest Information Panel */}
            {showGuestInfo && currentConversation?.type === "inquiry" && (
              <div className="bg-orange-50 border-b border-orange-200 px-6 py-4 flex-shrink-0">
                <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUserCircle} />
                  Guest Contact Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FontAwesomeIcon
                      icon={faUserCircle}
                      className="text-orange-600 w-4"
                    />
                    <span className="text-orange-800 font-medium">Name:</span>
                    <span className="text-orange-900">
                      {currentConversation.name}
                    </span>
                  </div>
                  {currentConversation.guest_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-orange-600 w-4"
                      />
                      <span className="text-orange-800 font-medium">
                        Email:
                      </span>
                      <a
                        href={`mailto:${currentConversation.guest_email}`}
                        className="text-orange-900 hover:underline"
                      >
                        {currentConversation.guest_email}
                      </a>
                    </div>
                  )}
                  {currentConversation.guest_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="text-orange-600 w-4"
                      />
                      <span className="text-orange-800 font-medium">
                        Phone:
                      </span>
                      <a
                        href={`tel:${currentConversation.guest_phone}`}
                        className="text-orange-900 hover:underline"
                      >
                        {currentConversation.guest_phone}
                      </a>
                    </div>
                  )}
                </div>
                <p className="text-xs text-orange-700 mt-3 italic">
                  💡 This user hasn't registered yet. They'll receive your
                  replies via email.
                </p>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="w-8 h-8 text-primary-600"
                  />
                </div>
              ) : messagesError ? (
                <div className="flex items-center justify-center h-full text-red-500">
                  Failed to load messages
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                    <FontAwesomeIcon
                      icon={faPaperPlane}
                      className="w-8 h-8 text-neutral-400"
                    />
                  </div>
                  <p className="text-neutral-600 font-medium mb-1">
                    No messages yet
                  </p>
                  <p className="text-neutral-500 text-sm">
                    {currentConversation?.type === "inquiry"
                      ? "Reply to this guest inquiry to start the conversation"
                      : "Start the conversation by sending a message"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isMine = message.sender_type === "service_provider";
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            isMine ? "items-end" : "items-start"
                          }`}
                        >
                          {message.type === "text" && (
                            <div
                              className={`px-4 py-2.5 rounded-2xl ${
                                isMine
                                  ? "bg-primary-600 text-white rounded-br-sm"
                                  : "bg-neutral-100 text-neutral-900 rounded-bl-sm"
                              }`}
                            >
                              <p className="body-regular whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                          )}

                          {message.type === "image" && (
                            <div
                              className={`rounded-2xl overflow-hidden ${
                                isMine ? "rounded-br-sm" : "rounded-bl-sm"
                              }`}
                            >
                              {message.content && (
                                <div
                                  className={`px-4 py-2.5 ${
                                    isMine
                                      ? "bg-primary-600 text-white"
                                      : "bg-neutral-100 text-neutral-900"
                                  }`}
                                >
                                  <p className="body-regular">
                                    {message.content}
                                  </p>
                                </div>
                              )}
                              <div className="relative">
                                {message.mediaUrl ? (
                                  <img
                                    src={message.mediaUrl}
                                    alt="Shared image"
                                    className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() =>
                                      window.open(message.mediaUrl!, "_blank")
                                    }
                                  />
                                ) : (
                                  <div className="w-64 h-48 bg-neutral-200 flex items-center justify-center">
                                    <FontAwesomeIcon
                                      icon={faImage}
                                      className="w-12 h-12 text-neutral-400"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {message.type === "video" && (
                            <div
                              className={`rounded-2xl overflow-hidden ${
                                isMine ? "rounded-br-sm" : "rounded-bl-sm"
                              }`}
                            >
                              {message.content && (
                                <div
                                  className={`px-4 py-2.5 ${
                                    isMine
                                      ? "bg-primary-600 text-white"
                                      : "bg-neutral-100 text-neutral-900"
                                  }`}
                                >
                                  <p className="body-regular">
                                    {message.content}
                                  </p>
                                </div>
                              )}
                              <video
                                src={message.mediaUrl || ""}
                                controls
                                className="max-w-full h-auto"
                              />
                            </div>
                          )}

                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="text-xs text-neutral-500">
                              {formatTime(message.timestamp)}
                            </span>
                            {isMine && (
                              <span className="text-neutral-500">
                                {getMessageStatus(message.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Media Preview */}
            {showMediaPreview && previewFile && (
              <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex-shrink-0">
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-neutral-200">
                  <div className="relative">
                    {previewFile.type.startsWith("image") ? (
                      <img
                        src={previewFile.url}
                        alt="Preview"
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-neutral-100 rounded flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faVideo}
                          className="w-6 h-6 text-neutral-600"
                        />
                      </div>
                    )}

                    {previewFile.uploadStatus &&
                      previewFile.uploadStatus !== "pending" && (
                        <div className="absolute inset-0 bg-neutral-900/70 rounded flex items-center justify-center">
                          {previewFile.uploadStatus === "uploading" && (
                            <FontAwesomeIcon
                              icon={faSpinner}
                              className="text-white text-lg animate-spin"
                            />
                          )}
                          {previewFile.uploadStatus === "uploaded" && (
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="text-green-400 text-lg"
                            />
                          )}
                          {previewFile.uploadStatus === "failed" && (
                            <FontAwesomeIcon
                              icon={faTimes}
                              className="text-red-400 text-lg"
                            />
                          )}
                        </div>
                      )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {previewFile.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {previewFile.type.startsWith("image") ? "Image" : "Video"}
                      {previewFile.uploadStatus === "uploading" &&
                        " - Uploading..."}
                      {previewFile.uploadStatus === "uploaded" &&
                        " - Uploaded!"}
                      {previewFile.uploadStatus === "failed" &&
                        ` - ${previewFile.error || "Upload failed"}`}
                    </p>
                  </div>
                  <button
                    onClick={cancelPreview}
                    disabled={isUploadingMedia}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon
                      icon={faTimes}
                      className="w-4 h-4 text-neutral-600"
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-neutral-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-end gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendMessageMutation.isPending || isUploadingMedia}
                  className="p-2.5 hover:bg-neutral-50 rounded-lg transition-colors text-neutral-600 flex-shrink-0 disabled:opacity-50"
                  title="Add image or video"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                </button>

                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
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
                        ? "Reply to guest inquiry..."
                        : "Type a message..."
                    }
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50 resize-none"
                    rows={1}
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={
                    sendMessageMutation.isPending ||
                    isUploadingMedia ||
                    (!messageInput.trim() && !previewFile)
                  }
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                >
                  {isUploadingMedia ? (
                    <>
                      <FontAwesomeIcon
                        icon={faCloudUpload}
                        className="animate-pulse"
                      />
                      Uploading...
                    </>
                  ) : sendMessageMutation.isPending ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden lg:flex items-center justify-center bg-neutral-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  className="w-10 h-10 text-neutral-400"
                />
              </div>
              <h3 className="heading-3 text-neutral-900 mb-2">
                Select a conversation
              </h3>
              <p className="body-regular text-neutral-600">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}

        {/* Sidebar - Conversations List (RIGHT SIDE) */}
        <div className="w-full lg:w-[400px] bg-white flex flex-col border-l border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-3 text-neutral-900">Conversations</h2>
              {unreadData && unreadData.total_unread > 0 && (
                <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                  {unreadData.total_unread}
                </span>
              )}
            </div>

            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4"
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="w-12 h-12 text-neutral-300 mb-3"
                />
                <p className="text-neutral-600 font-medium">
                  No conversations found
                </p>
                {searchQuery && (
                  <p className="text-neutral-500 text-sm mt-1">
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation.id)}
                  className={`px-6 py-4 border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50 ${
                    selectedConversationId === conversation.id
                      ? "bg-primary-50 border-r-4 border-r-primary-600"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      {conversation.avatar ? (
                        <img
                          src={conversation.avatar}
                          alt={conversation.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full ${
                            conversation.type === "inquiry"
                              ? "bg-orange-500"
                              : conversation.color
                          } flex items-center justify-center text-white font-semibold`}
                        >
                          {conversation.initials}
                        </div>
                      )}
                      {conversation.type === "client" &&
                        conversation.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {conversation.name}
                        </h3>
                        <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                          {conversation.lastMessageTime}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 truncate mb-2">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        {conversation.unreadCount > 0 && (
                          <span className="bg-primary-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                            {conversation.unreadCount}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeColor(
                            conversation.type,
                          )} ml-auto`}
                        >
                          {getTypeBadge(conversation.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
