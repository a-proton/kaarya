"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ServiceProviderCard from "../../../components/cards/ServiceProviderCard";
import Chatbot from "../../../components/Chatbot";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faMapMarkerAlt,
  faSliders,
  faChevronDown,
  faSpinner,
  faUser,
  faBriefcase,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

interface Category {
  id: number;
  name: string;
}

interface Provider {
  id: number;
  name: string;
  initials: string;
  title: string;
  location: string;
  rating: number;
  reviewCount: number;
  description: string;
  experienceYears: string;
  successRate: string;
  responseTime: string;
  distance: string;
  priceRange: string;
  isVerified: boolean;
  slug: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type SearchTab = "service" | "name";

export default function ServicesClient() {
  const searchParams = useSearchParams();

  // Tab
  const [activeTab, setActiveTab] = useState<SearchTab>("service");

  // Service search state
  const [selectedCategory, setSelectedCategory] = useState<
    number | undefined
  >();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("query") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [sortBy, setSortBy] = useState("Best Match");

  // Name search state (frontend-only filter)
  const [nameQuery, setNameQuery] = useState("");

  // Data state
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const initialLoadDone = useRef(false);

  const sortOptions = [
    "Best Match",
    "Highest Rating",
    "Most Reviews",
    "Lowest Price",
    "Nearest",
  ];

  // ─── Name filter (pure frontend) ──────────────────────────────────────────
  const filteredByName = useMemo(() => {
    if (!nameQuery.trim()) return providers;
    const q = nameQuery.trim().toLowerCase();
    return providers.filter((p) => p.name.toLowerCase().includes(q));
  }, [providers, nameQuery]);

  // The list actually shown in the grid
  const displayedProviders = activeTab === "name" ? filteredByName : providers;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const transformProvider = useCallback((p: any): Provider => {
    const fullName = p.full_name || p.name || "Unknown Provider";
    const category = p.category?.name || p.category || "Service Provider";
    const city = p.city || p.location || "Nepal";

    return {
      id: p.id,
      name: fullName,
      initials: generateInitials(fullName),
      title: category,
      location: city,
      rating: parseFloat(p.average_rating || p.rating || 0),
      reviewCount: p.total_reviews || p.reviewCount || 0,
      description:
        p.bio || p.about?.paragraphs?.[0] || "Professional service provider",
      experienceYears:
        p.experienceYears || `${p.years_of_experience || 0}+ Years`,
      successRate:
        p.successRate || p.job_success || `${p.job_success_rate || 0}%`,
      responseTime:
        p.responseTime || p.response_time || `${p.response_time_hours || 0}hr`,
      distance:
        p.distance ||
        (p.distance_km ? `${p.distance_km.toFixed(1)} km` : "N/A"),
      priceRange:
        p.priceRange ||
        p.hourly_rate ||
        `Rs. ${p.hourly_rate_min || 0}-${p.hourly_rate_max || 0}/hr`,
      isVerified: p.isVerified || p.is_verified || false,
      slug: p.slug || `provider-${p.id}`,
    };
  }, []);

  const getProviderCategoryId = (p: any): number | undefined => {
    if (p.category?.id) return p.category.id;
    if (p.category_id) return p.category_id;
    return undefined;
  };

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/categories/`);
      if (response.ok) {
        const data = await response.json();
        setCategories([
          { id: 0, name: "All Services" },
          ...(data.categories || []),
        ]);
      } else {
        setCategories([{ id: 0, name: "All Services" }]);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([{ id: 0, name: "All Services" }]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadAllProviders = useCallback(
    async (categoryId?: number) => {
      const response = await fetch(`${API_URL}/api/v1/providers/search/`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      let all: any[] = data.results || [];
      if (categoryId && categoryId !== 0) {
        all = all.filter((p) => getProviderCategoryId(p) === categoryId);
      }
      setProviders(all.map(transformProvider));
      setSearchId(0);
    },
    [transformProvider],
  );

  const searchWithFilters = useCallback(
    async (term: string, loc: string, categoryId?: number) => {
      const params: any = {
        query: term,
        location_text: loc && loc.trim() ? loc.trim() : "Nepal",
        radius_km: loc && loc.trim() ? 100 : 10000,
      };
      if (categoryId && categoryId !== 0) params.category_id = categoryId;

      const response = await fetch(`${API_URL}/api/v1/recommend/search/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        await loadAllProviders(categoryId);
        return;
      }

      const data = await response.json();
      let results: any[] = data.results || [];

      if (results.length === 0) {
        await loadAllProviders(categoryId);
        return;
      }

      if (categoryId && categoryId !== 0) {
        results = results.filter(
          (p) => getProviderCategoryId(p) === categoryId,
        );
      }

