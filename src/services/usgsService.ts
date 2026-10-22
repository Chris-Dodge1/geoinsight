
const USGS_API_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

export async function fetchEarthquakes(): Promise<unknown> {
  const response = await fetch(USGS_API_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch earthquakes: ${response.status}`
    );
  }

  const data: unknown = await response.json();

  return data;
}
