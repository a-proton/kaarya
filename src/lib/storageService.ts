/**
 * Storage Service using Supabase SSR
 * Handles file uploads to Supabase Storage with SSR-safe client creation
 * Aligns with Django backend field naming conventions
 */

import { createBrowserClient } from "@supabase/ssr";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  mediaType?: "image" | "video" | "file";
}

export interface UploadOptions {
  folder?: string;
  customFileName?: string;
  onProgress?: (progress: number) => void;
}

export interface FileValidation {
  maxSizeInMB: number;
  allowedTypes: string[];
}

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_BUCKET = "default_bucket";

const DEFAULT_VALIDATION: FileValidation = {
  maxSizeInMB: 10, // 10MB default
  allowedTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
  ],
};

// Video-specific validation
const VIDEO_VALIDATION: FileValidation = {
  maxSizeInMB: 100, // 100MB for videos
  allowedTypes: ["video/mp4", "video/webm", "video/quicktime"],
};

// Image-specific validation
const IMAGE_VALIDATION: FileValidation = {
  maxSizeInMB: 5, // 5MB for images
  allowedTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
};

// =====================================================
// SUPABASE CLIENT (SSR-SAFE)
// =====================================================

/**
 * Create a browser-safe Supabase client
 * This uses environment variables and is safe for client-side operations
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate a unique file path with timestamp and random string
 * Format: folder/YYYYMMDD_timestamp_random.ext
 */
function generateFilePath(file: File, customFolder?: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split(".").pop() || "bin";
  const folder = customFolder || "uploads";

  return `${folder}/${timestamp}_${randomString}.${extension}`;
}

/**
 * Detect media type from file
 */
function detectMediaType(file: File): "image" | "video" | "file" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
}

/**
 * Validate file against constraints
 */
