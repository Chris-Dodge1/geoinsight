
const USGS_API_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

let feedRequest: Promise<unknown> | undefined;

// Share the initial request, including StrictMode effect replay.
export function fetchEarthquakes(): Promise<unknown> {
  feedRequest ??= loadFeed().catch((error) => {
    feedRequest = undefined;
    throw error;
  });
  return feedRequest;
}

async function loadFeed(): Promise<unknown> {
  const response = await fetch(USGS_API_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch earthquakes: ${response.status}`
    );
  }

  const data: unknown = await response.json();

  return data;
}