      setProviders(results.map(transformProvider));
      setSearchId(data.search_id || 0);
    },
    [loadAllProviders, transformProvider],
  );

  const loadProviders = useCallback(
    async (term: string, loc: string, categoryId?: number) => {
      setLoading(true);
      try {
        if (term && term.trim().length > 0) {
          await searchWithFilters(term, loc, categoryId);
        } else {
          await loadAllProviders(categoryId);
        }
      } catch (error) {
        console.error("Error loading providers:", error);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    },
    [searchWithFilters, loadAllProviders],
  );

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Initial load — wait for categories first
  useEffect(() => {
    if (loadingCategories) return;
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    loadProviders(searchTerm, location, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingCategories]);

  // Re-load on category change
  useEffect(() => {
    if (!initialLoadDone.current) return;
    loadProviders(searchTerm, location, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // When switching to name tab, reload all providers so the full pool is available
  useEffect(() => {
    if (activeTab === "name" && initialLoadDone.current && !loading) {
      loadAllProviders(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = () =>
    loadProviders(searchTerm, location, selectedCategory);

  const handleTabSwitch = (tab: SearchTab) => {
    setActiveTab(tab);
    if (tab === "service") setNameQuery("");
  };

  const handleProviderClick = async (providerId: number, position: number) => {
    if (searchId > 0) {
      try {
        await fetch(`${API_URL}/api/v1/recommend/track-click/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider_id: providerId,
            search_id: searchId,
            position,
          }),
        });
      } catch (error) {
        console.error("Click tracking failed:", error);
      }
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        {/* Search Section */}
        <section className="bg-neutral-0 border-b border-neutral-200">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Tabs */}
            <div className="flex gap-0 pt-6">
              <button
                onClick={() => handleTabSwitch("service")}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                  activeTab === "service"
                    ? "border-[#0d9563] text-[#0d9563]"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <FontAwesomeIcon icon={faBriefcase} className="text-xs" />
                Search by Service
              </button>
              <button
                onClick={() => handleTabSwitch("name")}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                  activeTab === "name"
                    ? "border-[#0d9563] text-[#0d9563]"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <FontAwesomeIcon icon={faUser} className="text-xs" />
                Search by Name
              </button>
            </div>

            {/* Tab Panels */}
            <div className="py-5">
              {activeTab === "service" ? (
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 w-full relative">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Electrician, Plumber, Carpenter..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-lg text-neutral-800 transition-all focus:outline-none focus:border-[#0d9563] focus:shadow-[0_0_0_3px_rgba(26,177,137,0.08)] bg-neutral-0 placeholder:text-neutral-400"
                    />
                  </div>
                  <div className="flex-1 w-full relative">
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Kathmandu, Lalitpur... (optional)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-lg text-neutral-800 transition-all focus:outline-none focus:border-[#0d9563] focus:shadow-[0_0_0_3px_rgba(26,177,137,0.08)] bg-neutral-0 placeholder:text-neutral-400"
                    />
                  </div>
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
              ) : (
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 w-full relative">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Search provider by name e.g. Arjun, Sita..."
                      value={nameQuery}
                      onChange={(e) => setNameQuery(e.target.value)}
                      autoFocus
                      className="w-full pl-12 pr-10 py-3 border border-neutral-200 rounded-lg text-neutral-800 transition-all focus:outline-none focus:border-[#0d9563] focus:shadow-[0_0_0_3px_rgba(26,177,137,0.08)] bg-neutral-0 placeholder:text-neutral-400"
                    />
                    {nameQuery && (
                      <button
                        onClick={() => setNameQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        <FontAwesomeIcon icon={faTimes} className="text-sm" />
                      </button>
                    )}
                  </div>
                  {nameQuery && !loading && (
                    <div className="shrink-0 px-4 py-3 rounded-lg bg-[#f0faf6] border border-[#c8edd9] text-[#0d9563] text-sm font-semibold whitespace-nowrap">
                      {filteredByName.length} match
                      {filteredByName.length !== 1 ? "es" : ""}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-8">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center gap-3 flex-wrap">
              <span className="text-neutral-700 font-medium">
                {loading
                  ? "Loading..."
                  : `${displayedProviders.length} provider${displayedProviders.length !== 1 ? "s" : ""} found`}
              </span>
              {activeTab === "name" && nameQuery && !loading && (
                <span className="text-neutral-400 text-sm">
                  — filtered from {providers.length} total
                </span>
              )}
            </div>

            {/* Category pills + sort — only on service tab */}
            {activeTab === "service" && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {loadingCategories ? (
                  <div className="text-neutral-400">Loading categories...</div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() =>
                        setSelectedCategory(
                          category.id === 0 ? undefined : category.id,
                        )
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                        selectedCategory === category.id ||
                        (!selectedCategory && category.id === 0)
                          ? "bg-primary text-neutral-0"
                          : "bg-neutral-0 text-neutral-700 border border-neutral-200 hover:border-primary"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))
                )}
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
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-neutral-0 text-neutral-700 hover:border-primary transition-all">
                  <FontAwesomeIcon icon={faSliders} />
                  <span className="text-sm font-medium">Filters</span>
                </button>
              </div>
            )}

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
            ) : displayedProviders.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon
                    icon={activeTab === "name" ? faUser : faSearch}
                    className="text-neutral-400 text-2xl"
                  />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {activeTab === "name" && nameQuery
                    ? `No providers named "${nameQuery}"`
                    : "No providers found"}
                </h3>
                <p className="text-neutral-600">
                  {activeTab === "name"
                    ? "Try a different name or partial name"
                    : "Try adjusting your search criteria or location"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProviders.map((provider, index) => (
                  <div
                    key={provider.id}
                    onClick={() => handleProviderClick(provider.id, index + 1)}
                  >
                    <ServiceProviderCard {...provider} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <Chatbot />
    </>
  );
}

function generateInitials(name: string): string {
  if (!name) return "??";
  const words = name.split(" ");
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return words[0][0].toUpperCase();
}
