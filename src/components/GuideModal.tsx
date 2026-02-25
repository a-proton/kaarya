"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faLocationArrow,
  faKeyboard,
  faSearch,
  faComments,
  faChevronRight,
  faChevronLeft,
  faStar,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void; // Called when user finishes guide — triggers location request
}

const steps = [
  {
    icon: faStar,
    tag: "Welcome",
    title: "Welcome to Kaarya",
    subtitle:
      "Your trusted platform for finding verified service professionals near you.",
    content: (
      <div className="space-y-3">
        <p className="text-[#4a6374] text-[0.9375rem] leading-relaxed">
          Kaarya connects you with thousands of verified electricians, plumbers,
          HVAC specialists, and more — all just a search away.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { value: "5,000+", label: "Verified Pros" },
            { value: "50k+", label: "Jobs Done" },
            { value: "4.8★", label: "Avg Rating" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#f0faf6] border border-[#c8edd9] rounded-xl p-3 text-center"
            >
              <div className="text-[#0d9563] font-bold text-lg leading-tight">
                {stat.value}
              </div>
              <div className="text-[#6b8a9a] text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: faLocationArrow,
    tag: "Location",
    title: "How Location Works",
    subtitle:
      "Your location helps us find the best professionals closest to you.",
    content: (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3.5 bg-[#f0faf6] border border-[#c8edd9] rounded-xl">
          <div className="w-8 h-8 rounded-full bg-[#0d9563] flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon
              icon={faLocationArrow}
              className="text-white text-xs"
            />
          </div>
          <div>
            <p className="text-[#1e3a4f] font-semibold text-sm">
              Allow Location Access
            </p>
            <p className="text-[#5a6c7a] text-xs mt-0.5 leading-relaxed">
              After closing this guide, your browser will ask for permission.
              Allowing it gives you the most accurate, proximity-based
              recommendations automatically.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3.5 bg-[#fff8ed] border border-[#fde9b8] rounded-xl">
          <div className="w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon icon={faKeyboard} className="text-white text-xs" />
          </div>
          <div>
            <p className="text-[#1e3a4f] font-semibold text-sm">
              Enter Location Manually
            </p>
            <p className="text-[#5a6c7a] text-xs mt-0.5 leading-relaxed">
              If you decline or prefer privacy, you can type your city or area
              directly in the search bar. Recommendations will still work, just
              based on what you enter.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: faSearch,
    tag: "Search",
    title: "Finding the Right Pro",
    subtitle: "Two ways to get recommendations — quick search or smart chat.",
    content: (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3.5 bg-[#f0faf6] border border-[#c8edd9] rounded-xl">
          <div className="w-8 h-8 rounded-full bg-[#0d9563] flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon icon={faSearch} className="text-white text-xs" />
          </div>
          <div>
            <p className="text-[#1e3a4f] font-semibold text-sm">Quick Search</p>
            <p className="text-[#5a6c7a] text-xs mt-0.5 leading-relaxed">
              Type a service (e.g. "plumber") and your location to get instant
              results. Great for straightforward needs — fast but broader.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3.5 bg-[#eef5ff] border border-[#c5d9f7] rounded-xl">
          <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon icon={faComments} className="text-white text-xs" />
          </div>
          <div>
            <p className="text-[#1e3a4f] font-semibold text-sm">
              Chat with Our Assistant
            </p>
            <p className="text-[#5a6c7a] text-xs mt-0.5 leading-relaxed">
              Describe your problem in detail to our AI assistant. It
              understands context — like "my pipe burst last night" — and gives
              sharply tailored matches.
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
        setStep(0);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const goTo = (next: number, dir: "next" | "prev") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 220);
  };

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background: "rgba(10, 25, 35, 0.65)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden transition-all duration-300 ${
          visible ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        }`}
        style={{
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          className="relative px-6 pt-6 pb-5 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0d9563 0%, #1ab189 60%, #2dc99e 100%)",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-10 -left-4 w-28 h-28 rounded-full opacity-10 bg-white" />

          <div className="relative flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FontAwesomeIcon
                  icon={current.icon}
                  className="text-white text-sm"
                />
              </div>
              <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">
                {current.tag}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="text-white text-xs" />
            </button>
          </div>

          <div
            className={`transition-all duration-220 ${
              animating
                ? direction === "next"
                  ? "-translate-x-4 opacity-0"
                  : "translate-x-4 opacity-0"
                : "translate-x-0 opacity-100"
            }`}
          >
            <h2 className="text-white text-xl font-bold leading-tight mb-1.5">
              {current.title}
            </h2>
            <p className="text-white/75 text-[0.8125rem] leading-relaxed">
              {current.subtitle}
            </p>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-5 h-1.5 bg-white"
                    : i < step
                      ? "w-1.5 h-1.5 bg-white/60"
                      : "w-1.5 h-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className={`px-6 py-5 transition-all duration-220 ${
            animating
              ? direction === "next"
                ? "-translate-x-4 opacity-0"
                : "translate-x-4 opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          {current.content}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              onClick={() => goTo(step - 1, "prev")}
              className="flex items-center gap-1.5 text-[#5a6c7a] text-sm font-medium hover:text-[#1e3a4f] transition-colors px-3 py-2 rounded-lg hover:bg-[#f3f4f6]"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              Back
            </button>
          ) : (
            <div />
          )}

          {isLast ? (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #0d9563, #1ab189)",
              }}
            >
              <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
              Got it, let's start!
            </button>
          ) : (
            <button
              onClick={() => goTo(step + 1, "next")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #0d9563, #1ab189)",
              }}
            >
              Next
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
