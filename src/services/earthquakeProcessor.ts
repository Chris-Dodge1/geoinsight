
import type {
  EarthquakeCollection,
  EarthquakeFeature,
} from "../types/earthquake";

// Check whether an earthquake record contains valid data.
export function isValidEarthquake(
  earthquake: EarthquakeFeature
): boolean {
  const { properties, geometry } = earthquake;

  return (
    typeof earthquake.id === "string" &&
    earthquake.id.length > 0 &&
    properties !== null &&
    Number.isFinite(properties.mag) &&
    Number.isFinite(properties.time) &&
    geometry?.type === "Point" &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length === 3 &&
    geometry.coordinates.every(Number.isFinite) &&
    geometry.coordinates[0] >= -180 &&
    geometry.coordinates[0] <= 180 &&
    geometry.coordinates[1] >= -90 &&
    geometry.coordinates[1] <= 90
  );
}

// Filter out invalid earthquake records.
export function validateEarthquakes(
  collection: EarthquakeCollection
): EarthquakeFeature[] {
  return collection.features.filter(isValidEarthquake);
}

// Return earthquakes within California's approximate
// geographic bounding box.
export function filterCaliforniaEarthquakes(
  earthquakes: EarthquakeFeature[]
): EarthquakeFeature[] {
  return earthquakes.filter((earthquake) => {
    const [longitude, latitude] =
      earthquake.geometry.coordinates;

    return (
      latitude >= 32.5 &&
      latitude <= 42.0 &&
      longitude >= -124.5 &&
      longitude <= -114.0
    );
  });
}

// Return earthquakes sorted from highest to lowest magnitude.
export function sortEarthquakesByMagnitude(
  earthquakes: EarthquakeFeature[]
): EarthquakeFeature[] {
  return [...earthquakes].sort(
    (a, b) =>
      (b.properties.mag ?? -Infinity) -
      (a.properties.mag ?? -Infinity)
  );
}

// Filter earthquakes by a specified number of days.
export function filterEarthquakesByTime(
  earthquakes: EarthquakeFeature[],
  days: number,
  currentTime: number = Date.now()
): EarthquakeFeature[] {
  if (!Number.isFinite(days) || days < 0) {
    throw new RangeError(
      "Days must be a non-negative number"
    );
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const cutoffTime =
    currentTime - days * millisecondsPerDay;

  return earthquakes.filter((earthquake) => {
    const earthquakeTime = earthquake.properties.time;

    return (
      Number.isFinite(earthquakeTime) &&
      earthquakeTime >= cutoffTime &&
      earthquakeTime <= currentTime
    );
  });
}
