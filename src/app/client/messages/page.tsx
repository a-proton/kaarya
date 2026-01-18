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
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
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
  sender_type: "client" | "service_provider";
  sender_name: string;
  sender_image: string | null;
  is_read: boolean;
}

interface Conversation {
  id: number;
  name: string;
  initials: string;
  avatar?: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  color: string;
  service_provider: {
    id: number;
    full_name: string;
    business_name?: string;
    profile_image?: string;
  };
  is_active: boolean;
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

export default function ClientMessagesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaPreviewFile | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ==================================================================================
  // DATA FETCHING
  // ==================================================================================

  // Fetch conversations
  const {
    data: conversationsData = [],
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useQuery({
    queryKey: ["client-conversations"],
    queryFn: async () => {
      if (!isAuthenticated()) {
        router.push("/login?type=client&session=expired");
        throw new Error("Not authenticated");
      }

      const response = await api.get<Conversation[]>(
        "/api/v1/messages/conversations/",
      );

      // Transform to match frontend format
      return response.map((conv: any) => {
        const providerName =
          conv.service_provider?.business_name ||
          conv.service_provider?.full_name ||
          "Provider";
        const initials = providerName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        const colors = [
          "bg-primary-600",
          "bg-secondary-600",
          "bg-purple-600",
          "bg-blue-600",
        ];

        return {
          id: conv.id,
          name: providerName,
          initials,
          avatar: conv.service_provider?.profile_image,
          lastMessage: conv.last_message?.message_text || "No messages yet",
          lastMessageTime: formatTime(conv.last_message_at || conv.created_at),
          unreadCount: 0, // Backend will provide this via annotation
          isOnline: false, // Can be enhanced with real-time status
          color: colors[conv.id % colors.length],
          service_provider: conv.service_provider,
          is_active: conv.is_active,
        };
      });
    },
    refetchInterval: 5000,
  });

  // Fetch messages for selected conversation
  const {
    data: messagesData = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ["client-messages", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];

      const response = await api.get<{ results: any[] }>(
        `/api/v1/messages/conversations/${selectedConversationId}/messages/`,
      );

      // Transform messages and sort by timestamp
      const messages = response.results.map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_type,
        content: msg.message_text || "",
        timestamp: msg.created_at,
        type: msg.message_type || "text",
        mediaUrl: msg.file_url,
        fileName: null,
        status: msg.is_read ? "read" : "delivered",
        sender_type: msg.sender_type,
        sender_name: msg.sender_name,
        sender_image: msg.sender_image,
        is_read: msg.is_read,
      }));

      return messages.sort(
        (a: Message, b: Message) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
    },
    enabled: !!selectedConversationId,
    refetchInterval: 3000,
  });

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      messageText: string;
      previewFile: MediaPreviewFile | null;
    }) => {
      if (!selectedConversationId) throw new Error("No conversation selected");

      let messageData: any = {
        message_text: data.messageText,
        message_type: "text",
      };

      // Upload media to Supabase if there's a file
      if (data.previewFile) {
        setIsUploadingMedia(true);
        setPreviewFile((prev) =>
          prev ? { ...prev, uploadStatus: "uploading" } : null,
        );

        try {
          const uploadResult = await uploadMessageMedia(data.previewFile.file, {
            folder: `messages/${selectedConversationId}`,
          });

          if (uploadResult.success && uploadResult.publicUrl) {
            setPreviewFile((prev) =>
              prev
                ? {
                    ...prev,
                    uploadStatus: "uploaded",
                    uploadedUrl: uploadResult.publicUrl,
                  }
                : null,
            );

            messageData.file_url = uploadResult.publicUrl;
            messageData.message_type = data.previewFile.type.startsWith("image")
              ? "image"
              : "video";
          } else {
            throw new Error(uploadResult.error || "Upload failed");
          }
        } catch (error) {
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
          throw error;
        }

        setIsUploadingMedia(false);
      }

      // Send message to backend
      return api.post(
        `/api/v1/messages/conversations/${selectedConversationId}/messages/send/`,
        messageData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["client-messages", selectedConversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["client-conversations"] });
      setMessageInput("");
      setPreviewFile(null);
      setShowMediaPreview(false);
    },
    onError: (error: any) => {
      setIsUploadingMedia(false);
      alert(`Failed to send message: ${error.message || "Unknown error"}`);
    },
  });

  // Mark conversation as read
  const markReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return api.post(
        `/api/v1/messages/conversations/${conversationId}/mark-read/`,
        {},
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-conversations"] });
    },
  });

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  const handleSendMessage = () => {
    if (!messageInput.trim() && !previewFile) return;

    sendMessageMutation.mutate({
      messageText: messageInput.trim(),
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
      alert(`File is too large. Maximum size is ${isVideo ? 100 : 5}MB`);
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
    markReadMutation.mutate(conversationId);
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

  const filteredConversations = conversationsData.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentConversation = conversationsData.find(
    (c) => c.id === selectedConversationId,
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

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
            Failed to load your conversations.
          </p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["client-conversations"],
              })
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

        {/* Main Chat Area */}
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
              ) : messagesData.length === 0 ? (
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
                  {messagesData.map((message) => {
                    const isMine = message.sender_type === "client";
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] ${isMine ? "items-end" : "items-start"}`}
                        >
                          {message.type === "text" && (
                            <div
                              className={`px-4 py-2.5 rounded-2xl ${isMine ? "bg-primary-600 text-white rounded-br-sm" : "bg-neutral-100 text-neutral-900 rounded-bl-sm"}`}
                            >
                              <p className="body-regular whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                          )}

                          {message.type === "image" && (
                            <div
                              className={`rounded-2xl overflow-hidden ${isMine ? "rounded-br-sm" : "rounded-bl-sm"}`}
                            >
                              {message.content && (
                                <div
                                  className={`px-4 py-2.5 ${isMine ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-900"}`}
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
                              className={`rounded-2xl overflow-hidden ${isMine ? "rounded-br-sm" : "rounded-bl-sm"}`}
                            >
                              {message.content && (
                                <div
                                  className={`px-4 py-2.5 ${isMine ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-900"}`}
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
                            className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}
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
                    placeholder="Type a message..."
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

        {/* Sidebar - Conversations List */}
        <div className="w-full lg:w-[400px] bg-white flex flex-col border-l border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex-shrink-0">
            <h2 className="heading-3 text-neutral-900 mb-4">
              Your Service Providers
            </h2>
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4"
              />
              <input
                type="text"
                placeholder="Search..."
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
                  className={`px-6 py-4 border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50 ${selectedConversationId === conversation.id ? "bg-primary-50 border-r-4 border-r-primary-600" : ""}`}
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
                          className={`w-12 h-12 rounded-full ${conversation.color} flex items-center justify-center text-white font-semibold`}
                        >
                          {conversation.initials}
                        </div>
                      )}
                      {conversation.isOnline && (
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
                      <p className="text-sm text-neutral-600 truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-block mt-2 bg-primary-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                          {conversation.unreadCount}
                        </span>
                      )}
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
