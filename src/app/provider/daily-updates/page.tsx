"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faCalendar,
  faImage,
  faVideo,
  faFileAlt,
  faTimes,
  faPaperPlane,
  faPlus,
  faChevronDown,
  faArrowLeft,
  faBriefcase,
  faCheck,
  faSpinner,
  faEye,
  faPenToSquare,
  faTrash,
  faFilter,
  faClock,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

interface Client {
  id: number;
  full_name: string;
  user_email: string;
}

interface Project {
  id: number;
  project_name: string;
  client: Client | null;
  start_date: string;
  expected_end_date: string;
}

interface MediaFile {
  id: string;
  file: File;
  type: "image" | "video";
  preview: string;
}

interface ApiUpdate {
  id: number;
  update_text: string;
  work_hours: string;
  posted_by_name: string;
  milestone: number | null;
  media: any[];
  created_at: string;
}

interface DailyUpdate extends ApiUpdate {
  project_id: number;
  project_name?: string;
  client_name?: string;
  title?: string;
  status?: "completed" | "in-progress" | "blocked";
}

interface UpdateFormData {
  project: string;
  title: string;
  content: string;
  status: "completed" | "in-progress" | "blocked";
  work_hours: string;
}

// Custom API function for FormData uploads
async function uploadUpdateWithMedia(
  projectId: string,
  formData: FormData
): Promise<any> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/updates/create/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // DO NOT set Content-Type - browser will set it with boundary
      },
      body: formData,
      credentials: "include",
    }
  );

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: `HTTP ${response.status} Error` };
    }

    // Extract error message
    let errorMessage = "Failed to create update";
    if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (errorData.error) {
      errorMessage = errorData.error;
    } else if (typeof errorData === "object") {
      // Handle field-specific errors
      const fieldErrors = Object.entries(errorData)
        .map(([field, messages]) => {
          const msgArray = Array.isArray(messages) ? messages : [messages];
          return `${field}: ${msgArray.join(", ")}`;
        })
        .join("\n");
      if (fieldErrors) errorMessage = fieldErrors;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// Custom API function for DELETE requests
async function deleteUpdate(
  projectId: number,
  updateId: number
): Promise<void> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/updates/${updateId}/delete/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: `HTTP ${response.status} Error` };
    }
    throw new Error(
      errorData.detail || errorData.error || "Failed to delete update"
    );
  }
}

// Custom API function for GET requests
async function fetchProjects(): Promise<{ results: Project[] }> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/projects/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }

  return response.json();
}

