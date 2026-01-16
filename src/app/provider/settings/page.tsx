"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faBell,
  faGlobe,
  faTrash,
  faSave,
  faCamera,
  faEye,
  faEyeSlash,
  faShield,
  faEnvelope,
  faPhone,
  faBriefcase,
  faMapMarkerAlt,
  faExclamationTriangle,
  faTimes,
  faBolt,
  faImage,
  faUpload,
  faCertificate,
  faFileAlt,
  faCheckCircle,
  faEdit,
  faPlus,
  faSpinner,
  faCloudUpload,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  uploadImage,
  uploadDocument,
  uploadMultipleFiles,
} from "@/lib/storageService";

// ==================================================================================
// TYPE DEFINITIONS
// ============================================================================================
interface User {
  id: number;
  email: string;
  phone: string;
  user_type: string;
}
interface Profile {
  id: number;
  user: User;
  full_name: string;
  business_name: string;
  bio: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  profile_image: string;
  cover_image: string;
  hero_image: string;
  years_of_experience: number;
  license_number: string;
  service_radius: number;
  hourly_rate_min: number;
  hourly_rate_max: number;
  project_range_min: number;
  project_range_max: number;
  slug: string;
  latitude: number;
  longitude: number;
}
interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  image_url: string;
  description: string;
  display_order: number;
  created_at: string;
}
interface ExperienceItem {
  id: number;
  title: string;
  client_name: string;
  completion_date: string;
  description: string;
  display_order: number;
  formatted_date: string;
}
interface License {
  id: number;
  icon: string;
  title: string;
  issuer: string;
  license_number: string;
  issue_date: string;
  formatted_issue_date: string;
  status: string;
}
interface Specialization {
  id: number;
  icon: string;
  title: string;
  description: string;
  price: string;
  display_order: number;
  is_active: boolean;
}
interface VerificationDocument {
  id: number;
  document_type: string;
  document_url: string;
  document_number: string;
  issue_date: string;
  expiry_date: string;
  verification_status: string;
  upload_date: string;
  verified_at: string;
  rejection_reason: string;
}
interface NotificationPreferences {
  id: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  project_updates: boolean;
  payment_alerts: boolean;
  message_notifications: boolean;
  appointment_reminders: boolean;
  system_announcements: boolean;
}
interface UserPreferences {
  id: number;
  language: string;
  timezone: string;
  date_format: string;
  theme: string;
}
interface AccountInfo {
  account_created: string;
  account_status: string;
  last_login: string;
  email_verified: boolean;
  phone_verified: boolean;
}
interface AllSettingsData {
  profile: Profile;
  portfolio: PortfolioItem[];
  experience: ExperienceItem[];
  licenses: License[];
  specializations: Specialization[];
  verification_documents: VerificationDocument[];
  notification_preferences: NotificationPreferences;
  user_preferences: UserPreferences;
  account_info: AccountInfo;
}

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const profileImageRef = useRef<HTMLInputElement>(null);
  const heroImageRef = useRef<HTMLInputElement>(null);
  const portfolioImageRef = useRef<HTMLInputElement>(null);
  const verificationDocsRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Upload states
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const [isUploadingPortfolioImage, setIsUploadingPortfolioImage] =
    useState(false);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);

  // Editing states
  const [editingPortfolio, setEditingPortfolio] =
    useState<PortfolioItem | null>(null);
  const [editingExperience, setEditingExperience] =
    useState<ExperienceItem | null>(null);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [editingSpecialization, setEditingSpecialization] =
    useState<Specialization | null>(null);

  // Preview states
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [portfolioImagePreview, setPortfolioImagePreview] = useState<
    string | null
  >(null);
  const [documentPreviews, setDocumentPreviews] = useState<
    Array<{ file: File; preview: string; name: string }>
  >([]);

  // Form states
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    bio: "",
    profile_image: "",
  });
  const [publicProfileForm, setPublicProfileForm] = useState({
    business_name: "",
    slug: "",
    about_paragraphs: [""],
    hero_image: "",
  });
  const [businessForm, setBusinessForm] = useState({
    business_name: "",
    license_number: "",
    years_of_experience: 0,
    service_radius: 5,
    hourly_rate_min: 0,
    hourly_rate_max: 0,
  });
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    category: "",
    image_url: "",
    description: "",
  });
  const [experienceForm, setExperienceForm] = useState({
    title: "",
    client_name: "",
    completion_date: "",
    description: "",
  });
  const [licenseForm, setLicenseForm] = useState({
    title: "",
    issuer: "",
    license_number: "",
    issue_date: "",
    icon: "faCertificate",
  });
  const [specializationForm, setSpecializationForm] = useState({
    icon: "faBolt",
    title: "",
    description: "",
    price: "",
  });
  const [documentForm, setDocumentForm] = useState({
    document_type: "license",
    document_urls: [] as string[],
    document_number: "",
    issue_date: "",
    expiry_date: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences | null>(null);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);

  // ==================================================================================
  // FETCH ALL SETTINGS DATA
  // ==================================================================================
  const {
    data: settingsData,
    isLoading: settingsLoading,
    isError: settingsError,
    error: settingsErrorData,
  } = useQuery<AllSettingsData>({
    queryKey: ["all-settings"],
    queryFn: async () => {
      const response = await api.get<AllSettingsData>("/api/v1/settings/all/");
      if (response.profile) {
        setProfileForm({
          full_name: response.profile.full_name || "",
          email: response.profile.user.email || "",
          phone: response.profile.user.phone || "",
          address: response.profile.address || "",
          city: response.profile.city || "",
          state: response.profile.state || "",
          postal_code: response.profile.postal_code || "",
          bio: response.profile.bio || "",
          profile_image: response.profile.profile_image || "",
        });
        setPublicProfileForm({
          business_name: response.profile.business_name || "",
          slug: response.profile.slug || "",
          about_paragraphs: response.profile.bio
            ? response.profile.bio.split("\n")
            : [""],
          hero_image: response.profile.hero_image || "",
        });
        setBusinessForm({
          business_name: response.profile.business_name || "",
          license_number: response.profile.license_number || "",
          years_of_experience: response.profile.years_of_experience || 0,
          service_radius: response.profile.service_radius || 5,
          hourly_rate_min: response.profile.hourly_rate_min || 0,
          hourly_rate_max: response.profile.hourly_rate_max || 0,
        });
      }
      if (response.notification_preferences) {
        setNotificationPrefs(response.notification_preferences);
      }
      if (response.user_preferences) {
        setUserPrefs(response.user_preferences);
      }
      return response;
    },
  });

  // ==================================================================================
  // MUTATIONS - PROFILE
  // ==================================================================================
  const updateBasicProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      return api.put("/api/v1/settings/profile/basic/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      alert("Profile updated successfully!");
    },
    onError: (error: any) => {
      alert(`Failed to update profile: ${error.data?.detail || error.message}`);
    },
  });
  const updatePublicProfileMutation = useMutation({
    mutationFn: async (data: typeof publicProfileForm) => {
      return api.put("/api/v1/settings/profile/public/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      alert("Public profile updated successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to update public profile: ${
          error.data?.detail || error.message
        }`
      );
    },
  });
  const updateBusinessInfoMutation = useMutation({
    mutationFn: async (data: typeof businessForm) => {
      return api.put("/api/v1/settings/business/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      alert("Business information updated successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to update business info: ${error.data?.detail || error.message}`
      );
    },
  });

  // ==================================================================================
  // MUTATIONS - PORTFOLIO
  // ==================================================================================
  const createPortfolioMutation = useMutation({
    mutationFn: async (data: typeof portfolioForm) => {
      return api.post<PortfolioItem>("/api/v1/settings/portfolio/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowPortfolioModal(false);
      resetPortfolioForm();
      alert("Portfolio item added successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to add portfolio item: ${error.data?.detail || error.message}`
      );
    },
  });
  const updatePortfolioMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: typeof portfolioForm;
    }) => {
      return api.put<PortfolioItem>(`/api/v1/settings/portfolio/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowPortfolioModal(false);
      setEditingPortfolio(null);
      resetPortfolioForm();
      alert("Portfolio item updated successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to update portfolio item: ${
          error.data?.detail || error.message
        }`
      );
    },
  });
  const deletePortfolioMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/v1/settings/portfolio/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      alert("Portfolio item deleted successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to delete portfolio item: ${
          error.data?.detail || error.message
        }`
      );
    },
  });

  // ==================================================================================
  // MUTATIONS - EXPERIENCE
  // ==================================================================================
  const createExperienceMutation = useMutation({
    mutationFn: async (data: typeof experienceForm) => {
      return api.post<ExperienceItem>("/api/v1/settings/experience/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowExperienceModal(false);
      resetExperienceForm();
      alert("Experience entry added successfully!");
    },
    onError: (error: any) => {
      alert(`Failed to add experience: ${error.data?.detail || error.message}`);
    },
  });
  const updateExperienceMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: typeof experienceForm;
    }) => {
      return api.put<ExperienceItem>(
        `/api/v1/settings/experience/${id}/`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowExperienceModal(false);
      setEditingExperience(null);
      resetExperienceForm();
      alert("Experience entry updated successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to update experience: ${error.data?.detail || error.message}`
      );
    },
  });
  const deleteExperienceMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/v1/settings/experience/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      alert("Experience entry deleted successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to delete experience: ${error.data?.detail || error.message}`
      );
    },
  });

  // ==================================================================================
  // MUTATIONS - LICENSES
  // ==================================================================================
  const createLicenseMutation = useMutation({
    mutationFn: async (data: typeof licenseForm) => {
      return api.post<License>("/api/v1/settings/licenses/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowLicenseModal(false);
      resetLicenseForm();
      alert("License added successfully!");
    },
    onError: (error: any) => {
      alert(`Failed to add license: ${error.data?.detail || error.message}`);
    },
  });
  const updateLicenseMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: typeof licenseForm;
    }) => {
      return api.put<License>(`/api/v1/settings/licenses/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowLicenseModal(false);
      setEditingLicense(null);
      resetLicenseForm();
      alert("License updated successfully!");
    },
    onError: (error: any) => {
      alert(`Failed to update license: ${error.data?.detail || error.message}`);
    },
  });
  const deleteLicenseMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/v1/settings/licenses/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      alert("License deleted successfully!");
    },
    onError: (error: any) => {
      alert(`Failed to delete license: ${error.data?.detail || error.message}`);
    },
  });

  // ==================================================================================
  // MUTATIONS - SPECIALIZATIONS
  // ==================================================================================
  const createSpecializationMutation = useMutation({
    mutationFn: async (data: typeof specializationForm) => {
      return api.post<Specialization>(
        "/api/v1/settings/specializations/",
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowSpecializationModal(false);
      resetSpecializationForm();
      alert("Specialization added successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to add specialization: ${error.data?.detail || error.message}`
      );
    },
  });
  const updateSpecializationMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: typeof specializationForm;
    }) => {
      return api.put<Specialization>(
        `/api/v1/settings/specializations/${id}/`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowSpecializationModal(false);
      setEditingSpecialization(null);
      resetSpecializationForm();
      alert("Specialization updated successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to update specialization: ${
          error.data?.detail || error.message
        }`
      );
    },
  });
  const deleteSpecializationMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/v1/settings/specializations/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      alert("Specialization deleted successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to delete specialization: ${
          error.data?.detail || error.message
        }`
      );
    },
  });

  // ==================================================================================
  // MUTATIONS - VERIFICATION DOCUMENTS
  // ==================================================================================
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: typeof documentForm) => {
      return api.post<VerificationDocument>(
        "/api/v1/settings/documents/",
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowUploadModal(false);
      resetDocumentForm();
      setDocumentPreviews([]);
      alert("Documents uploaded successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to upload documents: ${error.data?.detail || error.message}`
      );
    },
  });

  // ==================================================================================
  // MUTATIONS - NOTIFICATION & USER PREFERENCES
  // ==================================================================================
  const updateNotificationPrefsMutation = useMutation({
    mutationFn: async (data: NotificationPreferences) => {
      return api.put<NotificationPreferences>(
        "/api/v1/settings/notifications/",
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      alert("Notification preferences updated successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to update preferences: ${error.data?.detail || error.message}`
      );
    },
  });
  const updateUserPrefsMutation = useMutation({
    mutationFn: async (data: UserPreferences) => {
      return api.put<UserPreferences>("/api/v1/settings/preferences/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      alert("Preferences updated successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to update preferences: ${error.data?.detail || error.message}`
      );
    },
  });

  // ==================================================================================
  // MUTATIONS - PASSWORD CHANGE
  // ==================================================================================
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      return api.post("/api/v1/auth/password/change/", {
        old_password: data.current_password,
        new_password: data.new_password,
      });
    },
    onSuccess: () => {
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      alert("Password changed successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to change password: ${error.data?.detail || error.message}`
      );
    },
  });

  // ==================================================================================
  // IMAGE UPLOAD HANDLERS
  // ==================================================================================
  const handleProfileImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setProfileImagePreview(preview);
    setIsUploadingProfileImage(true);
    try {
      const result = await uploadImage(file, { folder: "profiles" });
      if (result.success && result.publicUrl) {
        setProfileForm({ ...profileForm, profile_image: result.publicUrl });
        alert("Profile image uploaded! Don't forget to save changes.");
      } else {
        alert(`Upload failed: ${result.error}`);
        URL.revokeObjectURL(preview);
        setProfileImagePreview(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
      URL.revokeObjectURL(preview);
      setProfileImagePreview(null);
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  const handleHeroImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setHeroImagePreview(preview);
    setIsUploadingHeroImage(true);
    try {
      const result = await uploadImage(file, { folder: "hero_images" });
      if (result.success && result.publicUrl) {
        setPublicProfileForm({
          ...publicProfileForm,
          hero_image: result.publicUrl,
        });
        alert("Hero image uploaded! Don't forget to save changes.");
      } else {
        alert(`Upload failed: ${result.error}`);
        URL.revokeObjectURL(preview);
        setHeroImagePreview(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
      URL.revokeObjectURL(preview);
      setHeroImagePreview(null);
    } finally {
      setIsUploadingHeroImage(false);
    }
  };

  const handlePortfolioImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setPortfolioImagePreview(preview);
    setIsUploadingPortfolioImage(true);
    try {
      const result = await uploadImage(file, { folder: "portfolio" });
      if (result.success && result.publicUrl) {
        setPortfolioForm({ ...portfolioForm, image_url: result.publicUrl });
      } else {
        alert(`Upload failed: ${result.error}`);
        URL.revokeObjectURL(preview);
        setPortfolioImagePreview(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
      URL.revokeObjectURL(preview);
      setPortfolioImagePreview(null);
    } finally {
      setIsUploadingPortfolioImage(false);
    }
  };

  const handleVerificationDocsSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 10MB`);
        return;
      }
    }
    const previews = fileArray.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setDocumentPreviews(previews);
    setIsUploadingDocuments(true);
    try {
      const results = await uploadMultipleFiles(fileArray, {
        folder: "verification_documents",
      });
      const successfulUploads = results
        .filter((r) => r.success && r.publicUrl)
        .map((r) => r.publicUrl!);
      if (successfulUploads.length > 0) {
        setDocumentForm({ ...documentForm, document_urls: successfulUploads });
        alert(`${successfulUploads.length} document(s) uploaded successfully!`);
      } else {
        alert("No documents were uploaded successfully");
        setDocumentPreviews([]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload documents");
      setDocumentPreviews([]);
    } finally {
      setIsUploadingDocuments(false);
    }
  };

  const removeDocumentPreview = (index: number) => {
    const newPreviews = [...documentPreviews];
    URL.revokeObjectURL(newPreviews[index].preview);
    newPreviews.splice(index, 1);
    setDocumentPreviews(newPreviews);
    const newUrls = [...documentForm.document_urls];
    newUrls.splice(index, 1);
    setDocumentForm({ ...documentForm, document_urls: newUrls });
  };

  // ==================================================================================
  // HELPER FUNCTIONS
  // ==================================================================================
  const resetPortfolioForm = () => {
    setPortfolioForm({
      title: "",
      category: "",
      image_url: "",
      description: "",
    });
    setPortfolioImagePreview(null);
  };
  const resetExperienceForm = () => {
    setExperienceForm({
      title: "",
      client_name: "",
      completion_date: "",
      description: "",
    });
  };
  const resetLicenseForm = () => {
    setLicenseForm({
      title: "",
      issuer: "",
      license_number: "",
      issue_date: "",
      icon: "faCertificate",
    });
  };
  const resetSpecializationForm = () => {
    setSpecializationForm({
      icon: "faBolt",
      title: "",
      description: "",
      price: "",
    });
  };
  const resetDocumentForm = () => {
    setDocumentForm({
      document_type: "license",
      document_urls: [],
      document_number: "",
      issue_date: "",
      expiry_date: "",
    });
  };

  // ==================================================================================
  // HANDLERS
  // ==================================================================================
  const handleSaveProfile = () =>
    updateBasicProfileMutation.mutate(profileForm);
  const handleSavePublicProfile = () =>
    updatePublicProfileMutation.mutate(publicProfileForm);
  const handleSaveBusinessInfo = () =>
    updateBusinessInfoMutation.mutate(businessForm);

  const handleAddPortfolio = () => {
    if (
      !portfolioForm.title ||
      !portfolioForm.category ||
      !portfolioForm.image_url
    ) {
      alert("Please fill in required fields and upload an image");
      return;
    }
    if (editingPortfolio) {
      updatePortfolioMutation.mutate({
        id: editingPortfolio.id,
        data: portfolioForm,
      });
    } else {
      createPortfolioMutation.mutate(portfolioForm);
    }
  };
  const handleEditPortfolio = (item: PortfolioItem) => {
    setEditingPortfolio(item);
    setPortfolioForm({
      title: item.title,
      category: item.category,
      image_url: item.image_url,
      description: item.description,
    });
    setPortfolioImagePreview(item.image_url);
    setShowPortfolioModal(true);
  };
  const handleDeletePortfolio = (id: number) => {
    if (confirm("Are you sure you want to delete this portfolio item?")) {
      deletePortfolioMutation.mutate(id);
    }
  };

  const handleAddExperience = () => {
    if (
      !experienceForm.title ||
      !experienceForm.client_name ||
      !experienceForm.completion_date
    ) {
      alert("Please fill in required fields");
      return;
    }
    if (editingExperience) {
      updateExperienceMutation.mutate({
        id: editingExperience.id,
        data: experienceForm,
      });
    } else {
      createExperienceMutation.mutate(experienceForm);
    }
  };
  const handleEditExperience = (item: ExperienceItem) => {
    setEditingExperience(item);
    setExperienceForm({
      title: item.title,
      client_name: item.client_name,
      completion_date: item.completion_date,
      description: item.description,
    });
    setShowExperienceModal(true);
  };
  const handleDeleteExperience = (id: number) => {
    if (confirm("Are you sure you want to delete this experience entry?")) {
      deleteExperienceMutation.mutate(id);
    }
  };

  const handleAddLicense = () => {
    if (!licenseForm.title || !licenseForm.issuer) {
      alert("Please fill in required fields");
      return;
    }
    if (editingLicense) {
      updateLicenseMutation.mutate({
        id: editingLicense.id,
        data: licenseForm,
      });
    } else {
      createLicenseMutation.mutate(licenseForm);
    }
  };
  const handleEditLicense = (item: License) => {
    setEditingLicense(item);
    setLicenseForm({
      title: item.title,
      issuer: item.issuer,
      license_number: item.license_number,
      issue_date: item.issue_date,
      icon: item.icon,
    });
    setShowLicenseModal(true);
  };
  const handleDeleteLicense = (id: number) => {
    if (confirm("Are you sure you want to delete this license?")) {
      deleteLicenseMutation.mutate(id);
    }
  };

  const handleAddSpecialization = () => {
    if (!specializationForm.title || !specializationForm.description) {
      alert("Please fill in required fields");
      return;
    }
    if (editingSpecialization) {
      updateSpecializationMutation.mutate({
        id: editingSpecialization.id,
        data: specializationForm,
      });
    } else {
      createSpecializationMutation.mutate(specializationForm);
    }
  };
  const handleEditSpecialization = (item: Specialization) => {
    setEditingSpecialization(item);
    setSpecializationForm({
      icon: item.icon,
      title: item.title,
      description: item.description,
      price: item.price,
    });
    setShowSpecializationModal(true);
  };
  const handleDeleteSpecialization = (id: number) => {
    if (confirm("Are you sure you want to delete this specialization?")) {
      deleteSpecializationMutation.mutate(id);
    }
  };

  const handleUploadVerification = () => {
    if (documentForm.document_urls.length === 0) {
      alert("Please upload at least one document");
      return;
    }
    uploadDocumentMutation.mutate(documentForm);
  };

  const handleSaveNotifications = () => {
    if (notificationPrefs)
      updateNotificationPrefsMutation.mutate(notificationPrefs);
  };
  const handleSavePreferences = () => {
    if (userPrefs) updateUserPrefsMutation.mutate(userPrefs);
  };

  const handleChangePassword = () => {
    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      alert("Please fill in all password fields");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert("New passwords do not match");
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await api.delete("/api/v1/settings/account/delete/");
      if (response.status === 204) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/join-provider";
      }
    } catch (error: any) {
      alert(`Failed to delete account: ${error.data?.detail || error.message}`);
    }
    setShowDeleteModal(false);
  };

  const handleAddAboutParagraph = () => {
    setPublicProfileForm({
      ...publicProfileForm,
      about_paragraphs: [...publicProfileForm.about_paragraphs, ""],
    });
  };
  const handleRemoveAboutParagraph = (index: number) => {
    setPublicProfileForm({
      ...publicProfileForm,
      about_paragraphs: publicProfileForm.about_paragraphs.filter(
        (_, i) => i !== index
      ),
    });
  };
  const handleUpdateAboutParagraph = (index: number, value: string) => {
    const newParagraphs = [...publicProfileForm.about_paragraphs];
    newParagraphs[index] = value;
    setPublicProfileForm({
      ...publicProfileForm,
      about_paragraphs: newParagraphs,
    });
  };

  // ==================================================================================
  // LOADING & ERROR STATES
  // ==================================================================================
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-primary-600 mb-4"
          />
          <p className="text-neutral-600">Loading settings...</p>
        </div>
      </div>
    );
  }
  if (settingsError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-red-600 text-2xl"
            />
          </div>
          <h2 className="heading-3 text-neutral-900 mb-2">
            Error Loading Settings
          </h2>
          <p className="text-neutral-600 mb-4">
            {settingsErrorData instanceof Error
              ? settingsErrorData.message
              : "Failed to load settings data"}
          </p>
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

  const tabs = [
    { id: "profile", label: "Profile", icon: faUser },
    { id: "public-profile", label: "My Public Profile", icon: faGlobe },
    { id: "business", label: "Business Info", icon: faBriefcase },
    { id: "verification", label: "Verification", icon: faShield },
    { id: "portfolio", label: "Portfolio", icon: faImage },
    { id: "experience", label: "Experience", icon: faBriefcase },
    { id: "licenses", label: "Licenses", icon: faCertificate },
    { id: "specializations", label: "Specializations", icon: faBolt },
    { id: "security", label: "Security", icon: faLock },
    { id: "notifications", label: "Notifications", icon: faBell },
    { id: "preferences", label: "Preferences", icon: faGlobe },
    { id: "account", label: "Account", icon: faShield },
  ];

  // ==================================================================================
  // RENDER
  // ==================================================================================
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div>
          <h1 className="heading-2 text-neutral-900 mb-1">Settings</h1>
          <p className="text-neutral-600 body-regular">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Upload Progress Toast */}
      {(isUploadingProfileImage ||
        isUploadingHeroImage ||
        isUploadingPortfolioImage ||
        isUploadingDocuments) && (
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

      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4 sticky top-8">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-primary-50 text-primary-700 font-semibold"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="text-lg" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && settingsData && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <h2 className="heading-3 text-neutral-900 mb-6">
                  Profile Information
                </h2>
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-neutral-200">
                  <div className="relative">
                    {profileImagePreview || profileForm.profile_image ? (
                      <img
                        src={profileImagePreview || profileForm.profile_image}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center text-neutral-0 text-3xl font-semibold">
                        {profileForm.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                    <button
                      onClick={() => profileImageRef.current?.click()}
                      disabled={isUploadingProfileImage}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-neutral-900 text-neutral-0 rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                      {isUploadingProfileImage ? (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="text-sm animate-spin"
                        />
                      ) : (
                        <FontAwesomeIcon icon={faCamera} className="text-sm" />
                      )}
                    </button>
                    <input
                      ref={profileImageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageSelect}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      Profile Photo
                    </h3>
                    <p className="text-neutral-600 text-sm mb-3">
                      Upload a new profile picture (max 5MB)
                    </p>
                    <button
                      onClick={() => profileImageRef.current?.click()}
                      disabled={isUploadingProfileImage}
                      className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faCloudUpload} />
                      {isUploadingProfileImage
                        ? "Uploading..."
                        : "Change Photo"}
                    </button>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                        <input
                          type="text"
                          value={profileForm.full_name}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              full_name: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon
                          icon={faEnvelope}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Phone Number
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon
                          icon={faPhone}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        City
                      </label>
                      <input
                        type="text"
                        value={profileForm.city}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            city: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Address
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                      />
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            address: e.target.value,
                          })
                        }
                        className="w-full pl-12 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Bio
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={updateBasicProfileMutation.isPending}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {updateBasicProfileMutation.isPending ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Public Profile Tab */}
            {activeTab === "public-profile" && settingsData && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-neutral-0">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="heading-3 mb-1">Your Public Profile</h2>
                      <p className="text-neutral-100 text-sm">
                        This is how clients will see you on the platform
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-neutral-0 text-primary-600 rounded-lg hover:bg-neutral-50 transition-colors font-semibold">
                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                      Preview
                    </button>
                  </div>
                  <div className="text-neutral-100 text-sm">
                    Profile URL: karya.com/provider/{publicProfileForm.slug}
                  </div>
                </div>
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                  <h2 className="heading-3 text-neutral-900 mb-6">
                    Hero Image
                  </h2>
                  <div className="mb-6">
                    {heroImagePreview || publicProfileForm.hero_image ? (
                      <div className="relative group">
                        <img
                          src={heroImagePreview || publicProfileForm.hero_image}
                          alt="Hero"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => heroImageRef.current?.click()}
                          disabled={isUploadingHeroImage}
                          className="absolute inset-0 bg-neutral-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg disabled:opacity-50"
                        >
                          <span className="text-neutral-0 font-semibold flex items-center gap-2">
                            {isUploadingHeroImage ? (
                              <>
                                <FontAwesomeIcon
                                  icon={faSpinner}
                                  className="animate-spin"
                                />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faCloudUpload} />
                                Change Hero Image
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => heroImageRef.current?.click()}
                        disabled={isUploadingHeroImage}
                        className="w-full h-64 border-2 border-dashed border-neutral-300 rounded-lg hover:border-primary-500 transition-colors flex flex-col items-center justify-center gap-3 disabled:opacity-50"
                      >
                        <FontAwesomeIcon
                          icon={faCloudUpload}
                          className="text-4xl text-neutral-400"
                        />
                        <div className="text-center">
                          <p className="text-neutral-700 font-medium">
                            {isUploadingHeroImage
                              ? "Uploading..."
                              : "Click to upload hero image"}
                          </p>
                          <p className="text-neutral-500 text-sm mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      </button>
                    )}
                    <input
                      ref={heroImageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageSelect}
                      className="hidden"
                    />
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={publicProfileForm.business_name}
                        onChange={(e) =>
                          setPublicProfileForm({
                            ...publicProfileForm,
                            business_name: e.target.value,
                          })
                        }
                        placeholder="e.g., Anderson Construction"
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Profile URL Slug <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">
                          karya.com/provider/
                        </span>
                        <input
                          type="text"
                          value={publicProfileForm.slug}
                          onChange={(e) =>
                            setPublicProfileForm({
                              ...publicProfileForm,
                              slug: e.target.value
                                .toLowerCase()
                                .replace(/\s+/g, "-"),
                            })
                          }
                          placeholder="your-name-profession"
                          className="flex-1 px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                  <h2 className="heading-3 text-neutral-900 mb-6">
                    About Me *
                  </h2>
                  <div className="space-y-4">
                    {publicProfileForm.about_paragraphs.map(
                      (paragraph, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-neutral-700 font-semibold body-small">
                              Paragraph {index + 1}
                            </label>
                            {publicProfileForm.about_paragraphs.length > 1 && (
                              <button
                                onClick={() =>
                                  handleRemoveAboutParagraph(index)
                                }
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                <FontAwesomeIcon
                                  icon={faTrash}
                                  className="mr-1"
                                />
                                Remove
                              </button>
                            )}
                          </div>
                          <textarea
                            value={paragraph}
                            onChange={(e) =>
                              handleUpdateAboutParagraph(index, e.target.value)
                            }
                            rows={4}
                            className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                          />
                        </div>
                      )
                    )}
                    <button
                      onClick={handleAddAboutParagraph}
                      className="w-full py-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-primary-500 hover:text-primary-600 transition-colors font-medium"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add Paragraph
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleSavePublicProfile}
                    disabled={updatePublicProfileMutation.isPending}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {updatePublicProfileMutation.isPending ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} />
                        Save Public Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Business Info Tab */}
            {activeTab === "business" && settingsData && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <h2 className="heading-3 text-neutral-900 mb-6">
                  Business Information
                </h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={businessForm.business_name}
                        onChange={(e) =>
                          setBusinessForm({
                            ...businessForm,
                            business_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={businessForm.license_number}
                        onChange={(e) =>
                          setBusinessForm({
                            ...businessForm,
                            license_number: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        value={businessForm.years_of_experience}
                        onChange={(e) =>
                          setBusinessForm({
                            ...businessForm,
                            years_of_experience: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Service Radius (km)
                      </label>
                      <input
                        type="number"
                        value={businessForm.service_radius}
                        onChange={(e) =>
                          setBusinessForm({
                            ...businessForm,
                            service_radius: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Hourly Rate Range ($)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        value={businessForm.hourly_rate_min}
                        onChange={(e) =>
                          setBusinessForm({
                            ...businessForm,
                            hourly_rate_min: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Min"
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                      <input
                        type="number"
                        value={businessForm.hourly_rate_max}
                        onChange={(e) =>
                          setBusinessForm({
                            ...businessForm,
                            hourly_rate_max: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Max"
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleSaveBusinessInfo}
                    disabled={updateBusinessInfoMutation.isPending}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {updateBusinessInfoMutation.isPending ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === "portfolio" && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="heading-3 text-neutral-900">Portfolio</h2>
                  <button
                    onClick={() => setShowPortfolioModal(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Item
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {settingsData?.portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="h-48 bg-neutral-100 flex items-center justify-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faImage}
                            className="text-neutral-400 text-5xl"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-neutral-600 text-sm mb-3">
                          {item.category}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditPortfolio(item)}
                            className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
                          >
                            <FontAwesomeIcon icon={faEdit} className="mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePortfolio(item.id)}
                            disabled={deletePortfolioMutation.isPending}
                            className="flex-1 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {settingsData?.portfolio.length === 0 && (
                  <div className="text-center py-12">
                    <FontAwesomeIcon
                      icon={faImage}
                      className="text-5xl text-neutral-300 mb-4"
                    />
                    <p className="text-neutral-600 font-medium">
                      No portfolio items yet
                    </p>
                    <p className="text-neutral-500 text-sm mt-1">
                      Add your first portfolio item to showcase your work
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === "experience" && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="heading-3 text-neutral-900">Experience</h2>
                  <button
                    onClick={() => setShowExperienceModal(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Entry
                  </button>
                </div>
                <div className="space-y-4">
                  {settingsData?.experience.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-neutral-200 rounded-lg"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold text-neutral-900">
                            {item.title}
                          </h3>
                          <p className="text-neutral-600 text-sm">
                            Client: {item.client_name}
                          </p>
                          <p className="text-neutral-600 text-sm">
                            Completed: {item.formatted_date}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditExperience(item)}
                            className="px-3 py-1 border border-neutral-200 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExperience(item.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-neutral-700">
                        {item.description}
                      </p>
                    </div>
                  ))}
                  {settingsData?.experience.length === 0 && (
                    <p className="text-neutral-500 text-center py-8">
                      No experience entries yet
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Licenses Tab */}
            {activeTab === "licenses" && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="heading-3 text-neutral-900">
                    Licenses & Certifications
                  </h2>
                  <button
                    onClick={() => setShowLicenseModal(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add License
                  </button>
                </div>
                <div className="space-y-4">
                  {settingsData?.licenses.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-neutral-200 rounded-lg"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold text-neutral-900">
                            {item.title}
                          </h3>
                          <p className="text-neutral-600 text-sm">
                            Issuer: {item.issuer}
                          </p>
                          <p className="text-neutral-600 text-sm">
                            Number: {item.license_number}
                          </p>
                          <p className="text-neutral-600 text-sm">
                            Issued: {item.formatted_issue_date}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditLicense(item)}
                            className="px-3 py-1 border border-neutral-200 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteLicense(item.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {settingsData?.licenses.length === 0 && (
                    <p className="text-neutral-500 text-center py-8">
                      No licenses added yet
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Specializations Tab */}
            {activeTab === "specializations" && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="heading-3 text-neutral-900">
                    Specializations
                  </h2>
                  <button
                    onClick={() => setShowSpecializationModal(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Specialization
                  </button>
                </div>
                <div className="space-y-4">
                  {settingsData?.specializations.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-neutral-200 rounded-lg"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold text-neutral-900">
                            {item.title}
                          </h3>
                          <p className="text-neutral-600 text-sm">
                            {item.description}
                          </p>
                          {item.price && (
                            <p className="text-neutral-700 mt-1">
                              Price: {item.price}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSpecialization(item)}
                            className="px-3 py-1 border border-neutral-200 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSpecialization(item.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {settingsData?.specializations.length === 0 && (
                    <p className="text-neutral-500 text-center py-8">
                      No specializations added yet
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === "verification" && settingsData && (
              <div className="space-y-6">
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="heading-3 text-neutral-900">
                      Verification Status
                    </h2>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faUpload} />
                      Upload Documents
                    </button>
                  </div>
                  <div className="space-y-4">
                    {settingsData.verification_documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon
                              icon={faFileAlt}
                              className="text-primary-600 text-xl"
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-900">
                              {doc.document_type}
                            </h3>
                            <p className="text-neutral-600 text-sm">
                              Uploaded:{" "}
                              {new Date(doc.upload_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
                            doc.verification_status === "verified"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : doc.verification_status === "pending"
                              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                              : "bg-red-100 text-red-700 border-red-200"
                          }`}
                        >
                          {doc.verification_status.charAt(0).toUpperCase() +
                            doc.verification_status.slice(1)}
                        </span>
                      </div>
                    ))}
                    {settingsData.verification_documents.length === 0 && (
                      <p className="text-neutral-500 text-center py-8">
                        No documents uploaded yet
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-blue-600"
                    />
                    Why Get Verified?
                  </h3>
                  <ul className="space-y-2 text-neutral-700 text-sm">
                    <li>• Build trust with potential clients</li>
                    <li>• Appear higher in search results</li>
                    <li>• Access premium features</li>
                    <li>• Display verified badge on your profile</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                  <h2 className="heading-3 text-neutral-900 mb-6">
                    Change Password
                  </h2>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon
                          icon={faLock}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                        <input
                          type={
                            showPasswordFields.current ? "text" : "password"
                          }
                          value={passwordForm.current_password}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              current_password: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-12 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordFields({
                              ...showPasswordFields,
                              current: !showPasswordFields.current,
                            })
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          <FontAwesomeIcon
                            icon={
                              showPasswordFields.current ? faEyeSlash : faEye
                            }
                          />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon
                          icon={faLock}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                        <input
                          type={showPasswordFields.new ? "text" : "password"}
                          value={passwordForm.new_password}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              new_password: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-12 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordFields({
                              ...showPasswordFields,
                              new: !showPasswordFields.new,
                            })
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          <FontAwesomeIcon
                            icon={showPasswordFields.new ? faEyeSlash : faEye}
                          />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Confirm New Password{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon
                          icon={faLock}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                        <input
                          type={
                            showPasswordFields.confirm ? "text" : "password"
                          }
                          value={passwordForm.confirm_password}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirm_password: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-12 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordFields({
                              ...showPasswordFields,
                              confirm: !showPasswordFields.confirm,
                            })
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          <FontAwesomeIcon
                            icon={
                              showPasswordFields.confirm ? faEyeSlash : faEye
                            }
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
                    <button className="btn-secondary">Cancel</button>
                    <button
                      onClick={handleChangePassword}
                      disabled={changePasswordMutation.isPending}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <FontAwesomeIcon
                            icon={faSpinner}
                            className="animate-spin"
                          />
                          Updating...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faLock} />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && notificationPrefs && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <h2 className="heading-3 text-neutral-900 mb-6">
                  Notification Preferences
                </h2>
                <div className="space-y-6">
                  {[
                    {
                      key: "email_notifications",
                      label: "Email Notifications",
                      desc: "Receive notifications via email",
                    },
                    {
                      key: "sms_notifications",
                      label: "SMS Notifications",
                      desc: "Receive notifications via text message",
                    },
                    {
                      key: "project_updates",
                      label: "Project Updates",
                      desc: "Get notified about project status changes",
                    },
                    {
                      key: "payment_alerts",
                      label: "Payment Alerts",
                      desc: "Receive alerts for new payments and invoices",
                    },
                    {
                      key: "message_notifications",
                      label: "Message Notifications",
                      desc: "Get notified about new messages",
                    },
                    {
                      key: "appointment_reminders",
                      label: "Appointment Reminders",
                      desc: "Get reminders for scheduled appointments",
                    },
                    {
                      key: "system_announcements",
                      label: "System Announcements",
                      desc: "Receive important platform updates",
                    },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between pb-6 border-b border-neutral-200"
                    >
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          {label}
                        </h3>
                        <p className="text-neutral-600 text-sm">{desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            notificationPrefs[
                              key as keyof NotificationPreferences
                            ]
                          }
                          onChange={(e) =>
                            setNotificationPrefs({
                              ...notificationPrefs,
                              [key]: e.target.checked,
                            } as NotificationPreferences)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-0 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-neutral-0 after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleSaveNotifications}
                    disabled={updateNotificationPrefsMutation.isPending}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {updateNotificationPrefsMutation.isPending ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && userPrefs && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <h2 className="heading-3 text-neutral-900 mb-6">
                  General Preferences
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Language
                    </label>
                    <select
                      value={userPrefs.language}
                      onChange={(e) =>
                        setUserPrefs({ ...userPrefs, language: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Timezone
                    </label>
                    <select
                      value={userPrefs.timezone}
                      onChange={(e) =>
                        setUserPrefs({ ...userPrefs, timezone: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                    >
                      <option value="Asia/Kathmandu">Kathmandu (NPT)</option>
                      <option value="America/Los_Angeles">
                        Pacific Time (PT)
                      </option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/New_York">
                        Eastern Time (ET)
                      </option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Date Format
                    </label>
                    <select
                      value={userPrefs.date_format}
                      onChange={(e) =>
                        setUserPrefs({
                          ...userPrefs,
                          date_format: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleSavePreferences}
                    disabled={updateUserPrefsMutation.isPending}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {updateUserPrefsMutation.isPending ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && settingsData && (
              <div className="space-y-6">
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                  <h2 className="heading-3 text-neutral-900 mb-6">
                    Account Information
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="text-neutral-600 text-sm mb-1">
                          Account Created
                        </p>
                        <p className="font-semibold text-neutral-900">
                          {new Date(
                            settingsData.account_info.account_created
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="text-neutral-600 text-sm mb-1">
                          Account Status
                        </p>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold border border-green-200">
                          {settingsData.account_info.account_status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="text-neutral-600 text-sm mb-1">
                          Last Login
                        </p>
                        <p className="font-semibold text-neutral-900">
                          {settingsData.account_info.last_login
                            ? new Date(
                                settingsData.account_info.last_login
                              ).toLocaleString()
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-0 rounded-xl border-2 border-red-200 p-6">
                  <h2 className="heading-3 text-red-600 mb-2">Danger Zone</h2>
                  <p className="text-neutral-600 body-regular mb-6">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-red-600 text-neutral-0 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50 sticky top-0">
              <h3 className="heading-4 text-neutral-900">
                {editingPortfolio
                  ? "Edit Portfolio Item"
                  : "Add Portfolio Item"}
              </h3>
              <button
                onClick={() => {
                  setShowPortfolioModal(false);
                  setEditingPortfolio(null);
                  resetPortfolioForm();
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Project Image <span className="text-red-500">*</span>
                  </label>
                  {portfolioImagePreview || portfolioForm.image_url ? (
                    <div className="relative group">
                      <img
                        src={portfolioImagePreview || portfolioForm.image_url}
                        alt="Portfolio preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => portfolioImageRef.current?.click()}
                        disabled={isUploadingPortfolioImage}
                        className="absolute inset-0 bg-neutral-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg disabled:opacity-50"
                      >
                        <span className="text-neutral-0 font-semibold flex items-center gap-2">
                          {isUploadingPortfolioImage ? (
                            <>
                              <FontAwesomeIcon
                                icon={faSpinner}
                                className="animate-spin"
                              />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faCloudUpload} />
                              Change Image
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => portfolioImageRef.current?.click()}
                      disabled={isUploadingPortfolioImage}
                      className="w-full h-48 border-2 border-dashed border-neutral-300 rounded-lg hover:border-primary-500 transition-colors flex flex-col items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <FontAwesomeIcon
                        icon={faCloudUpload}
                        className="text-4xl text-neutral-400"
                      />
                      <div className="text-center">
                        <p className="text-neutral-700 font-medium">
                          {isUploadingPortfolioImage
                            ? "Uploading..."
                            : "Click to upload image"}
                        </p>
                        <p className="text-neutral-500 text-sm mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </button>
                  )}
                  <input
                    ref={portfolioImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePortfolioImageSelect}
                    className="hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={portfolioForm.title}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Modern Kitchen Remodel"
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={portfolioForm.category}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    <option>Kitchen</option>
                    <option>Bathroom</option>
                    <option>Living Room</option>
                    <option>Bedroom</option>
                    <option>Exterior</option>
                    <option>Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Description
                  </label>
                  <textarea
                    value={portfolioForm.description}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the project..."
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => {
                  setShowPortfolioModal(false);
                  setEditingPortfolio(null);
                  resetPortfolioForm();
                }}
                disabled={
                  createPortfolioMutation.isPending ||
                  updatePortfolioMutation.isPending
                }
                className="btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPortfolio}
                disabled={
                  createPortfolioMutation.isPending ||
                  updatePortfolioMutation.isPending ||
                  isUploadingPortfolioImage
                }
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {createPortfolioMutation.isPending ||
                updatePortfolioMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    {editingPortfolio ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={editingPortfolio ? faSave : faPlus}
                    />
                    {editingPortfolio ? "Update" : "Add to Portfolio"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Experience Modal */}
      {showExperienceModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="heading-4 text-neutral-900">
                {editingExperience ? "Edit Experience" : "Add Experience"}
              </h3>
              <button
                onClick={() => {
                  setShowExperienceModal(false);
                  setEditingExperience(null);
                  resetExperienceForm();
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-neutral-700 font-semibold mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={experienceForm.title}
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={experienceForm.client_name}
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      client_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2">
                  Completion Date *
                </label>
                <input
                  type="date"
                  value={experienceForm.completion_date}
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      completion_date: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={experienceForm.description}
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowExperienceModal(false);
                  setEditingExperience(null);
                  resetExperienceForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleAddExperience} className="btn-primary">
                {editingExperience ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License Modal */}
      {showLicenseModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="heading-4 text-neutral-900">
                {editingLicense ? "Edit License" : "Add License"}
              </h3>
              <button
                onClick={() => {
                  setShowLicenseModal(false);
                  setEditingLicense(null);
                  resetLicenseForm();
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-neutral-700 font-semibold mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={licenseForm.title}
                  onChange={(e) =>
                    setLicenseForm({ ...licenseForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2">
                  Issuer *
                </label>
                <input
                  type="text"
                  value={licenseForm.issuer}
                  onChange={(e) =>
                    setLicenseForm({ ...licenseForm, issuer: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  value={licenseForm.license_number}
                  onChange={(e) =>
                    setLicenseForm({
                      ...licenseForm,
                      license_number: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={licenseForm.issue_date}
                  onChange={(e) =>
                    setLicenseForm({
                      ...licenseForm,
                      issue_date: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowLicenseModal(false);
                  setEditingLicense(null);
                  resetLicenseForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleAddLicense} className="btn-primary">
                {editingLicense ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specialization Modal */}
      {showSpecializationModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="heading-4 text-neutral-900">
                {editingSpecialization
                  ? "Edit Specialization"
                  : "Add Specialization"}
              </h3>
              <button
                onClick={() => {
                  setShowSpecializationModal(false);
                  setEditingSpecialization(null);
                  resetSpecializationForm();
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-neutral-700 font-semibold mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={specializationForm.title}
                  onChange={(e) =>
                    setSpecializationForm({
                      ...specializationForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2">
                  Description *
                </label>
                <textarea
                  value={specializationForm.description}
                  onChange={(e) =>
                    setSpecializationForm({
                      ...specializationForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-neutral-700 font-semibold mb-2">
                  Price (Optional)
                </label>
                <input
                  type="text"
                  value={specializationForm.price}
                  onChange={(e) =>
                    setSpecializationForm({
                      ...specializationForm,
                      price: e.target.value,
                    })
                  }
                  placeholder="e.g., $50/hr or Fixed $500"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSpecializationModal(false);
                  setEditingSpecialization(null);
                  resetSpecializationForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleAddSpecialization} className="btn-primary">
                {editingSpecialization ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Verification Documents Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50 sticky top-0">
              <h3 className="heading-4 text-neutral-900">
                Upload Verification Documents
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetDocumentForm();
                  setDocumentPreviews([]);
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Upload Documents <span className="text-red-500">*</span>
                  </label>
                  {documentPreviews.length > 0 ? (
                    <div className="space-y-3">
                      {documentPreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                        >
                          <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon
                              icon={faFileAlt}
                              className="text-primary-600"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {preview.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocumentPreview(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => verificationDocsRef.current?.click()}
                        disabled={isUploadingDocuments}
                        className="w-full py-2 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Add More Documents
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => verificationDocsRef.current?.click()}
                      disabled={isUploadingDocuments}
                      className="w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg hover:border-primary-500 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <FontAwesomeIcon
                        icon={faCloudUpload}
                        className="text-3xl text-neutral-400"
                      />
                      <div className="text-center">
                        <p className="text-neutral-700 font-medium">
                          {isUploadingDocuments
                            ? "Uploading..."
                            : "Click to upload documents"}
                        </p>
                        <p className="text-neutral-500 text-sm mt-1">
                          PDF, JPG, PNG up to 10MB each
                        </p>
                      </div>
                    </button>
                  )}
                  <input
                    ref={verificationDocsRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handleVerificationDocsSelect}
                    className="hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={documentForm.document_type}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        document_type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                  >
                    <option value="license">Business License</option>
                    <option value="insurance">Insurance Certificate</option>
                    <option value="certification">
                      Professional Certification
                    </option>
                    <option value="id">Tax ID Document</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Document Number
                  </label>
                  <input
                    type="text"
                    value={documentForm.document_number}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        document_number: e.target.value,
                      })
                    }
                    placeholder="Enter document number..."
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={documentForm.issue_date}
                      onChange={(e) =>
                        setDocumentForm({
                          ...documentForm,
                          issue_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={documentForm.expiry_date}
                      onChange={(e) =>
                        setDocumentForm({
                          ...documentForm,
                          expiry_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetDocumentForm();
                  setDocumentPreviews([]);
                }}
                disabled={uploadDocumentMutation.isPending}
                className="btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadVerification}
                disabled={
                  uploadDocumentMutation.isPending || isUploadingDocuments
                }
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {uploadDocumentMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUpload} />
                    Submit Documents
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="text-red-600 text-xl"
                  />
                </div>
                <div>
                  <h3 className="heading-4 text-neutral-900">Delete Account</h3>
                  <p className="text-neutral-600 text-sm">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">
                  <strong>Warning:</strong> Deleting your account will
                  permanently remove:
                </p>
                <ul className="mt-2 space-y-1 text-red-700 text-sm">
                  <li>• All your profile information</li>
                  <li>• Project data and history</li>
                  <li>• Messages and communications</li>
                  <li>• Payment records</li>
                </ul>
              </div>
              <p className="text-neutral-700 body-regular">
                Are you absolutely sure you want to delete your account? This
                action is permanent and cannot be reversed.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 bg-red-600 text-neutral-0 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTrash} />
                Yes, Delete My Account
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
      `}</style>
    </div>
  );
}
