
import type { EarthquakeCollection } from "../types/earthquake";

export type EarthquakeFeedPeriod = "day" | "week" | "month";

const USGS_API_BASE_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary";

export async function fetchEarthquakes(
  period: EarthquakeFeedPeriod = "day"
): Promise<EarthquakeCollection> {
  const response = await fetch(
    `${USGS_API_BASE_URL}/all_${period}.geojson`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch earthquakes: ${response.status}`
    );
  }

  const data: EarthquakeCollection = await response.json();

  return data;
}