async function fetchProjectUpdates(
  projectId: number
): Promise<{ results: ApiUpdate[] }> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/updates/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch updates for project ${projectId}`);
  }

  return response.json();
}

export default function DailyUpdatesPage() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [updateDate, setUpdateDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [updateTitle, setUpdateTitle] = useState<string>("");
  const [updateContent, setUpdateContent] = useState<string>("");
  const [workHours, setWorkHours] = useState<string>("");
  const [updateStatus, setUpdateStatus] = useState<
    "completed" | "in-progress" | "blocked"
  >("completed");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [viewingUpdate, setViewingUpdate] = useState<DailyUpdate | null>(null);
  const [editingUpdate, setEditingUpdate] = useState<DailyUpdate | null>(null);
  const [filterProject, setFilterProject] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  // Fetch all updates from all projects
  const {
    data: allUpdatesData,
    isLoading: updatesLoading,
    isError,
  } = useQuery({
    queryKey: ["all-daily-updates"],
    queryFn: async () => {
      let projects: Project[] = [];
      if (projectsData && Array.isArray(projectsData.results)) {
        projects = projectsData.results;
      } else {
        const projRes = await fetchProjects();
        projects = projRes.results || [];
      }

      if (projects.length === 0) return [];

      const updatesPromises = projects.map(async (project) => {
        try {
          const res = await fetchProjectUpdates(project.id);
          const results = res.results || [];
          return results.map((update) => ({
            ...update,
            project_id: project.id,
            project_name: project.project_name,
            client_name: project.client?.full_name || "Unassigned",
            // Extract title from first line of update_text
            title: update.update_text.split("\n")[0].substring(0, 100),
            // Infer status from work_hours (you can adjust this logic)
            status:
              parseFloat(update.work_hours) > 0 ? "completed" : "in-progress",
          }));
        } catch (err) {
          console.error(
            `Error fetching updates for project ${project.id}:`,
            err
          );
          return [];
        }
      });

      const updatesArrays = await Promise.all(updatesPromises);
      return updatesArrays.flat();
    },
    enabled: true,
  });

  const createUpdateMutation = useMutation({
    mutationFn: async (data: UpdateFormData & { media: MediaFile[] }) => {
      const formData = new FormData();

      // Add update text (title + content combined)
      formData.append("update_text", `${data.title}\n\n${data.content}`);

      // Add work hours (backend expects decimal, default to 0 if empty)
      const hours = data.work_hours.trim();
      formData.append("work_hours", hours || "0");

      // Add media files - backend expects files named 'media_files'
      // Based on your Django model, it should accept multiple files
      data.media.forEach((media) => {
        formData.append("media_files", media.file, media.file.name);
      });

      // Log FormData contents for debugging
      console.log("📤 Sending FormData:");
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(
            `${key}: File(${value.name}, ${value.size} bytes, ${value.type})`
          );
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      return uploadUpdateWithMedia(data.project, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-daily-updates"] });
      showSuccessNotification("Update posted successfully!");
      resetForm();
    },
    onError: (error: Error) => {
      console.error("❌ Create update error:", error);
      alert(error.message || "Failed to post update");
    },
  });

  // Delete update mutation
  const deleteUpdateMutation = useMutation({
    mutationFn: async ({
      projectId,
      updateId,
    }: {
      projectId: number;
      updateId: number;
    }) => {
      await deleteUpdate(projectId, updateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-daily-updates"] });
      showSuccessNotification("Update deleted successfully!");
      setViewingUpdate(null);
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to delete update");
    },
  });

  const projects = projectsData?.results || [];
  const dailyUpdates = Array.isArray(allUpdatesData) ? allUpdatesData : [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: MediaFile[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        alert(`File ${file.name} is not a valid image or video`);
        return;
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 50MB`);
        return;
      }

      const fileType = isImage ? "image" : "video";
      const preview = URL.createObjectURL(file);

      const newMedia: MediaFile = {
        id: Date.now().toString() + Math.random(),
        file,
        type: fileType,
        preview,
      };

      newFiles.push(newMedia);
    });

    setMediaFiles((prev) => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeMedia = (id: string) => {
    setMediaFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedProject) {
      alert("Please select a project");
      return;
    }

    if (!updateTitle.trim()) {
      alert("Please add a title");
      return;
    }

    if (!updateContent.trim()) {
      alert("Please add update content");
      return;
    }

    setIsSubmitting(true);

    try {
      await createUpdateMutation.mutateAsync({
        project: selectedProject,
        title: updateTitle,
        content: updateContent,
        status: updateStatus,
        work_hours: workHours,
        media: mediaFiles,
      });
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUpdateTitle("");
    setUpdateContent("");
    setUpdateStatus("completed");
    setWorkHours("");
    mediaFiles.forEach((media) => URL.revokeObjectURL(media.preview));
    setMediaFiles([]);
    setSelectedProject("");
    setUpdateDate(new Date().toISOString().split("T")[0]);
    setEditingUpdate(null);
  };

  const showSuccessNotification = (message: string) => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleViewUpdate = (update: DailyUpdate) => {
    setViewingUpdate(update);
  };

  const handleDeleteUpdate = (update: DailyUpdate) => {
    if (confirm("Are you sure you want to delete this update?")) {
      deleteUpdateMutation.mutate({
        projectId: update.project_id,
        updateId: update.id,
      });
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const selectedProjectData = projects.find(
    (p) => p.id.toString() === selectedProject
  );

  const filteredUpdates =
    filterProject === "all"
      ? dailyUpdates
      : dailyUpdates.filter(
          (update) => update.project_id.toString() === filterProject
        );

  const isLoading = projectsLoading || updatesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading updates...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTimes} className="text-red-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Updates
          </h3>
          <p className="text-red-700 mb-4">Failed to load daily updates</p>
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

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
            aria-label="Go back"
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="text-neutral-600 text-lg"
            />
          </button>
          <div>
            <h1 className="heading-2 text-neutral-900 flex items-center gap-3">
              <FontAwesomeIcon
                icon={faClipboardList}
                className="text-primary-600"
              />
              Daily Updates
            </h1>
            <p className="text-neutral-600 body-regular mt-1">
              Post progress updates with photos and videos
            </p>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-8 right-8 z-50 animate-slide-in-right">
          <div className="bg-green-600 text-neutral-0 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} />
            </div>
            <div>
              <p className="font-semibold">Update Posted Successfully!</p>
              <p className="text-green-100 text-sm">
                Your daily update has been saved
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 max-w-5xl mx-auto">
        {/* Editing Banner */}
        {editingUpdate && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={faPenToSquare}
                className="text-yellow-600 text-xl"
              />
              <div>
                <p className="font-semibold text-yellow-900">Editing Update</p>
                <p className="text-yellow-700 text-sm">
                  Make your changes and click "Update" to save
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-yellow-600 text-neutral-0 rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
            >
              Cancel Edit
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Selection & Work Hours Card */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Selection */}
              <div>
                <label
                  htmlFor="project"
                  className="block text-neutral-700 font-semibold mb-3 body-small flex items-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={faBriefcase}
                    className="text-primary-600"
                  />
                  Select Project <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="project"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    required
                    className="w-full appearance-none px-4 py-3.5 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                  >
                    <option value="">Choose a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_name} -{" "}
                        {project.client?.full_name || "No client"}
                      </option>
                    ))}
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  />
                </div>
                {selectedProjectData && (
                  <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <p className="text-primary-700 text-sm">
                      <span className="font-semibold">Client:</span>{" "}
                      {selectedProjectData.client?.full_name || "Unassigned"}
                    </p>
                  </div>
                )}
              </div>

              {/* Work Hours */}
              <div>
                <label
                  htmlFor="work_hours"
                  className="block text-neutral-700 font-semibold mb-3 body-small flex items-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={faClock}
                    className="text-primary-600"
                  />
                  Work Hours
                </label>
                <input
                  type="number"
                  id="work_hours"
                  value={workHours}
                  onChange={(e) => setWorkHours(e.target.value)}
                  min="0"
                  step="0.5"
                  placeholder="e.g., 8.5"
                  className="w-full px-4 py-3.5 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                />
                <p className="mt-2 text-neutral-500 text-sm">
                  Total hours worked on this update
                </p>
              </div>
            </div>
          </div>

          {/* Title & Status Card */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-neutral-700 font-semibold mb-3 body-small flex items-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={faFileAlt}
                    className="text-primary-600"
                  />
                  Update Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  placeholder="e.g., Electrical Wiring Installation Completed"
                  required
                  className="w-full px-4 py-3.5 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                />
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-neutral-700 font-semibold mb-3 body-small flex items-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="text-primary-600"
                  />
                  Work Status <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="status"
                    value={updateStatus}
                    onChange={(e) =>
                      setUpdateStatus(
                        e.target.value as
                          | "completed"
                          | "in-progress"
                          | "blocked"
                      )
                    }
                    required
                    className="w-full appearance-none px-4 py-3.5 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                  >
                    <option value="completed">✓ Completed</option>
                    <option value="in-progress">⏱ In Progress</option>
                    <option value="blocked">⚠ Blocked</option>
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Update Content Card */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <label
              htmlFor="content"
              className="block text-neutral-700 font-semibold mb-3 body-small flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faFileAlt} className="text-primary-600" />
              Update Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
              placeholder="Share today's progress, challenges, or accomplishments...&#10;&#10;Example:&#10;- Completed foundation work&#10;- Installed electrical wiring in main room&#10;- Team meeting scheduled for tomorrow"
              required
              rows={8}
              className="w-full px-4 py-3 bg-neutral-0 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-neutral-500 text-sm">
                {updateContent.length} characters
              </p>
            </div>
          </div>

          {/* Media Upload Card */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-neutral-700 font-semibold body-small flex items-center gap-2">
                <FontAwesomeIcon icon={faImage} className="text-primary-600" />
                Attach Media (Photos & Videos)
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-neutral-0 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Media Preview Grid */}
            {mediaFiles.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaFiles.map((media) => (
                  <div
                    key={media.id}
                    className="relative group rounded-lg overflow-hidden border-2 border-neutral-200 hover:border-primary-500 transition-colors"
                  >
                    <div className="aspect-square bg-neutral-100">
                      {media.type === "image" ? (
                        <img
                          src={media.preview}
                          alt="Upload preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full relative">
                          <video
                            src={media.preview}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50">
                            <FontAwesomeIcon
                              icon={faVideo}
                              className="text-neutral-0 text-3xl"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(media.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-neutral-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-700"
                      aria-label="Remove file"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-900/80 to-transparent p-2">
                      <p className="text-neutral-0 text-xs truncate">
                        {media.file.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 rounded-xl p-12 text-center hover:border-primary-500 hover:bg-primary-50/50 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faImage}
                      className="text-neutral-400 text-2xl"
                    />
                  </div>
                  <div>
                    <p className="text-neutral-700 font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-neutral-500 text-sm">
                      PNG, JPG, GIF, MP4, MOV up to 50MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {mediaFiles.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
                <FontAwesomeIcon
                  icon={faImage}
                  className="text-blue-600 mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-blue-700 text-sm font-medium">
                    {mediaFiles.length} file{mediaFiles.length > 1 ? "s" : ""}{" "}
                    attached
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Images and videos will be uploaded with your update
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to discard this update? All content will be lost."
                  )
                ) {
                  resetForm();
                }
              }}
              className="px-6 py-3 border-2 border-neutral-200 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createUpdateMutation.isPending}
              className="btn-primary-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-center"
            >
              {isSubmitting || createUpdateMutation.isPending ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Post Update
                </>
              )}
            </button>
          </div>

          {/* Helper Tips */}
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl border border-primary-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <FontAwesomeIcon
                icon={faClipboardList}
                className="text-primary-600"
              />
              Tips for Great Updates
            </h3>
            <ul className="space-y-2 text-neutral-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>
                  Include specific accomplishments and progress made today
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>Add photos showing before/after or work in progress</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>
                  Mention any challenges faced and how they were resolved
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>Note next steps or what's planned for tomorrow</span>
              </li>
            </ul>
          </div>
        </form>

        {/* Daily Updates List */}
        {dailyUpdates.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-3 text-neutral-900 flex items-center gap-3">
                <FontAwesomeIcon
                  icon={faClipboardList}
                  className="text-primary-600"
                />
                Recent Updates
                <span className="text-sm font-normal text-neutral-500">
                  ({dailyUpdates.length})
                </span>
              </h2>

              {/* Filter */}
              <div className="flex items-center gap-3">
                <label className="text-neutral-600 font-medium text-sm flex items-center gap-2">
                  <FontAwesomeIcon icon={faFilter} />
                  Filter:
                </label>
                <div className="relative">
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="appearance-none px-4 py-2 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-small cursor-pointer pr-10"
                  >
                    <option value="all">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredUpdates.map((update) => {
                const project = projects.find(
                  (p) => p.id === update.project_id
                );
                return (
                  <div
                    key={update.id}
                    className="bg-neutral-0 rounded-xl border border-neutral-200 hover:border-primary-500 transition-all overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center font-semibold text-sm">
                              {project?.project_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-neutral-900">
                                {project?.project_name}
                              </h3>
                              <p className="text-neutral-500 text-sm">
                                {project?.client?.full_name || "Unassigned"}
                              </p>
                            </div>
                          </div>
                          <h4 className="font-semibold text-neutral-900 text-lg mb-2">
                            {update.title}
                          </h4>
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 border rounded ${
                                update.status === "completed"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : update.status === "in-progress"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {update.status === "completed" && "✓ COMPLETED"}
                              {update.status === "in-progress" &&
                                "⏱ IN PROGRESS"}
                              {update.status === "blocked" && "⚠ BLOCKED"}
                            </span>
                            {update.work_hours &&
                              parseFloat(update.work_hours) > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded">
                                  <FontAwesomeIcon icon={faClock} />
                                  {update.work_hours} hrs
                                </span>
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewUpdate(update)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            aria-label="View update"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            onClick={() => handleDeleteUpdate(update)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Delete update"
                            disabled={deleteUpdateMutation.isPending}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-neutral-600 text-sm mb-3">
                        <FontAwesomeIcon
                          icon={faCalendar}
                          className="text-xs"
                        />
                        <span>
                          {new Date(update.created_at).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                        <span className="text-neutral-400">•</span>
                        <span className="text-neutral-500">
                          Posted by {update.posted_by_name}
                        </span>
                      </div>

                      {/* Content Preview */}
                      <p className="text-neutral-700 body-regular line-clamp-3 mb-4">
                        {update.update_text}
                      </p>

                      {/* Media Thumbnails */}
                      {update.media && update.media.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {update.media
                            .slice(0, 4)
                            .map((media: any, index: number) => (
                              <div
                                key={index}
                                className="w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 relative"
                              >
                                <img
                                  src={
                                    media.media_file ||
                                    media.media_url ||
                                    media.file ||
                                    media.url
                                  }
                                  alt="Update media"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          {update.media.length > 4 && (
                            <div className="w-20 h-20 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 font-semibold text-sm">
                              +{update.media.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredUpdates.length === 0 && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
                <FontAwesomeIcon
                  icon={faClipboardList}
                  className="text-5xl text-neutral-300 mb-4"
                />
                <p className="text-neutral-600 font-medium">
                  No updates found for this filter
                </p>
                <p className="text-neutral-500 text-sm mt-2">
                  Try selecting a different project or clear the filter
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Update Modal */}
      {viewingUpdate && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-neutral-0 border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="heading-4 text-neutral-900">Update Details</h3>
              <button
                onClick={() => setViewingUpdate(null)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Project Info */}
              <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <div className="w-12 h-12 rounded-full bg-primary-600 text-neutral-0 flex items-center justify-center font-bold text-lg">
                  {viewingUpdate.project_name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">
                    {viewingUpdate.project_name}
                  </h4>
                  <p className="text-neutral-600 text-sm">
                    {viewingUpdate.client_name}
                  </p>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-neutral-600 font-medium mb-2 body-small">
                  Update Title
                </label>
                <h2 className="heading-4 text-neutral-900">
                  {viewingUpdate.title}
                </h2>
              </div>

              {/* Status & Work Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-600 font-medium mb-2 body-small">
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 border rounded-lg ${
                      viewingUpdate.status === "completed"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : viewingUpdate.status === "in-progress"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {viewingUpdate.status === "completed" && "✓ COMPLETED"}
                    {viewingUpdate.status === "in-progress" && "⏱ IN PROGRESS"}
                    {viewingUpdate.status === "blocked" && "⚠ BLOCKED"}
                  </span>
                </div>
                {viewingUpdate.work_hours &&
                  parseFloat(viewingUpdate.work_hours) > 0 && (
                    <div>
                      <label className="block text-neutral-600 font-medium mb-2 body-small">
                        Work Hours
                      </label>
                      <div className="flex items-center gap-2 text-neutral-900 font-medium">
                        <FontAwesomeIcon
                          icon={faClock}
                          className="text-primary-600"
                        />
                        {viewingUpdate.work_hours} hours
                      </div>
                    </div>
                  )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-neutral-600 font-medium mb-2 body-small">
                  Posted On
                </label>
                <div className="flex items-center gap-2 text-neutral-900">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="text-primary-600"
                  />
                  <span className="font-medium">
                    {new Date(viewingUpdate.created_at).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-neutral-600 font-medium mb-3 body-small">
                  Update Content
                </label>
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <p className="text-neutral-900 body-regular whitespace-pre-wrap leading-relaxed">
                    {viewingUpdate.update_text}
                  </p>
                </div>
              </div>

              {/* Media */}
              {viewingUpdate.media && viewingUpdate.media.length > 0 && (
                <div>
                  <label className="block text-neutral-600 font-medium mb-3 body-small">
                    Media ({viewingUpdate.media.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {viewingUpdate.media.map((media: any, index: number) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg overflow-hidden border border-neutral-200"
                      >
                        <img
                          src={
                            media.media_file ||
                            media.media_url ||
                            media.file ||
                            media.url
                          }
                          alt="Update media"
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() =>
                            window.open(
                              media.media_file ||
                                media.media_url ||
                                media.file ||
                                media.url,
                              "_blank"
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posted By */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  Posted by{" "}
                  <span className="font-semibold">
                    {viewingUpdate.posted_by_name}
                  </span>
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setViewingUpdate(null)}
                className="px-5 py-2.5 border border-neutral-200 rounded-lg text-neutral-700 font-medium hover:bg-neutral-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this update?")) {
                    handleDeleteUpdate(viewingUpdate);
                  }
                }}
                className="px-5 py-2.5 bg-red-600 text-neutral-0 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={deleteUpdateMutation.isPending}
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
