// app/reset-password/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { verifyResetToken, resetPassword } from "@/lib/auth";

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>();

  const password = watch("password");

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setIsVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        await verifyResetToken(token);
        setIsValidToken(true);
      } catch (error) {
        console.error("Token verification error:", error);
        setIsValidToken(false);
        setToast({
          type: "error",
          message: "Invalid or expired reset link",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setToast({
        type: "error",
        message: "Invalid reset token",
      });
      return;
    }

    try {
      setToast(null);

      const response = await resetPassword(
        token,
        data.password,
        data.confirmPassword,
      );

      if (response.success) {
        setResetSuccess(true);
        setToast({
          type: "success",
          message: "Password reset successful!",
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login?type=provider");
        }, 3000);
      } else {
        setToast({
          type: "error",
          message: response.message || "Failed to reset password",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to reset password. Please try again.",
      });
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">
            Verifying reset link...
          </p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="w-full max-w-md">
          <div className="rounded-2xl shadow-xl p-8 bg-white border border-neutral-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-neutral-800">
                Invalid Reset Link
              </h2>
              <p className="text-neutral-600 mb-6">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>

              <div className="space-y-3">
                <Link
                  href="/forgot-password"
                  className="block w-full bg-primary-500 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Request New Link
                </Link>

                <Link
                  href="/login?type=provider"
                  className="block w-full bg-neutral-100 text-neutral-700 py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-neutral-200"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

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
          <div className="rounded-2xl shadow-xl p-8 bg-white border border-neutral-100">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-lock text-2xl text-primary-600"></i>
              </div>
              <h2 className="text-3xl font-bold mb-2 text-neutral-800">
                {resetSuccess ? "Password Reset!" : "Create New Password"}
              </h2>
              <p className="text-sm text-neutral-500">
                {resetSuccess
                  ? "Redirecting you to login..."
                  : "Enter your new password below"}
              </p>
            </div>

            {!resetSuccess ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold mb-2 text-neutral-700"
                  >
                    New Password
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
                          value: /^(?=.*[A-Za-z])(?=.*\d)/,
                          message: "Password must contain letters and numbers",
                        },
                      })}
                      placeholder="Enter new password"
                      className={`w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all duration-300 ${
                        errors.password
                          ? "border-error focus:border-error focus:ring-4 focus:ring-error/10"
                          : "border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                      } bg-white focus:outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      <i
                        className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                      ></i>
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-error mt-1.5 ml-1 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {errors.password.message}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1.5 ml-1">
                    Must be at least 8 characters with letters and numbers
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold mb-2 text-neutral-700"
                  >
                    Confirm Password
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
                      placeholder="Re-enter new password"
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      <i
                        className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-500 text-white py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-300 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <i className="fas fa-check"></i>
                    </>
                  )}
                </button>

                {/* Back to Login */}
                <div className="text-center">
                  <Link
                    href="/login?type=provider"
                    className="text-sm font-semibold text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200 inline-flex items-center gap-2"
                  >
                    <i className="fas fa-arrow-left"></i>
                    Back to Login
                  </Link>
                </div>
              </form>
            ) : (
              // Success State
              <div className="text-center space-y-5">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <i className="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Password Reset Successfully!
                  </h3>
                  <p className="text-sm text-green-700">
                    Your password has been updated. You can now login with your
                    new password.
                  </p>
                </div>

                <Link
                  href="/login?type=provider"
                  className="block w-full bg-primary-500 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Go to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
