// app/login/page.tsx
"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  login,
  storeTokens,
  extractAccessToken,
  extractRefreshToken,
  storeUserProfile,
} from "@/lib/auth";
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

type AccountType = "user" | "provider";

interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountType = searchParams.get("type") as AccountType | null;
  const registered = searchParams.get("registered");

  const [activeTab, setActiveTab] = useState<AccountType>(
    accountType === "provider" ? "provider" : "user",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    defaultValues: {
      rememberMe: false,
    },
  });

  // Show registration success message
  useEffect(() => {
    if (registered === "true") {
      setToast({
        type: "success",
        message: "Registration successful! Please sign in to continue.",
      });
    }
  }, [registered]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleTabChange = (tab: AccountType) => {
    setActiveTab(tab);
    reset();
    setShowPassword(false);
    setToast(null);
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setToast(null);

      // Call login API
      const response = await login(data.email, data.password);

      // Check if user data exists
      if (!response.data?.user) {
        throw new Error("Invalid response format from server");
      }

      const userType = response.data.user.user_type;

      // ==================== USER TYPE VALIDATION ====================
      // Prevent providers from logging in through User tab
      if (activeTab === "user" && userType === "service_provider") {
        setToast({
          type: "error",
          message:
            "Service providers cannot log in here. Please use the Provider login tab.",
        });
        return;
      }

      // Prevent clients from logging in through Provider tab
      if (activeTab === "provider" && userType === "client") {
        setToast({
          type: "error",
          message: "Clients cannot log in here. Please use the User login tab.",
        });
        return;
      }

      // Validate that only clients can use User tab
      if (activeTab === "user" && userType !== "client") {
        setToast({
          type: "error",
          message:
            "Only clients can log in through this tab. Please contact your service provider for login credentials.",
        });
        return;
      }

      // Validate that only providers can use Provider tab
      if (activeTab === "provider" && userType !== "service_provider") {
        setToast({
          type: "error",
          message: "Only service providers can log in through this tab.",
        });
        return;
      }
      // ==================== END VALIDATION ====================

      // Extract tokens
      const accessToken = extractAccessToken(response);
      const refreshToken = extractRefreshToken(response);

      if (!accessToken) {
        throw new Error("No access token received from server");
      }

      // Store tokens
      storeTokens(accessToken, refreshToken || undefined);

      // Store user profile
      if (response.data?.profile && response.data?.user) {
        const userProfile = {
          id: response.data.user.id,
          email: response.data.user.email,
          phone: response.data.user.phone,
          full_name: response.data.profile.full_name,
          business_name: response.data.profile.business_name,
          profile_image: response.data.profile.profile_image,
          initials: response.data.profile.initials,
          user_type: response.data.user.user_type,
          category_name: response.data.profile.category_name,
        };

        storeUserProfile(userProfile);
      } else {
        throw new Error("Invalid response format from server");
      }

      // Show success toast
      setToast({
        type: "success",
        message: "Login successful! Redirecting...",
      });

      // Redirect based on user_type
      setTimeout(() => {
        if (userType === "service_provider") {
          router.push("/provider/dashboard");
        } else if (userType === "client") {
          router.push("/client/dashboard");
        } else {
          setToast({
            type: "error",
            message: "Unknown account type. Please contact support.",
          });
        }
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Login failed. Please check your credentials.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div
            className={`max-w-md p-4 rounded-xl shadow-lg border-2 ${
              toast.type === "success"
                ? "bg-green-50 border-green-200"
                : toast.type === "error"
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <i
                className={`fas ${
                  toast.type === "success"
                    ? "fa-check-circle text-green-500"
                    : toast.type === "error"
                      ? "fa-exclamation-circle text-red-500"
                      : "fa-info-circle text-blue-500"
                } text-xl mt-0.5`}
              ></i>
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-1 ${
                    toast.type === "success"
                      ? "text-green-800"
                      : toast.type === "error"
                        ? "text-red-800"
                        : "text-blue-800"
                  }`}
                >
                  {toast.type === "success"
                    ? "Success!"
                    : toast.type === "error"
                      ? "Error"
                      : "Info"}
                </h3>
                <p
                  className={`text-sm ${
                    toast.type === "success"
                      ? "text-green-700"
                      : toast.type === "error"
                        ? "text-red-700"
                        : "text-blue-700"
                  }`}
                >
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => setToast(null)}
                className={`${
                  toast.type === "success"
                    ? "text-green-400 hover:text-green-600"
                    : toast.type === "error"
                      ? "text-red-400 hover:text-red-600"
                      : "text-blue-400 hover:text-blue-600"
                } transition-colors`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="rounded-2xl shadow-xl p-8 bg-white border border-neutral-100">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-center mb-2 text-neutral-800">
              Welcome Back
            </h2>
            <p className="text-sm text-center text-neutral-500">
              Sign in to access your account
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl p-1.5 mb-6 bg-neutral-100 shadow-inner">
            <button
              type="button"
              onClick={() => handleTabChange("user")}
              title="Switch to User Login"
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === "user"
                  ? "bg-white text-primary-600 shadow-md"
                  : "text-neutral-600 hover:text-neutral-800"
              }`}
            >
              <i className="fas fa-user mr-2"></i>
              User
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("provider")}
              title="Switch to Provider Login"
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === "provider"
                  ? "bg-white text-primary-600 shadow-md"
                  : "text-neutral-600 hover:text-neutral-800"
              }`}
            >
              <i className="fas fa-briefcase mr-2"></i>
              Provider
            </button>
          </div>

          {/* Social Login Buttons (Provider Only) */}
          {activeTab === "provider" && (
            <>
              <button
                type="button"
                title="Sign in with Google"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl mb-3 border-2 border-neutral-200 bg-white transition-all duration-300 hover:shadow-md hover:border-neutral-300 hover:-translate-y-0.5"
              >
                <i className="fab fa-google text-xl text-[#4285F4]"></i>
                <span className="text-sm font-semibold text-neutral-700">
                  Continue with Google
                </span>
              </button>

              <button
                type="button"
                title="Sign in with Apple"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl mb-6 bg-neutral-900 text-white transition-all duration-300 hover:bg-neutral-800 hover:-translate-y-0.5 hover:shadow-md"
              >
                <i className="fab fa-apple text-xl"></i>
                <span className="text-sm font-semibold">
                  Continue with Apple
                </span>
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-neutral-500 font-medium">
                    or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2 text-neutral-700"
              >
                {activeTab === "user" ? "Username or Email" : "Email Address"}
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-primary-500"></i>
                <input
                  id="email"
                  type="text"
                  autoComplete={activeTab === "user" ? "username" : "email"}
                  {...register("email", {
                    required: `${
                      activeTab === "user" ? "Username/Email" : "Email"
                    } is required`,
                    ...(activeTab === "provider" && {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    }),
                  })}
                  placeholder={
                    activeTab === "user"
                      ? "Enter your username"
                      : "you@example.com"
                  }
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

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2 text-neutral-700"
              >
                Password
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-primary-500"></i>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  placeholder="Enter your password"
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
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="w-4 h-4 rounded cursor-pointer accent-primary-500 border-neutral-300"
                />
                <span className="text-sm text-neutral-600 group-hover:text-neutral-800 transition-colors duration-200">
                  Remember for 30 days
                </span>
              </label>
              {activeTab === "provider" && (
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-500 text-white py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-300 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <i className="fas fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6">
            {activeTab === "provider" && (
              <p className="text-sm text-center text-neutral-600">
                New to Kaarya?{" "}
                <Link
                  href="/join-provider"
                  className="font-semibold text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200"
                >
                  Create an account
                </Link>
              </p>
            )}

            {activeTab === "user" && (
              <div className="p-4 rounded-xl text-center bg-blue-50 border border-blue-100">
                <i className="fas fa-info-circle text-blue-500 mb-2 text-lg"></i>
                <p className="text-sm text-neutral-700">
                  Don&apos;t have credentials? Contact your service provider to
                  receive your login details.
                </p>
              </div>
            )}

            {activeTab === "provider" && (
              <p className="text-xs text-center mt-6 text-neutral-400 leading-relaxed">
                Protected by reCAPTCHA. By signing in, you agree to our{" "}
                <Link
                  href="/privacy"
                  className="text-primary-500 hover:underline transition-colors duration-200"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/terms"
                  className="text-primary-500 hover:underline transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </>
  );
}
