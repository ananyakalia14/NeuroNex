/* ── Geo Utilities — Haversine & Coordinate Transforms ── */

/**
 * Haversine distance between two lat/lng points in kilometers
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Convert lat/lng to canvas pixel coordinates
 */
export function latLngToPixel(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  panX: number,
  panY: number,
): { x: number; y: number } {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * canvasWidth * zoom + panX;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * canvasHeight * zoom + panY;
  return { x, y };
}

/**
 * Convert canvas pixel coordinates back to lat/lng
 */
export function pixelToLatLng(
  px: number,
  py: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  panX: number,
  panY: number,
): { lat: number; lng: number } {
  const lng = ((px - panX) / (canvasWidth * zoom)) * (bounds.maxLng - bounds.minLng) + bounds.minLng;
  const lat = bounds.maxLat - ((py - panY) / (canvasHeight * zoom)) * (bounds.maxLat - bounds.minLat);
  return { lat, lng };
}

/**
 * Generate a random ID string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format minutes to human-readable time
 */
export function formatTime(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Format distance in km
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
