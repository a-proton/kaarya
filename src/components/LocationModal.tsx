// components/LocationModal.tsx
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faTimes,
  faExclamationTriangle,
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-primary-500 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-2xl" />
            <h3 className="text-xl font-bold">Location Access Required</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-6 p-4 bg-warning/10 rounded-lg border border-warning/20">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-warning text-xl mt-1"
            />
            <div>
              <p className="text-neutral-800 font-semibold mb-1">
                Location Permission Denied
              </p>
              <p className="text-sm text-neutral-600">
                Without location access, we can't provide you with the most
                accurate and localized results.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-neutral-800">What this means:</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-start gap-2">
                <span className="text-error mt-1">•</span>
                <span>You'll need to manually enter your location</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-error mt-1">•</span>
                <span>Distance calculations may be less accurate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-error mt-1">•</span>
                <span>Results may not be optimized for your area</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button onClick={onManualInput} className="btn-primary w-full">
              Enter Location Manually
            </button>
            <button onClick={onClose} className="btn-secondary w-full">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