function validateFile(
  file: File,
  validation: FileValidation
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeInBytes = validation.maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds ${validation.maxSizeInMB}MB limit`,
    };
  }

  // Check file type
  if (!validation.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${
        file.type
      } is not allowed. Allowed types: ${validation.allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Get public URL for an uploaded file
 */
function getPublicUrl(filePath: string): string {
  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

// =====================================================
// MAIN UPLOAD FUNCTIONS
// =====================================================

/**
 * Upload a file to Supabase Storage
 * Returns public URL that can be sent to Django backend
 *
 * @param file - File object from input
 * @param options - Upload options (folder, custom name, progress callback)
 * @returns UploadResult with publicUrl for backend
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // Client-side only check
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Upload can only be performed in browser environment",
      };
    }

    // Determine validation rules based on file type
    const mediaType = detectMediaType(file);
    let validation = DEFAULT_VALIDATION;

    if (mediaType === "image") {
      validation = IMAGE_VALIDATION;
    } else if (mediaType === "video") {
      validation = VIDEO_VALIDATION;
    }

    // Validate file
    const validationResult = validateFile(file, validation);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.error,
      };
    }

    // Generate file path
    const filePath = options.customFileName
      ? `${options.folder || "uploads"}/${options.customFileName}`
      : generateFilePath(file, options.folder);

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Upload file
    const { data, error } = await supabase.storage
      .from(DEFAULT_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return {
        success: false,
        error: error.message || "Upload failed",
      };
    }

    // Get public URL
    const publicUrl = getPublicUrl(data.path);

    return {
      success: true,
      publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mediaType,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Upload an image specifically (with image validation)
 * Backend expects: profile_image, cover_image, hero_image, photo, etc.
 */
export async function uploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const mediaType = detectMediaType(file);

  if (mediaType !== "image") {
    return {
      success: false,
      error: "File must be an image",
    };
  }

  return uploadFile(file, { ...options, folder: options.folder || "images" });
}

/**
 * Upload a video specifically (with video validation)
 * Backend expects: file_url (in Message model for videos)
 */
export async function uploadVideo(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const mediaType = detectMediaType(file);

  if (mediaType !== "video") {
    return {
      success: false,
      error: "File must be a video",
    };
  }

  return uploadFile(file, { ...options, folder: options.folder || "videos" });
}

/**
 * Upload a document/file (PDF, etc.)
 * Backend expects: document_url, receipt_url, id_proof_url, etc.
 */
export async function uploadDocument(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  return uploadFile(file, {
    ...options,
    folder: options.folder || "documents",
  });
}

/**
 * Upload media for project updates
 * Backend expects: media_url in UpdateMedia model
 */
export async function uploadProjectUpdateMedia(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  return uploadFile(file, {
    ...options,
    folder: options.folder || "project_updates",
  });
}

/**
 * Upload chat/message media
 * Backend expects: file_url in Message model (mediaUrl as frontend alias)
 */
export async function uploadMessageMedia(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  return uploadFile(file, { ...options, folder: options.folder || "messages" });
}

// =====================================================
// DELETE FUNCTIONS
// =====================================================

/**
 * Delete a file from Supabase Storage
 * Extracts file path from public URL and deletes
 *
 * @param publicUrl - The public URL returned from upload
 * @returns Success status
 */
export async function deleteFile(
  publicUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window === "undefined") {
      return {
        success: false,
        error: "Delete can only be performed in browser environment",
      };
    }

    // Extract file path from public URL
    const url = new URL(publicUrl);
    const pathMatch = url.pathname.match(
      /\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/
    );

    if (!pathMatch) {
      return {
        success: false,
        error: "Invalid public URL format",
      };
    }

    const filePath = pathMatch[1];
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage
      .from(DEFAULT_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// =====================================================
// BATCH OPERATIONS
// =====================================================

/**
 * Upload multiple files at once
 * Useful for portfolio images, gallery uploads, etc.
 */
export async function uploadMultipleFiles(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) => uploadFile(file, options));
  return Promise.all(uploadPromises);
}

// =====================================================
// HELPER FUNCTIONS FOR BACKEND FIELD MAPPING
// =====================================================

/**
 * Helper to prepare upload result for backend API
 * Maps to backend field names
 */
export function prepareForBackend(
  uploadResult: UploadResult,
  fieldName:
    | "file_url"
    | "mediaUrl"
    | "profile_image"
    | "cover_image"
    | "hero_image"
    | "document_url"
    | "receipt_url"
    | "photo"
    | "media_url"
    | "id_proof_url"
): Record<string, string | null> {
  if (!uploadResult.success || !uploadResult.publicUrl) {
    return { [fieldName]: null };
  }

  return { [fieldName]: uploadResult.publicUrl };
}

/**
 * Example usage for Message model (chat/messaging)
 * Backend accepts both 'file_url' and 'mediaUrl'
 */
export function prepareMessageMedia(uploadResult: UploadResult) {
  return prepareForBackend(uploadResult, "mediaUrl");
}

/**
 * Example usage for ServiceProviderProfile images
 */
export function prepareProfileImage(uploadResult: UploadResult) {
  return prepareForBackend(uploadResult, "profile_image");
}

export function prepareCoverImage(uploadResult: UploadResult) {
  return prepareForBackend(uploadResult, "cover_image");
}

export function prepareHeroImage(uploadResult: UploadResult) {
  return prepareForBackend(uploadResult, "hero_image");
}

/**
 * Example usage for Employee photo
 */
export function prepareEmployeePhoto(uploadResult: UploadResult) {
  return prepareForBackend(uploadResult, "photo");
}

/**
 * Example usage for documents
 */
export function prepareDocument(uploadResult: UploadResult) {
  return prepareForBackend(uploadResult, "document_url");
}

export function prepareReceipt(uploadResult: UploadResult) {
  return prepareForBackend(uploadResult, "receipt_url");
}

export default {
  uploadFile,
  uploadImage,
  uploadVideo,
  uploadDocument,
  uploadProjectUpdateMedia,
  uploadMessageMedia,
  uploadMultipleFiles,
  deleteFile,
  prepareForBackend,
  prepareMessageMedia,
  prepareProfileImage,
  prepareCoverImage,
  prepareHeroImage,
  prepareEmployeePhoto,
  prepareDocument,
  prepareReceipt,
};
