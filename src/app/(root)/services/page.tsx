"use client";

import { useState, useEffect } from "react";
import ServiceProviderCard from "../../../components/cards/ServiceProviderCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faMapMarkerAlt,
  faSliders,
  faChevronDown,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import {
  getProvidersForListing,
  searchProviders,
} from "./[slug]/_components/providerData";

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Services");
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("Best Match");

  // State for providers and loading
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    "All Services",
    "Panel Upgrades",
    "Emergency Repair",
    "Smart Home",
    "Commercial",
  ];

  const sortOptions = [
    "Best Match",
    "Highest Rating",
    "Most Reviews",
    "Lowest Price",
    "Nearest",
  ];

  // Fetch providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const data = await getProvidersForListing();
      setProviders(data);
    } catch (error) {
      console.error("Failed to load providers:", error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchProviders({
        search_query: searchTerm || undefined,
      });

      const formatted = results.map((p) => ({
        id: p.id,
        name: p.name,
        initials: p.initials,
        title: p.title,
        location: p.location,
        rating: p.rating,
        reviewCount: p.reviewCount,
        description: p.about.paragraphs[0],
        experienceYears: p.experienceYears,
        successRate: p.successRate || p.jobSuccess,
        responseTime: p.responseTime,
        distance: p.distance || "N/A",
        priceRange: p.priceRange || p.hourlyRate,
        isVerified: p.isVerified,
        slug: p.slug,
      }));

      setProviders(formatted);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Search Section */}
      <section className="bg-neutral-0 py-8 border-b border-neutral-200">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="flex-1 w-full relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Electrician"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-lg text-neutral-800 transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(26,177,137,0.08)] bg-neutral-0 placeholder:text-neutral-400"
              />
            </div>

            {/* Location Input */}
            <div className="flex-1 w-full relative">
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Brooklyn, NY"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-lg text-neutral-800 transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(26,177,137,0.08)] bg-neutral-0 placeholder:text-neutral-400"
              />
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary whitespace-nowrap w-full md:w-auto disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin mr-2"
                  />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Count */}
          <div className="mb-4">
            <span className="text-neutral-700 font-medium">
              {loading ? "Loading..." : `${providers.length} providers found`}
            </span>
          </div>

          {/* Filter Bar - All in One Line */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Category Pills */}
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-primary text-neutral-0"
                    : "bg-neutral-0 text-neutral-700 border border-neutral-200 hover:border-primary"
                }`}
              >
                {category}
              </button>
            ))}

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 rounded-lg border border-neutral-200 bg-neutral-0 text-neutral-700 text-sm font-medium focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(26,177,137,0.08)] cursor-pointer transition-all"
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    Sort by: {option}
                  </option>
                ))}
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-xs"
              />
            </div>

            {/* Filters Button */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-neutral-0 text-neutral-700 hover:border-primary transition-all">
              <FontAwesomeIcon icon={faSliders} />
              <span className="text-sm font-medium">Filters</span>
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="text-4xl text-primary-600 mb-4"
                />
                <p className="text-neutral-600">Loading providers...</p>
              </div>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="text-neutral-400 text-2xl"
                />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No providers found
              </h3>
              <p className="text-neutral-600">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            /* Providers Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <ServiceProviderCard key={provider.id} {...provider} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
