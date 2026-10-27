
import test from "node:test";
import assert from "node:assert/strict";

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
  assert.equal(isValidEarthquake(losAngeles), true);
});

test("rejects an earthquake with missing magnitude", () => {
  const invalid = makeEarthquake(
    "invalid", null, -118.24, 34.05, 1000
  );

  assert.equal(isValidEarthquake(invalid), false);
});

test("rejects invalid coordinates", () => {
  const invalid = makeEarthquake(
    "invalid", 2.0, -200, 34.05, 1000
  );

  assert.equal(isValidEarthquake(invalid), false);
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

  assert.equal(results.length, 2);
});

test("filters earthquakes to California region", () => {
  const results = filterCaliforniaEarthquakes([
    losAngeles,
    sanFrancisco,
    newYork,
  ]);

  assert.equal(results.length, 2);
  assert.deepEqual(
    results.map((earthquake) => earthquake.id),
    ["la", "sf"]
  );
});

test("sorts earthquakes by magnitude", () => {
  const results = sortEarthquakesByMagnitude([
    losAngeles,
    sanFrancisco,
    newYork,
  ]);

  assert.deepEqual(
    results.map((earthquake) => earthquake.id),
    ["sf", "ny", "la"]
  );
});

test("calculates earthquake statistics", () => {
  const stats = calculateEarthquakeStats([
    losAngeles,
    sanFrancisco,
    newYork,
  ]);

  assert.equal(stats.totalEarthquakes, 3);
  assert.equal(stats.strongestMagnitude, 4.2);
  assert.equal(stats.strongestEarthquake?.id, "sf");
  assert.equal(stats.recentEarthquake?.id, "ny");
  assert.equal(stats.magnitude4Plus, 1);
  assert.ok(
    Math.abs(stats.averageMagnitude! - 3.2666666667) < 0.000001
  );
});

test("handles an empty dataset", () => {
  const stats = calculateEarthquakeStats([]);

  assert.equal(stats.totalEarthquakes, 0);
  assert.equal(stats.averageMagnitude, null);
  assert.equal(stats.strongestEarthquake, null);
  assert.equal(stats.recentEarthquake, null);
  assert.equal(stats.magnitude4Plus, 0);
});
