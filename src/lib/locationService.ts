// lib/locationService.ts
export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  timestamp: number;
}

export interface LocationPermissionResult {
  granted: boolean;
  location?: LocationData;
  error?: string;
}

export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  try {
    if (!navigator.geolocation) {
      return { granted: false, error: "Geolocation not supported" };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
          };
          localStorage.setItem("userLocation", JSON.stringify(location));
          resolve({ granted: true, location });
        },
        (error) => {
          resolve({ granted: false, error: error.message });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
      );
    });
  } catch (error) {
    return { granted: false, error: "Failed to access location" };
  }
}

export function getStoredLocation(): LocationData | null {
  try {
    const stored = localStorage.getItem("userLocation");
    if (!stored) return null;
    const location = JSON.parse(stored);
    if (Date.now() - location.timestamp > 3600000) {
      localStorage.removeItem("userLocation");
      return null;
    }
    return location;
  } catch {
    return null;
  }
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "User-Agent": "KaryaApp/1.0" } },
    );
    if (!res.ok) return "Unknown";
    const data = await res.json();
    return data.address?.city || data.address?.town || "Unknown";
  } catch {
    return "Unknown";
  }
}
