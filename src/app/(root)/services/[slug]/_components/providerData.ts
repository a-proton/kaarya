// app/(root)/services/[slug]/_components/providerData.ts

export interface Provider {
  slug: string;
  id: number;
  name: string;
  initials: string;
  title: string;
  experienceYears: string;
  location: string;
  memberSince: string;
  rating: number;
  reviewCount: number;
  jobSuccess: string;
  responseTime: string;
  hourlyRate: string;
  projectRange: string;
  services: string[];
  heroImage: string;
  isVerified: boolean;
  backgroundVerified: boolean;
  about: {
    paragraphs: string[];
  };
  specializations: Array<{
    icon: string;
    title: string;
    description: string;
    price: string;
  }>;
  portfolio: Array<{
    id: number;
    url: string;
    title: string;
    category: string;
  }>;
  experienceHistory: Array<{
    id: number;
    title: string;
    client: string;
    date: string;
    description: string;
  }>;
  reviews: Array<{
    id: number;
    name: string;
    initials: string;
    date: string;
    rating: number;
    verified: boolean;
    project: string;
    comment: string;
    helpful: number;
  }>;
  licenses: Array<{
    icon: string;
    title: string;
    issuer: string;
    license: string;
    issued: string;
    status: string;
  }>;
  availability: Array<{
    day: string;
    date: number;
    available: boolean;
  }>;
  quickStats: Array<{
    icon: string;
    label: string;
    value: string;
  }>;
  contactMethods: Array<{
    icon: string;
    label: string;
    preferred: boolean;
  }>;
  serviceArea: {
    radius: number;
    location: string;
  };
  distance?: string;
  priceRange?: string;
  successRate?: string;
}

// ==================================================================================
// PUBLIC API HELPER (NO AUTHENTICATION REQUIRED)
// ==================================================================================

