"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faBell,
  faGlobe,
  faSave,
  faCamera,
  faEye,
  faEyeSlash,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faTimes,
  faCheckCircle,
  faBriefcase,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

export default function ClientSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Profile state
  const [fullName, setFullName] = useState("John Smith");
  const [email, setEmail] = useState("john.smith@email.com");
  const [phone, setPhone] = useState("+1 (555) 987-6543");
  const [company, setCompany] = useState("Smith Construction LLC");
  const [address, setAddress] = useState("123 Main Street");
  const [city, setCity] = useState("Los Angeles");
  const [state, setState] = useState("CA");
  const [zipCode, setZipCode] = useState("90001");

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [milestoneAlerts, setMilestoneAlerts] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);

  // Preferences state
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");

  const handleSaveProfile = () => {
    console.log("Saving profile...", {
      fullName,
      email,
      phone,
      company,
      address,
      city,
      state,
      zipCode,
    });
    alert("Profile updated successfully!");
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }
    console.log("Changing password...");
    alert("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveNotifications = () => {
    console.log("Saving notification preferences...");
    alert("Notification preferences updated!");
  };

  const handleSavePreferences = () => {
    console.log("Saving preferences...");
    alert("Preferences updated!");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: faUser },
    { id: "security", label: "Security", icon: faLock },
    { id: "notifications", label: "Notifications", icon: faBell },
    { id: "preferences", label: "Preferences", icon: faGlobe },
  ];

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
            {activeTab === "profile" && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <h2 className="heading-3 text-neutral-900 mb-6">
                  Profile Information
                </h2>

                {/* Profile Picture */}
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-neutral-200">
                  <div className="relative">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-neutral-0 text-3xl font-semibold">
                      JS
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-neutral-900 text-neutral-0 rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors">
                      <FontAwesomeIcon icon={faCamera} className="text-sm" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      Profile Photo
                    </h3>
                    <p className="text-neutral-600 text-sm mb-3">
                      Upload a new profile picture
                    </p>
                    <button className="btn-secondary text-sm">
                      Change Photo
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
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
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
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
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
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Company Name
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faBriefcase}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                      />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
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
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
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
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button className="btn-secondary">Cancel</button>
                  <button onClick={handleSaveProfile} className="btn-primary">
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Save Changes
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
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
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
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {confirmPassword && newPassword !== confirmPassword && (
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
                    className="btn-primary"
                  >
                    <FontAwesomeIcon icon={faLock} className="mr-2" />
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                <h2 className="heading-3 text-neutral-900 mb-6">
                  Notification Preferences
                </h2>
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        Email Notifications
                      </h3>
                      <p className="text-neutral-600 text-sm">
                        Receive notifications via email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) =>
                          setEmailNotifications(e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-0 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-neutral-0 after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* SMS Notifications */}
                  <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        SMS Notifications
                      </h3>
                      <p className="text-neutral-600 text-sm">
                        Receive notifications via text message
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-0 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-neutral-0 after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Project Updates */}
                  <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        Project Updates
                      </h3>
                      <p className="text-neutral-600 text-sm">
                        Get notified when providers post daily updates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={projectUpdates}
                        onChange={(e) => setProjectUpdates(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-0 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-neutral-0 after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Milestone Alerts */}
                  <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        Milestone Alerts
                      </h3>
                      <p className="text-neutral-600 text-sm">
                        Get notified about milestone completions and delays
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={milestoneAlerts}
                        onChange={(e) => setMilestoneAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-0 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-neutral-0 after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Message Notifications */}
                  <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        Message Notifications
                      </h3>
                      <p className="text-neutral-600 text-sm">
                        Get notified about new messages
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={messageNotifications}
                        onChange={(e) =>
                          setMessageNotifications(e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-0 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-neutral-0 after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Payment Reminders */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        Payment Reminders
                      </h3>
                      <p className="text-neutral-600 text-sm">
                        Receive reminders for upcoming payments
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentReminders}
                        onChange={(e) => setPaymentReminders(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-0 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-neutral-0 after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleSaveNotifications}
                    className="btn-primary"
                  >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
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
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Chinese</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
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
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                    >
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleSavePreferences}
                    className="btn-primary"
                  >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
