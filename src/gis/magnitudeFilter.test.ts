import { describe, expect, it } from "vitest";
import type { Earthquake } from "./earthquakeLayer";
import { filterEarthquakesByMagnitude } from "./magnitudeFilter";

function makeEarthquake(
  id: string,
  magnitude: number
): Earthquake {
  return {
    id,
    longitude: -117.4,
    latitude: 33.95,
    magnitude,
    depthKm: 5,
    place: "Test location",
  };
}

const earthquakes: Earthquake[] = [
  makeEarthquake("small", 1.2),
  makeEarthquake("boundary25", 2.5),
  makeEarthquake("moderate", 3.6),
  makeEarthquake("boundary40", 4.0),
  makeEarthquake("large", 5.2),
];

describe("GeoInsight magnitude filtering", () => {
  it("includes all earthquakes when the filter is null", () => {
    const results = filterEarthquakesByMagnitude(
      earthquakes,
      null
    );

    expect(results).toHaveLength(5);
  });

  it("filters earthquakes at magnitude 2.5 or higher", () => {
    const results = filterEarthquakesByMagnitude(
      earthquakes,
      2.5
    );

    expect(results.map((eq) => eq.id)).toEqual([
      "boundary25",
      "moderate",
      "boundary40",
      "large",
    ]);
  });

  it("filters earthquakes at magnitude 4.0 or higher", () => {
    const results = filterEarthquakesByMagnitude(
      earthquakes,
      4.0
    );

    expect(results.map((eq) => eq.id)).toEqual([
      "boundary40",
      "large",
    ]);
  });

  it("handles an empty earthquake dataset", () => {
    expect(
      filterEarthquakesByMagnitude([], 2.5)
    ).toEqual([]);
  });

  it("does not modify the original dataset", () => {
    const originalIds = earthquakes.map((eq) => eq.id);

    filterEarthquakesByMagnitude(earthquakes, 4.0);

    expect(earthquakes.map((eq) => eq.id)).toEqual(
      originalIds
    );
  });

  it("rejects invalid minimum magnitudes", () => {
    expect(() =>
      filterEarthquakesByMagnitude(earthquakes, NaN)
    ).toThrow();

    expect(() =>
      filterEarthquakesByMagnitude(earthquakes, Infinity)
    ).toThrow();
  });
});