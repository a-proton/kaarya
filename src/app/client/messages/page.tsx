"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPaperPlane,
  faImage,
  faVideo,
  faCheck,
  faCheckDouble,
  faTimes,
  faPlus,
  faSpinner,
  faExclamationTriangle,
  faCloudUpload,
  faEllipsisVertical,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { uploadMessageMedia } from "@/lib/storageService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  senderId: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "video" | "file";
  mediaUrl?: string | null;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#1ab189",
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];

const formatTime = (d: string) => {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000),
    h = Math.floor(diff / 3600000),
    dy = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy < 7) return `${dy}d ago`;
  return new Date(d).toLocaleDateString();
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientMessagesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaPreviewFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // ── Conversations ──
  const {
    data: convs = [],
    isLoading: convsLoading,
    isError: convsError,
  } = useQuery<Conversation[]>({
    queryKey: ["client-conversations"],
    queryFn: async () => {
      if (!isAuthenticated()) {
        router.push("/login?type=client&session=expired");
        throw new Error("Not authenticated");
      }
      const res = await api.get<Record<string, unknown>[]>(
        "/api/v1/messages/conversations/",
      );
      return res.map((c) => {
        const sp = c.service_provider as {
          business_name?: string;
          full_name?: string;
          profile_image?: string;
        } | null;
        const name = sp?.business_name || sp?.full_name || "Provider";
        const id = c.id as number;
        return {
          id,
          name,
          initials: name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          avatar: sp?.profile_image || null,
          lastMessage:
            (c.last_message as { message_text?: string } | null)
              ?.message_text || "No messages yet",
          lastMessageTime: formatTime(
            (c.last_message_at as string) || (c.created_at as string),
          ),
          unreadCount: 0,
          isOnline: false,
          color: AVATAR_COLORS[id % AVATAR_COLORS.length],
          service_provider:
            c.service_provider as Conversation["service_provider"],
          is_active: (c.is_active as boolean) ?? true,
        };
      });
    },
    refetchInterval: 5000,
  });

  // ── Messages ──
  const {
    data: msgs,
    isLoading: msgsLoading,
    isError: msgsError,
  } = useQuery<Message[]>({
    queryKey: ["client-messages", selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const res = await api.get<{ results: Record<string, unknown>[] }>(
        `/api/v1/messages/conversations/${selectedId}/messages/`,
      );
      return (res.results || [])
        .map((m) => ({
          id: m.id as number,
          senderId: m.sender_type as string,
          content: (m.message_text as string) || "",
          timestamp: m.created_at as string,
          type: (m.message_type as Message["type"]) || "text",
          mediaUrl: m.file_url as string | null,
          status: (m.is_read as boolean)
            ? "read"
            : ("delivered" as Message["status"]),
          sender_type: m.sender_type as "client" | "service_provider",
          sender_name: m.sender_name as string,
          sender_image: (m.sender_image as string | null) || null,
          is_read: (m.is_read as boolean) || false,
        }))
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
    },
    enabled: !!selectedId,
    refetchInterval: 3000,
  });

  // ── Send ──
  const sendMutation = useMutation({
    mutationFn: async ({
      text,
      file,
    }: {
      text: string;
      file: MediaPreviewFile | null;
    }) => {
      if (!selectedId) throw new Error("No conversation selected");
      const payload: Record<string, unknown> = {
        message_text: text,
        message_type: "text",
      };
      if (file) {
        setUploading(true);
        setPreviewFile((p) => (p ? { ...p, uploadStatus: "uploading" } : null));
        try {
          const r = await uploadMessageMedia(file.file, {
            folder: `messages/${selectedId}`,
          });
          if (r.success && r.publicUrl) {
            setPreviewFile((p) =>
              p
                ? { ...p, uploadStatus: "uploaded", uploadedUrl: r.publicUrl }
                : null,
            );
            payload.file_url = r.publicUrl;
            payload.message_type = file.type.startsWith("image")
              ? "image"
              : "video";
          } else throw new Error(r.error || "Upload failed");
        } catch (e) {
          setPreviewFile((p) =>
            p
              ? {
                  ...p,
                  uploadStatus: "failed",
                  error: e instanceof Error ? e.message : "Upload failed",
                }
              : null,
          );
          setUploading(false);
          throw e;
        }
        setUploading(false);
      }
      return api.post(
        `/api/v1/messages/conversations/${selectedId}/messages/send/`,
        payload,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["client-messages", selectedId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-conversations"],
      });
      setInput("");
      setPreviewFile(null);
      setShowPreview(false);
      setUploading(false);
    },
    onError: (e: unknown) => {
      setUploading(false);
      alert(
        `Failed to send: ${(e as { message?: string }).message ?? "Unknown error"}`,
      );
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/v1/messages/conversations/${id}/mark-read/`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["client-conversations"] }),
  });

  // ── Handlers ──
  const handleSend = () => {
    if (!input.trim() && !previewFile) return;
    sendMutation.mutate({ text: input.trim(), file: previewFile });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isImg = f.type.startsWith("image/"),
      isVid = f.type.startsWith("video/");
    if (!isImg && !isVid) {
      alert("Select an image or video file");
      return;
    }
    if (f.size > (isVid ? 100 : 5) * 1024 * 1024) {
      alert(`Max ${isVid ? "100" : "5"}MB`);
      return;
    }
    setPreviewFile({
      file: f,
      type: f.type,
      url: URL.createObjectURL(f),
      name: f.name,
      uploadStatus: "pending",
    });
    setShowPreview(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const cancelPreview = () => {
    if (previewFile) URL.revokeObjectURL(previewFile.url);
    setPreviewFile(null);
    setShowPreview(false);
    setUploading(false);
  };
  const selectConv = (id: number) => {
    setSelectedId(id);
    const c = convs.find((x) => x.id === id);
    if (c?.unreadCount) markReadMutation.mutate(id);
  };

  const msgStatus = (s: Message["status"]) => {
    if (s === "sent")
      return (
        <FontAwesomeIcon
          icon={faCheck}
          style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.6)" }}
        />
      );
    if (s === "delivered")
      return (
        <FontAwesomeIcon
          icon={faCheckDouble}
          style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.6)" }}
        />
      );
    return (
      <FontAwesomeIcon
        icon={faCheckDouble}
        style={{ fontSize: "0.6rem", color: "#93c5fd" }}
      />
    );
  };

  const messages = msgs ?? [];
  const currentConv = convs.find((c) => c.id === selectedId);
  const filteredConvs = convs.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── States ──
  if (convsLoading)
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

  if (convsError)
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center max-w-sm px-6">
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
            style={{ fontSize: "1.125rem", color: "var(--color-neutral-900)" }}
          >
            Error Loading Conversations
          </h2>
          <p
            className="mb-5"
            style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}
          >
            Failed to load your conversations.
          </p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["client-conversations"],
              })
            }
            className="btn btn-primary btn-md"
          >
            Retry
          </button>
        </div>
      </div>
    );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: "100vh", backgroundColor: "var(--color-neutral-50)" }}
    >
      <style>{`
        .animate-spin  { animation: spin 1s linear infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(.4,0,.6,1) infinite; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
      `}</style>

      {/* Upload toast */}
      {uploading && (
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
              className="w-8 h-8 rounded-full flex items-center justify-center"
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
        {/* ── Chat area ── */}
        {selectedId ? (
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              borderRight: "1px solid var(--color-neutral-200)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  {currentConv?.avatar ? (
                    <img
                      src={currentConv.avatar}
                      alt={currentConv.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                      style={{
                        backgroundColor: currentConv?.color ?? "#1ab189",
                        color: "white",
                        fontSize: "0.875rem",
                      }}
                    >
                      {currentConv?.initials}
                    </div>
                  )}
                  {currentConv?.isOnline && (
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
                  <h2
                    className="font-semibold"
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {currentConv?.name}
                  </h2>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    {currentConv?.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  color: "var(--color-neutral-500)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--color-neutral-100)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                }}
              >
                <FontAwesomeIcon
                  icon={faEllipsisVertical}
                  style={{ fontSize: "1.125rem" }}
                />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ padding: "1.25rem 1.5rem" }}
            >
              {msgsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin"
                    style={{ fontSize: "2rem", color: "#1ab189" }}
                  />
                </div>
              ) : msgsError ? (
                <div className="flex items-center justify-center h-full">
                  <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>
                    Failed to load messages
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                  >
                    <FontAwesomeIcon
                      icon={faPaperPlane}
                      style={{ fontSize: "1.5rem", color: "#1ab189" }}
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
                    Start the conversation by sending a message
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {messages.map((msg) => {
                    const mine = msg.sender_type === "client";
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          justifyContent: mine ? "flex-end" : "flex-start",
                        }}
                      >
                        <div style={{ maxWidth: "70%" }}>
                          {msg.type === "text" && (
                            <div
                              style={{
                                padding: "0.625rem 1rem",
                                borderRadius: "1rem",
                                borderBottomRightRadius: mine
                                  ? "0.25rem"
                                  : "1rem",
                                borderBottomLeftRadius: mine
                                  ? "1rem"
                                  : "0.25rem",
                                backgroundColor: mine
                                  ? "#1ab189"
                                  : "var(--color-neutral-100)",
                                color: mine
                                  ? "white"
                                  : "var(--color-neutral-900)",
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {msg.content}
                            </div>
                          )}
                          {msg.type === "image" && (
                            <div
                              style={{
                                borderRadius: "1rem",
                                overflow: "hidden",
                                borderBottomRightRadius: mine
                                  ? "0.25rem"
                                  : "1rem",
                                borderBottomLeftRadius: mine
                                  ? "1rem"
                                  : "0.25rem",
                              }}
                            >
                              {msg.content && (
                                <div
                                  style={{
                                    padding: "0.5rem 1rem",
                                    backgroundColor: mine
                                      ? "#1ab189"
                                      : "var(--color-neutral-100)",
                                    color: mine
                                      ? "white"
                                      : "var(--color-neutral-900)",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {msg.content}
                                </div>
                              )}
                              {msg.mediaUrl ? (
                                <img
                                  src={msg.mediaUrl}
                                  alt="Shared image"
                                  style={{
                                    display: "block",
                                    maxWidth: "100%",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    window.open(msg.mediaUrl!, "_blank")
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
                                  style={{
                                    width: 256,
                                    height: 192,
                                    backgroundColor: "var(--color-neutral-200)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
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
                          {msg.type === "video" && (
                            <div
                              style={{
                                borderRadius: "1rem",
                                overflow: "hidden",
                                borderBottomRightRadius: mine
                                  ? "0.25rem"
                                  : "1rem",
                                borderBottomLeftRadius: mine
                                  ? "1rem"
                                  : "0.25rem",
                              }}
                            >
                              {msg.content && (
                                <div
                                  style={{
                                    padding: "0.5rem 1rem",
                                    backgroundColor: mine
                                      ? "#1ab189"
                                      : "var(--color-neutral-100)",
                                    color: mine
                                      ? "white"
                                      : "var(--color-neutral-900)",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {msg.content}
                                </div>
                              )}
                              <video
                                src={msg.mediaUrl ?? ""}
                                controls
                                style={{ maxWidth: "100%", display: "block" }}
                              />
                            </div>
                          )}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              marginTop: "0.25rem",
                              justifyContent: mine ? "flex-end" : "flex-start",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.65rem",
                                color: "var(--color-neutral-400)",
                              }}
                            >
                              {formatTime(msg.timestamp)}
                            </span>
                            {mine && msgStatus(msg.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Media preview bar */}
            {showPreview && previewFile && (
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
                  <div className="relative flex-shrink-0">
                    {previewFile.type.startsWith("image") ? (
                      <img
                        src={previewFile.url}
                        alt="Preview"
                        className="rounded-lg object-cover"
                        style={{ width: 48, height: 48 }}
                      />
                    ) : (
                      <div
                        className="rounded-lg flex items-center justify-center"
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: "var(--color-neutral-100)",
                        }}
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
                    disabled={uploading}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: uploading ? "not-allowed" : "pointer",
                      padding: "0.375rem",
                      color: "var(--color-neutral-500)",
                      opacity: uploading ? 0.4 : 1,
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

            {/* Input */}
            <div
              className="flex-shrink-0 flex items-end gap-3"
              style={{
                padding: "0.875rem 1.5rem",
                borderTop: "1px solid var(--color-neutral-200)",
                backgroundColor: "var(--color-neutral-0)",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFile}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={sendMutation.isPending || uploading}
                title="Attach"
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
                  opacity: sendMutation.isPending || uploading ? 0.4 : 1,
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
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !sendMutation.isPending &&
                    !uploading
                  ) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={sendMutation.isPending || uploading}
                placeholder="Type a message…"
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
                  opacity: sendMutation.isPending || uploading ? 0.6 : 1,
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
              <button
                onClick={handleSend}
                disabled={
                  sendMutation.isPending ||
                  uploading ||
                  (!input.trim() && !previewFile)
                }
                className="flex items-center gap-2 font-semibold rounded-xl flex-shrink-0"
                style={{
                  padding: "0.625rem 1.25rem",
                  backgroundColor: "#1ab189",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  opacity:
                    sendMutation.isPending ||
                    uploading ||
                    (!input.trim() && !previewFile)
                      ? 0.5
                      : 1,
                  transition: "opacity 150ms, background-color 150ms",
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
                {uploading ? (
                  <>
                    <FontAwesomeIcon
                      icon={faCloudUpload}
                      className="animate-pulse"
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    Uploading…
                  </>
                ) : sendMutation.isPending ? (
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
              Choose a provider from the list to start messaging
            </p>
          </div>
        )}

        {/* ── Sidebar ── */}
        <div
          className="flex flex-col overflow-hidden flex-shrink-0"
          style={{
            width: "clamp(20rem, 26rem, 28rem)",
            backgroundColor: "var(--color-neutral-0)",
            borderLeft: "1px solid var(--color-neutral-200)",
          }}
        >
          <div
            className="flex-shrink-0"
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--color-neutral-200)",
            }}
          >
            <h2
              className="font-bold mb-4"
              style={{
                fontSize: "1.125rem",
                color: "var(--color-neutral-900)",
              }}
            >
              Your Service Providers
            </h2>
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
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
                {search && (
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
              filteredConvs.map((conv) => {
                const sel = selectedId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConv(conv.id)}
                    style={{
                      padding: "0.875rem 1.25rem",
                      borderBottom: "1px solid var(--color-neutral-100)",
                      cursor: "pointer",
                      backgroundColor: sel
                        ? "rgba(26,177,137,0.06)"
                        : "transparent",
                      borderRight: sel
                        ? "3px solid #1ab189"
                        : "3px solid transparent",
                      transition: "background-color 120ms",
                    }}
                    onMouseEnter={(e) => {
                      if (!sel)
                        (
                          e.currentTarget as HTMLDivElement
                        ).style.backgroundColor = "var(--color-neutral-50)";
                    }}
                    onMouseLeave={(e) => {
                      if (!sel)
                        (
                          e.currentTarget as HTMLDivElement
                        ).style.backgroundColor = "transparent";
                    }}
                  >
                    <div className="flex items-start gap-3">
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
                              backgroundColor: conv.color,
                              color: "white",
                              fontSize: "0.875rem",
                            }}
                          >
                            {conv.initials}
                          </div>
                        )}
                        {conv.isOnline && (
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
                        <p
                          className="truncate mb-2"
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--color-neutral-500)",
                          }}
                        >
                          {conv.lastMessage}
                        </p>
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
                              backgroundColor: "rgba(26,177,137,0.08)",
                              border: "1px solid rgba(26,177,137,0.25)",
                              color: "#1ab189",
                            }}
                          >
                            Service Provider
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
