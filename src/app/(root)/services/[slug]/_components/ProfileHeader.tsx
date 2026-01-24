"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone,
  faBookmark,
  faShareNodes,
  faMapMarkerAlt,
  faStar,
  faClock,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faBookmark as faBookmarkRegular } from "@fortawesome/free-regular-svg-icons";
import { useState } from "react";
import { Provider } from "./providerData";
import InquiryModal from "./InquiryModal";

interface ProfileHeaderProps {
  provider: Provider;
}

export default function ProfileHeader({ provider }: ProfileHeaderProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  const providerData = {
    name: provider.name,
    initials: provider.initials,
    title: provider.title,
    experienceYears: provider.experienceYears,
    location: provider.location,
    memberSince: provider.memberSince,
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    jobSuccess: provider.jobSuccess,
    responseTime: provider.responseTime,
    hourlyRate: provider.hourlyRate,
    projectRange: provider.projectRange,
    services: provider.services,
  };

  return (
    <>
      {" "}
      <div className="bg-neutral-0 border-b border-neutral-200">
        {" "}
        {/* Hero Image */}{" "}
        <div className="w-full h-64 bg-gradient-to-br from-neutral-200 to-neutral-300 relative overflow-hidden">
          {" "}
          <img
            src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&h=400&fit=crop"
            alt="Workshop"
            className="w-full h-full object-cover"
          />{" "}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>{" "}
        </div>
        {/* Profile Info Container */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Profile Picture */}
            <div className="absolute -top-20 left-0">
              <div className="w-40 h-40 rounded-full bg-primary-600 flex items-center justify-center text-neutral-0 text-5xl font-bold shadow-lg border-4 border-neutral-0">
                {providerData.initials}
              </div>
              {/* Verified Badge */}
              <div className="absolute bottom-2 right-2 w-12 h-12 bg-neutral-0 rounded-full flex items-center justify-center shadow-md">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-neutral-0 text-xl"
                  />
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-24 pb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Left Side - Name and Details */}
                <div className="flex-1">
                  <h1 className="heading-2 text-neutral-900 mb-2">
                    {providerData.name}
                  </h1>
                  <p className="body-large text-neutral-700 mb-1">
                    {providerData.title} • {providerData.experienceYears}
                  </p>
                  <div className="flex items-center gap-2 text-neutral-600 mb-3">
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="text-neutral-500"
                    />
                    <span className="body-regular">
                      {providerData.location}
                    </span>
                  </div>
                  <p className="body-small text-neutral-500 mb-4">
                    {providerData.memberSince}
                  </p>

                  {/* Stats Row */}
                  <div className="flex flex-wrap items-center gap-6 mb-4">
                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faStar}
                        className="text-yellow-500"
                      />
                      <span className="font-semibold text-neutral-900">
                        {providerData.rating}
                      </span>
                      <span className="text-neutral-600">
                        {providerData.reviewCount} Reviews
                      </span>
                    </div>

                    {/* Job Success */}
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="text-primary-500"
                      />
                      <span className="font-semibold text-neutral-900">
                        {providerData.jobSuccess}
                      </span>
                      <span className="text-neutral-600">Job Success</span>
                    </div>

                    {/* Response Time */}
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faClock}
                        className="text-secondary-600"
                      />
                      <span className="font-semibold text-neutral-900">
                        {providerData.responseTime}
                      </span>
                    </div>
                  </div>

                  {/* Service Tags */}
                  <div className="flex flex-wrap gap-2">
                    {providerData.services.map((service, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Side - Action Buttons */}
                <div className="flex flex-col gap-3 lg:min-w-[280px]">
                  <button
                    className="btn-primary-lg w-full"
                    onClick={() => setIsInquiryModalOpen(true)}
                  >
                    <FontAwesomeIcon icon={faPhone} />
                    Contact Provider
                  </button>
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon
                      icon={isSaved ? faBookmark : faBookmarkRegular}
                    />
                    {isSaved ? "Saved" : "Save to Favorites"}
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-neutral-200 bg-neutral-0 text-neutral-700 hover:bg-neutral-50 transition-all">
                    <FontAwesomeIcon icon={faShareNodes} />
                    <span className="font-medium">Share Profile</span>
                  </button>
                </div>
              </div>

              {/* Pricing Info */}
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-neutral-600 body-small mb-1">
                      Hourly Rate
                    </p>
                    <p className="heading-4 text-neutral-900">
                      {providerData.hourlyRate}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600 body-small mb-1">
                      Typical Project Range
                    </p>
                    <p className="heading-4 text-neutral-900">
                      {providerData.projectRange}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg">
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="text-primary-600"
                      />
                      <span className="text-primary-700 font-medium">
                        Usually responds within 1 hour
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        providerId={provider.id}
        providerName={provider.name}
      />
    </>
  );
}
