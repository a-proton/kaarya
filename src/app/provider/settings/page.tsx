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
  faCheck,
  faImage,
  faUpload,
  faCertificate,
  faFileAlt,
  faCheckCircle,
  faEdit,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Profile state
  const [fullName, setFullName] = useState("John Anderson");
  const [email, setEmail] = useState("john.anderson@example.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [company, setCompany] = useState("Anderson Construction");
  const [location, setLocation] = useState("Los Angeles, CA");
  const [bio, setBio] = useState(
    "Experienced contractor specializing in residential and commercial projects."
  );

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);

  // Preferences state
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");

  // Business Info state
  const [businessName, setBusinessName] = useState("Anderson Construction");
  const [yearsExperience, setYearsExperience] = useState("15");
  const [serviceRadius, setServiceRadius] = useState("50");
  const [hourlyRateMin, setHourlyRateMin] = useState("75");
  const [hourlyRateMax, setHourlyRateMax] = useState("150");
  const [licenseNumber, setLicenseNumber] = useState("CA-123456");

  // Verification state
  const [verificationDocs, setVerificationDocs] = useState([
    {
      id: "1",
      type: "Business License",
      status: "Verified",
      uploadDate: "2024-01-15",
    },
    {
      id: "2",
      type: "Insurance Certificate",
      status: "Pending",
      uploadDate: "2024-03-10",
    },
  ]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState([
    {
      id: "1",
      title: "Modern Kitchen Remodel",
      category: "Kitchen",
      imageUrl: "",
    },
    {
      id: "2",
      title: "Bathroom Renovation",
      category: "Bathroom",
      imageUrl: "",
    },
  ]);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  // Public Profile state
  const [profileTitle, setProfileTitle] = useState(
    "Licensed Master Electrician"
  );
  const [profileSlug, setProfileSlug] = useState("john-anderson-electrician");
  const [aboutParagraphs, setAboutParagraphs] = useState([
    "With over 15 years of experience in residential and commercial electrical work, I take pride in delivering safe, efficient, and high-quality electrical solutions.",
  ]);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [publicServices, setPublicServices] = useState([
    "Panel Upgrades",
    "Emergency Repairs",
    "Smart Home",
  ]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newService, setNewService] = useState("");

  const handleSaveProfile = () => {
    console.log("Saving profile...", {
      fullName,
      email,
      phone,
      company,
      location,
      bio,
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

  const handleDeleteAccount = () => {
    console.log("Deleting account...");
    alert(
      "Account deletion request submitted. You will receive a confirmation email."
    );
    setShowDeleteModal(false);
  };

  const handleSaveBusinessInfo = () => {
    console.log("Saving business info...");
    alert("Business information updated successfully!");
  };

  const handleUploadVerification = () => {
    console.log("Uploading verification document...");
    alert("Document uploaded for verification!");
    setShowUploadModal(false);
  };

  const handleAddPortfolio = () => {
    console.log("Adding portfolio item...");
    alert("Portfolio item added successfully!");
    setShowPortfolioModal(false);
  };

  const handleSavePublicProfile = () => {
    console.log("Saving public profile...");
    alert("Public profile updated successfully!");
  };

  const handleAddService = () => {
    if (newService.trim()) {
      setPublicServices([...publicServices, newService.trim()]);
      setNewService("");
      setShowServiceModal(false);
    }
  };

  const handleRemoveService = (index: number) => {
    setPublicServices(publicServices.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: faUser },
    { id: "public-profile", label: "My Public Profile", icon: faGlobe },
    { id: "business", label: "Business Info", icon: faBriefcase },
    { id: "verification", label: "Verification", icon: faShield },
    { id: "portfolio", label: "Portfolio", icon: faImage },
    { id: "security", label: "Security", icon: faLock },
    { id: "notifications", label: "Notifications", icon: faBell },
    { id: "preferences", label: "Preferences", icon: faGlobe },
    { id: "account", label: "Account", icon: faShield },
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
                    <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center text-neutral-0 text-3xl font-semibold">
                      JA
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
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
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

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Company
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
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Location
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                      />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                    />
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

            {/* My Public Profile Tab */}
            {activeTab === "public-profile" && (
              <div className="space-y-6">
                {/* Preview Card */}
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
                    Profile URL: karya.com/services/{profileSlug}
                  </div>
                </div>

                {/* Profile Title & Slug */}
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                  <h2 className="heading-3 text-neutral-900 mb-6">
                    Basic Information
                  </h2>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Professional Title{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileTitle}
                        onChange={(e) => setProfileTitle(e.target.value)}
                        placeholder="e.g., Licensed Master Electrician"
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
                          value={profileSlug}
                          onChange={(e) =>
                            setProfileSlug(
                              e.target.value.toLowerCase().replace(/\s+/g, "-")
                            )
                          }
                          placeholder="your-name-profession"
                          className="flex-1 px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                        />
                      </div>
                      <p className="text-neutral-500 text-sm mt-1">
                        Choose a unique URL for your profile (letters, numbers,
                        and hyphens only)
                      </p>
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Hero Banner Image
                      </label>
                      <div className="space-y-3">
                        {heroImageUrl ? (
                          <div className="relative">
                            <img
                              src={heroImageUrl}
                              alt="Hero banner preview"
                              className="w-full h-48 object-cover rounded-lg border border-neutral-200"
                            />
                            <button
                              onClick={() => setHeroImageUrl("")}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-neutral-0 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setHeroImageUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                              id="hero-image-upload"
                            />
                            <label
                              htmlFor="hero-image-upload"
                              className="cursor-pointer"
                            >
                              <FontAwesomeIcon
                                icon={faImage}
                                className="text-4xl text-neutral-400 mb-3"
                              />
                              <p className="text-neutral-700 font-medium mb-1">
                                Click to upload banner image
                              </p>
                              <p className="text-neutral-500 text-sm">
                                PNG, JPG up to 10MB (1200x400px recommended)
                              </p>
                            </label>
                          </div>
                        )}
                      </div>
                      <p className="text-neutral-500 text-sm mt-2">
                        This banner appears at the top of your public profile
                        page
                      </p>
                    </div>
                  </div>
                </div>

                {/* About Me Section */}
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                  <h2 className="heading-3 text-neutral-900 mb-6">About Me</h2>
                  <div className="space-y-4">
                    {aboutParagraphs.map((paragraph, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-neutral-700 font-semibold body-small">
                            Paragraph {index + 1}
                          </label>
                          {aboutParagraphs.length > 1 && (
                            <button
                              onClick={() =>
                                setAboutParagraphs(
                                  aboutParagraphs.filter((_, i) => i !== index)
                                )
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
                          onChange={(e) => {
                            const newParagraphs = [...aboutParagraphs];
                            newParagraphs[index] = e.target.value;
                            setAboutParagraphs(newParagraphs);
                          }}
                          rows={4}
                          className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setAboutParagraphs([...aboutParagraphs, ""])
                      }
                      className="w-full py-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-primary-500 hover:text-primary-600 transition-colors font-medium"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add Paragraph
                    </button>
                  </div>
                </div>

                {/* Services Offered */}
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="heading-3 text-neutral-900">
                      Services Offered
                    </h2>
                    <button
                      onClick={() => setShowServiceModal(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      Add Service
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {publicServices.map((service, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 bg-primary-50 border border-primary-200 text-primary-700 rounded-lg font-medium flex items-center gap-2"
                      >
                        <span>{service}</span>
                        <button
                          onClick={() => handleRemoveService(index)}
                          className="hover:text-primary-900 transition-colors"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {publicServices.length === 0 && (
                    <p className="text-neutral-500 text-center py-8">
                      No services added yet. Click "Add Service" to get started.
                    </p>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-3">
                  <button className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleSavePublicProfile}
                    className="btn-primary"
                  >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Save Public Profile
                  </button>
                </div>
              </div>
            )}

            {/* Business Info Tab */}
            {activeTab === "business" && (
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
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Service Radius (km)
                      </label>
                      <input
                        type="number"
                        value={serviceRadius}
                        onChange={(e) => setServiceRadius(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                    </div>
                  </div>

                  {/* Hourly Rate Range */}
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Hourly Rate Range ($)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          value={hourlyRateMin}
                          onChange={(e) => setHourlyRateMin(e.target.value)}
                          placeholder="Min"
                          className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={hourlyRateMax}
                          onChange={(e) => setHourlyRateMax(e.target.value)}
                          placeholder="Max"
                          className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleSaveBusinessInfo}
                    className="btn-primary"
                  >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === "verification" && (
              <div className="space-y-6">
                {/* Verification Status */}
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
                      Upload Document
                    </button>
                  </div>

                  <div className="space-y-4">
                    {verificationDocs.map((doc) => (
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
                              {doc.type}
                            </h3>
                            <p className="text-neutral-600 text-sm">
                              Uploaded:{" "}
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
                            doc.status === "Verified"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Info */}
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
                  {portfolioItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="h-48 bg-neutral-100 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faImage}
                          className="text-neutral-400 text-5xl"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-neutral-600 text-sm mb-3">
                          {item.category}
                        </p>
                        <div className="flex items-center gap-2">
                          <button className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium">
                            <FontAwesomeIcon icon={faEdit} className="mr-2" />
                            Edit
                          </button>
                          <button className="flex-1 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
                            <FontAwesomeIcon icon={faTrash} className="mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Change Password */}
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
                      className="btn-primary"
                    >
                      <FontAwesomeIcon icon={faLock} className="mr-2" />
                      Update Password
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
                  <h2 className="heading-3 text-neutral-900 mb-2">
                    Two-Factor Authentication
                  </h2>
                  <p className="text-neutral-600 body-regular mb-6">
                    Add an extra layer of security to your account
                  </p>
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faShield}
                          className="text-green-600 text-xl"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {twoFactorEnabled ? "Enabled" : "Disabled"}
                        </p>
                        <p className="text-neutral-600 text-sm">
                          {twoFactorEnabled
                            ? "Your account is protected"
                            : "Enable for better security"}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={twoFactorEnabled}
                        onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-0 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-neutral-0 after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
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
                        Get notified about project status changes
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

                  {/* Payment Alerts */}
                  <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        Payment Alerts
                      </h3>
                      <p className="text-neutral-600 text-sm">
                        Receive alerts for new payments and invoices
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentAlerts}
                        onChange={(e) => setPaymentAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-0 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-neutral-0 after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Message Notifications */}
                  <div className="flex items-center justify-between">
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

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                {/* Account Information */}
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
                          January 15, 2024
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="text-neutral-600 text-sm mb-1">
                          Account Status
                        </p>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold border border-green-200">
                          Active
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="text-neutral-600 text-sm mb-1">
                          Last Login
                        </p>
                        <p className="font-semibold text-neutral-900">
                          Today at 10:30 AM
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
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
            {/* Modal Header */}
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

            {/* Modal Content */}
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

            {/* Modal Footer */}
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

      {/* Upload Verification Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
              <h3 className="heading-4 text-neutral-900">
                Upload Verification Document
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer">
                    <option>Business License</option>
                    <option>Insurance Certificate</option>
                    <option>Professional Certification</option>
                    <option>Tax ID Document</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Document Number
                  </label>
                  <input
                    type="text"
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
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Upload Document <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                    <FontAwesomeIcon
                      icon={faUpload}
                      className="text-4xl text-neutral-400 mb-3"
                    />
                    <p className="text-neutral-700 font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-neutral-500 text-sm">
                      PDF, PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadVerification}
                className="btn-primary flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faUpload} />
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Portfolio Item Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
              <h3 className="heading-4 text-neutral-900">Add Portfolio Item</h3>
              <button
                onClick={() => setShowPortfolioModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Modern Kitchen Remodel"
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer">
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
                    placeholder="Describe the project..."
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Upload Image <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                    <FontAwesomeIcon
                      icon={faImage}
                      className="text-4xl text-neutral-400 mb-3"
                    />
                    <p className="text-neutral-700 font-medium mb-1">
                      Click to upload project image
                    </p>
                    <p className="text-neutral-500 text-sm">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPortfolioModal(false)}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPortfolio}
                className="btn-primary flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add to Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
              <h3 className="heading-4 text-neutral-900">Add Service</h3>
              <button
                onClick={() => {
                  setShowServiceModal(false);
                  setNewService("");
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div>
                <label className="block text-neutral-700 font-semibold mb-2 body-small">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="e.g., Panel Upgrades, Emergency Repairs"
                  className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddService();
                    }
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowServiceModal(false);
                  setNewService("");
                }}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                className="btn-primary flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
