"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faEnvelope,
  faPhone,
  faUser,
  faCommentDots,
  faPaperPlane,
  faCheckCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: number;
  providerName: string;
}

interface FormData {
  client_name: string;
  client_email: string;
  client_phone: string;
  message_text: string;
  service_type: string;
}

export default function InquiryModal({
  isOpen,
  onClose,
  providerId,
  providerName,
}: InquiryModalProps) {
  const [formData, setFormData] = useState<FormData>({
    client_name: "",
    client_email: "",
    client_phone: "",
    message_text: "",
    service_type: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/messages/inquiries/submit/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_provider_id: providerId,
            ...formData,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setFormData({
            client_name: "",
            client_email: "",
            client_phone: "",
            message_text: "",
            service_type: "",
          });
        }, 3000);
      } else {
        // Handle validation errors
        if (data.client_name) {
          setError(data.client_name[0]);
        } else if (data.client_email) {
          setError(data.client_email[0]);
        } else if (data.client_phone) {
          setError(data.client_phone[0]);
        } else if (data.message_text) {
          setError(data.message_text[0]);
        } else if (data.service_provider_id) {
          setError(data.service_provider_id[0]);
        } else {
          setError(data.error || "Failed to submit inquiry. Please try again.");
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="heading-3 text-neutral-900">Contact Provider</h2>
            <p className="body-regular text-neutral-600 mt-1">
              Send an inquiry to {providerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            // Success State
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-primary-600 text-4xl"
                />
              </div>
              <h3 className="heading-3 text-neutral-900 mb-2">
                Inquiry Sent Successfully!
              </h3>
              <p className="body-regular text-neutral-600 mb-4">
                {providerName} will contact you soon at your provided email or
                phone number.
              </p>
              <p className="body-small text-neutral-500">
                Typical response time: Within 1 hour
              </p>
            </div>
          ) : (
            // Form
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block body-small font-medium text-neutral-700 mb-2">
                  Your Name *
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block body-small font-medium text-neutral-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="email"
                    name="client_email"
                    value={formData.client_email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block body-small font-medium text-neutral-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="tel"
                    name="client_phone"
                    value={formData.client_phone}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Service Type */}
              <div>
                <label className="block body-small font-medium text-neutral-700 mb-2">
                  Service Type (Optional)
                </label>
                <input
                  type="text"
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="e.g., Kitchen Remodel, Roof Repair"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block body-small font-medium text-neutral-700 mb-2">
                  Your Message *
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faCommentDots}
                    className="absolute left-4 top-4 text-neutral-400"
                  />
                  <textarea
                    name="message_text"
                    value={formData.message_text}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
                    placeholder="Please describe your project or inquiry in detail..."
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Include details like timeline, budget, and specific
                  requirements (minimum 10 characters)
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="text-red-600 mt-0.5"
                  />
                  <p className="body-small text-red-700">{error}</p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="body-small text-primary-800">
                  <strong>What happens next?</strong> {providerName} will
                  receive your inquiry and typically responds within 1 hour.
                  They'll contact you via your preferred method.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} />
                      Send Inquiry
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
