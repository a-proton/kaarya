"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faMapMarkerAlt,
  faCheckCircle,
  faBriefcase,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import LocationModal from "../../components/LocationModal";
import GuideModal from "../../components/GuideModal";
import {
  requestLocationPermission,
  getStoredLocation,
  reverseGeocode,
  LocationData,
} from "../../lib/locationService";

const GUIDE_SEEN_KEY = "kaarya_guide_seen";
const MANUAL_LOCATION_KEY = "kaarya_manual_location";

export default function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationText, setLocationText] = useState("");
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    const storedGps = getStoredLocation();
    const storedManual = localStorage.getItem(MANUAL_LOCATION_KEY);
    const guideSeen = localStorage.getItem(GUIDE_SEEN_KEY);

    if (storedGps) {
      // GPS location already granted and stored — restore it
      reverseGeocode(storedGps.latitude, storedGps.longitude).then((city) => {
        setUserLocation(storedGps);
        setLocationText(city);
      });
    } else if (storedManual) {
      // User previously typed a location manually — restore it
      setLocationText(storedManual);
    }

    // Show guide only if user has never seen it before
    if (!guideSeen) {
      const t = setTimeout(() => setShowGuideModal(true), 0);
      return () => clearTimeout(t);
    }
  }, []);

  /** Called when user finishes / closes the guide modal */
  const handleGuideClose = () => {
    // Mark guide as seen so it never shows again
    localStorage.setItem(GUIDE_SEEN_KEY, "true");
    setShowGuideModal(false);

    // Only request location if we don't already have one
    const storedGps = getStoredLocation();
    const storedManual = localStorage.getItem(MANUAL_LOCATION_KEY);
    if (storedGps || storedManual) return;

    requestLocationPermission().then((result) => {
      if (result.granted && result.location) {
        setUserLocation(result.location);
        reverseGeocode(
          result.location.latitude,
          result.location.longitude,
        ).then((city) => setLocationText(city));
      } else {
        // Permission denied — show manual-input modal
        setShowLocationModal(true);
      }
    });
  };

  const handleSearch = () => {
    // Persist manually typed location whenever a search is triggered
    if (locationText && !userLocation) {
      localStorage.setItem(MANUAL_LOCATION_KEY, locationText);
    }

    const params = new URLSearchParams();
    if (searchQuery) params.append("query", searchQuery);
    if (locationText) params.append("location", locationText);
    if (userLocation) {
      params.append("lat", userLocation.latitude.toString());
      params.append("lon", userLocation.longitude.toString());
    }
    router.push(`/services?${params.toString()}`);
  };

  const handleManualLocation = () => {
    setShowLocationModal(false);
    document.getElementById("location-input")?.focus();
  };

  /** Persist manual location as the user types so it survives a refresh */
  const handleLocationTextChange = (value: string) => {
    setLocationText(value);
    if (!userLocation) {
      // Only persist manual text; GPS location is stored by locationService
      if (value) {
        localStorage.setItem(MANUAL_LOCATION_KEY, value);
      } else {
        localStorage.removeItem(MANUAL_LOCATION_KEY);
      }
    }
  };

  return (
    <>
      <section className="bg-gradient-to-br from-[#e8f5f1] to-[#d8f0e8] pt-24 pb-16 min-h-[550px]">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 xl:gap-16 items-center">
            {/* Left Content */}
            <div className="max-w-[700px]">
              <h1 className="text-[clamp(2.25rem,4vw,3rem)] font-bold text-[#1e3a4f] leading-[1.15] mb-5 tracking-[-0.02em]">
                Find Trusted Service Providers Near You
              </h1>

              <p className="text-[1.0625rem] text-[#5a6c7a] leading-[1.65] mb-8">
                Connect with verified professionals for electrical, plumbing,
                HVAC, and more
              </p>

              {/* Search Box */}
              <div className="bg-white rounded-md p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0 max-w-[700px]">
                <div className="flex-[1.2] flex items-center gap-2.5 px-4 py-3 min-w-0">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="text-[#0d9563] shrink-0 w-[18px] h-[18px]"
                  />
                  <input
                    type="text"
                    placeholder="What service do you need?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 border-none bg-transparent text-[0.9375rem] text-neutral-700 outline-none min-w-0 placeholder:text-neutral-400"
                  />
                </div>

                <div className="hidden md:block w-px h-5 bg-[#e5e7eb] shrink-0"></div>

                <div className="flex-[0.8] flex items-center gap-2.5 px-4 py-3 min-w-0">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="text-[#0d9563] shrink-0 w-[18px] h-[18px]"
                  />
                  <input
                    id="location-input"
                    type="text"
                    placeholder="Where?"
                    value={locationText}
                    onChange={(e) => handleLocationTextChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 border-none bg-transparent text-[0.9375rem] text-neutral-700 outline-none min-w-0 placeholder:text-neutral-400"
                  />
                </div>

                <button
                  onClick={handleSearch}
                  className="px-7 py-3 bg-[#0d9563] text-white border-none rounded font-semibold text-base cursor-pointer transition-all duration-200 whitespace-nowrap shrink-0 hover:bg-[#059953]"
                >
                  Search
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-[0.9375rem] md:text-[0.8125rem] lg:text-[0.9375rem] text-neutral-700 whitespace-nowrap">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-[#0d9563] shrink-0 w-[18px] h-[18px]"
                  />
                  <span>5,000+ Verified Providers</span>
                </div>
                <div className="flex items-center gap-2 text-[0.9375rem] md:text-[0.8125rem] lg:text-[0.9375rem] text-neutral-700 whitespace-nowrap">
                  <FontAwesomeIcon
                    icon={faBriefcase}
                    className="text-[#0d9563] shrink-0 w-[18px] h-[18px]"
                  />
                  <span>50,000+ Jobs Completed</span>
                </div>
                <div className="flex items-center gap-2 text-[0.9375rem] md:text-[0.8125rem] lg:text-[0.9375rem] text-neutral-700 whitespace-nowrap">
                  <FontAwesomeIcon
                    icon={faStar}
                    className="text-[#0d9563] shrink-0 w-[18px] h-[18px]"
                  />
                  <span>4.8★ Average Rating</span>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="relative flex justify-center lg:justify-end lg:pr-8">
              <div className="relative w-full max-w-[550px] lg:max-w-[480px] xl:max-w-[550px]">
                <Image
                  src="/hero-side.png"
                  alt="Professional service providers"
                  width={550}
                  height={400}
                  priority
                  quality={90}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Modal — shown only on first ever visit */}
      <GuideModal isOpen={showGuideModal} onClose={handleGuideClose} />

      {/* Location Modal — shown only if browser permission was denied */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onManualInput={handleManualLocation}
      />
    </>
  );
}
