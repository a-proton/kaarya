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
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  uploadImage,
  uploadDocument,
  uploadMultipleFiles,
} from "@/lib/storageService";
import { useRouter } from "next/navigation";

// ==================================================================================
// TYPE DEFINITIONS
// ==================================================================================
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
// DESIGN TOKENS
// ==================================================================================
const baseInput: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  fontFamily: "var(--font-sans)",
  fontSize: "0.875rem",
  color: "var(--color-neutral-900)",
  backgroundColor: "var(--color-neutral-0)",
  border: "1px solid var(--color-neutral-200)",
  borderRadius: "0.625rem",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 150ms, box-shadow 150ms",
};

const baseInputWithIcon: React.CSSProperties = {
  ...baseInput,
  paddingLeft: "2.75rem",
};

const focusHandlers = {
  onFocus: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    e.currentTarget.style.borderColor = "#1ab189";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,177,137,0.12)";
  },
  onBlur: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    e.currentTarget.style.borderColor = "var(--color-neutral-200)";
    e.currentTarget.style.boxShadow = "none";
  },
};

const VERIFICATION_STATUS_STYLES: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  verified: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  pending: { bg: "#fefce8", color: "#ca8a04", border: "#fef08a" },
  rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

// ==================================================================================
// SHARED COMPONENTS
// ==================================================================================
function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: "var(--color-neutral-0)",
        border: "1px solid var(--color-neutral-200)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          padding: "1.125rem 1.5rem",
          borderBottom: "1px solid var(--color-neutral-200)",
        }}
      >
        <h2
          className="font-bold"
          style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
        >
          {title}
        </h2>
        {action}
      </div>
      <div style={{ padding: "1.5rem" }}>{children}</div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "var(--color-neutral-700)",
          marginBottom: "0.5rem",
        }}
      >
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function InputWithIcon({
  icon,
  ...props
}: { icon: any } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <FontAwesomeIcon
        icon={icon}
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--color-neutral-400)", fontSize: "0.8rem" }}
      />
      <input style={baseInputWithIcon} {...focusHandlers} {...props} />
    </div>
  );
}

function ModalFooter({
  onCancel,
  onConfirm,
  confirmLabel,
  isPending,
  pendingLabel,
  disabled,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  isPending: boolean;
  pendingLabel: string;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-end gap-3"
      style={{
        padding: "1rem 1.5rem",
        borderTop: "1px solid var(--color-neutral-200)",
        backgroundColor: "var(--color-neutral-50)",
        borderRadius: "0 0 1rem 1rem",
      }}
    >
      <button
        onClick={onCancel}
        disabled={isPending}
        className="btn btn-ghost btn-md"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={isPending || disabled}
        className="btn btn-primary btn-md flex items-center gap-2"
        style={{
          opacity: isPending || disabled ? 0.6 : 1,
          cursor: isPending || disabled ? "not-allowed" : "pointer",
        }}
      >
        {isPending ? (
          <>
            <FontAwesomeIcon
              icon={faSpinner}
              className="animate-spin"
              style={{ fontSize: "0.875rem" }}
            />
            {pendingLabel}
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faSave} style={{ fontSize: "0.875rem" }} />
            {confirmLabel}
          </>
        )}
      </button>
    </div>
  );
}

function SaveBar({
  onSave,
  isPending,
  label = "Save Changes",
}: {
  onSave: () => void;
  isPending: boolean;
  label?: string;
}) {
  return (
    <div
      className="flex justify-end gap-3 mt-6 pt-5"
      style={{ borderTop: "1px solid var(--color-neutral-200)" }}
    >
      <button className="btn btn-ghost btn-md">Cancel</button>
      <button
        onClick={onSave}
        disabled={isPending}
        className="btn btn-primary btn-md flex items-center gap-2"
        style={{
          opacity: isPending ? 0.6 : 1,
          cursor: isPending ? "not-allowed" : "pointer",
        }}
      >
        {isPending ? (
          <>
            <FontAwesomeIcon
              icon={faSpinner}
              className="animate-spin"
              style={{ fontSize: "0.875rem" }}
            />
            Saving...
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faSave} style={{ fontSize: "0.875rem" }} />
            {label}
          </>
        )}
      </button>
    </div>
  );
}

