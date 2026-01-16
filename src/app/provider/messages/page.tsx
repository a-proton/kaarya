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
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

// ==================================================================================
// HELPER FUNCTIONS
// ==================================================================================

const mapConversationFromBackend = (conv: any): Conversation => {
  const name =
    conv.client_name_display || conv.service_provider_name || "Unknown";
  const avatar = conv.client_image || conv.service_provider_image || null;
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
    type: "client",
    avatar,
    lastMessage: conv.last_message?.text || "No messages yet",
    lastMessageTime: formatTime(conv.last_message_at || conv.created_at),
    unreadCount: 0,
    isOnline: Math.random() > 0.5,
    color,
    service_provider_name: conv.service_provider_name,
    service_provider_image: conv.service_provider_image,
    client_name_display: conv.client_name_display,
    client_image: conv.client_image,
    last_message: conv.last_message,
    last_message_at: conv.last_message_at,
    is_active: conv.is_active,
    created_at: conv.created_at,
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
  const [previewFile, setPreviewFile] = useState<{
    type: string;
    url: string;
    name: string;
  } | null>(null);
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
    refetchInterval: 5000, // Auto-refresh every 5 seconds
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
      // Sort messages by timestamp to ensure correct order (oldest first)
      const mappedMessages = response.results.map(mapMessageFromBackend);
      return mappedMessages.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    },
    enabled: !!selectedConversationId,
    refetchInterval: 3000, // Auto-refresh messages every 3 seconds
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
    mutationFn: async (data: MessageCreateData) => {
      if (!selectedConversationId) throw new Error("No conversation selected");
      return api.post(
        `/api/v1/messages/conversations/${selectedConversationId}/messages/send/`,
        data
      );
    },
    onSuccess: async () => {
      // Immediately refetch to get the actual message from server
      await queryClient.invalidateQueries({
        queryKey: ["messages", selectedConversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      setMessageInput("");
      setPreviewFile(null);
      setShowMediaPreview(false);
    },
    onError: (error: any) => {
      alert(
        `Failed to send message: ${
          error.data?.detail || error.message || "Unknown error"
        }`
      );
    },
  });

  const markConversationReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return api.post(
        `/api/v1/messages/conversations/${conversationId}/mark-read/`,
        {}
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
      file_url: previewFile?.url || undefined,
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    setPreviewFile({
      type: file.type,
      url: fileUrl,
      name: file.name,
    });
    setShowMediaPreview(true);
  };

  const cancelPreview = () => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
    setShowMediaPreview(false);
  };

  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversationId(conversationId);
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

  const getTypeBadge = (type: Conversation["type"]) => {
    if (type === "client") return "Client";
    return "Inquiry";
  };

  const getTypeBadgeColor = (type: Conversation["type"]) => {
    if (type === "client")
      return "bg-primary-50 text-primary-700 border-primary-200";
    return "bg-orange-50 text-orange-700 border-orange-200";
  };

  const filteredConversations = conversationsData.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentConversation = conversationsData.find(
    (c) => c.id === selectedConversationId
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
                      className={`w-10 h-10 rounded-full ${currentConversation?.color} flex items-center justify-center text-white font-semibold`}
                    >
                      {currentConversation?.initials}
                    </div>
                  )}
                  {currentConversation?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-900">
                    {currentConversation?.name}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {currentConversation?.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <FontAwesomeIcon
                  icon={faEllipsisVertical}
                  className="w-5 h-5 text-neutral-600"
                />
              </button>
            </div>

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
                    Start the conversation by sending a message
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
                        {/* Message Bubble */}
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
                                    className="max-w-full h-auto"
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

                          {/* Timestamp and Status */}
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {previewFile.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {previewFile.type.startsWith("image") ? "Image" : "Video"}
                    </p>
                  </div>
                  <button
                    onClick={cancelPreview}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
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
                {/* Attachment Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendMessageMutation.isPending}
                  className="p-2.5 hover:bg-neutral-50 rounded-lg transition-colors text-neutral-600 flex-shrink-0 disabled:opacity-50"
                  title="Add image or video"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                </button>

                {/* Text Input */}
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !sendMessageMutation.isPending
                      ) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular disabled:opacity-50 resize-none"
                    rows={1}
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={
                    sendMessageMutation.isPending ||
                    (!messageInput.trim() && !previewFile)
                  }
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                >
                  {sendMessageMutation.isPending ? (
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
          /* Empty State - No conversation selected */
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
          {/* Sidebar Header */}
          <div className="px-6 py-4 border-b border-neutral-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-3 text-neutral-900">Conversations</h2>
              {unreadData && unreadData.total_unread > 0 && (
                <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                  {unreadData.total_unread}
                </span>
              )}
            </div>

            {/* Search */}
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

          {/* Conversations List */}
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
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conversation.avatar ? (
                        <img
                          src={conversation.avatar}
                          alt={conversation.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full ${conversation.color} flex items-center justify-center text-white font-semibold`}
                        >
                          {conversation.initials}
                        </div>
                      )}
                      {conversation.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Content */}
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
                      <div className="flex items-center justify-between">
                        {conversation.unreadCount > 0 && (
                          <span className="bg-primary-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                            {conversation.unreadCount}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeColor(
                            conversation.type
                          )}`}
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
    </div>
  );
}
