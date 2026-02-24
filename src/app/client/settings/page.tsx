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
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faExclamationTriangle,
  faTimes,
  faCheckCircle,
  faSpinner,
  faCloudUpload,
  faShield,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { uploadImage } from "@/lib/storageService";

// ==================================================================================
// TYPE DEFINITIONS
// ==================================================================================
interface ClientProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  profile_image: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
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

interface AllClientSettingsData {
  profile: ClientProfile;
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
export default function ClientSettingsPage() {
  const queryClient = useQueryClient();
  const profileImageRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    profile_image: "",
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
  // FETCH ALL SETTINGS DATA
  // ==================================================================================
  const {
    data: settingsData,
    isLoading: settingsLoading,
    isError: settingsError,
    error: settingsErrorData,
  } = useQuery<AllClientSettingsData>({
    queryKey: ["all-client-settings"],
    queryFn: async () => {
      const response = await api.get<AllClientSettingsData>(
        "/api/v1/client/settings/all/",
      );
      if (response.profile) {
        setProfileForm({
          full_name: response.profile.full_name || "",
          email: response.profile.email || "",
          phone: response.profile.phone || "",
          address: response.profile.address || "",
          city: response.profile.city || "",
          state: response.profile.state || "",
          postal_code: response.profile.postal_code || "",
          profile_image: response.profile.profile_image || "",
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
  // MUTATIONS
  // ==================================================================================
  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileForm) =>
      api.put("/api/v1/client/settings/profile/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-client-settings"] });
      notify("Profile updated successfully!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const updateNotificationPrefsMutation = useMutation({
    mutationFn: (data: NotificationPreferences) =>
      api.put<NotificationPreferences>(
        "/api/v1/client/settings/notifications/",
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-client-settings"] });
      notify("Notification preferences saved!");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    },
  });

  const updateUserPrefsMutation = useMutation({
    mutationFn: (data: UserPreferences) =>
      api.put<UserPreferences>("/api/v1/client/settings/preferences/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-client-settings"] });
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
        new_password_confirm: data.confirm_password,
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
  // IMAGE UPLOAD HANDLER
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
      const result = await uploadImage(file, { folder: "client_profiles" });
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

  // ==================================================================================
  // ACTION HANDLERS
  // ==================================================================================
  const handleSaveProfile = () => updateProfileMutation.mutate(profileForm);

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
    if (passwordForm.new_password.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete("/api/v1/client/settings/account/delete/");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/";
    } catch (error: unknown) {
      const e = error as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message}`);
    }
    setShowDeleteModal(false);
  };

  // ==================================================================================
  // LOADING & ERROR STATES
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
    { id: "security", label: "Security", icon: faLock },
    { id: "notifications", label: "Notifications", icon: faBell },
    { id: "preferences", label: "Preferences", icon: faGlobe },
    { id: "account", label: "Account", icon: faShield },
  ];

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
      {isUploadingProfileImage && (
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

                {/* Form Fields */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.25rem",
                  }}
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
                  <FormField label="Street Address">
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

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.25rem",
                    marginTop: "1.25rem",
                  }}
                >
                  <FormField label="State">
                    <input
                      style={baseInput}
                      value={profileForm.state}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          state: e.target.value,
                        })
                      }
                      placeholder="State"
                      {...focusHandlers}
                    />
                  </FormField>
                  <FormField label="Zip Code">
                    <input
                      style={baseInput}
                      value={profileForm.postal_code}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          postal_code: e.target.value,
                        })
                      }
                      placeholder="Postal code"
                      {...focusHandlers}
                    />
                  </FormField>
                </div>

                <SaveBar
                  onSave={handleSaveProfile}
                  isPending={updateProfileMutation.isPending}
                />
              </SectionCard>
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
                  {(
                    [
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
                    ] as const
                  ).map(({ key, label, field }) => (
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
                      {key === "new_password" && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-neutral-400)",
                            marginTop: "0.375rem",
                          }}
                        >
                          Minimum 8 characters
                        </p>
                      )}
                      {key === "confirm_password" &&
                        passwordForm.confirm_password &&
                        passwordForm.new_password !==
                          passwordForm.confirm_password && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#dc2626",
                              marginTop: "0.375rem",
                            }}
                          >
                            Passwords do not match
                          </p>
                        )}
                    </FormField>
                  ))}

                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: "rgba(26,177,137,0.06)",
                      border: "1px solid rgba(26,177,137,0.2)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "#1ab189",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>
                        <strong>Password Tips:</strong> Use a combination of
                        uppercase and lowercase letters, numbers, and special
                        characters for better security.
                      </span>
                    </p>
                  </div>
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
                  {(
                    [
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
                        desc: "Get notified when providers post daily updates",
                      },
                      {
                        key: "payment_alerts",
                        label: "Payment Alerts",
                        desc: "Receive reminders for upcoming payments",
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
                    ] as const
                  ).map(({ key, label, desc }, idx, arr) => (
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
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
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
                      data including project history, messages, and reviews.
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

      {/* ── DELETE ACCOUNT MODAL ── */}
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
                    "Messages and communications",
                    "Reviews you've written",
                    "All other associated data",
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
