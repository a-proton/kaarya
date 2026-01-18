// app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { forgotPassword } from "@/lib/auth";

interface ForgotPasswordFormData {
  email: string;
}

interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setToast(null);

      const response = await forgotPassword(data.email.toLowerCase().trim());

      if (response.success) {
        setSubmittedEmail(data.email);
        setEmailSent(true);
        setToast({
          type: "success",
          message: response.message,
        });
      } else {
        setToast({
          type: "error",
          message: response.message || "Failed to send reset email",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Network error. Please try again.",
      });
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setSubmittedEmail("");
    reset();
    setToast(null);
  };

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
          {/* Card */}
          <div className="rounded-2xl shadow-xl p-8 bg-white border border-neutral-100">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-key text-2xl text-primary-600"></i>
              </div>
              <h2 className="text-3xl font-bold mb-2 text-neutral-800">
                Forgot Password?
              </h2>
              <p className="text-sm text-neutral-500">
                {emailSent
                  ? "Check your email for reset instructions"
                  : "No worries, we'll send you reset instructions"}
              </p>
            </div>

            {!emailSent ? (
              // Email Form
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold mb-2 text-neutral-700"
                  >
                    Email Address
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
                      placeholder="you@example.com"
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-500 text-white py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-300 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <i className="fas fa-paper-plane"></i>
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
              <div className="space-y-5">
                {/* Email Sent Icon */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <i className="fas fa-envelope-circle-check text-5xl text-green-500 mb-4"></i>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Email Sent!
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
                    We've sent a password reset link to:
                  </p>
                  <p className="text-sm font-semibold text-green-800 bg-white px-4 py-2 rounded-lg">
                    {submittedEmail}
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <i className="fas fa-info-circle"></i>
                    Next Steps
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <i className="fas fa-check text-blue-500 mt-1"></i>
                      <span>Check your email inbox and spam folder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="fas fa-check text-blue-500 mt-1"></i>
                      <span>Click the reset link (expires in 1 hour)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="fas fa-check text-blue-500 mt-1"></i>
                      <span>Create a new password</span>
                    </li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleTryAgain}
                    className="w-full bg-neutral-100 text-neutral-700 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-neutral-200 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-redo"></i>
                    Send to Different Email
                  </button>

                  <Link
                    href="/login?type=provider"
                    className="block w-full text-center bg-primary-500 text-white py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Back to Login
                  </Link>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-neutral-100">
              <p className="text-xs text-center text-neutral-500">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={handleTryAgain}
                  className="text-primary-500 hover:underline font-semibold"
                >
                  try again
                </button>
              </p>
            </div>

            {/* Help Section */}
            <div className="mt-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <h4 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                <i className="fas fa-question-circle text-neutral-500"></i>
                Need Help?
              </h4>
              <p className="text-xs text-neutral-600">
                If you're having trouble resetting your password, please contact
                our support team at{" "}
                <a
                  href="mailto:support@kaarya.com"
                  className="text-primary-500 hover:underline font-semibold"
                >
                  support@kaarya.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
