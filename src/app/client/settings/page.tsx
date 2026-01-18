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
  faBriefcase,
  faSpinner,
  faCloudUpload,
  faShield,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { uploadImage } from "@/lib/storageService";

// ==================================================================================
// TYPE DEFINITIONS
// ==================================================================================
interface User {
  id: number;
  email: string;
  phone: string;
  user_type: string;
}

interface ClientProfile {
  id: number;
  full_name: string;
  email: string; // Added - comes from user.email in serializer
  phone: string; // Added - comes from user.phone in serializer
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
// MAIN COMPONENT
// ==================================================================================
export default function ClientSettingsPage() {
  const queryClient = useQueryClient();
  const profileImageRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Upload states
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

  // Preview states
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );

  // Form states
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

      // Initialize profile form with data from response
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
  // MUTATIONS - PROFILE
  // ==================================================================================
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      return api.put("/api/v1/client/settings/profile/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-client-settings"] });
      alert("Profile updated successfully!");
    },
    onError: (error: any) => {
      alert(`Failed to update profile: ${error.data?.detail || error.message}`);
    },
  });

  // ==================================================================================
  // MUTATIONS - NOTIFICATION & USER PREFERENCES
  // ==================================================================================
  const updateNotificationPrefsMutation = useMutation({
    mutationFn: async (data: NotificationPreferences) => {
      return api.put<NotificationPreferences>(
        "/api/v1/client/settings/notifications/",
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-client-settings"] });
      alert("Notification preferences updated successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to update preferences: ${error.data?.detail || error.message}`,
      );
    },
  });

  const updateUserPrefsMutation = useMutation({
    mutationFn: async (data: UserPreferences) => {
      return api.put<UserPreferences>(
        "/api/v1/client/settings/preferences/",
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-client-settings"] });
      alert("Preferences updated successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to update preferences: ${error.data?.detail || error.message}`,
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
        new_password_confirm: data.confirm_password,
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
        `Failed to change password: ${error.data?.detail || error.message}`,
      );
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
      const result = await uploadImage(file, { folder: "client_profiles" });
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

  // ==================================================================================
  // HANDLERS
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
    } catch (error: any) {
      alert(`Failed to delete account: ${error.data?.detail || error.message}`);
    }
    setShowDeleteModal(false);
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
      {isUploadingProfileImage && (
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

                {/* Profile Picture */}
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-neutral-200">
                  <div className="relative">
                    {profileImagePreview || profileForm.profile_image ? (
                      <img
                        src={profileImagePreview || profileForm.profile_image}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-neutral-0 text-3xl font-semibold">
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

                {/* Form Fields */}
                <div className="space-y-5">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Street Address
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        State
                      </label>
                      <input
                        type="text"
                        value={profileForm.state}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            state: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={profileForm.postal_code}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            postal_code: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? (
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

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <h2 className="heading-3 text-neutral-900 mb-2">
                  Change Password
                </h2>
                <p className="text-neutral-600 mb-6">
                  Update your password to keep your account secure
                </p>

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
                        type={showPasswordFields.current ? "text" : "password"}
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
                          icon={showPasswordFields.current ? faEyeSlash : faEye}
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
                    <p className="text-neutral-500 text-sm mt-1">
                      Minimum 8 characters
                    </p>
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
                        type={showPasswordFields.confirm ? "text" : "password"}
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
                          icon={showPasswordFields.confirm ? faEyeSlash : faEye}
                        />
                      </button>
                    </div>
                    {passwordForm.confirm_password &&
                      passwordForm.new_password !==
                        passwordForm.confirm_password && (
                        <p className="text-red-600 text-sm mt-1">
                          Passwords do not match
                        </p>
                      )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 text-sm">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      <strong>Password Tips:</strong> Use a combination of
                      uppercase and lowercase letters, numbers, and special
                      characters for better security.
                    </p>
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
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between pb-6 border-b border-neutral-200 last:border-0"
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
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
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
                            settingsData.account_info.account_created,
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
                                settingsData.account_info.last_login,
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
                  <li>• Messages and communications</li>
                  <li>• Reviews you've written</li>
                  <li>• All other associated data</li>
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
