"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faStar,
  faEnvelope,
  faPhone,
  faExclamationTriangle,
  faBook,
  faVideo,
  faComments,
  faHeadset,
  faShieldAlt,
  faTimes,
  faChevronDown,
  faChevronUp,
  faCheckCircle,
  faPaperPlane,
  faFlag,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ==================================================================================
// TYPE DEFINITIONS
// ==================================================================================
interface Project {
  id: number;
  project_name: string;
  service_provider: {
    id: number;
    full_name: string;
    business_name: string;
  };
}

interface ProjectsResponse {
  count: number;
  results: Project[];
}

interface ReviewFormData {
  service_provider_id: number;
  project_id?: number;
  rating: number;
  review_text: string;
  quality_rating?: number;
  timeliness_rating?: number;
  communication_rating?: number;
  value_rating?: number;
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ClientHelpSupportPage() {
  const queryClient = useQueryClient();

  // Modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Review form states
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [detailedRatings, setDetailedRatings] = useState({
    quality_rating: 0,
    timeliness_rating: 0,
    communication_rating: 0,
    value_rating: 0,
  });
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);

  // Report form states
  const [reportCategory, setReportCategory] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  // Contact form states
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  // ==================================================================================
  // FETCH PROJECTS (for review dropdown)
  // ==================================================================================
  const { data: projectsData, isLoading: projectsLoading } =
    useQuery<ProjectsResponse>({
      queryKey: ["client-projects"],
      queryFn: async () => {
        const response = await api.get<ProjectsResponse>("/api/v1/projects/");
        return response;
      },
      enabled: showReviewModal, // Only fetch when modal is open
    });

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================

