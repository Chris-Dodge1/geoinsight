import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Earthquake } from "../gis/earthquakeLayer";
import { filterEarthquakesByMagnitude } from "../gis/magnitudeFilter";
import EarthquakeDashboard from "./EarthquakeDashboard";
import { calculateDashboardStats } from "./dashboardStats";

const earthquakes: Earthquake[] = [1, 2.5, 4, 4.5].map(
  (magnitude, index) => ({
    id: String(index),
    latitude: 34,
    longitude: -117,
    magnitude,
    depthKm: 5,
    place: "Test location",
  })
);

function renderDashboard(
  data: Earthquake[],
  status: "loading" | "ready" | "error" = "ready"
) {
  return renderToStaticMarkup(
    <EarthquakeDashboard
      stats={calculateDashboardStats(data)}
      status={status}
      scopeLabel="Within 50 km of Riverside"
    />
  );
}

describe("Earthquake dashboard statistics", () => {
  it("calculates all four statistics including the 4.0 boundary", () => {
    expect(calculateDashboardStats(earthquakes)).toEqual({
      totalEarthquakes: 4,
      averageMagnitude: 3,
      strongestMagnitude: 4.5,
      magnitude4Plus: 2,
    });
  });

  it("handles empty results without inventing magnitudes", () => {
    expect(calculateDashboardStats([])).toEqual({
      totalEarthquakes: 0,
      averageMagnitude: null,
      strongestMagnitude: null,
      magnitude4Plus: 0,
    });
  });

  it("handles negative and zero magnitudes without changing observations", () => {
    const data = [-1, 0].map((magnitude) => ({
      ...earthquakes[0], magnitude,
    }));
    expect(calculateDashboardStats(data).strongestMagnitude).toBe(0);
    expect(calculateDashboardStats(data.slice(0, 1)).strongestMagnitude).toBe(-1);
    expect(calculateDashboardStats(data).averageMagnitude).toBe(-0.5);
    expect(data.map((earthquake) => earthquake.magnitude)).toEqual([-1, 0]);
  });

  it("reflects magnitude filtering on radius results and reset data", () => {
    const radiusResults = earthquakes.slice(0, 3);
    expect(calculateDashboardStats(
      filterEarthquakesByMagnitude(radiusResults, 2.5)
    )).toEqual({
      totalEarthquakes: 2,
      averageMagnitude: 3.25,
      strongestMagnitude: 4,
      magnitude4Plus: 1,
    });
    expect(calculateDashboardStats(
      filterEarthquakesByMagnitude(radiusResults, 4)
    ).totalEarthquakes).toBe(1);
    expect(calculateDashboardStats(
      filterEarthquakesByMagnitude(earthquakes, 4)
    ).totalEarthquakes).toBe(2);
    expect(calculateDashboardStats(
      filterEarthquakesByMagnitude(earthquakes, null)
    ).totalEarthquakes).toBe(4);
  });
});

describe("Earthquake dashboard display", () => {
  it("renders the four cards, formatted magnitudes, and search scope", () => {
    const markup = renderDashboard(earthquakes);
    for (const label of [
      "Total Earthquakes", "Average Magnitude",
      "Strongest Magnitude", "Magnitude 4.0+",
      "Within 50 km of Riverside",
    ]) expect(markup).toContain(label);
    expect(markup).toContain('class="dashboard-card-value">4</p>');
    expect(markup).toContain('class="dashboard-card-value">3.00</p>');
    expect(markup).toContain('class="dashboard-card-value">4.50</p>');
    expect(markup).toContain('class="dashboard-card-value">2</p>');
  });

  it("renders zero counts and unavailable magnitudes for empty results", () => {
    const markup = renderDashboard([]);
    expect(markup.match(/class="dashboard-card-value">0<\/p>/g)).toHaveLength(2);
    expect(markup.match(/class="dashboard-card-value">—<\/p>/g)).toHaveLength(2);
  });

  it("shows loading placeholders instead of misleading zero counts", () => {
    const markup = renderDashboard([], "loading");
    expect(markup).toContain('aria-busy="true"');
    expect(markup.match(/class="dashboard-card-value">\.\.\.<\/p>/g)).toHaveLength(4);
  });

  it("hides statistics when the USGS feed fails", () => {
    const markup = renderDashboard(earthquakes, "error");
    expect(markup.match(/class="dashboard-card-value">—<\/p>/g)).toHaveLength(4);
    expect(markup).not.toContain('class="dashboard-card-value">4.50</p>');
  });
});
