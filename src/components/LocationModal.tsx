"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faTimes,
  faExclamationTriangle,
  faLocationArrow,
  faKeyboard,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualInput: () => void;
}

export default function LocationModal({
  isOpen,
  onClose,
  onManualInput,
}: LocationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const t1 = setTimeout(() => setMounted(true), 0);
      const t2 = setTimeout(() => setVisible(true), 10);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      const t1 = setTimeout(() => setVisible(false), 0);
      const t2 = setTimeout(() => setMounted(false), 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isOpen]);

  if (!mounted) return null;

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
        className={`bg-white rounded-2xl w-full max-w-[420px] overflow-hidden transition-all duration-300 ${
          visible ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        }`}
        style={{
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          className="relative px-6 pt-5 pb-5 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0d9563 0%, #1ab189 60%, #2dc99e 100%)",
          }}
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full opacity-10 bg-white" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(245,158,11,0.2)" }}
              >
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-[#f59e0b] text-base"
                />
              </div>
              <div>
                <p className="text-white/60 text-[0.65rem] font-semibold tracking-widest uppercase">
                  Location
                </p>
                <h3 className="text-white font-bold text-base leading-tight">
                  Permission Denied
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.1)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
              }
            >
              <FontAwesomeIcon
                icon={faTimes}
                className="text-white/70 text-xs"
              />
            </button>
          </div>

          <p className="relative text-white/65 text-xs mt-3 leading-relaxed">
            No worries — you can still get great recommendations by typing your
            location manually below.
          </p>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          {/* Manual option — primary CTA */}
          <button
            onClick={onManualInput}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#0d9563] bg-[#f0faf6] hover:bg-[#e4f6ef] transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0d9563] flex items-center justify-center shrink-0">
              <FontAwesomeIcon
                icon={faKeyboard}
                className="text-white text-sm"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1e3a4f] font-semibold text-sm">
                Enter Location Manually
              </p>
              <p className="text-[#5a6c7a] text-xs mt-0.5">
                Type your city or neighbourhood in the search bar
              </p>
            </div>
            <FontAwesomeIcon
              icon={faLocationArrow}
              className="text-[#0d9563] text-sm shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>

          {/* Privacy note */}
          <div className="flex items-start gap-2.5 px-1">
            <FontAwesomeIcon
              icon={faShieldAlt}
              className="text-[#9ca3af] text-xs mt-0.5 shrink-0"
            />
            <p className="text-[#9ca3af] text-[0.7rem] leading-relaxed">
              Your location is only used to surface nearby professionals. We
              never store or share your precise coordinates.
            </p>
          </div>
        </div>

        {/* Dismiss */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb] hover:border-[#d1d5db] transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
