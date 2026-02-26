"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

interface FormData {
  fullName: string;
  businessName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  city: string;
  password: string;
  confirmPassword: string;
  serviceCategory: string;
}

interface Category {
  id: number;
  name: string;
}

export default function JoinProviderPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      countryCode: "+977",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const response = await fetch(`${API_BASE_URL}/api/v1/categories/`);

        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        } else {
          console.error("Failed to fetch categories");
          // Fallback categories if API fails
          setCategories([
            { id: 1, name: "Electrical Services" },
            { id: 2, name: "Plumbing Services" },
            { id: 3, name: "HVAC Services" },
            { id: 4, name: "Carpentry" },
            { id: 5, name: "Painting" },
            { id: 6, name: "Cleaning Services" },
            { id: 7, name: "Gardening & Landscaping" },
            { id: 8, name: "Other" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback categories
        setCategories([
          { id: 1, name: "Electrical Services" },
          { id: 2, name: "Plumbing Services" },
          { id: 3, name: "HVAC Services" },
          { id: 4, name: "Carpentry" },
          { id: 5, name: "Painting" },
          { id: 6, name: "Cleaning Services" },
          { id: 7, name: "Gardening & Landscaping" },
          { id: 8, name: "Other" },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      setApiError("");
      setSuccessMessage("");

      // Prepare the request payload matching Django backend structure
      const payload = {
        email: data.email,
        phone: data.phoneNumber,
        country_code: data.countryCode,
        country: data.countryCode === "+977" ? "Nepal" : "Other",
        password: data.password,
        password_confirm: data.confirmPassword,
        full_name: data.fullName,
        business_name: data.businessName,
        category_id: parseInt(data.serviceCategory),
        city: data.city,
      };

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/register/provider/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors from backend
        if (result.errors || result.error || result.message) {
          const errorMessage =
            result.message ||
            result.error ||
            (typeof result.errors === "string"
              ? result.errors
              : JSON.stringify(result.errors));
          throw new Error(errorMessage);
        }
        throw new Error("Registration failed. Please try again.");
      }

      // Success - show message and redirect
      setSuccessMessage("Registration successful! Redirecting to login...");

      // Store any token if provided
      if (result.token || result.access_token || result.access) {
        localStorage.setItem(
          "authToken",
          result.token || result.access_token || result.access,
        );
      }

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login?type=provider&registered=true");
      }, 2000);
    } catch (error) {
      console.error("Provider registration error:", error);
      setApiError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.",
      );
    }
  };

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return "";
    if (pwd.length < 6) return "Weak";
    if (pwd.length < 10) return "Medium";
    return "Strong";
  };

  const getPasswordStrengthColor = (strength: string) => {
    if (strength === "Weak") return "text-error";
    if (strength === "Medium") return "text-warning";
    return "text-success";
  };

  const password = watch("password", "");
  const passwordStrength = calculatePasswordStrength(password);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      <div className="min-h-screen py-12 px-4 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block group">
              <h1 className="text-4xl font-bold text-primary-500 mb-1 transition-transform duration-300 group-hover:scale-105">
                Get Started Now
              </h1>
            </Link>
            <p className="text-sm mt-3 text-neutral-600">
              Already have an account?{" "}
              <Link
                href="/login?type=provider"
                className="font-semibold text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200">
              <div className="flex items-start gap-3">
                <i className="fas fa-exclamation-circle text-red-500 text-xl mt-0.5"></i>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">
                    Registration Error
                  </h3>
                  <p className="text-sm text-red-700">{apiError}</p>
                </div>
                <button
                  onClick={() => setApiError("")}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-green-50 border-2 border-green-200">
              <div className="flex items-start gap-3">
                <i className="fas fa-check-circle text-green-500 text-xl mt-0.5"></i>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 mb-1">
                    Success!
                  </h3>
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Single Unified Card */}
          <div className="rounded-2xl shadow-xl overflow-hidden bg-white border border-neutral-100">
            <div className="grid lg:grid-cols-[1.2fr_1fr]">
              {/* Left Side - Form */}
              <div className="p-8 lg:p-12">
                <h2 className="text-3xl font-bold mb-2 text-neutral-800">
                  Join Karya as a Provider
                </h2>
                <p className="text-sm mb-8 text-neutral-600">
                  Connect with clients in your area and grow your business with
                  Nepal&apos;s trusted service platform
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-semibold mb-2 text-neutral-700"
                    >
                      Full Name <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-primary-500"></i>
                      <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        {...register("fullName", {
                          required: "Full name is required",
                          minLength: {
                            value: 2,
                            message: "Name must be at least 2 characters",
                          },
                        })}
                        placeholder="Enter your full name"
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 ${
                          errors.fullName
                            ? "border-error focus:border-error focus:ring-4 focus:ring-error/10"
                            : "border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        } bg-white focus:outline-none`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-xs text-error mt-1.5 ml-1 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Business Name */}
                  <div>
                    <label
                      htmlFor="businessName"
                      className="block text-sm font-semibold mb-2 text-neutral-700"
                    >
                      Business Name <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <i className="fas fa-store absolute left-4 top-1/2 -translate-y-1/2 text-primary-500"></i>
                      <input
                        id="businessName"
                        type="text"
                        autoComplete="organization"
                        {...register("businessName", {
                          required: "Business name is required",
                          minLength: {
                            value: 2,
                            message:
                              "Business name must be at least 2 characters",
                          },
                        })}
                        placeholder="Enter your business name"
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 ${
                          errors.businessName
                            ? "border-error focus:border-error focus:ring-4 focus:ring-error/10"
                            : "border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        } bg-white focus:outline-none`}
                      />
                    </div>
                    {errors.businessName && (
                      <p className="text-xs text-error mt-1.5 ml-1 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.businessName.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold mb-2 text-neutral-700"
                    >
                      Email Address <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-primary-500"></i>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                          },
                        })}
                        placeholder="your.email@example.com"
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 ${
                          errors.email
                            ? "border-error focus:border-error focus:ring-4 focus:ring-error/10"
                            : "border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        } bg-white focus:outline-none`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-error mt-1.5 ml-1 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-semibold mb-2 text-neutral-700"
                    >
                      Phone Number <span className="text-error">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="countryCode"
                        {...register("countryCode")}
                        className="px-3 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-neutral-700 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                      >
                        <option value="+977">🇳🇵 +977</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                      </select>
                      <div className="relative flex-1">
                        <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-primary-500"></i>
                        <input
                          id="phoneNumber"
                          type="tel"
                          autoComplete="tel"
                          {...register("phoneNumber", {
                            required: "Phone number is required",
                            pattern: {
                              value: /^[0-9]{10}$/,
                              message: "Phone number must be 10 digits",
                            },
                          })}
                          placeholder="9876543210"
                          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 ${
                            errors.phoneNumber
                              ? "border-error focus:border-error focus:ring-4 focus:ring-error/10"
                              : "border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                          } bg-white focus:outline-none`}
                        />
                      </div>
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-xs text-error mt-1.5 ml-1 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-semibold mb-2 text-neutral-700"
                    >
                      City <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-primary-500"></i>
                      <input
                        id="city"
                        type="text"
                        autoComplete="address-level2"
                        {...register("city", {
                          required: "City is required",
                          minLength: {
                            value: 2,
                            message: "City must be at least 2 characters",
                          },
                        })}
                        placeholder="Enter your city"
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 ${
                          errors.city
                            ? "border-error focus:border-error focus:ring-4 focus:ring-error/10"
                            : "border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        } bg-white focus:outline-none`}
                      />
                    </div>
                    {errors.city && (
                      <p className="text-xs text-error mt-1.5 ml-1 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold mb-2 text-neutral-700"
                    >
                      Password <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-primary-500"></i>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        {...register("password", {
                          required: "Password is required",
                          minLength: {
                            value: 8,
                            message: "Password must be at least 8 characters",
                          },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message:
                              "Password must contain uppercase, lowercase, and number",
                          },
                        })}
                        placeholder="Create a strong password"
                        className={`w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all duration-300 ${
                          errors.password
                            ? "border-error focus:border-error focus:ring-4 focus:ring-error/10"
                            : "border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        } bg-white focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors duration-200"
                      >
                        <i
                          className={`fas ${
                            showPassword ? "fa-eye-slash" : "fa-eye"
                          }`}
                        ></i>
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-error mt-1.5 ml-1 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.password.message}
                      </p>
                    )}
                    {password && !errors.password && passwordStrength && (
                      <p
                        className={`text-xs mt-1.5 ml-1 flex items-center gap-1 ${getPasswordStrengthColor(
                          passwordStrength,
                        )}`}
                      >
                        <i className="fas fa-shield-alt"></i>
                        Password strength: {passwordStrength}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-semibold mb-2 text-neutral-700"
                    >
                      Confirm Password <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-primary-500"></i>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        {...register("confirmPassword", {
                          required: "Please confirm your password",
                          validate: (value) =>
                            value === password || "Passwords do not match",
                        })}
                        placeholder="Re-enter your password"
                        className={`w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all duration-300 ${
                          errors.confirmPassword
                            ? "border-error focus:border-error focus:ring-4 focus:ring-error/10"
                            : "border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        } bg-white focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        title={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors duration-200"
                      >
                        <i
                          className={`fas ${
                            showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                          }`}
                        ></i>
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-error mt-1.5 ml-1 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Service Category - Dynamic from Backend */}
                  <div>
                    <label
                      htmlFor="serviceCategory"
                      className="block text-sm font-semibold mb-2 text-neutral-700"
                    >
                      Service Category <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <i className="fas fa-briefcase absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 pointer-events-none"></i>
                      <select
                        id="serviceCategory"
                        {...register("serviceCategory", {
                          required: "Please select a service category",
                        })}
                        disabled={loadingCategories}
                        className={`w-full pl-12 pr-10 py-3.5 rounded-xl border-2 transition-all duration-300 ${
                          errors.serviceCategory
                            ? "border-error focus:border-error focus:ring-4 focus:ring-error/10"
                            : "border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        } bg-white focus:outline-none appearance-none cursor-pointer text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="">
                          {loadingCategories
                            ? "Loading categories..."
                            : "Select your primary service"}
                        </option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"></i>
                    </div>
                    {errors.serviceCategory && (
                      <p className="text-xs text-error mt-1.5 ml-1 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.serviceCategory.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || loadingCategories}
                    className="w-full bg-primary-500 text-white py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-300 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 mt-6"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Provider Account</span>
                        <i className="fas fa-arrow-right"></i>
                      </>
                    )}
                  </button>

                  {/* Terms */}
                  <p className="text-xs text-center text-neutral-500 mt-4">
                    By creating an account, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="font-semibold text-primary-500 hover:underline transition-colors duration-200"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-semibold text-primary-500 hover:underline transition-colors duration-200"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </form>
              </div>

              {/* Right Side - Benefits (Green Background) */}
              <div className="p-8 lg:p-12 bg-primary">
                <div className="text-center mb-8">
                  <div className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 bg-white/20 backdrop-blur-sm">
                    <i className="fas fa-users text-6xl text-white"></i>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-2 bg-white/20 backdrop-blur-sm">
                    <i className="fas fa-check-circle text-white"></i>
                    <span className="text-sm font-semibold text-white">
                      VERIFIED
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-8 text-center text-white">
                  Why Join Karya?
                </h3>

                <div className="space-y-4">
                  {/* Benefit 1 */}
                  <div className="flex gap-4 p-5 rounded-xl bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-white/20">
                      <i className="fas fa-users text-xl text-white"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 text-white">
                        Join 5,000+ Verified Providers
                      </h4>
                      <p className="text-sm text-white/90">
                        Connect with clients who trust Karya for quality service
                        professionals across Nepal
                      </p>
                    </div>
                  </div>

                  {/* Benefit 2 */}
                  <div className="flex gap-4 p-5 rounded-xl bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-white/20">
                      <i className="fas fa-calendar-check text-xl text-white"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 text-white">
                        Average 15 Jobs per Month
                      </h4>
                      <p className="text-sm text-white/90">
                        Our active providers receive consistent job
                        opportunities in their service area with competitive
                        rates
                      </p>
                    </div>
                  </div>

                  {/* Benefit 3 */}
                  <div className="flex gap-4 p-5 rounded-xl bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-white/20">
                      <i className="fas fa-star text-xl text-white"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 text-white">
                        4.8★ Average Rating
                      </h4>
                      <p className="text-sm text-white/90">
                        Build your reputation with our verified review system
                        and showcase your expertise
                      </p>
                    </div>
                  </div>

                  {/* Benefit 4 */}
                  <div className="flex gap-4 p-5 rounded-xl bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-white/20">
                      <i className="fas fa-shield-alt text-xl text-white"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 text-white">
                        Secure Payments
                      </h4>
                      <p className="text-sm text-white/90">
                        Get paid securely and on time through our trusted
                        payment platform
                      </p>
                    </div>
                  </div>

                  {/* Benefit 5 */}
                  <div className="flex gap-4 p-5 rounded-xl bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-white/20">
                      <i className="fas fa-headset text-xl text-white"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 text-white">
                        24/7 Support Team
                      </h4>
                      <p className="text-sm text-white/90">
                        Get assistance anytime with our dedicated support team
                        ready to help you succeed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