const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
    : process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function publicApiFetch(endpoint: string): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log("🔍 Fetching from:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("❌ API Error:", response.status, response.statusText);
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log("✅ API Response received");
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

// ==================================================================================
// CACHE MANAGEMENT
// ==================================================================================

let cachedProviders: Provider[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function clearProviderCache() {
  cachedProviders = null;
  cacheTimestamp = null;
}

// ==================================================================================
// PUBLIC API FUNCTIONS
// ==================================================================================

export async function getAllProviders(): Promise<Provider[]> {
  console.log("📋 getAllProviders called");

  // Check cache first
  if (
    cachedProviders &&
    cacheTimestamp &&
    Date.now() - cacheTimestamp < CACHE_DURATION
  ) {
    console.log("✅ Returning cached providers:", cachedProviders.length);
    return cachedProviders;
  }

  try {
    const response = await publicApiFetch("/api/v1/providers/search/");

    // ✅ FIXED: Log count instead of individual items
    console.log(
      `🔄 Transforming ${response.results?.length || 0} providers...`,
    );
    const providers = (response.results || []).map(transformBackendProvider);
    console.log(`✅ Transformed ${providers.length} providers`);

    // Update cache
    cachedProviders = providers;
    cacheTimestamp = Date.now();

    return providers;
  } catch (error) {
    console.error("❌ Failed to fetch providers:", error);
    return [];
  }
}

export async function getProviderBySlug(
  slug: string,
): Promise<Provider | undefined> {
  console.log("🔍 getProviderBySlug called with slug:", slug);

  try {
    const response = await publicApiFetch(`/api/v1/providers/slug/${slug}/`);
    console.log("✅ Provider fetched successfully");

    return transformBackendProvider(response);
  } catch (error) {
    console.error(`❌ Failed to fetch provider with slug ${slug}:`, error);
    return undefined;
  }
}

export async function getProviderById(
  id: number,
): Promise<Provider | undefined> {
  try {
    const response = await publicApiFetch(`/api/v1/providers/${id}/`);
    return transformBackendProvider(response);
  } catch (error) {
    console.error(`❌ Failed to fetch provider with id ${id}:`, error);
    return undefined;
  }
}

export async function getProvidersForListing() {
  console.log("📋 getProvidersForListing called");

  const providers = await getAllProviders();
  console.log(`📦 Preparing ${providers.length} providers for listing`);

  return providers.map((provider) => ({
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    initials: provider.initials,
    title: provider.title,
    location: provider.location,
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    description: provider.about.paragraphs[0] || "No description available",
    experienceYears: provider.experienceYears,
    successRate: provider.successRate || provider.jobSuccess,
    responseTime: provider.responseTime,
    distance: provider.distance || "N/A",
    priceRange: provider.priceRange || provider.hourlyRate,
    isVerified: provider.isVerified,
  }));
}

export async function searchProviders(filters: {
  category_id?: number;
  min_rating?: number;
  is_verified?: boolean;
  search_query?: string;
}) {
  console.log("🔍 searchProviders called with filters:", filters);

  try {
    const params = new URLSearchParams();
    if (filters.category_id)
      params.append("category_id", filters.category_id.toString());
    if (filters.min_rating)
      params.append("min_rating", filters.min_rating.toString());
    if (filters.is_verified) params.append("is_verified", "true");
    if (filters.search_query)
      params.append("search_query", filters.search_query);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/v1/providers/search/?${queryString}`
      : `/api/v1/providers/search/`;

    const response = await publicApiFetch(endpoint);

    // ✅ FIXED: Log count instead of individual items
    const results = response.results || [];
    console.log(`🔄 Transforming ${results.length} search results...`);
    const providers = results.map(transformBackendProvider);
    console.log(`✅ Transformed ${providers.length} providers`);

    return providers;
  } catch (error) {
    console.error("❌ Failed to search providers:", error);
    return [];
  }
}

// ==================================================================================
// DATA TRANSFORMATION
// ==================================================================================

function transformBackendProvider(data: any): Provider {
  // ✅ REMOVED INDIVIDUAL LOGGING - Only log when there's an error

  // ✅ Generate slug if missing
  const slug = data.slug || `provider-${data.id}`;

  const transformed = {
    id: data.id,
    slug: slug,
    name: data.name || data.full_name || "Unknown Provider",
    initials:
      data.initials || generateInitials(data.name || data.full_name || "??"),
    title: data.title || data.category?.name || "",
    experienceYears:
      data.experienceYears ||
      (data.years_of_experience ? `${data.years_of_experience}+ Years` : "New"),
    location:
      data.location ||
      (data.city && data.state
        ? `${data.city}, ${data.state}`
        : "Location not set"),
    memberSince:
      data.memberSince ||
      (data.member_since
        ? `Member since ${new Date(data.member_since).getFullYear()}`
        : ""),
    rating: parseFloat(data.rating || data.average_rating) || 0,
    reviewCount: data.reviewCount || data.total_reviews || 0,
    jobSuccess:
      data.jobSuccess || (data.job_success ? `${data.job_success}%` : "0%"),
    responseTime:
      data.responseTime ||
      (data.response_time_hours ? `< ${data.response_time_hours}hr` : "N/A"),
    hourlyRate:
      data.hourlyRate ||
      (data.hourly_rate_min && data.hourly_rate_max
        ? `$${data.hourly_rate_min}-${data.hourly_rate_max}/hour`
        : ""),
    projectRange:
      data.projectRange ||
      (data.project_range_min && data.project_range_max
        ? `$${data.project_range_min}-${data.project_range_max}`
        : ""),
    services: data.services || [],
    heroImage: data.heroImage || data.hero_image || data.cover_image || "",
    isVerified: data.isVerified || data.is_verified || false,
    backgroundVerified:
      data.backgroundVerified || data.background_verified || false,
    about: {
      paragraphs:
        data.about?.paragraphs ||
        (data.bio ? data.bio.split("\n\n") : ["No description available"]),
    },
    specializations: data.specializations || [],
    portfolio: data.portfolio || [],
    experienceHistory: data.experienceHistory || data.experience_history || [],
    reviews: data.reviews || [],
    licenses: data.licenses || [],
    availability: data.availability || [],
    quickStats: data.quickStats || [],
    contactMethods: data.contactMethods || [
      { icon: "faCommentDots", label: "Karya messaging", preferred: true },
      { icon: "faPhone", label: "Phone call", preferred: true },
      { icon: "faComment", label: "Text message", preferred: true },
      { icon: "faEnvelope", label: "Email", preferred: false },
    ],
    serviceArea: data.serviceArea || {
      radius: data.service_radius || 25,
      location:
        data.location ||
        (data.city && data.state ? `${data.city}, ${data.state}` : ""),
    },
    distance: data.distance || "N/A",
    priceRange:
      data.priceRange ||
      data.hourlyRate ||
      data.projectRange ||
      "Contact for pricing",
    successRate: data.successRate || data.jobSuccess || "0%",
  };

  return transformed;
}

function generateInitials(name: string): string {
  if (!name) return "??";
  const words = name.split(" ");
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return words[0][0].toUpperCase();
}
