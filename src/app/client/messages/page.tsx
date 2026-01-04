"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faPaperPlane,
  faImage,
  faFile,
  faTimes,
  faDownload,
  faCheck,
  faCheckDouble,
  faCircle,
  faUser,
  faEllipsisV,
  faPaperclip,
  faSmile,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  sender: "client" | "provider";
  content: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  type: "image" | "file";
  url: string;
  size?: string;
}

export default function ClientMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "provider",
      content:
        "Hi John! I wanted to update you on the kitchen remodel progress. We've completed the electrical wiring and the inspector approved everything.",
      timestamp: new Date(Date.now() - 3600000 * 2),
      status: "read",
    },
    {
      id: "2",
      sender: "client",
      content:
        "That's great news! When do you think you'll start on the cabinets?",
      timestamp: new Date(Date.now() - 3600000 * 1.5),
      status: "read",
    },
    {
      id: "3",
      sender: "provider",
      content:
        "We'll begin cabinet installation tomorrow morning. I've attached some photos of the electrical work we completed today.",
      timestamp: new Date(Date.now() - 3600000),
      status: "read",
      attachments: [
        {
          id: "a1",
          name: "electrical_wiring_1.jpg",
          type: "image",
          url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
        },
        {
          id: "a2",
          name: "electrical_wiring_2.jpg",
          type: "image",
          url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
        },
      ],
    },
    {
      id: "4",
      sender: "client",
      content:
        "Perfect! The wiring looks professional. Thanks for keeping me updated.",
      timestamp: new Date(Date.now() - 1800000),
      status: "read",
    },
    {
      id: "5",
      sender: "provider",
      content:
        "You're welcome! I'll send you progress photos as we work on the cabinets.",
      timestamp: new Date(Date.now() - 900000),
      status: "read",
    },
  ]);

  const [messageInput, setMessageInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Provider info
  const provider = {
    name: "Michael Rodriguez",
    initials: "MR",
    role: "Licensed Electrician",
    status: "online",
    lastSeen: "Active now",
    phone: "+1 (555) 123-4567",
    projects: ["Kitchen Remodel", "Bathroom Renovation"],
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && attachments.length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "client",
      content: messageInput,
      timestamp: new Date(),
      status: "sent",
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");
    setAttachments([]);

    // Simulate message delivery
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg
        )
      );
    }, 1000);

    // Simulate message read
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "read" } : msg
        )
      );
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const fileType = file.type.startsWith("image/") ? "image" : "file";
      const preview = URL.createObjectURL(file);

      const newAttachment: Attachment = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: fileType,
        url: preview,
        size: formatFileSize(file.size),
      };

      setAttachments((prev) => [...prev, newAttachment]);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatMessageDate = (date: Date): string => {
    const now = new Date();
    const messageDate = new Date(date);

    if (
      messageDate.getDate() === now.getDate() &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getFullYear() === now.getFullYear()
    ) {
      return "Today";
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday";
    }

    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sent":
        return <FontAwesomeIcon icon={faCheck} className="text-neutral-400" />;
      case "delivered":
        return (
          <FontAwesomeIcon icon={faCheckDouble} className="text-neutral-400" />
        );
      case "read":
        return (
          <FontAwesomeIcon icon={faCheckDouble} className="text-primary-600" />
        );
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-neutral-0 font-semibold text-lg">
                {provider.initials}
              </div>
              {provider.status === "online" && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-neutral-0 rounded-full"></div>
              )}
            </div>
            <div>
              <h1 className="heading-4 text-neutral-900">{provider.name}</h1>
              <div className="flex items-center gap-2">
                <p className="text-neutral-600 text-sm">{provider.role}</p>
                <span className="text-neutral-400">•</span>
                <p className="text-neutral-500 text-sm flex items-center gap-1">
                  {provider.status === "online" ? (
                    <>
                      <FontAwesomeIcon
                        icon={faCircle}
                        className="text-green-500 text-xs"
                      />
                      {provider.lastSeen}
                    </>
                  ) : (
                    provider.lastSeen
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-3 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              title="More options"
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-6">
                <div className="px-4 py-1.5 bg-neutral-200 rounded-full">
                  <p className="text-neutral-600 text-xs font-medium">{date}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                {dateMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${
                      message.sender === "client"
                        ? "flex-row-reverse"
                        : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    {message.sender === "provider" && (
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-neutral-0 font-semibold text-sm flex-shrink-0">
                        {provider.initials}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[70%] ${
                        message.sender === "client"
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      {/* Message Content */}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.sender === "client"
                            ? "bg-primary-600 text-neutral-0"
                            : "bg-neutral-0 border border-neutral-200 text-neutral-900"
                        }`}
                      >
                        <p className="body-regular leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>

                        {/* Attachments */}
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.attachments.map((attachment) => (
                                <div key={attachment.id}>
                                  {attachment.type === "image" ? (
                                    <div className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="w-full max-w-xs"
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`flex items-center gap-3 p-3 rounded-lg ${
                                        message.sender === "client"
                                          ? "bg-primary-700"
                                          : "bg-neutral-50"
                                      }`}
                                    >
                                      <FontAwesomeIcon
                                        icon={faFile}
                                        className={`text-xl ${
                                          message.sender === "client"
                                            ? "text-neutral-0"
                                            : "text-neutral-600"
                                        }`}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={`text-sm font-medium truncate ${
                                            message.sender === "client"
                                              ? "text-neutral-0"
                                              : "text-neutral-900"
                                          }`}
                                        >
                                          {attachment.name}
                                        </p>
                                        {attachment.size && (
                                          <p
                                            className={`text-xs ${
                                              message.sender === "client"
                                                ? "text-neutral-200"
                                                : "text-neutral-500"
                                            }`}
                                          >
                                            {attachment.size}
                                          </p>
                                        )}
                                      </div>
                                      <button
                                        className={`p-2 rounded-lg transition-colors ${
                                          message.sender === "client"
                                            ? "hover:bg-primary-600 text-neutral-0"
                                            : "hover:bg-neutral-100 text-neutral-600"
                                        }`}
                                      >
                                        <FontAwesomeIcon icon={faDownload} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>

                      {/* Message Info */}
                      <div
                        className={`flex items-center gap-1 mt-1 px-2 ${
                          message.sender === "client"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <p className="text-neutral-500 text-xs">
                          {formatTime(message.timestamp)}
                        </p>
                        {message.sender === "client" && (
                          <span className="text-xs">
                            {getStatusIcon(message.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-neutral-0 font-semibold text-sm flex-shrink-0">
                {provider.initials}
              </div>
              <div className="bg-neutral-0 border border-neutral-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-neutral-0 border-t border-neutral-200 px-6 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="mb-4 flex gap-3 flex-wrap">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative group bg-neutral-100 rounded-lg overflow-hidden"
                >
                  {attachment.type === "image" ? (
                    <div className="w-20 h-20">
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faFile}
                        className="text-2xl text-neutral-600"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-neutral-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
              title="Attach file"
            >
              <FontAwesomeIcon icon={faPaperclip} className="text-xl" />
            </button>

            <div className="flex-1 relative">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-neutral-100 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none max-h-32"
                style={{
                  minHeight: "48px",
                  height: "auto",
                }}
              />
              <button
                type="button"
                className="absolute right-3 bottom-3 text-neutral-400 hover:text-neutral-600 transition-colors"
                title="Add emoji"
              >
                <FontAwesomeIcon icon={faSmile} />
              </button>
            </div>

            <button
              type="submit"
              disabled={!messageInput.trim() && attachments.length === 0}
              className="p-3 bg-primary-600 text-neutral-0 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Send message"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-xl" />
            </button>
          </form>

          <p className="text-neutral-400 text-xs mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