  // Create Review Mutation
  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      return api.post("/api/v1/reviews/create/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      setShowReviewModal(false);
      resetReviewForm();
      alert("Thank you for your review! It has been submitted successfully.");
    },
    onError: (error: any) => {
      const errorMessage =
        error.data?.error || error.message || "Failed to submit review";
      alert(`Error: ${errorMessage}`);
    },
  });

  // Submit Contact Form Mutation
  const submitContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return api.post("/api/v1/contact/submit/", data);
    },
    onSuccess: () => {
      setShowContactModal(false);
      resetContactForm();
      alert("Your message has been sent! We'll respond within 24-48 hours.");
    },
    onError: (error: any) => {
      const errorMessage =
        error.data?.error || error.message || "Failed to send message";
      alert(`Error: ${errorMessage}`);
    },
  });

  // ==================================================================================
  // FORM HANDLERS
  // ==================================================================================

  const resetReviewForm = () => {
    setSelectedProject(null);
    setRating(0);
    setReviewText("");
    setDetailedRatings({
      quality_rating: 0,
      timeliness_rating: 0,
      communication_rating: 0,
      value_rating: 0,
    });
    setShowDetailedRatings(false);
  };

  const resetContactForm = () => {
    setContactName("");
    setContactEmail("");
    setContactSubject("");
    setContactMessage("");
  };

  const handleSubmitReview = () => {
    // Validation
    if (!selectedProject) {
      alert("Please select a project");
      return;
    }
    if (rating === 0) {
      alert("Please provide a rating");
      return;
    }

    const selectedProjectData = projectsData?.results.find(
      (p) => p.id === selectedProject,
    );
    if (!selectedProjectData) {
      alert("Invalid project selected");
      return;
    }

    const reviewData: ReviewFormData = {
      service_provider_id: selectedProjectData.service_provider.id,
      project_id: selectedProject,
      rating,
      review_text: reviewText || undefined,
    };

    // Add detailed ratings if provided
    if (showDetailedRatings) {
      if (detailedRatings.quality_rating > 0) {
        reviewData.quality_rating = detailedRatings.quality_rating;
      }
      if (detailedRatings.timeliness_rating > 0) {
        reviewData.timeliness_rating = detailedRatings.timeliness_rating;
      }
      if (detailedRatings.communication_rating > 0) {
        reviewData.communication_rating = detailedRatings.communication_rating;
      }
      if (detailedRatings.value_rating > 0) {
        reviewData.value_rating = detailedRatings.value_rating;
      }
    }

    createReviewMutation.mutate(reviewData);
  };

  const handleSubmitReport = () => {
    // For now, just show alert - you can integrate with backend later
    if (!reportCategory || !reportDescription) {
      alert("Please fill in all required fields");
      return;
    }

    console.log("Report submitted:", { reportCategory, reportDescription });
    alert(
      "Your report has been submitted. Our admin team will review it within 24 hours.",
    );
    setShowReportModal(false);
    setReportCategory("");
    setReportDescription("");
  };

  const handleSubmitContact = () => {
    // Validation
    if (!contactName || !contactEmail || !contactSubject || !contactMessage) {
      alert("Please fill in all fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    const contactData: ContactFormData = {
      name: contactName,
      email: contactEmail,
      subject: contactSubject,
      message: contactMessage,
    };

    submitContactMutation.mutate(contactData);
  };

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const setDetailedRating = (
    category: keyof typeof detailedRatings,
    value: number,
  ) => {
    setDetailedRatings({
      ...detailedRatings,
      [category]: value,
    });
  };

  // ==================================================================================
  // FAQ DATA
  // ==================================================================================
  const faqCategories = [
    {
      category: "Getting Started",
      icon: faBook,
      questions: [
        {
          id: 1,
          question: "How do I track my project progress?",
          answer:
            "You can track your project progress from the Dashboard or Projects page. Each project shows a progress bar, current status, and recent updates. Daily updates from your service provider will appear in the Daily Updates section with detailed progress reports and photos.",
        },
        {
          id: 2,
          question: "How do I communicate with my service provider?",
          answer:
            "Use the Messages section to send direct messages to your service provider. You can also comment on daily updates and milestones. For urgent matters, you'll find the provider's contact information in the project details.",
        },
        {
          id: 3,
          question: "Where can I find project documents?",
          answer:
            "All project-related documents including contracts, invoices, and reports are available in the Documents section. You can view, download, and organize them by project.",
        },
      ],
    },
    {
      category: "Payments & Billing",
      icon: faShieldAlt,
      questions: [
        {
          id: 4,
          question: "How do I make a payment?",
          answer:
            "Navigate to the Payments section to view outstanding invoices. Click on any invoice to pay using your preferred payment method. We accept credit cards, bank transfers, and digital wallets. All payments are secured with industry-standard encryption.",
        },
        {
          id: 5,
          question: "Can I view my payment history?",
          answer:
            "Yes, the Payments section shows your complete payment history including paid invoices, pending payments, and receipts. You can download receipts for your records at any time.",
        },
        {
          id: 6,
          question: "What if I dispute a charge?",
          answer:
            "If you have concerns about a charge, first contact your service provider through Messages. If the issue isn't resolved, you can report it to our admin team using the 'Report an Issue' option on this page.",
        },
      ],
    },
    {
      category: "Project Management",
      icon: faComments,
      questions: [
        {
          id: 7,
          question: "How do I comment on milestones?",
          answer:
            "Go to the Milestones section and click on any milestone to view details. You can leave comments, especially if you have concerns about delays or quality. Your service provider will be notified of your comments.",
        },
        {
          id: 8,
          question: "What should I do if a milestone is delayed?",
          answer:
            "If a milestone shows as 'At Risk' or is past its due date, you can comment on it to request an update from your provider. You can also send a direct message or, if necessary, report the issue to admin.",
        },
        {
          id: 9,
          question: "How do daily updates work?",
          answer:
            "Service providers post daily updates with progress photos, descriptions of work completed, and any issues encountered. You'll receive notifications for new updates and can ask questions or provide feedback through comments.",
        },
      ],
    },
    {
      category: "Account & Security",
      icon: faShieldAlt,
      questions: [
        {
          id: 10,
          question: "How do I change my password?",
          answer:
            "Go to Settings → Security tab to change your password. You'll need to enter your current password and then set a new one. Make sure it's at least 8 characters long.",
        },
        {
          id: 11,
          question: "Is my information secure?",
          answer:
            "Yes, we use industry-standard encryption to protect your data. Your payment information is processed through secure payment gateways and never stored on our servers. We comply with all data protection regulations.",
        },
      ],
    },
  ];

  // ==================================================================================
  // RENDER STAR RATINGS
  // ==================================================================================
  const renderStarRating = (
    currentRating: number,
    onRate: (rating: number) => void,
    size: string = "text-4xl",
  ) => {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className={`${size} hover:scale-110 transition-transform`}
          >
            <FontAwesomeIcon
              icon={faStar}
              className={
                star <= currentRating ? "text-yellow-500" : "text-neutral-300"
              }
            />
          </button>
        ))}
        {currentRating > 0 && (
          <span className="text-neutral-700 font-semibold ml-2">
            {currentRating}.0 / 5.0
          </span>
        )}
      </div>
    );
  };

  // ==================================================================================
  // RENDER
  // ==================================================================================
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setShowReviewModal(true)}
          className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-all text-left group"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FontAwesomeIcon
              icon={faStar}
              className="text-yellow-600 text-xl"
            />
          </div>
          <h3 className="heading-4 text-neutral-900 mb-2">Leave a Review</h3>
          <p className="text-neutral-600 text-sm">
            Share your experience with your service provider
          </p>
        </button>

        <button
          onClick={() => setShowContactModal(true)}
          className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-all text-left group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="text-blue-600 text-xl"
            />
          </div>
          <h3 className="heading-4 text-neutral-900 mb-2">Contact Support</h3>
          <p className="text-neutral-600 text-sm">
            Get help from our support team via email
          </p>
        </button>

        <button
          onClick={() => setShowReportModal(true)}
          className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-all text-left group"
        >
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FontAwesomeIcon icon={faFlag} className="text-red-600 text-xl" />
          </div>
          <h3 className="heading-4 text-neutral-900 mb-2">Report an Issue</h3>
          <p className="text-neutral-600 text-sm">
            Report problems or concerns to our admin team
          </p>
        </button>
      </div>

      {/* Contact Information */}
      <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
        <h2 className="heading-3 text-neutral-900 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faHeadset} className="text-primary-600" />
          Get In Touch
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="text-primary-600 text-xl"
              />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">
                Email Support
              </h3>
              <p className="text-neutral-600 text-sm mb-2">
                For general inquiries and support
              </p>
              <a
                href="mailto:info@kaarya.com"
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                info@kaarya.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon
                icon={faPhone}
                className="text-green-600 text-xl"
              />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">
                Phone Support
              </h3>
              <p className="text-neutral-600 text-sm mb-2">
                Available Monday - Friday, 9 AM - 6 PM
              </p>
              <a
                href="tel:+15551234567"
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                +1 (555) 123-4567
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs by Category */}
      <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
        <h2 className="heading-3 text-neutral-900 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={category.icon}
                    className="text-primary-600"
                  />
                </div>
                <h3 className="heading-4 text-neutral-900">
                  {category.category}
                </h3>
              </div>
              <div className="space-y-3 ml-13">
                {category.questions.map((faq) => (
                  <div
                    key={faq.id}
                    className="border border-neutral-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors text-left"
                    >
                      <span className="font-semibold text-neutral-900 pr-4">
                        {faq.question}
                      </span>
                      <FontAwesomeIcon
                        icon={
                          expandedFaq === faq.id ? faChevronUp : faChevronDown
                        }
                        className="text-neutral-600 flex-shrink-0"
                      />
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-4 pb-4 pt-2 bg-neutral-50 border-t border-neutral-200">
                        <p className="text-neutral-700">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon
                icon={faVideo}
                className="text-purple-600 text-xl"
              />
            </div>
            <h3 className="heading-4 text-neutral-900">Video Tutorials</h3>
          </div>
          <p className="text-neutral-600 mb-4">
            Watch step-by-step guides on how to use the client portal
            effectively.
          </p>
          <button className="btn-secondary w-full">Watch Tutorials</button>
        </div>

        <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon
                icon={faBook}
                className="text-orange-600 text-xl"
              />
            </div>
            <h3 className="heading-4 text-neutral-900">User Guide</h3>
          </div>
          <p className="text-neutral-600 mb-4">
            Download our comprehensive user guide for detailed instructions.
          </p>
          <button className="btn-secondary w-full">Download Guide</button>
        </div>
      </div>

      {/* ==================================================================================
          REVIEW MODAL - ENHANCED WITH API INTEGRATION
          ================================================================================== */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50 sticky top-0 z-10">
              <h3 className="heading-4 text-neutral-900">Leave a Review</h3>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  resetReviewForm();
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {projectsLoading ? (
                <div className="text-center py-8">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-3xl text-primary-600 mb-3"
                  />
                  <p className="text-neutral-600">Loading your projects...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Project Selection */}
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Select Project <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedProject || ""}
                      onChange={(e) =>
                        setSelectedProject(Number(e.target.value))
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                    >
                      <option value="">Choose a project...</option>
                      {projectsData?.results.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project_name} -{" "}
                          {project.service_provider.business_name ||
                            project.service_provider.full_name}
                        </option>
                      ))}
                    </select>
                    <p className="text-neutral-500 text-sm mt-1">
                      Select the project you want to review
                    </p>
                  </div>

                  {/* Overall Rating */}
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-3 body-small">
                      Overall Rating <span className="text-red-500">*</span>
                    </label>
                    {renderStarRating(rating, setRating)}
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Your Review (Optional)
                    </label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with this service provider..."
                      rows={6}
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                    />
                  </div>

                  {/* Toggle Detailed Ratings */}
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowDetailedRatings(!showDetailedRatings)
                      }
                      className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-2"
                    >
                      <FontAwesomeIcon
                        icon={showDetailedRatings ? faChevronUp : faChevronDown}
                      />
                      {showDetailedRatings ? "Hide" : "Add"} Detailed Ratings
                      (Optional)
                    </button>
                  </div>

                  {/* Detailed Ratings */}
                  {showDetailedRatings && (
                    <div className="bg-neutral-50 rounded-lg p-5 space-y-4">
                      <p className="text-neutral-700 font-semibold mb-3">
                        Rate specific aspects (optional):
                      </p>

                      {/* Quality Rating */}
                      <div>
                        <label className="block text-neutral-700 font-medium mb-2 text-sm">
                          Quality of Work
                        </label>
                        {renderStarRating(
                          detailedRatings.quality_rating,
                          (value) => setDetailedRating("quality_rating", value),
                          "text-2xl",
                        )}
                      </div>

                      {/* Timeliness Rating */}
                      <div>
                        <label className="block text-neutral-700 font-medium mb-2 text-sm">
                          Timeliness
                        </label>
                        {renderStarRating(
                          detailedRatings.timeliness_rating,
                          (value) =>
                            setDetailedRating("timeliness_rating", value),
                          "text-2xl",
                        )}
                      </div>

                      {/* Communication Rating */}
                      <div>
                        <label className="block text-neutral-700 font-medium mb-2 text-sm">
                          Communication
                        </label>
                        {renderStarRating(
                          detailedRatings.communication_rating,
                          (value) =>
                            setDetailedRating("communication_rating", value),
                          "text-2xl",
                        )}
                      </div>

                      {/* Value Rating */}
                      <div>
                        <label className="block text-neutral-700 font-medium mb-2 text-sm">
                          Value for Money
                        </label>
                        {renderStarRating(
                          detailedRatings.value_rating,
                          (value) => setDetailedRating("value_rating", value),
                          "text-2xl",
                        )}
                      </div>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 text-sm">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      Your review helps other clients make informed decisions
                      and helps providers improve their services.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  resetReviewForm();
                }}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={createReviewMutation.isPending || projectsLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {createReviewMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================================
          REPORT MODAL
          ================================================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 sticky top-0 z-10">
              <div>
                <h3 className="heading-4 text-neutral-900">Report an Issue</h3>
                <p className="text-neutral-600 text-sm">
                  Our admin team will review your report
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
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
                    Issue Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                  >
                    <option value="">Select a category...</option>
                    <option value="payment">Payment Issue</option>
                    <option value="quality">Quality of Work</option>
                    <option value="delay">Project Delay</option>
                    <option value="communication">Communication Problem</option>
                    <option value="safety">Safety Concern</option>
                    <option value="billing">Billing Dispute</option>
                    <option value="contract">Contract Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Please provide detailed information about the issue..."
                    rows={6}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-700 text-sm">
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="mr-2"
                    />
                    <strong>Important:</strong> For urgent safety concerns,
                    please contact us immediately at{" "}
                    <a
                      href="tel:+15551234567"
                      className="font-semibold underline"
                    >
                      +1 (555) 123-4567
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                className="px-5 py-2.5 bg-red-600 text-neutral-0 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faFlag} />
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================================
          CONTACT MODAL - ENHANCED WITH API INTEGRATION
          ================================================================================== */}
      {showContactModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-blue-50 sticky top-0 z-10">
              <div>
                <h3 className="heading-4 text-neutral-900">Contact Support</h3>
                <p className="text-neutral-600 text-sm">
                  We'll respond within 24-48 hours
                </p>
              </div>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  resetContactForm();
                }}
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
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Enter your full name..."
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="Brief description of your inquiry..."
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Provide detailed information about your question or concern..."
                    rows={6}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                  />
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <p className="text-primary-700 text-sm">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                    You can also email us directly at{" "}
                    <a
                      href="mailto:info@kaarya.com"
                      className="font-semibold underline"
                    >
                      info@kaarya.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowContactModal(false);
                  resetContactForm();
                }}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitContact}
                disabled={submitContactMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {submitContactMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
