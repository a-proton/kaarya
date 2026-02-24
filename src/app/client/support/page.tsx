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
  faCheck,
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
  icon,
  children,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
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
        className="flex items-center gap-3"
        style={{
          padding: "1.125rem 1.5rem",
          borderBottom: "1px solid var(--color-neutral-200)",
        }}
      >
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
          >
            <FontAwesomeIcon
              icon={icon}
              style={{ color: "#1ab189", fontSize: "0.8rem" }}
            />
          </div>
        )}
        <h2
          className="font-bold"
          style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
        >
          {title}
        </h2>
      </div>
      <div style={{ padding: "1.5rem" }}>{children}</div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
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
      {hint && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-neutral-400)",
            marginTop: "0.375rem",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function ModalFooter({
  onCancel,
  onConfirm,
  confirmLabel,
  isPending,
  pendingLabel,
  confirmIcon,
  danger,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  isPending?: boolean;
  pendingLabel?: string;
  confirmIcon?: any;
  danger?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-end gap-3"
      style={{
        padding: "1rem 1.5rem",
        borderTop: "1px solid var(--color-neutral-200)",
        backgroundColor: "var(--color-neutral-50)",
        borderRadius: "0 0 1rem 1rem",
      }}
    >
      <button
        onClick={onCancel}
        disabled={isPending}
        className="btn btn-ghost btn-md"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={isPending}
        className="btn btn-md flex items-center gap-2"
        style={{
          backgroundColor: danger ? "#dc2626" : "#1ab189",
          color: "white",
          border: "none",
          padding: "0.625rem 1.25rem",
          borderRadius: "0.625rem",
          fontWeight: 600,
          fontSize: "0.875rem",
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.6 : 1,
          transition: "background-color 120ms",
        }}
        onMouseEnter={(e) => {
          if (!isPending)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              danger ? "#b91c1c" : "#17a077";
        }}
        onMouseLeave={(e) => {
          if (!isPending)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              danger ? "#dc2626" : "#1ab189";
        }}
      >
        {isPending ? (
          <>
            <FontAwesomeIcon
              icon={faSpinner}
              className="animate-spin"
              style={{ fontSize: "0.875rem" }}
            />
            {pendingLabel ?? "Loading…"}
          </>
        ) : (
          <>
            {confirmIcon && (
              <FontAwesomeIcon
                icon={confirmIcon}
                style={{ fontSize: "0.875rem" }}
              />
            )}
            {confirmLabel}
          </>
        )}
      </button>
    </div>
  );
}

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================
export default function ClientHelpSupportPage() {
  const queryClient = useQueryClient();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

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
  // TOAST
  // ==================================================================================
  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // ==================================================================================
  // FETCH PROJECTS
  // ==================================================================================
  const { data: projectsData, isLoading: projectsLoading } =
    useQuery<ProjectsResponse>({
      queryKey: ["client-projects"],
      queryFn: async () => api.get<ProjectsResponse>("/api/v1/projects/"),
      enabled: showReviewModal,
    });

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================
  const createReviewMutation = useMutation({
    mutationFn: (data: ReviewFormData) =>
      api.post("/api/v1/reviews/create/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      setShowReviewModal(false);
      resetReviewForm();
      notify("Thank you! Your review has been submitted.");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { error?: string }; message?: string };
      alert(`Error: ${e.data?.error ?? e.message}`);
    },
  });

  const submitContactMutation = useMutation({
    mutationFn: (data: ContactFormData) =>
      api.post("/api/v1/contact/submit/", data),
    onSuccess: () => {
      setShowContactModal(false);
      resetContactForm();
      notify("Message sent! We'll respond within 24–48 hours.");
    },
    onError: (error: unknown) => {
      const e = error as { data?: { error?: string }; message?: string };
      alert(`Error: ${e.data?.error ?? e.message}`);
    },
  });

  // ==================================================================================
  // FORM HELPERS
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
      review_text: reviewText || "",
    };
    if (showDetailedRatings) {
      if (detailedRatings.quality_rating > 0)
        reviewData.quality_rating = detailedRatings.quality_rating;
      if (detailedRatings.timeliness_rating > 0)
        reviewData.timeliness_rating = detailedRatings.timeliness_rating;
      if (detailedRatings.communication_rating > 0)
        reviewData.communication_rating = detailedRatings.communication_rating;
      if (detailedRatings.value_rating > 0)
        reviewData.value_rating = detailedRatings.value_rating;
    }
    createReviewMutation.mutate(reviewData);
  };

  const handleSubmitReport = () => {
    if (!reportCategory || !reportDescription) {
      alert("Please fill in all required fields");
      return;
    }
    console.log("Report submitted:", { reportCategory, reportDescription });
    setShowReportModal(false);
    setReportCategory("");
    setReportDescription("");
    notify("Report submitted. Our admin team will review it within 24 hours.");
  };

  const handleSubmitContact = () => {
    if (!contactName || !contactEmail || !contactSubject || !contactMessage) {
      alert("Please fill in all fields");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      alert("Please enter a valid email address");
      return;
    }
    submitContactMutation.mutate({
      name: contactName,
      email: contactEmail,
      subject: contactSubject,
      message: contactMessage,
    });
  };

  const toggleFaq = (id: number) =>
    setExpandedFaq(expandedFaq === id ? null : id);

  const setDetailedRating = (
    category: keyof typeof detailedRatings,
    value: number,
  ) => setDetailedRatings({ ...detailedRatings, [category]: value });

  // ==================================================================================
  // STAR RATING RENDERER
  // ==================================================================================
  const renderStarRating = (
    currentRating: number,
    onRate: (rating: number) => void,
    large = false,
  ) => (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.125rem",
            fontSize: large ? "2rem" : "1.375rem",
            color:
              star <= currentRating ? "#f59e0b" : "var(--color-neutral-300)",
            transition: "transform 120ms, color 120ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          <FontAwesomeIcon icon={faStar} />
        </button>
      ))}
      {currentRating > 0 && (
        <span
          className="font-semibold"
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-neutral-600)",
            marginLeft: "0.25rem",
          }}
        >
          {currentRating}.0 / 5.0
        </span>
      )}
    </div>
  );

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
          Help & Support
        </h1>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--color-neutral-500)",
            marginTop: "0.125rem",
          }}
        >
          Find answers, leave reviews, and contact our support team
        </p>
      </div>

      <div style={{ padding: "1.75rem 2rem" }}>
        <div
          style={{ maxWidth: "56rem", margin: "0 auto" }}
          className="space-y-5"
        >
          {/* ── QUICK ACTIONS ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
            }}
          >
            {[
              {
                icon: faStar,
                iconBg: "rgba(245,158,11,0.12)",
                iconColor: "#f59e0b",
                title: "Leave a Review",
                desc: "Share your experience with your service provider",
                onClick: () => setShowReviewModal(true),
              },
              {
                icon: faEnvelope,
                iconBg: "rgba(26,177,137,0.1)",
                iconColor: "#1ab189",
                title: "Contact Support",
                desc: "Get help from our support team via email",
                onClick: () => setShowContactModal(true),
              },
              {
                icon: faFlag,
                iconBg: "rgba(220,38,38,0.08)",
                iconColor: "#dc2626",
                title: "Report an Issue",
                desc: "Report problems or concerns to our admin team",
                onClick: () => setShowReportModal(true),
              },
            ].map(({ icon, iconBg, iconColor, title, desc, onClick }) => (
              <button
                key={title}
                onClick={onClick}
                className="rounded-2xl text-left"
                style={{
                  backgroundColor: "var(--color-neutral-0)",
                  border: "1px solid var(--color-neutral-200)",
                  padding: "1.25rem",
                  cursor: "pointer",
                  transition: "border-color 150ms, box-shadow 150ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#1ab189";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 4px 16px rgba(26,177,137,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "var(--color-neutral-200)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "none";
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: iconBg }}
                >
                  <FontAwesomeIcon
                    icon={icon}
                    style={{ color: iconColor, fontSize: "1rem" }}
                  />
                </div>
                <h3
                  className="font-bold mb-1"
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-neutral-500)",
                    lineHeight: 1.5,
                  }}
                >
                  {desc}
                </p>
              </button>
            ))}
          </div>

          {/* ── GET IN TOUCH ── */}
          <SectionCard title="Get In Touch" icon={faHeadset}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div
                className="flex items-start gap-4 rounded-xl p-4"
                style={{
                  backgroundColor: "var(--color-neutral-50)",
                  border: "1px solid var(--color-neutral-200)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                >
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    style={{ color: "#1ab189", fontSize: "0.9rem" }}
                  />
                </div>
                <div>
                  <h3
                    className="font-semibold mb-1"
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    Email Support
                  </h3>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-neutral-500)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    For general inquiries and support
                  </p>
                  <a
                    href="mailto:info@kaarya.com"
                    style={{
                      fontSize: "0.8125rem",
                      color: "#1ab189",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    info@kaarya.com
                  </a>
                </div>
              </div>

              <div
                className="flex items-start gap-4 rounded-xl p-4"
                style={{
                  backgroundColor: "var(--color-neutral-50)",
                  border: "1px solid var(--color-neutral-200)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                >
                  <FontAwesomeIcon
                    icon={faPhone}
                    style={{ color: "#1ab189", fontSize: "0.9rem" }}
                  />
                </div>
                <div>
                  <h3
                    className="font-semibold mb-1"
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    Phone Support
                  </h3>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-neutral-500)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Monday – Friday, 9 AM – 6 PM
                  </p>
                  <a
                    href="tel:+9779800000000"
                    style={{
                      fontSize: "0.8125rem",
                      color: "#1ab189",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    +9779800000000
                  </a>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── FAQs ── */}
          <SectionCard
            title="Frequently Asked Questions"
            icon={faQuestionCircle}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {faqCategories.map((category, catIndex) => (
                <div key={catIndex}>
                  <div
                    className="flex items-center gap-3 mb-3"
                    style={{ paddingBottom: "0.625rem" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                    >
                      <FontAwesomeIcon
                        icon={category.icon}
                        style={{ color: "#1ab189", fontSize: "0.7rem" }}
                      />
                    </div>
                    <h3
                      className="font-bold"
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      {category.category}
                    </h3>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {category.questions.map((faq) => (
                      <div
                        key={faq.id}
                        className="rounded-xl overflow-hidden"
                        style={{
                          border: "1px solid var(--color-neutral-200)",
                        }}
                      >
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full flex items-center justify-between text-left"
                          style={{
                            padding: "0.875rem 1rem",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            backgroundColor:
                              expandedFaq === faq.id
                                ? "rgba(26,177,137,0.05)"
                                : "transparent",
                            transition: "background-color 120ms",
                          }}
                          onMouseEnter={(e) => {
                            if (expandedFaq !== faq.id)
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.backgroundColor =
                                "var(--color-neutral-50)";
                          }}
                          onMouseLeave={(e) => {
                            if (expandedFaq !== faq.id)
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.backgroundColor = "transparent";
                          }}
                        >
                          <span
                            className="font-semibold"
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--color-neutral-900)",
                              paddingRight: "1rem",
                            }}
                          >
                            {faq.question}
                          </span>
                          <FontAwesomeIcon
                            icon={
                              expandedFaq === faq.id
                                ? faChevronUp
                                : faChevronDown
                            }
                            style={{
                              color:
                                expandedFaq === faq.id
                                  ? "#1ab189"
                                  : "var(--color-neutral-400)",
                              fontSize: "0.75rem",
                              flexShrink: 0,
                            }}
                          />
                        </button>
                        {expandedFaq === faq.id && (
                          <div
                            style={{
                              padding: "0 1rem 1rem",
                              borderTop: "1px solid var(--color-neutral-100)",
                              paddingTop: "0.75rem",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "0.8375rem",
                                color: "var(--color-neutral-600)",
                                lineHeight: 1.6,
                              }}
                            >
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── ADDITIONAL RESOURCES ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            {[
              {
                icon: faVideo,
                iconBg: "rgba(139,92,246,0.1)",
                iconColor: "#8b5cf6",
                title: "Video Tutorials",
                desc: "Watch step-by-step guides on how to use the client portal effectively.",
                label: "Watch Tutorials",
              },
              {
                icon: faBook,
                iconBg: "rgba(249,115,22,0.1)",
                iconColor: "#f97316",
                title: "User Guide",
                desc: "Download our comprehensive user guide for detailed instructions.",
                label: "Download Guide",
              },
            ].map(({ icon, iconBg, iconColor, title, desc, label }) => (
              <div
                key={title}
                className="rounded-2xl"
                style={{
                  backgroundColor: "var(--color-neutral-0)",
                  border: "1px solid var(--color-neutral-200)",
                  padding: "1.25rem",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: iconBg }}
                >
                  <FontAwesomeIcon
                    icon={icon}
                    style={{ color: iconColor, fontSize: "1rem" }}
                  />
                </div>
                <h3
                  className="font-bold mb-1"
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-neutral-500)",
                    marginBottom: "1rem",
                    lineHeight: 1.5,
                  }}
                >
                  {desc}
                </p>
                <button
                  className="w-full rounded-xl flex items-center justify-center"
                  style={{
                    padding: "0.625rem",
                    border: "1px solid var(--color-neutral-200)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-neutral-700)",
                    transition: "background-color 120ms",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "var(--color-neutral-50)";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "transparent";
                  }}
                >
                  {label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================================================================================
          REVIEW MODAL
      ================================================================================== */}
      {showReviewModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-xl w-full my-8"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(245,158,11,0.12)" }}
                >
                  <FontAwesomeIcon
                    icon={faStar}
                    style={{ color: "#f59e0b", fontSize: "0.9rem" }}
                  />
                </div>
                <h3
                  className="font-bold"
                  style={{
                    fontSize: "1.0625rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  Leave a Review
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  resetReviewForm();
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                  padding: "0.375rem",
                }}
              >
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: "1rem" }} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: "1.5rem",
                maxHeight: "calc(100vh - 240px)",
                overflowY: "auto",
              }}
            >
              {projectsLoading ? (
                <div className="text-center" style={{ padding: "2.5rem 0" }}>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin mb-3"
                    style={{ fontSize: "1.75rem", color: "#1ab189" }}
                  />
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Loading your projects…
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <FormField
                    label="Select Project"
                    required
                    hint="Select the project you want to review"
                  >
                    <select
                      style={{
                        ...baseInput,
                        cursor: "pointer",
                        appearance: "none",
                      }}
                      value={selectedProject || ""}
                      onChange={(e) =>
                        setSelectedProject(Number(e.target.value))
                      }
                      {...focusHandlers}
                    >
                      <option value="">Choose a project…</option>
                      {projectsData?.results.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project_name} –{" "}
                          {project.service_provider.business_name ||
                            project.service_provider.full_name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Overall Rating" required>
                    {renderStarRating(rating, setRating, true)}
                  </FormField>

                  <FormField label="Your Review (Optional)">
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with this service provider…"
                      rows={5}
                      style={{ ...baseInput, resize: "none" }}
                      {...focusHandlers}
                    />
                  </FormField>

                  {/* Toggle Detailed */}
                  <button
                    type="button"
                    onClick={() => setShowDetailedRatings(!showDetailedRatings)}
                    className="flex items-center gap-2"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#1ab189",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={showDetailedRatings ? faChevronUp : faChevronDown}
                      style={{ fontSize: "0.75rem" }}
                    />
                    {showDetailedRatings ? "Hide" : "Add"} Detailed Ratings
                    (Optional)
                  </button>

                  {showDetailedRatings && (
                    <div
                      className="rounded-xl"
                      style={{
                        backgroundColor: "var(--color-neutral-50)",
                        border: "1px solid var(--color-neutral-200)",
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      <p
                        className="font-semibold"
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-neutral-700)",
                        }}
                      >
                        Rate specific aspects:
                      </p>
                      {[
                        {
                          key: "quality_rating" as const,
                          label: "Quality of Work",
                        },
                        {
                          key: "timeliness_rating" as const,
                          label: "Timeliness",
                        },
                        {
                          key: "communication_rating" as const,
                          label: "Communication",
                        },
                        {
                          key: "value_rating" as const,
                          label: "Value for Money",
                        },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <p
                            style={{
                              fontSize: "0.8125rem",
                              fontWeight: 500,
                              color: "var(--color-neutral-600)",
                              marginBottom: "0.375rem",
                            }}
                          >
                            {label}
                          </p>
                          {renderStarRating(detailedRatings[key], (val) =>
                            setDetailedRating(key, val),
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: "rgba(26,177,137,0.05)",
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
                      Your review helps other clients make informed decisions
                      and helps providers improve their services.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <ModalFooter
              onCancel={() => {
                setShowReviewModal(false);
                resetReviewForm();
              }}
              onConfirm={handleSubmitReview}
              confirmLabel="Submit Review"
              isPending={createReviewMutation.isPending || projectsLoading}
              pendingLabel="Submitting…"
              confirmIcon={faPaperPlane}
            />
          </div>
        </div>
      )}

      {/* ==================================================================================
          REPORT MODAL
      ================================================================================== */}
      {showReportModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-xl w-full"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(220,38,38,0.08)" }}
                >
                  <FontAwesomeIcon
                    icon={faFlag}
                    style={{ color: "#dc2626", fontSize: "0.9rem" }}
                  />
                </div>
                <div>
                  <h3
                    className="font-bold"
                    style={{
                      fontSize: "1.0625rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    Report an Issue
                  </h3>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    Our admin team will review your report
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                  padding: "0.375rem",
                }}
              >
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: "1rem" }} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <FormField label="Issue Category" required>
                <select
                  style={{
                    ...baseInput,
                    cursor: "pointer",
                    appearance: "none",
                  }}
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  {...focusHandlers}
                >
                  <option value="">Select a category…</option>
                  <option value="payment">Payment Issue</option>
                  <option value="quality">Quality of Work</option>
                  <option value="delay">Project Delay</option>
                  <option value="communication">Communication Problem</option>
                  <option value="safety">Safety Concern</option>
                  <option value="billing">Billing Dispute</option>
                  <option value="contract">Contract Issue</option>
                  <option value="other">Other</option>
                </select>
              </FormField>

              <FormField label="Description" required>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide detailed information about the issue…"
                  rows={5}
                  style={{ ...baseInput, resize: "none" }}
                  {...focusHandlers}
                />
              </FormField>

              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "rgba(245,158,11,0.06)",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "#b45309",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    style={{ marginTop: "0.125rem", flexShrink: 0 }}
                  />
                  <span>
                    <strong>Important:</strong> For urgent safety concerns,
                    contact us immediately at{" "}
                    <a
                      href="tel:+9779800000000"
                      style={{ fontWeight: 600, color: "#b45309" }}
                    >
                      +977 9800000000
                    </a>
                  </span>
                </p>
              </div>
            </div>

            <ModalFooter
              onCancel={() => setShowReportModal(false)}
              onConfirm={handleSubmitReport}
              confirmLabel="Submit Report"
              confirmIcon={faFlag}
              danger
            />
          </div>
        </div>
      )}

      {/* ==================================================================================
          CONTACT MODAL
      ================================================================================== */}
      {showContactModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl max-w-xl w-full my-8"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                >
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    style={{ color: "#1ab189", fontSize: "0.9rem" }}
                  />
                </div>
                <div>
                  <h3
                    className="font-bold"
                    style={{
                      fontSize: "1.0625rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    Contact Support
                  </h3>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    We'll respond within 24–48 hours
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  resetContactForm();
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                  padding: "0.375rem",
                }}
              >
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: "1rem" }} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: "1.5rem",
                maxHeight: "calc(100vh - 240px)",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.25rem",
                }}
              >
                <FormField label="Your Name" required>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full name"
                    style={baseInput}
                    {...focusHandlers}
                  />
                </FormField>
                <FormField label="Your Email" required>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={baseInput}
                    {...focusHandlers}
                  />
                </FormField>
              </div>

              <FormField label="Subject" required>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="Brief description of your inquiry…"
                  style={baseInput}
                  {...focusHandlers}
                />
              </FormField>

              <FormField label="Message" required>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Provide detailed information about your question or concern…"
                  rows={5}
                  style={{ ...baseInput, resize: "none" }}
                  {...focusHandlers}
                />
              </FormField>

              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "rgba(26,177,137,0.05)",
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
                  <FontAwesomeIcon icon={faEnvelope} />
                  You can also email us directly at{" "}
                  <a
                    href="mailto:info@kaarya.com"
                    style={{ fontWeight: 700, color: "#1ab189" }}
                  >
                    info@kaarya.com
                  </a>
                </p>
              </div>
            </div>

            <ModalFooter
              onCancel={() => {
                setShowContactModal(false);
                resetContactForm();
              }}
              onConfirm={handleSubmitContact}
              confirmLabel="Send Message"
              isPending={submitContactMutation.isPending}
              pendingLabel="Sending…"
              confirmIcon={faPaperPlane}
            />
          </div>
        </div>
      )}
    </div>
  );
}