// ==================================================================================
// TOGGLE SWITCH
// ==================================================================================
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        width: "3rem",
        height: "1.625rem",
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        backgroundColor: checked ? "#1ab189" : "var(--color-neutral-200)",
        transition: "background-color 200ms",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "0.1875rem",
          left: checked ? "calc(100% - 1.3125rem)" : "0.1875rem",
          width: "1.25rem",
          height: "1.25rem",
          borderRadius: "9999px",
          backgroundColor: "white",
          transition: "left 200ms",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
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
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const [isUploadingPortfolioImage, setIsUploadingPortfolioImage] =
    useState(false);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);

  const [editingPortfolio, setEditingPortfolio] =
    useState<PortfolioItem | null>(null);
  const [editingExperience, setEditingExperience] =
    useState<ExperienceItem | null>(null);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [editingSpecialization, setEditingSpecialization] =
    useState<Specialization | null>(null);

  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [portfolioImagePreview, setPortfolioImagePreview] = useState<
    string | null
  >(null);
  const [documentPreviews, setDocumentPreviews] = useState<
    Array<{ file: File; preview: string; name: string }>
  >([]);

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
  // TOAST
  // ==================================================================================
  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ==================================================================================
  // DATA FETCHING
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
      if (response.notification_preferences)
        setNotificationPrefs(response.notification_preferences);
      if (response.user_preferences) setUserPrefs(response.user_preferences);
      return response;
    },
  });

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================
  const updateBasicProfileMutation = useMutation({
    mutationFn: (data: typeof profileForm) =>
      api.put("/api/v1/settings/profile/basic/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      notify("Profile updated successfully!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const updatePublicProfileMutation = useMutation({
    mutationFn: (data: typeof publicProfileForm) =>
      api.put("/api/v1/settings/profile/public/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      notify("Public profile updated!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const updateBusinessInfoMutation = useMutation({
    mutationFn: (data: typeof businessForm) =>
      api.put("/api/v1/settings/business/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      notify("Business info updated!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const createPortfolioMutation = useMutation({
    mutationFn: (data: typeof portfolioForm) =>
      api.post<PortfolioItem>("/api/v1/settings/portfolio/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowPortfolioModal(false);
      resetPortfolioForm();
      notify("Portfolio item added!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const updatePortfolioMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof portfolioForm }) =>
      api.put<PortfolioItem>(`/api/v1/settings/portfolio/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowPortfolioModal(false);
      setEditingPortfolio(null);
      resetPortfolioForm();
      notify("Portfolio item updated!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/settings/portfolio/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      notify("Portfolio item deleted!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const createExperienceMutation = useMutation({
    mutationFn: (data: typeof experienceForm) =>
      api.post<ExperienceItem>("/api/v1/settings/experience/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowExperienceModal(false);
      resetExperienceForm();
      notify("Experience added!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const updateExperienceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof experienceForm }) =>
      api.put<ExperienceItem>(`/api/v1/settings/experience/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowExperienceModal(false);
      setEditingExperience(null);
      resetExperienceForm();
      notify("Experience updated!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/settings/experience/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      notify("Experience entry deleted!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const createLicenseMutation = useMutation({
    mutationFn: (data: typeof licenseForm) =>
      api.post<License>("/api/v1/settings/licenses/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowLicenseModal(false);
      resetLicenseForm();
      notify("License added!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const updateLicenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof licenseForm }) =>
      api.put<License>(`/api/v1/settings/licenses/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowLicenseModal(false);
      setEditingLicense(null);
      resetLicenseForm();
      notify("License updated!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const deleteLicenseMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/settings/licenses/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      notify("License deleted!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const createSpecializationMutation = useMutation({
    mutationFn: (data: typeof specializationForm) =>
      api.post<Specialization>("/api/v1/settings/specializations/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowSpecializationModal(false);
      resetSpecializationForm();
      notify("Specialization added!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const updateSpecializationMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: typeof specializationForm;
    }) =>
      api.put<Specialization>(`/api/v1/settings/specializations/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowSpecializationModal(false);
      setEditingSpecialization(null);
      resetSpecializationForm();
      notify("Specialization updated!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const deleteSpecializationMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/settings/specializations/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      notify("Specialization deleted!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: (data: typeof documentForm) =>
      api.post<VerificationDocument>("/api/v1/settings/documents/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      setShowUploadModal(false);
      resetDocumentForm();
      setDocumentPreviews([]);
      notify("Documents submitted!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const updateNotificationPrefsMutation = useMutation({
    mutationFn: (data: NotificationPreferences) =>
      api.put<NotificationPreferences>("/api/v1/settings/notifications/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      notify("Notification preferences saved!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const updateUserPrefsMutation = useMutation({
    mutationFn: (data: UserPreferences) =>
      api.put<UserPreferences>("/api/v1/settings/preferences/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-settings"] });
      notify("Preferences saved!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: typeof passwordForm) =>
      api.post("/api/v1/auth/password/change/", {
        old_password: data.current_password,
        new_password: data.new_password,
      }),
    onSuccess: () => {
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      notify("Password updated successfully!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  // ==================================================================================
  // IMAGE UPLOAD HANDLERS
  // ==================================================================================
  const handleProfileImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
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
        notify("Profile image uploaded! Save to apply.");
      } else {
        alert(`Upload failed: ${result.error}`);
        URL.revokeObjectURL(preview);
        setProfileImagePreview(null);
      }
    } catch {
      alert("Failed to upload image");
      URL.revokeObjectURL(preview);
      setProfileImagePreview(null);
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  const handleHeroImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
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
        notify("Hero image uploaded! Save to apply.");
      } else {
        alert(`Upload failed: ${result.error}`);
        URL.revokeObjectURL(preview);
        setHeroImagePreview(null);
      }
    } catch {
      alert("Failed to upload image");
      URL.revokeObjectURL(preview);
      setHeroImagePreview(null);
    } finally {
      setIsUploadingHeroImage(false);
    }
  };

  const handlePortfolioImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
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
    } catch {
      alert("Failed to upload image");
      URL.revokeObjectURL(preview);
      setPortfolioImagePreview(null);
    } finally {
      setIsUploadingPortfolioImage(false);
    }
  };

  const handleVerificationDocsSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 10MB`);
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
        notify(`${successfulUploads.length} document(s) uploaded!`);
      } else {
        alert("No documents were uploaded successfully");
        setDocumentPreviews([]);
      }
    } catch {
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
  // RESET HELPERS
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
  const resetExperienceForm = () =>
    setExperienceForm({
      title: "",
      client_name: "",
      completion_date: "",
      description: "",
    });
  const resetLicenseForm = () =>
    setLicenseForm({
      title: "",
      issuer: "",
      license_number: "",
      issue_date: "",
      icon: "faCertificate",
    });
  const resetSpecializationForm = () =>
    setSpecializationForm({
      icon: "faBolt",
      title: "",
      description: "",
      price: "",
    });
  const resetDocumentForm = () =>
    setDocumentForm({
      document_type: "license",
      document_urls: [],
      document_number: "",
      issue_date: "",
      expiry_date: "",
    });

  // ==================================================================================
  // ACTION HANDLERS
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
      alert("Please fill required fields and upload an image");
      return;
    }
    if (editingPortfolio)
      updatePortfolioMutation.mutate({
        id: editingPortfolio.id,
        data: portfolioForm,
      });
    else createPortfolioMutation.mutate(portfolioForm);
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
    if (confirm("Delete this portfolio item?"))
      deletePortfolioMutation.mutate(id);
  };

  const handleAddExperience = () => {
    if (
      !experienceForm.title ||
      !experienceForm.client_name ||
      !experienceForm.completion_date
    ) {
      alert("Please fill required fields");
      return;
    }
    if (editingExperience)
      updateExperienceMutation.mutate({
        id: editingExperience.id,
        data: experienceForm,
      });
    else createExperienceMutation.mutate(experienceForm);
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
    if (confirm("Delete this experience entry?"))
      deleteExperienceMutation.mutate(id);
  };

  const handleAddLicense = () => {
    if (!licenseForm.title || !licenseForm.issuer) {
      alert("Please fill required fields");
      return;
    }
    if (editingLicense)
      updateLicenseMutation.mutate({
        id: editingLicense.id,
        data: licenseForm,
      });
    else createLicenseMutation.mutate(licenseForm);
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
    if (confirm("Delete this license?")) deleteLicenseMutation.mutate(id);
  };

  const handleAddSpecialization = () => {
    if (!specializationForm.title || !specializationForm.description) {
      alert("Please fill required fields");
      return;
    }
    if (editingSpecialization)
      updateSpecializationMutation.mutate({
        id: editingSpecialization.id,
        data: specializationForm,
      });
    else createSpecializationMutation.mutate(specializationForm);
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
    if (confirm("Delete this specialization?"))
      deleteSpecializationMutation.mutate(id);
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
      await api.delete("/api/v1/settings/account/delete/");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      router.push("/join-provider");
    } catch (error: unknown) {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    }
    setShowDeleteModal(false);
  };

  const handleAddAboutParagraph = () =>
    setPublicProfileForm({
      ...publicProfileForm,
      about_paragraphs: [...publicProfileForm.about_paragraphs, ""],
    });
  const handleRemoveAboutParagraph = (index: number) =>
    setPublicProfileForm({
      ...publicProfileForm,
      about_paragraphs: publicProfileForm.about_paragraphs.filter(
        (_, i) => i !== index,
      ),
    });
  const handleUpdateAboutParagraph = (index: number, value: string) => {
    const newParagraphs = [...publicProfileForm.about_paragraphs];
    newParagraphs[index] = value;
    setPublicProfileForm({
      ...publicProfileForm,
      about_paragraphs: newParagraphs,
    });
  };

  // ==================================================================================
  // LOADING / ERROR
  // ==================================================================================
  if (settingsLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
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
            Loading settings…
          </p>
        </div>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#fef2f2" }}
          >
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              style={{ color: "#ef4444", fontSize: "1.1rem" }}
            />
          </div>
          <p className="mb-4" style={{ color: "#ef4444" }}>
            {settingsErrorData instanceof Error
              ? settingsErrorData.message
              : "Failed to load settings"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: faUser },
    { id: "public-profile", label: "Public Profile", icon: faGlobe },
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

  const isAnyUploading =
    isUploadingProfileImage ||
    isUploadingHeroImage ||
    isUploadingPortfolioImage ||
    isUploadingDocuments;

  // ==================================================================================
  // RENDER
  // ==================================================================================
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-neutral-50)" }}
    >
      {/* Toast */}
      {showToast && (
        <div
          className="fixed top-5 right-5 z-[60]"
          style={{ minWidth: "17rem" }}
        >
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-3.5"
            style={{
              backgroundColor: "var(--color-neutral-900)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#1ab189" }}
            >
              <FontAwesomeIcon
                icon={faCheck}
                style={{ color: "white", fontSize: "0.6rem" }}
              />
            </div>
            <p
              className="flex-1 font-medium"
              style={{ fontSize: "0.875rem", color: "white" }}
            >
              {toastMsg}
            </p>
            <button
              onClick={() => setShowToast(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                padding: 0,
              }}
            >
              <FontAwesomeIcon icon={faTimes} style={{ fontSize: "0.75rem" }} />
            </button>
          </div>
        </div>
      )}

      {/* Upload progress toast */}
      {isAnyUploading && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60]">
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-3"
            style={{
              backgroundColor: "var(--color-neutral-900)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
            }}
          >
            <FontAwesomeIcon
              icon={faSpinner}
              className="animate-spin"
              style={{ color: "#1ab189", fontSize: "1rem" }}
            />
            <p
              style={{ fontSize: "0.875rem", color: "white", fontWeight: 500 }}
            >
              Uploading to cloud…
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.125rem 2rem",
        }}
      >
        <h1
          className="font-bold"
          style={{
            fontSize: "1.375rem",
            color: "var(--color-neutral-900)",
            lineHeight: 1.2,
          }}
        >
          Settings
        </h1>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--color-neutral-500)",
            marginTop: "0.125rem",
          }}
        >
          Manage your account settings and preferences
        </p>
      </div>

      <div style={{ padding: "1.75rem 2rem" }}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl sticky top-6"
              style={{
                backgroundColor: "var(--color-neutral-0)",
                border: "1px solid var(--color-neutral-200)",
                padding: "0.75rem",
              }}
            >
              <nav
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                {tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-3 w-full rounded-xl"
                      style={{
                        padding: "0.625rem 0.875rem",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        fontWeight: active ? 600 : 400,
                        backgroundColor: active
                          ? "rgba(26,177,137,0.1)"
                          : "transparent",
                        color: active ? "#1ab189" : "var(--color-neutral-600)",
                        textAlign: "left",
                        transition: "background-color 120ms, color 120ms",
                      }}
                      onMouseEnter={(e) => {
                        if (!active)
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "var(--color-neutral-50)";
                      }}
                      onMouseLeave={(e) => {
                        if (!active)
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "transparent";
                      }}
                    >
                      <FontAwesomeIcon
                        icon={tab.icon}
                        style={{
                          width: "0.875rem",
                          fontSize: "0.8rem",
                          flexShrink: 0,
                        }}
                      />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-5">
            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && settingsData && (
              <SectionCard title="Profile Information">
                {/* Avatar */}
                <div
                  className="flex items-center gap-5 pb-6 mb-6"
                  style={{ borderBottom: "1px solid var(--color-neutral-200)" }}
                >
                  <div className="relative flex-shrink-0">
                    {profileImagePreview || profileForm.profile_image ? (
                      <img
                        src={profileImagePreview || profileForm.profile_image}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl"
                        style={{ backgroundColor: "#1ab189", color: "white" }}
                      >
                        {profileForm.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "?"}
                      </div>
                    )}
                    <button
                      onClick={() => profileImageRef.current?.click()}
                      disabled={isUploadingProfileImage}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--color-neutral-900)",
                        color: "white",
                        border: "2px solid var(--color-neutral-0)",
                        cursor: "pointer",
                      }}
                    >
                      {isUploadingProfileImage ? (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin"
                          style={{ fontSize: "0.6rem" }}
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faCamera}
                          style={{ fontSize: "0.6rem" }}
                        />
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
                    <h3
                      className="font-semibold mb-1"
                      style={{
                        fontSize: "0.9375rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      Profile Photo
                    </h3>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-neutral-500)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Upload a new profile picture (max 5MB)
                    </p>
                    <button
                      onClick={() => profileImageRef.current?.click()}
                      disabled={isUploadingProfileImage}
                      className="btn btn-ghost btn-md flex items-center gap-2"
                      style={{ opacity: isUploadingProfileImage ? 0.6 : 1 }}
                    >
                      <FontAwesomeIcon
                        icon={faCloudUpload}
                        style={{ fontSize: "0.8rem" }}
                      />
                      {isUploadingProfileImage ? "Uploading…" : "Change Photo"}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.25rem",
                  }}
                  className="grid-cols-1 md:grid-cols-2"
                >
                  <FormField label="Full Name" required>
                    <InputWithIcon
                      icon={faUser}
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          full_name: e.target.value,
                        })
                      }
                      placeholder="Your full name"
                    />
                  </FormField>
                  <FormField label="Email Address" required>
                    <InputWithIcon
                      icon={faEnvelope}
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="your@email.com"
                    />
                  </FormField>
                  <FormField label="Phone Number">
                    <InputWithIcon
                      icon={faPhone}
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+1 (555) 000-0000"
                    />
                  </FormField>
                  <FormField label="City">
                    <input
                      style={baseInput}
                      value={profileForm.city}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, city: e.target.value })
                      }
                      placeholder="City"
                      {...focusHandlers}
                    />
                  </FormField>
                </div>
                <div style={{ marginTop: "1.25rem" }}>
                  <FormField label="Address">
                    <InputWithIcon
                      icon={faMapMarkerAlt}
                      type="text"
                      value={profileForm.address}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          address: e.target.value,
                        })
                      }
                      placeholder="Street address"
                    />
                  </FormField>
                </div>
                <div style={{ marginTop: "1.25rem" }}>
                  <FormField label="Bio">
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      rows={4}
                      placeholder="Tell clients about yourself…"
                      style={{ ...baseInput, resize: "none" }}
                      {...focusHandlers}
                    />
                  </FormField>
                </div>
                <SaveBar
                  onSave={handleSaveProfile}
                  isPending={updateBasicProfileMutation.isPending}
                />
              </SectionCard>
            )}

            {/* ── PUBLIC PROFILE TAB ── */}
            {activeTab === "public-profile" && settingsData && (
              <>
                {/* URL banner */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: "rgba(26,177,137,0.06)",
                    border: "1px solid rgba(26,177,137,0.2)",
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3
                        className="font-semibold mb-1"
                        style={{
                          fontSize: "0.9375rem",
                          color: "var(--color-neutral-900)",
                        }}
                      >
                        Your Public Profile
                      </h3>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        karya.com/provider/
                        <strong style={{ color: "#1ab189" }}>
                          {publicProfileForm.slug || "your-slug"}
                        </strong>
                      </p>
                    </div>
                    <button className="btn btn-ghost btn-md flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faEye}
                        style={{ fontSize: "0.8rem" }}
                      />
                      Preview
                    </button>
                  </div>
                </div>

                <SectionCard title="Hero Image">
                  {heroImagePreview || publicProfileForm.hero_image ? (
                    <div className="relative group mb-5">
                      <img
                        src={heroImagePreview || publicProfileForm.hero_image}
                        alt="Hero"
                        className="w-full object-cover rounded-xl"
                        style={{ height: "14rem" }}
                      />
                      <button
                        onClick={() => heroImageRef.current?.click()}
                        disabled={isUploadingHeroImage}
                        className="absolute inset-0 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: "rgba(0,0,0,0)",
                          transition: "background-color 150ms",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "rgba(0,0,0,0.4)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "rgba(0,0,0,0)";
                        }}
                      >
                        <span
                          className="font-semibold flex items-center gap-2"
                          style={{
                            color: "white",
                            opacity: 0,
                            transition: "opacity 150ms",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLSpanElement).style.opacity =
                              "1";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLSpanElement).style.opacity =
                              "0";
                          }}
                        >
                          <FontAwesomeIcon icon={faCloudUpload} />
                          Change Hero Image
                        </span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => heroImageRef.current?.click()}
                      disabled={isUploadingHeroImage}
                      className="w-full flex flex-col items-center justify-center gap-3 rounded-xl mb-5"
                      style={{
                        height: "10rem",
                        border: "2px dashed var(--color-neutral-300)",
                        cursor: "pointer",
                        backgroundColor: "transparent",
                        transition: "border-color 150ms",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "#1ab189";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "var(--color-neutral-300)";
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faCloudUpload}
                        style={{
                          fontSize: "2rem",
                          color: "var(--color-neutral-400)",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-neutral-600)",
                          fontWeight: 500,
                        }}
                      >
                        {isUploadingHeroImage
                          ? "Uploading…"
                          : "Click to upload hero image"}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-neutral-400)",
                        }}
                      >
                        PNG, JPG up to 5MB
                      </p>
                    </button>
                  )}
                  <input
                    ref={heroImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageSelect}
                    className="hidden"
                  />

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1.25rem",
                    }}
                  >
                    <FormField label="Business Name">
                      <input
                        style={baseInput}
                        value={publicProfileForm.business_name}
                        onChange={(e) =>
                          setPublicProfileForm({
                            ...publicProfileForm,
                            business_name: e.target.value,
                          })
                        }
                        placeholder="e.g., Anderson Construction"
                        {...focusHandlers}
                      />
                    </FormField>
                    <FormField label="Profile URL Slug" required>
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--color-neutral-400)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          karya.com/provider/
                        </span>
                        <input
                          style={{ ...baseInput }}
                          value={publicProfileForm.slug}
                          onChange={(e) =>
                            setPublicProfileForm({
                              ...publicProfileForm,
                              slug: e.target.value
                                .toLowerCase()
                                .replace(/\s+/g, "-"),
                            })
                          }
                          placeholder="your-slug"
                          {...focusHandlers}
                        />
                      </div>
                    </FormField>
                  </div>
                </SectionCard>

                <SectionCard title="About Me">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {publicProfileForm.about_paragraphs.map(
                      (paragraph, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <label
                              style={{
                                fontSize: "0.8125rem",
                                fontWeight: 600,
                                color: "var(--color-neutral-700)",
                              }}
                            >
                              Paragraph {index + 1}
                            </label>
                            {publicProfileForm.about_paragraphs.length > 1 && (
                              <button
                                onClick={() =>
                                  handleRemoveAboutParagraph(index)
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "0.8rem",
                                  color: "#dc2626",
                                  fontWeight: 500,
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faTrash}
                                  style={{ marginRight: "0.25rem" }}
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
                            style={{ ...baseInput, resize: "none" }}
                            {...focusHandlers}
                          />
                        </div>
                      ),
                    )}
                    <button
                      onClick={handleAddAboutParagraph}
                      className="w-full rounded-xl flex items-center justify-center gap-2"
                      style={{
                        padding: "0.75rem",
                        border: "2px dashed var(--color-neutral-300)",
                        cursor: "pointer",
                        backgroundColor: "transparent",
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-500)",
                        fontWeight: 500,
                        transition: "border-color 150ms, color 150ms",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "#1ab189";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "#1ab189";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "var(--color-neutral-300)";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "var(--color-neutral-500)";
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faPlus}
                        style={{ fontSize: "0.75rem" }}
                      />
                      Add Paragraph
                    </button>
                  </div>
                  <SaveBar
                    onSave={handleSavePublicProfile}
                    isPending={updatePublicProfileMutation.isPending}
                    label="Save Public Profile"
                  />
                </SectionCard>
              </>
            )}

            {/* ── BUSINESS INFO TAB ── */}
            {activeTab === "business" && settingsData && (
              <SectionCard title="Business Information">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.25rem",
                  }}
                >
                  <FormField label="Business Name">
                    <input
                      style={baseInput}
                      value={businessForm.business_name}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          business_name: e.target.value,
                        })
                      }
                      {...focusHandlers}
                    />
                  </FormField>
                  <FormField label="License Number">
                    <input
                      style={baseInput}
                      value={businessForm.license_number}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          license_number: e.target.value,
                        })
                      }
                      {...focusHandlers}
                    />
                  </FormField>
                  <FormField label="Years of Experience">
                    <input
                      type="number"
                      style={baseInput}
                      value={businessForm.years_of_experience}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          years_of_experience: parseInt(e.target.value) || 0,
                        })
                      }
                      {...focusHandlers}
                    />
                  </FormField>
                  <FormField label="Service Radius (km)">
                    <input
                      type="number"
                      style={baseInput}
                      value={businessForm.service_radius}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          service_radius: parseInt(e.target.value) || 0,
                        })
                      }
                      {...focusHandlers}
                    />
                  </FormField>
                </div>
                <div style={{ marginTop: "1.25rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--color-neutral-700)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Hourly Rate Range ($)
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <input
                      type="number"
                      style={baseInput}
                      value={businessForm.hourly_rate_min}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          hourly_rate_min: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Min"
                      {...focusHandlers}
                    />
                    <input
                      type="number"
                      style={baseInput}
                      value={businessForm.hourly_rate_max}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          hourly_rate_max: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Max"
                      {...focusHandlers}
                    />
                  </div>
                </div>
                <SaveBar
                  onSave={handleSaveBusinessInfo}
                  isPending={updateBusinessInfoMutation.isPending}
                />
              </SectionCard>
            )}

            {/* ── PORTFOLIO TAB ── */}
            {activeTab === "portfolio" && (
              <SectionCard
                title="Portfolio"
                action={
                  <button
                    onClick={() => {
                      resetPortfolioForm();
                      setEditingPortfolio(null);
                      setShowPortfolioModal(true);
                    }}
                    className="btn btn-primary btn-md flex items-center gap-2"
                  >
                    <FontAwesomeIcon
                      icon={faPlus}
                      style={{ fontSize: "0.8rem" }}
                    />
                    Add Item
                  </button>
                }
              >
                {settingsData?.portfolio.length === 0 ? (
                  <div className="text-center" style={{ padding: "3rem" }}>
                    <FontAwesomeIcon
                      icon={faImage}
                      style={{
                        fontSize: "3rem",
                        color: "var(--color-neutral-300)",
                        marginBottom: "1rem",
                      }}
                    />
                    <p
                      className="font-semibold"
                      style={{
                        color: "var(--color-neutral-900)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      No portfolio items yet
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      Add your first item to showcase your work
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1.25rem",
                    }}
                  >
                    {settingsData?.portfolio.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl overflow-hidden"
                        style={{ border: "1px solid var(--color-neutral-200)" }}
                      >
                        <div
                          style={{
                            height: "10rem",
                            backgroundColor: "var(--color-neutral-100)",
                          }}
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FontAwesomeIcon
                                icon={faImage}
                                style={{
                                  fontSize: "2.5rem",
                                  color: "var(--color-neutral-300)",
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <div style={{ padding: "1rem" }}>
                          <h3
                            className="font-semibold"
                            style={{
                              fontSize: "0.9rem",
                              color: "var(--color-neutral-900)",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {item.title}
                          </h3>
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--color-neutral-500)",
                              marginBottom: "0.75rem",
                            }}
                          >
                            {item.category}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditPortfolio(item)}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg"
                              style={{
                                padding: "0.5rem",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                border: "1px solid var(--color-neutral-200)",
                                backgroundColor: "transparent",
                                cursor: "pointer",
                                color: "var(--color-neutral-700)",
                                transition: "background-color 120ms",
                              }}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.backgroundColor =
                                  "var(--color-neutral-50)";
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.backgroundColor = "transparent";
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePortfolio(item.id)}
                              disabled={deletePortfolioMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg"
                              style={{
                                padding: "0.5rem",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                border: "1px solid #fecaca",
                                backgroundColor: "#fef2f2",
                                cursor: "pointer",
                                color: "#dc2626",
                                transition: "background-color 120ms",
                              }}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.backgroundColor = "#fee2e2";
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.backgroundColor = "#fef2f2";
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── EXPERIENCE TAB ── */}
            {activeTab === "experience" && (
              <SectionCard
                title="Experience"
                action={
                  <button
                    onClick={() => {
                      resetExperienceForm();
                      setEditingExperience(null);
                      setShowExperienceModal(true);
                    }}
                    className="btn btn-primary btn-md flex items-center gap-2"
                  >
                    <FontAwesomeIcon
                      icon={faPlus}
                      style={{ fontSize: "0.8rem" }}
                    />
                    Add Entry
                  </button>
                }
              >
                {settingsData?.experience.length === 0 ? (
                  <p
                    className="text-center"
                    style={{
                      padding: "3rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    No experience entries yet
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {settingsData?.experience.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl p-4"
                        style={{
                          backgroundColor: "var(--color-neutral-50)",
                          border: "1px solid var(--color-neutral-200)",
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3
                              className="font-semibold"
                              style={{
                                fontSize: "0.9rem",
                                color: "var(--color-neutral-900)",
                                marginBottom: "0.25rem",
                              }}
                            >
                              {item.title}
                            </h3>
                            <p
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--color-neutral-500)",
                              }}
                            >
                              Client: {item.client_name} · {item.formatted_date}
                            </p>
                            {item.description && (
                              <p
                                style={{
                                  fontSize: "0.8125rem",
                                  color: "var(--color-neutral-700)",
                                  marginTop: "0.5rem",
                                }}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0 ml-4">
                            <button
                              onClick={() => handleEditExperience(item)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                border: "1px solid var(--color-neutral-200)",
                                borderRadius: "0.5rem",
                                backgroundColor: "var(--color-neutral-0)",
                                cursor: "pointer",
                                color: "var(--color-neutral-700)",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteExperience(item.id)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                border: "1px solid #fecaca",
                                borderRadius: "0.5rem",
                                backgroundColor: "#fef2f2",
                                cursor: "pointer",
                                color: "#dc2626",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── LICENSES TAB ── */}
            {activeTab === "licenses" && (
              <SectionCard
                title="Licenses & Certifications"
                action={
                  <button
                    onClick={() => {
                      resetLicenseForm();
                      setEditingLicense(null);
                      setShowLicenseModal(true);
                    }}
                    className="btn btn-primary btn-md flex items-center gap-2"
                  >
                    <FontAwesomeIcon
                      icon={faPlus}
                      style={{ fontSize: "0.8rem" }}
                    />
                    Add License
                  </button>
                }
              >
                {settingsData?.licenses.length === 0 ? (
                  <p
                    className="text-center"
                    style={{
                      padding: "3rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    No licenses added yet
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {settingsData?.licenses.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl p-4"
                        style={{
                          backgroundColor: "var(--color-neutral-50)",
                          border: "1px solid var(--color-neutral-200)",
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: "rgba(26,177,137,0.1)",
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faCertificate}
                                style={{ color: "#1ab189", fontSize: "0.9rem" }}
                              />
                            </div>
                            <div>
                              <h3
                                className="font-semibold"
                                style={{
                                  fontSize: "0.9rem",
                                  color: "var(--color-neutral-900)",
                                }}
                              >
                                {item.title}
                              </h3>
                              <p
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--color-neutral-500)",
                                }}
                              >
                                {item.issuer} · {item.license_number} ·{" "}
                                {item.formatted_issue_date}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 ml-4">
                            <button
                              onClick={() => handleEditLicense(item)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                border: "1px solid var(--color-neutral-200)",
                                borderRadius: "0.5rem",
                                backgroundColor: "var(--color-neutral-0)",
                                cursor: "pointer",
                                color: "var(--color-neutral-700)",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLicense(item.id)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                border: "1px solid #fecaca",
                                borderRadius: "0.5rem",
                                backgroundColor: "#fef2f2",
                                cursor: "pointer",
                                color: "#dc2626",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── SPECIALIZATIONS TAB ── */}
            {activeTab === "specializations" && (
              <SectionCard
                title="Specializations"
                action={
                  <button
                    onClick={() => {
                      resetSpecializationForm();
                      setEditingSpecialization(null);
                      setShowSpecializationModal(true);
                    }}
                    className="btn btn-primary btn-md flex items-center gap-2"
                  >
                    <FontAwesomeIcon
                      icon={faPlus}
                      style={{ fontSize: "0.8rem" }}
                    />
                    Add
                  </button>
                }
              >
                {settingsData?.specializations.length === 0 ? (
                  <p
                    className="text-center"
                    style={{
                      padding: "3rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    No specializations added yet
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {settingsData?.specializations.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl p-4"
                        style={{
                          backgroundColor: "var(--color-neutral-50)",
                          border: "1px solid var(--color-neutral-200)",
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: "rgba(26,177,137,0.1)",
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faBolt}
                                style={{ color: "#1ab189", fontSize: "0.9rem" }}
                              />
                            </div>
                            <div>
                              <h3
                                className="font-semibold"
                                style={{
                                  fontSize: "0.9rem",
                                  color: "var(--color-neutral-900)",
                                }}
                              >
                                {item.title}
                              </h3>
                              <p
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--color-neutral-500)",
                                }}
                              >
                                {item.description}
                              </p>
                              {item.price && (
                                <p
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#1ab189",
                                    fontWeight: 600,
                                    marginTop: "0.25rem",
                                  }}
                                >
                                  {item.price}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 ml-4">
                            <button
                              onClick={() => handleEditSpecialization(item)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                border: "1px solid var(--color-neutral-200)",
                                borderRadius: "0.5rem",
                                backgroundColor: "var(--color-neutral-0)",
                                cursor: "pointer",
                                color: "var(--color-neutral-700)",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteSpecialization(item.id)
                              }
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                border: "1px solid #fecaca",
                                borderRadius: "0.5rem",
                                backgroundColor: "#fef2f2",
                                cursor: "pointer",
                                color: "#dc2626",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {/* ── VERIFICATION TAB ── */}
            {activeTab === "verification" && settingsData && (
              <>
                <SectionCard
                  title="Verification Documents"
                  action={
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="btn btn-primary btn-md flex items-center gap-2"
                    >
                      <FontAwesomeIcon
                        icon={faUpload}
                        style={{ fontSize: "0.8rem" }}
                      />
                      Upload Documents
                    </button>
                  }
                >
                  {settingsData.verification_documents.length === 0 ? (
                    <p
                      className="text-center"
                      style={{
                        padding: "3rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      No documents uploaded yet
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {settingsData.verification_documents.map((doc) => {
                        const s =
                          VERIFICATION_STATUS_STYLES[doc.verification_status] ??
                          VERIFICATION_STATUS_STYLES.pending;
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between rounded-xl p-4"
                            style={{
                              backgroundColor: "var(--color-neutral-50)",
                              border: "1px solid var(--color-neutral-200)",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{
                                  backgroundColor: "rgba(26,177,137,0.1)",
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faFileAlt}
                                  style={{
                                    color: "#1ab189",
                                    fontSize: "0.9rem",
                                  }}
                                />
                              </div>
                              <div>
                                <h3
                                  className="font-semibold"
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "var(--color-neutral-900)",
                                  }}
                                >
                                  {doc.document_type}
                                </h3>
                                <p
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--color-neutral-500)",
                                  }}
                                >
                                  Uploaded:{" "}
                                  {new Date(
                                    doc.upload_date,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span
                              style={{
                                padding: "0.2rem 0.625rem",
                                borderRadius: "9999px",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                backgroundColor: s.bg,
                                color: s.color,
                                border: `1px solid ${s.border}`,
                                textTransform: "capitalize",
                              }}
                            >
                              {doc.verification_status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>
                <div
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: "rgba(26,177,137,0.05)",
                    border: "1px solid rgba(26,177,137,0.2)",
                  }}
                >
                  <h3
                    className="font-semibold flex items-center gap-2 mb-3"
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      style={{ color: "#1ab189" }}
                    />
                    Why Get Verified?
                  </h3>
                  <ul
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    {[
                      "Build trust with potential clients",
                      "Appear higher in search results",
                      "Access premium features",
                      "Display verified badge on your profile",
                    ].map((item) => (
                      <li
                        key={item}
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-neutral-700)",
                        }}
                      >
                        · {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === "security" && (
              <SectionCard title="Change Password">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  {[
                    {
                      key: "current_password" as const,
                      label: "Current Password",
                      field: "current" as const,
                    },
                    {
                      key: "new_password" as const,
                      label: "New Password",
                      field: "new" as const,
                    },
                    {
                      key: "confirm_password" as const,
                      label: "Confirm New Password",
                      field: "confirm" as const,
                    },
                  ].map(({ key, label, field }) => (
                    <FormField key={key} label={label} required>
                      <div className="relative">
                        <FontAwesomeIcon
                          icon={faLock}
                          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{
                            color: "var(--color-neutral-400)",
                            fontSize: "0.8rem",
                          }}
                        />
                        <input
                          type={showPasswordFields[field] ? "text" : "password"}
                          value={passwordForm[key]}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              [key]: e.target.value,
                            })
                          }
                          style={{
                            ...baseInput,
                            paddingLeft: "2.75rem",
                            paddingRight: "3rem",
                          }}
                          {...focusHandlers}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordFields({
                              ...showPasswordFields,
                              [field]: !showPasswordFields[field],
                            })
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--color-neutral-400)",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={
                              showPasswordFields[field] ? faEyeSlash : faEye
                            }
                            style={{ fontSize: "0.875rem" }}
                          />
                        </button>
                      </div>
                    </FormField>
                  ))}
                </div>
                <SaveBar
                  onSave={handleChangePassword}
                  isPending={changePasswordMutation.isPending}
                  label="Update Password"
                />
              </SectionCard>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === "notifications" && notificationPrefs && (
              <SectionCard title="Notification Preferences">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "0" }}
                >
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
                  ].map(({ key, label, desc }, idx, arr) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                      style={{
                        padding: "1rem 0",
                        borderBottom:
                          idx < arr.length - 1
                            ? "1px solid var(--color-neutral-100)"
                            : "none",
                      }}
                    >
                      <div>
                        <h3
                          className="font-semibold"
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--color-neutral-900)",
                            marginBottom: "0.125rem",
                          }}
                        >
                          {label}
                        </h3>
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-neutral-500)",
                          }}
                        >
                          {desc}
                        </p>
                      </div>
                      <Toggle
                        checked={
                          notificationPrefs[
                            key as keyof NotificationPreferences
                          ] as boolean
                        }
                        onChange={(val) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            [key]: val,
                          } as NotificationPreferences)
                        }
                      />
                    </div>
                  ))}
                </div>
                <SaveBar
                  onSave={handleSaveNotifications}
                  isPending={updateNotificationPrefsMutation.isPending}
                  label="Save Preferences"
                />
              </SectionCard>
            )}

            {/* ── PREFERENCES TAB ── */}
            {activeTab === "preferences" && userPrefs && (
              <SectionCard title="General Preferences">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <FormField label="Language">
                    <select
                      style={{
                        ...baseInput,
                        cursor: "pointer",
                        appearance: "none",
                      }}
                      value={userPrefs.language}
                      onChange={(e) =>
                        setUserPrefs({ ...userPrefs, language: e.target.value })
                      }
                      {...focusHandlers}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </FormField>
                  <FormField label="Timezone">
                    <select
                      style={{
                        ...baseInput,
                        cursor: "pointer",
                        appearance: "none",
                      }}
                      value={userPrefs.timezone}
                      onChange={(e) =>
                        setUserPrefs({ ...userPrefs, timezone: e.target.value })
                      }
                      {...focusHandlers}
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
                  </FormField>
                  <FormField label="Date Format">
                    <select
                      style={{
                        ...baseInput,
                        cursor: "pointer",
                        appearance: "none",
                      }}
                      value={userPrefs.date_format}
                      onChange={(e) =>
                        setUserPrefs({
                          ...userPrefs,
                          date_format: e.target.value,
                        })
                      }
                      {...focusHandlers}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </FormField>
                </div>
                <SaveBar
                  onSave={handleSavePreferences}
                  isPending={updateUserPrefsMutation.isPending}
                  label="Save Preferences"
                />
              </SectionCard>
            )}

            {/* ── ACCOUNT TAB ── */}
            {activeTab === "account" && settingsData && (
              <>
                <SectionCard title="Account Information">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {[
                      {
                        label: "Account Created",
                        value: new Date(
                          settingsData.account_info.account_created,
                        ).toLocaleDateString(),
                      },
                      {
                        label: "Last Login",
                        value: settingsData.account_info.last_login
                          ? new Date(
                              settingsData.account_info.last_login,
                            ).toLocaleString()
                          : "Never",
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl p-4"
                        style={{
                          backgroundColor: "var(--color-neutral-50)",
                          border: "1px solid var(--color-neutral-200)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--color-neutral-500)",
                          }}
                        >
                          {label}
                        </span>
                        <span
                          className="font-semibold"
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--color-neutral-900)",
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                    <div
                      className="flex items-center justify-between rounded-xl p-4"
                      style={{
                        backgroundColor: "var(--color-neutral-50)",
                        border: "1px solid var(--color-neutral-200)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        Account Status
                      </span>
                      <span
                        style={{
                          padding: "0.2rem 0.625rem",
                          borderRadius: "9999px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          backgroundColor: "#f0fdf4",
                          color: "#16a34a",
                          border: "1px solid #bbf7d0",
                          textTransform: "capitalize",
                        }}
                      >
                        {settingsData.account_info.account_status}
                      </span>
                    </div>
                  </div>
                </SectionCard>

                <div
                  className="rounded-2xl"
                  style={{ border: "2px solid #fecaca", overflow: "hidden" }}
                >
                  <div
                    style={{
                      padding: "1.25rem 1.5rem",
                      borderBottom: "1px solid #fecaca",
                    }}
                  >
                    <h2
                      className="font-bold"
                      style={{ fontSize: "1rem", color: "#dc2626" }}
                    >
                      Danger Zone
                    </h2>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-neutral-500)",
                        marginTop: "0.25rem",
                      }}
                    >
                      Actions here are permanent and cannot be undone.
                    </p>
                  </div>
                  <div style={{ padding: "1.5rem" }}>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-600)",
                        marginBottom: "1.25rem",
                      }}
                    >
                      Deleting your account will permanently remove all your
                      data including projects, messages, and payment history.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 rounded-xl"
                      style={{
                        padding: "0.625rem 1.25rem",
                        backgroundColor: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        transition: "background-color 120ms",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = "#fee2e2";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = "#fef2f2";
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faTrash}
                        style={{ fontSize: "0.8rem" }}
                      />
                      Delete Account
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================================
          MODALS
      ================================================================================== */}

      {/* Portfolio Modal */}
      {showPortfolioModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-lg w-full my-8"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <h3
                className="font-bold"
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--color-neutral-900)",
                }}
              >
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
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.375rem",
                  borderRadius: "0.5rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: "1rem" }} />
              </button>
            </div>
            <div
              style={{
                padding: "1.5rem",
                maxHeight: "calc(100vh - 240px)",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                <FormField label="Project Image" required>
                  {portfolioImagePreview || portfolioForm.image_url ? (
                    <div className="relative group">
                      <img
                        src={portfolioImagePreview || portfolioForm.image_url}
                        alt="Preview"
                        className="w-full object-cover rounded-xl"
                        style={{ height: "12rem" }}
                      />
                      <button
                        onClick={() => portfolioImageRef.current?.click()}
                        disabled={isUploadingPortfolioImage}
                        className="absolute inset-0 rounded-xl flex items-center justify-center font-semibold"
                        style={{
                          backgroundColor: "rgba(0,0,0,0)",
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          gap: "0.5rem",
                          transition: "background-color 150ms",
                          display: "flex",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "rgba(0,0,0,0.45)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "rgba(0,0,0,0)";
                        }}
                      >
                        <FontAwesomeIcon icon={faCloudUpload} />
                        {isUploadingPortfolioImage
                          ? "Uploading…"
                          : "Change Image"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => portfolioImageRef.current?.click()}
                      disabled={isUploadingPortfolioImage}
                      className="w-full flex flex-col items-center justify-center gap-3 rounded-xl"
                      style={{
                        height: "10rem",
                        border: "2px dashed var(--color-neutral-300)",
                        cursor: "pointer",
                        backgroundColor: "transparent",
                        transition: "border-color 150ms",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "#1ab189";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "var(--color-neutral-300)";
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faCloudUpload}
                        style={{
                          fontSize: "2rem",
                          color: "var(--color-neutral-400)",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-neutral-600)",
                        }}
                      >
                        {isUploadingPortfolioImage
                          ? "Uploading…"
                          : "Click to upload image"}
                      </p>
                    </button>
                  )}
                  <input
                    ref={portfolioImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePortfolioImageSelect}
                    className="hidden"
                  />
                </FormField>
                <FormField label="Project Title" required>
                  <input
                    style={baseInput}
                    value={portfolioForm.title}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Modern Kitchen Remodel"
                    {...focusHandlers}
                  />
                </FormField>
                <FormField label="Category" required>
                  <select
                    style={{
                      ...baseInput,
                      cursor: "pointer",
                      appearance: "none",
                    }}
                    value={portfolioForm.category}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        category: e.target.value,
                      })
                    }
                    {...focusHandlers}
                  >
                    <option value="">Select Category</option>
                    <option>Kitchen</option>
                    <option>Bathroom</option>
                    <option>Living Room</option>
                    <option>Bedroom</option>
                    <option>Exterior</option>
                    <option>Commercial</option>
                  </select>
                </FormField>
                <FormField label="Description">
                  <textarea
                    style={{ ...baseInput, resize: "none" }}
                    value={portfolioForm.description}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Describe the project…"
                    {...focusHandlers}
                  />
                </FormField>
              </div>
            </div>
            <ModalFooter
              onCancel={() => {
                setShowPortfolioModal(false);
                setEditingPortfolio(null);
                resetPortfolioForm();
              }}
              onConfirm={handleAddPortfolio}
              confirmLabel={
                editingPortfolio ? "Update Item" : "Add to Portfolio"
              }
              isPending={
                createPortfolioMutation.isPending ||
                updatePortfolioMutation.isPending
              }
              pendingLabel={editingPortfolio ? "Updating…" : "Adding…"}
              disabled={isUploadingPortfolioImage}
            />
          </div>
        </div>
      )}

      {/* Experience Modal */}
      {showExperienceModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-lg w-full"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <h3
                className="font-bold"
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                {editingExperience ? "Edit Experience" : "Add Experience"}
              </h3>
              <button
                onClick={() => {
                  setShowExperienceModal(false);
                  setEditingExperience(null);
                  resetExperienceForm();
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                }}
              >
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: "1rem" }} />
              </button>
            </div>
            <div
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <FormField label="Project Title" required>
                <input
                  style={baseInput}
                  value={experienceForm.title}
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      title: e.target.value,
                    })
                  }
                  {...focusHandlers}
                />
              </FormField>
              <FormField label="Client Name" required>
                <input
                  style={baseInput}
                  value={experienceForm.client_name}
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      client_name: e.target.value,
                    })
                  }
                  {...focusHandlers}
                />
              </FormField>
              <FormField label="Completion Date" required>
                <input
                  type="date"
                  style={baseInput}
                  value={experienceForm.completion_date}
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      completion_date: e.target.value,
                    })
                  }
                  {...focusHandlers}
                />
              </FormField>
              <FormField label="Description">
                <textarea
                  style={{ ...baseInput, resize: "none" }}
                  value={experienceForm.description}
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  {...focusHandlers}
                />
              </FormField>
            </div>
            <ModalFooter
              onCancel={() => {
                setShowExperienceModal(false);
                setEditingExperience(null);
                resetExperienceForm();
              }}
              onConfirm={handleAddExperience}
              confirmLabel={editingExperience ? "Update" : "Add Experience"}
              isPending={
                createExperienceMutation.isPending ||
                updateExperienceMutation.isPending
              }
              pendingLabel={editingExperience ? "Updating…" : "Adding…"}
            />
          </div>
        </div>
      )}

      {/* License Modal */}
      {showLicenseModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-lg w-full"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <h3
                className="font-bold"
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                {editingLicense ? "Edit License" : "Add License"}
              </h3>
              <button
                onClick={() => {
                  setShowLicenseModal(false);
                  setEditingLicense(null);
                  resetLicenseForm();
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                }}
              >
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: "1rem" }} />
              </button>
            </div>
            <div
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <FormField label="Title" required>
                <input
                  style={baseInput}
                  value={licenseForm.title}
                  onChange={(e) =>
                    setLicenseForm({ ...licenseForm, title: e.target.value })
                  }
                  {...focusHandlers}
                />
              </FormField>
              <FormField label="Issuer" required>
                <input
                  style={baseInput}
                  value={licenseForm.issuer}
                  onChange={(e) =>
                    setLicenseForm({ ...licenseForm, issuer: e.target.value })
                  }
                  {...focusHandlers}
                />
              </FormField>
              <FormField label="License Number">
                <input
                  style={baseInput}
                  value={licenseForm.license_number}
                  onChange={(e) =>
                    setLicenseForm({
                      ...licenseForm,
                      license_number: e.target.value,
                    })
                  }
                  {...focusHandlers}
                />
              </FormField>
              <FormField label="Issue Date">
                <input
                  type="date"
                  style={baseInput}
                  value={licenseForm.issue_date}
                  onChange={(e) =>
                    setLicenseForm({
                      ...licenseForm,
                      issue_date: e.target.value,
                    })
                  }
                  {...focusHandlers}
                />
              </FormField>
            </div>
            <ModalFooter
              onCancel={() => {
                setShowLicenseModal(false);
                setEditingLicense(null);
                resetLicenseForm();
              }}
              onConfirm={handleAddLicense}
              confirmLabel={editingLicense ? "Update" : "Add License"}
              isPending={
                createLicenseMutation.isPending ||
                updateLicenseMutation.isPending
              }
              pendingLabel={editingLicense ? "Updating…" : "Adding…"}
            />
          </div>
        </div>
      )}

      {/* Specialization Modal */}
      {showSpecializationModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-lg w-full"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <h3
                className="font-bold"
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--color-neutral-900)",
                }}
              >
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
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                }}
              >
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: "1rem" }} />
              </button>
            </div>
            <div
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <FormField label="Title" required>
                <input
                  style={baseInput}
                  value={specializationForm.title}
                  onChange={(e) =>
                    setSpecializationForm({
                      ...specializationForm,
                      title: e.target.value,
                    })
                  }
                  {...focusHandlers}
                />
              </FormField>
              <FormField label="Description" required>
                <textarea
                  style={{ ...baseInput, resize: "none" }}
                  value={specializationForm.description}
                  onChange={(e) =>
                    setSpecializationForm({
                      ...specializationForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  {...focusHandlers}
                />
              </FormField>
              <FormField label="Price (Optional)">
                <input
                  style={baseInput}
                  value={specializationForm.price}
                  onChange={(e) =>
                    setSpecializationForm({
                      ...specializationForm,
                      price: e.target.value,
                    })
                  }
                  placeholder="e.g., $50/hr or Fixed $500"
                  {...focusHandlers}
                />
              </FormField>
            </div>
            <ModalFooter
              onCancel={() => {
                setShowSpecializationModal(false);
                setEditingSpecialization(null);
                resetSpecializationForm();
              }}
              onConfirm={handleAddSpecialization}
              confirmLabel={
                editingSpecialization ? "Update" : "Add Specialization"
              }
              isPending={
                createSpecializationMutation.isPending ||
                updateSpecializationMutation.isPending
              }
              pendingLabel={editingSpecialization ? "Updating…" : "Adding…"}
            />
          </div>
        </div>
      )}

      {/* Upload Verification Docs Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-lg w-full my-8"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <h3
                className="font-bold"
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                Upload Verification Documents
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetDocumentForm();
                  setDocumentPreviews([]);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                }}
              >
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: "1rem" }} />
              </button>
            </div>
            <div
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                maxHeight: "calc(100vh - 240px)",
                overflowY: "auto",
              }}
            >
              <FormField label="Documents" required>
                {documentPreviews.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {documentPreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-xl p-3"
                        style={{
                          backgroundColor: "var(--color-neutral-50)",
                          border: "1px solid var(--color-neutral-200)",
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                        >
                          <FontAwesomeIcon
                            icon={faFileAlt}
                            style={{ color: "#1ab189", fontSize: "0.8rem" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-medium truncate"
                            style={{
                              fontSize: "0.8125rem",
                              color: "var(--color-neutral-900)",
                            }}
                          >
                            {preview.name}
                          </p>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-neutral-400)",
                            }}
                          >
                            {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => removeDocumentPreview(index)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#dc2626",
                            padding: "0.25rem",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faTimes}
                            style={{ fontSize: "0.8rem" }}
                          />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => verificationDocsRef.current?.click()}
                      disabled={isUploadingDocuments}
                      className="w-full rounded-xl flex items-center justify-center gap-2"
                      style={{
                        padding: "0.625rem",
                        border: "1px solid var(--color-neutral-200)",
                        cursor: "pointer",
                        backgroundColor: "transparent",
                        fontSize: "0.8125rem",
                        color: "var(--color-neutral-500)",
                        fontWeight: 500,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faPlus}
                        style={{ fontSize: "0.75rem" }}
                      />
                      Add More
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => verificationDocsRef.current?.click()}
                    disabled={isUploadingDocuments}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl"
                    style={{
                      height: "8rem",
                      border: "2px dashed var(--color-neutral-300)",
                      cursor: "pointer",
                      backgroundColor: "transparent",
                      transition: "border-color 150ms",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "#1ab189";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-neutral-300)";
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCloudUpload}
                      style={{
                        fontSize: "1.75rem",
                        color: "var(--color-neutral-400)",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-600)",
                        fontWeight: 500,
                      }}
                    >
                      {isUploadingDocuments
                        ? "Uploading…"
                        : "Click to upload documents"}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-neutral-400)",
                      }}
                    >
                      PDF, JPG, PNG up to 10MB each
                    </p>
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
              </FormField>

              <FormField label="Document Type" required>
                <select
                  style={{
                    ...baseInput,
                    cursor: "pointer",
                    appearance: "none",
                  }}
                  value={documentForm.document_type}
                  onChange={(e) =>
                    setDocumentForm({
                      ...documentForm,
                      document_type: e.target.value,
                    })
                  }
                  {...focusHandlers}
                >
                  <option value="license">Business License</option>
                  <option value="insurance">Insurance Certificate</option>
                  <option value="certification">
                    Professional Certification
                  </option>
                  <option value="id">Tax ID Document</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
              <FormField label="Document Number">
                <input
                  style={baseInput}
                  value={documentForm.document_number}
                  onChange={(e) =>
                    setDocumentForm({
                      ...documentForm,
                      document_number: e.target.value,
                    })
                  }
                  placeholder="Enter document number…"
                  {...focusHandlers}
                />
              </FormField>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <FormField label="Issue Date">
                  <input
                    type="date"
                    style={baseInput}
                    value={documentForm.issue_date}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        issue_date: e.target.value,
                      })
                    }
                    {...focusHandlers}
                  />
                </FormField>
                <FormField label="Expiry Date">
                  <input
                    type="date"
                    style={baseInput}
                    value={documentForm.expiry_date}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        expiry_date: e.target.value,
                      })
                    }
                    {...focusHandlers}
                  />
                </FormField>
              </div>
            </div>
            <ModalFooter
              onCancel={() => {
                setShowUploadModal(false);
                resetDocumentForm();
                setDocumentPreviews([]);
              }}
              onConfirm={handleUploadVerification}
              confirmLabel="Submit Documents"
              isPending={uploadDocumentMutation.isPending}
              pendingLabel="Submitting…"
              disabled={isUploadingDocuments}
            />
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-md w-full"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ padding: "1.75rem" }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#fef2f2" }}
              >
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  style={{ color: "#ef4444", fontSize: "1.1rem" }}
                />
              </div>
              <h3
                className="font-semibold text-center mb-2"
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--color-neutral-900)",
                }}
              >
                Delete Account?
              </h3>
              <p
                className="text-center mb-4"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-neutral-500)",
                }}
              >
                This action is permanent and cannot be reversed.
              </p>
              <div
                className="rounded-xl p-4 mb-5"
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "#dc2626",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  This will permanently delete:
                </p>
                <ul
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  {[
                    "All profile information",
                    "Project data and history",
                    "Messages and communications",
                    "Payment records",
                  ].map((item) => (
                    <li
                      key={item}
                      style={{ fontSize: "0.8rem", color: "#dc2626" }}
                    >
                      · {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-ghost btn-md flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="btn btn-md flex-1 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "#b91c1c";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "#dc2626";
                  }}
                >
                  <FontAwesomeIcon
                    icon={faTrash}
                    style={{ fontSize: "0.875rem" }}
                  />
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
