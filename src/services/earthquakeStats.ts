
import type { EarthquakeFeature } from "../types/earthquake";

export interface EarthquakeStats {
  totalEarthquakes: number;
  averageMagnitude: number | null;
  strongestMagnitude: number | null;
  strongestEarthquake: EarthquakeFeature | null;
  recentEarthquake: EarthquakeFeature | null;
  magnitude4Plus: number;
}

export interface DailyEarthquakeTrend {
  date: string;
  totalEarthquakes: number;
  averageMagnitude: number | null;
  strongestMagnitude: number | null;
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

// Group earthquakes by UTC date and calculate daily statistics.
export function calculateDailyEarthquakeTrends(
  earthquakes: EarthquakeFeature[]
): DailyEarthquakeTrend[] {
  const dailyGroups = new Map<string, EarthquakeFeature[]>();

  for (const earthquake of earthquakes) {
    const time = earthquake.properties.time;

    if (!Number.isFinite(time)) {
      continue;
    }

    const date = new Date(time).toISOString().slice(0, 10);

    const group = dailyGroups.get(date) ?? [];
    group.push(earthquake);
    dailyGroups.set(date, group);
  }

  return Array.from(dailyGroups.entries())
    .map(([date, group]) => {
      const withMagnitude = group.filter(
        (earthquake) =>
          Number.isFinite(earthquake.properties.mag)
      );

      const magnitudes = withMagnitude.map(
        (earthquake) => earthquake.properties.mag!
      );

      const totalMagnitude = magnitudes.reduce(
        (sum, magnitude) => sum + magnitude,
        0
      );

      return {
        date,
        totalEarthquakes: group.length,
        averageMagnitude:
          magnitudes.length > 0
            ? totalMagnitude / magnitudes.length
            : null,
        strongestMagnitude:
          magnitudes.length > 0
            ? Math.max(...magnitudes)
            : null,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
