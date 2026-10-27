
import type { EarthquakeFeature } from "../types/earthquake";

export interface EarthquakeStats {
  totalEarthquakes: number;
  averageMagnitude: number | null;
  strongestMagnitude: number | null;
  strongestEarthquake: EarthquakeFeature | null;
  recentEarthquake: EarthquakeFeature | null;
  magnitude4Plus: number;
}

// Calculate statistics from validated earthquake records.
export function calculateEarthquakeStats(
  earthquakes: EarthquakeFeature[]
): EarthquakeStats {
  const withMagnitude = earthquakes.filter(
    (earthquake) => Number.isFinite(earthquake.properties.mag)
  );

  const totalMagnitude = withMagnitude.reduce(
    (sum, earthquake) => sum + earthquake.properties.mag!,
    0
  );

  const strongestEarthquake = withMagnitude.reduce<
    EarthquakeFeature | null
  >((strongest, earthquake) => {
    if (
      strongest === null ||
      earthquake.properties.mag! > strongest.properties.mag!
    ) {
      return earthquake;
    }
    return strongest;
  }, null);

  const recentEarthquake = earthquakes.reduce<
    EarthquakeFeature | null
  >((recent, earthquake) => {
    if (
      recent === null ||
      earthquake.properties.time > recent.properties.time
    ) {
      return earthquake;
    }
    return recent;
  }, null);

  return {
    totalEarthquakes: earthquakes.length,
    averageMagnitude:
      withMagnitude.length > 0
        ? totalMagnitude / withMagnitude.length
        : null,
    strongestMagnitude: strongestEarthquake?.properties.mag ?? null,
    strongestEarthquake,
    recentEarthquake,
    magnitude4Plus: withMagnitude.filter(
      (earthquake) => earthquake.properties.mag! >= 4
    ).length,
  };
}
