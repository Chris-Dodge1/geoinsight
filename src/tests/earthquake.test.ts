
import { test, expect } from "vitest";

import type { EarthquakeFeature } from "../types/earthquake";

import {
  isValidEarthquake,
  validateEarthquakes,
  filterCaliforniaEarthquakes,
  sortEarthquakesByMagnitude,
} from "../services/earthquakeProcessor";

import { calculateEarthquakeStats } from "../services/earthquakeStats";

// Create a sample earthquake for testing.
function makeEarthquake(
  id: string,
  magnitude: number | null,
  longitude: number,
  latitude: number,
  time: number
): EarthquakeFeature {
  return {
    type: "Feature",
    id,
    properties: {
      mag: magnitude,
      place: "Test location",
      time,
      updated: time,
      url: "https://earthquake.usgs.gov",
      title: "Test earthquake",
      status: "reviewed",
      tsunami: 0,
      type: "earthquake",
    },
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude, 10],
    },
  };
}

const losAngeles = makeEarthquake(
  "la", 2.5, -118.24, 34.05, 1000
);

const sanFrancisco = makeEarthquake(
  "sf", 4.2, -122.42, 37.77, 2000
);

const newYork = makeEarthquake(
  "ny", 3.1, -74.01, 40.71, 3000
);

test("accepts a valid earthquake", () => {
  expect(isValidEarthquake(losAngeles)).toBe(true);
});

test("rejects an earthquake with missing magnitude", () => {
  const invalid = makeEarthquake(
    "invalid", null, -118.24, 34.05, 1000
  );

  expect(isValidEarthquake(invalid)).toBe(false);
});

test("rejects invalid coordinates", () => {
  const invalid = makeEarthquake(
    "invalid", 2.0, -200, 34.05, 1000
  );

  expect(isValidEarthquake(invalid)).toBe(false);
});

test("removes invalid earthquake records", () => {
  const invalid = makeEarthquake(
    "invalid", null, -118.24, 34.05, 1000
  );

  const collection = {
    type: "FeatureCollection" as const,
    features: [losAngeles, invalid, sanFrancisco],
  };

  const results = validateEarthquakes(collection);

  expect(results.length).toBe(2);
});

test("filters earthquakes to California region", () => {
  const results = filterCaliforniaEarthquakes([
    losAngeles,
    sanFrancisco,
    newYork,
  ]);

  expect(results.length).toBe(2);
  expect(
    results.map((earthquake) => earthquake.id)
  ).toEqual(["la", "sf"]);
});

test("sorts earthquakes by magnitude", () => {
  const results = sortEarthquakesByMagnitude([
    losAngeles,
    sanFrancisco,
    newYork,
  ]);

  expect(
    results.map((earthquake) => earthquake.id)
  ).toEqual(["sf", "ny", "la"]);
});

test("calculates earthquake statistics", () => {
  const stats = calculateEarthquakeStats([
    losAngeles,
    sanFrancisco,
    newYork,
  ]);

  expect(stats.totalEarthquakes).toBe(3);
  expect(stats.strongestMagnitude).toBe(4.2);
  expect(stats.strongestEarthquake?.id).toBe("sf");
  expect(stats.recentEarthquake?.id).toBe("ny");
  expect(stats.magnitude4Plus).toBe(1);
  expect(stats.averageMagnitude).toBeCloseTo(
    3.2666666667,
    5
  );
});

test("handles an empty dataset", () => {
  const stats = calculateEarthquakeStats([]);

  expect(stats.totalEarthquakes).toBe(0);
  expect(stats.averageMagnitude).toBeNull();
  expect(stats.strongestEarthquake).toBeNull();
  expect(stats.recentEarthquake).toBeNull();
  expect(stats.magnitude4Plus).toBe(0);
});
