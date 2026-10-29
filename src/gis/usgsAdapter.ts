import type { Earthquake } from "./earthquakeLayer";

// Approximate Southern California geographic bounds.
const REGION = {
  minLatitude: 32,
  maxLatitude: 36.5,
  minLongitude: -121,
  maxLongitude: -114,
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// Convert raw USGS GeoJSON into GeoInsight earthquakes.
export function convertUSGSFeed(
  data: unknown
): Earthquake[] {
  if (!isRecord(data) || !Array.isArray(data.features)) {
    throw new Error("Unexpected USGS response format.");
  }

  const earthquakes: Earthquake[] = [];

  for (const feature of data.features) {
    if (
      !isRecord(feature) ||
      typeof feature.id !== "string" ||
      !isRecord(feature.properties) ||
      !isRecord(feature.geometry)
    ) {
      continue;
    }

    const coordinates = feature.geometry.coordinates;
    const magnitude = feature.properties.mag;
    const place = feature.properties.place;

    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 3
    ) {
      continue;
    }

    const [longitude, latitude, depthKm] = coordinates;

    if (
      typeof longitude !== "number" ||
      typeof latitude !== "number" ||
      typeof depthKm !== "number" ||
      typeof magnitude !== "number" ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(depthKm) ||
      !Number.isFinite(magnitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      continue;
    }

    // Keep earthquakes within the target region.
    if (
      latitude < REGION.minLatitude ||
      latitude > REGION.maxLatitude ||
      longitude < REGION.minLongitude ||
      longitude > REGION.maxLongitude
    ) {
      continue;
    }

    earthquakes.push({
      id: feature.id,
      longitude,
      latitude,
      magnitude,
      depthKm,
      place:
        typeof place === "string" && place.trim()
          ? place
          : "Unknown location",
    });
  }

  return earthquakes;
}