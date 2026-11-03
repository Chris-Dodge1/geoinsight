import type { Earthquake } from "./earthquakeLayer";

/**
 * Filter earthquakes by a minimum magnitude.
 * Pass null to include every earthquake.
 */
export function filterEarthquakesByMagnitude(
  earthquakes: Earthquake[],
  minimumMagnitude: number | null
): Earthquake[] {
  if (
    minimumMagnitude !== null &&
    !Number.isFinite(minimumMagnitude)
  ) {
    throw new Error("Minimum magnitude must be finite.");
  }

  return earthquakes.filter(
    (earthquake) =>
      minimumMagnitude === null ||
      earthquake.magnitude >= minimumMagnitude
  );
}