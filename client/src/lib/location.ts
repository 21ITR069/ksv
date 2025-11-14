import { OFFICE_COORDINATES } from "@shared/schema";

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's current location
 */
export function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Check if user is within radius of office
 */
export function isWithinOfficeRadius(
  userLat: number,
  userLon: number,
  radiusKm: number = 1
): boolean {
  const distance = calculateDistance(
    userLat,
    userLon,
    OFFICE_COORDINATES.latitude,
    OFFICE_COORDINATES.longitude
  );
  return distance <= radiusKm;
}

/**
 * Get distance from office
 */
export function getDistanceFromOffice(
  userLat: number,
  userLon: number
): number {
  return calculateDistance(
    userLat,
    userLon,
    OFFICE_COORDINATES.latitude,
    OFFICE_COORDINATES.longitude
  );
}
