import type { Earthquake } from "./earthquakeLayer";

// Inclusive, approximate geographic envelopes, not exact state boundaries.
export const regions = {
  southernCalifornia: {
    label: "Southern California",
    bounds: { minLatitude: 32, maxLatitude: 36.5, minLongitude: -121, maxLongitude: -114 },
    center: "-116.8, 34.0",
    zoom: 8,
  },
  california: {
    label: "All of California",
    bounds: { minLatitude: 32, maxLatitude: 42.1, minLongitude: -124.5, maxLongitude: -114 },
    center: "-119.5, 37.0",
    zoom: 5,
  },
} as const;

export type RegionId = keyof typeof regions;
export const defaultRegion: RegionId = "southernCalifornia";

export function filterEarthquakesByRegion(earthquakes: Earthquake[], regionId: RegionId): Earthquake[] {
  const bounds = regions[regionId].bounds;
  return earthquakes.filter(({ latitude, longitude }) =>
    latitude >= bounds.minLatitude && latitude <= bounds.maxLatitude &&
    longitude >= bounds.minLongitude && longitude <= bounds.maxLongitude
  );
}
