import type { Earthquake } from "../gis/earthquakeLayer";
import type { EarthquakeDashboardStats } from "./EarthquakeDashboard";

// Presentation adapter; retain the shared Earthquake and dashboard contracts.
export function calculateDashboardStats(
  earthquakes: readonly Earthquake[]
): EarthquakeDashboardStats {
  let totalMagnitude = 0;
  let strongestMagnitude: number | null = null;
  let magnitude4Plus = 0;

  for (const earthquake of earthquakes) {
    totalMagnitude += earthquake.magnitude;
    strongestMagnitude = strongestMagnitude === null
      ? earthquake.magnitude
      : Math.max(strongestMagnitude, earthquake.magnitude);
    if (earthquake.magnitude >= 4) magnitude4Plus += 1;
  }

  return {
    totalEarthquakes: earthquakes.length,
    averageMagnitude: earthquakes.length === 0
      ? null
      : totalMagnitude / earthquakes.length,
    strongestMagnitude,
    magnitude4Plus,
  };
}
