
import { test, expect } from "vitest";

import type { EarthquakeFeature } from "../types/earthquake";

import {
  isValidEarthquake,
  validateEarthquakes,
  filterCaliforniaEarthquakes,
  sortEarthquakesByMagnitude,
  filterEarthquakesByTime,
} from "../services/earthquakeProcessor";

import {
  calculateEarthquakeStats,
  calculateDailyEarthquakeTrends,
} from "../services/earthquakeStats";

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

// Existing earthquake processing tests.

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

// Time-based earthquake filtering tests.

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 4);

function makeTimedEarthquake(
  id: string,
  daysAgo: number
): EarthquakeFeature {
  return makeEarthquake(
    id,
    3.0,
    -118.24,
    34.05,
    NOW - daysAgo * DAY
  );
}

test("filters earthquakes from the last 24 hours", () => {
  const earthquakes = [
    makeTimedEarthquake("recent", 0.5),
    makeTimedEarthquake("old", 2),
  ];

  const results = filterEarthquakesByTime(
    earthquakes, 1, NOW
  );

  expect(results.map((e) => e.id)).toEqual(["recent"]);
});

test("filters earthquakes from the last 7 days", () => {
  const earthquakes = [
    makeTimedEarthquake("recent", 2),
    makeTimedEarthquake("weekly", 6),
    makeTimedEarthquake("old", 10),
  ];

  const results = filterEarthquakesByTime(
    earthquakes, 7, NOW
  );

  expect(results.map((e) => e.id)).toEqual([
    "recent",
    "weekly",
  ]);
});

test("filters earthquakes from the last 30 days", () => {
  const earthquakes = [
    makeTimedEarthquake("recent", 5),
    makeTimedEarthquake("monthly", 25),
    makeTimedEarthquake("old", 40),
  ];

  const results = filterEarthquakesByTime(
    earthquakes, 30, NOW
  );

  expect(results.map((e) => e.id)).toEqual([
    "recent",
    "monthly",
  ]);
});

test("includes earthquakes exactly at the cutoff", () => {
  const earthquakes = [
    makeTimedEarthquake("boundary", 7),
    makeTimedEarthquake("outside", 8),
  ];

  const results = filterEarthquakesByTime(
    earthquakes, 7, NOW
  );

  expect(results.map((e) => e.id)).toEqual(["boundary"]);
});

test("excludes earthquakes with future timestamps", () => {
  const earthquakes = [
    makeTimedEarthquake("future", -1),
    makeTimedEarthquake("valid", 1),
  ];

  const results = filterEarthquakesByTime(
    earthquakes, 7, NOW
  );

  expect(results.map((e) => e.id)).toEqual(["valid"]);
});

test("rejects negative or invalid day ranges", () => {
  expect(() =>
    filterEarthquakesByTime([], -1, NOW)
  ).toThrow(RangeError);

  expect(() =>
    filterEarthquakesByTime([], Number.NaN, NOW)
  ).toThrow(RangeError);

  expect(() =>
    filterEarthquakesByTime([], Infinity, NOW)
  ).toThrow(RangeError);
});

test("handles an empty dataset when filtering by time", () => {
  const results = filterEarthquakesByTime(
    [], 7, NOW
  );

  expect(results).toEqual([]);
});

test("does not modify the original earthquake array", () => {
  const earthquakes = [
    makeTimedEarthquake("recent", 1),
    makeTimedEarthquake("old", 20),
  ];

  const results = filterEarthquakesByTime(
    earthquakes, 7, NOW
  );

  expect(earthquakes.length).toBe(2);
  expect(results.length).toBe(1);
});


test("groups earthquakes by UTC date", () => {
  const earthquakes = [
    makeEarthquake("a", 2.0, -118.24, 34.05,
      Date.UTC(2026, 10, 1, 8)),
    makeEarthquake("b", 4.0, -118.24, 34.05,
      Date.UTC(2026, 10, 1, 20)),
    makeEarthquake("c", 3.0, -118.24, 34.05,
      Date.UTC(2026, 10, 2, 10)),
  ];

  const trends = calculateDailyEarthquakeTrends(earthquakes);

  expect(trends).toEqual([
    {
      date: "2026-11-01",
      totalEarthquakes: 2,
      averageMagnitude: 3,
      strongestMagnitude: 4,
    },
    {
      date: "2026-11-02",
      totalEarthquakes: 1,
      averageMagnitude: 3,
      strongestMagnitude: 3,
    },
  ]);
});

test("sorts daily trends chronologically", () => {
  const earthquakes = [
    makeTimedEarthquake("older", 3),
    makeTimedEarthquake("newer", 1),
  ];

  const trends = calculateDailyEarthquakeTrends(earthquakes);

  expect(trends.map((trend) => trend.date)).toEqual([
    "2026-11-01",
    "2026-11-03",
  ]);
});

test("handles missing magnitudes in daily trends", () => {
  const earthquakes = [
    makeEarthquake("a", null, -118.24, 34.05, NOW),
  ];

  const trends = calculateDailyEarthquakeTrends(earthquakes);

  expect(trends[0].totalEarthquakes).toBe(1);
  expect(trends[0].averageMagnitude).toBeNull();
  expect(trends[0].strongestMagnitude).toBeNull();
});

test("handles an empty dataset for daily trends", () => {
  expect(calculateDailyEarthquakeTrends([])).toEqual([]);
});
