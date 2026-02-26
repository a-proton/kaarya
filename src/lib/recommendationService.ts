// lib/recommendationService.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface RecommendationParams {
  query?: string;
  location_text?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  category_id?: number;
}

export interface RecommendedProvider {
  id: number;
  business_name: string;
  full_name: string;
  semantic_score: number;
  final_score: number;
  distance_km: number;
  category: string;
  bio: string;
  years_of_experience: number;
  hourly_rate: string;
  response_time: string;
  job_success: string;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  slug: string;
  city?: string;
  profile_image?: string;
}

export async function searchRecommendations(params: RecommendationParams) {
  try {
    const res = await fetch(`${API_URL}/api/v1/recommend/search/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Search failed");
    return await res.json();
  } catch (error) {
    console.error("Recommendation error:", error);
    throw error;
  }
}

export async function trackClick(
  providerId: number,
  searchId: number,
  position: number,
) {
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
    console.error("Track click error:", error);
  }
}
