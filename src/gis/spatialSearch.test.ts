import { describe, it, expect, vi, beforeEach } from "vitest";

import * as distanceOperator from
  "@arcgis/core/geometry/operators/geodeticDistanceOperator";

import {
  searchEarthquakesByRadius,
  searchLocations,
} from "./spatialSearch";

import type { Earthquake } from "./earthquakeLayer";
import { getSearchLocationsForRegion } from "./spatialSearch";
import { filterEarthquakesByRegion } from "./regions";

// Mock ArcGIS dependencies so tests can run in Node.
vi.mock("@arcgis/core/geometry/Point", () => ({
  default: class {
    latitude: number;
    longitude: number;

    constructor(options: {
      latitude: number;
      longitude: number;
    }) {
      this.latitude = options.latitude;
      this.longitude = options.longitude;
    }
  },
}));

vi.mock("@arcgis/core/Graphic", () => ({
  default: class {},
}));

vi.mock("@arcgis/core/layers/GraphicsLayer", () => ({
  default: class {},
}));

vi.mock("@arcgis/core/symbols/SimpleFillSymbol", () => ({
  default: class {},
}));

vi.mock(
  "@arcgis/core/geometry/operators/geodeticDistanceOperator",
  () => ({
    load: vi.fn(async () => {}),
    execute: vi.fn(),
  })
);

vi.mock(
  "@arcgis/core/geometry/operators/geodesicBufferOperator",
  () => ({
    load: vi.fn(async () => {}),
    execute: vi.fn(),
  })
);

// Sample earthquake data
const earthquakes: Earthquake[] = [
  {
    id: "1",
    latitude: 33.9533,
    longitude: -117.3962,
    magnitude: 2.1,
    depthKm: 5,
    place: "Riverside",
  },
  {
    id: "2",
    latitude: 34.0556,
    longitude: -117.1825,
    magnitude: 3.2,
    depthKm: 8,
    place: "Redlands",
  },
  {
    id: "3",
    latitude: 33.8303,
    longitude: -116.5453,
    magnitude: 4.5,
    depthKm: 12,
    place: "Palm Springs",
  },
];

const riverside = searchLocations[0];

describe("GeoInsight spatial radius search", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Simulated distances in kilometers:
    // Riverside: 0 km
    // Redlands: 25 km
    // Palm Springs: 80 km
    const distances = [0, 25, 80];
    let index = 0;

    vi.mocked(distanceOperator.execute).mockImplementation(
      () => distances[index++] ?? NaN
    );
  });

  it("finds earthquakes within 50 km", async () => {
    const results = await searchEarthquakesByRadius(
      earthquakes,
      riverside,
      50
    );

    expect(results.map((e) => e.id)).toEqual(["1", "2"]);
  });

  it("includes earthquakes exactly on the boundary", async () => {
    const results = await searchEarthquakesByRadius(
      earthquakes,
      riverside,
      25
    );

    expect(results.map((e) => e.id)).toEqual(["1", "2"]);
  });

  it("excludes earthquakes outside the radius", async () => {
    const results = await searchEarthquakesByRadius(
      earthquakes,
      riverside,
      10
    );

    expect(results.map((e) => e.id)).toEqual(["1"]);
  });

  it("returns all earthquakes within 100 km", async () => {
    const results = await searchEarthquakesByRadius(
      earthquakes,
      riverside,
      100
    );

    expect(results).toHaveLength(3);
  });

  it("handles an empty earthquake dataset", async () => {
    const results = await searchEarthquakesByRadius(
      [],
      riverside,
      50
    );

    expect(results).toEqual([]);
  });

  it("rejects invalid radius values", async () => {
    for (const radius of [0, -10, NaN, Infinity]) {
      await expect(
        searchEarthquakesByRadius(
          earthquakes,
          riverside,
          radius
        )
      ).rejects.toThrow("Radius must be a positive number.");
    }
  });

  it("uses kilometers for ArcGIS distance calculations", async () => {
    await searchEarthquakesByRadius(
      earthquakes,
      riverside,
      50
    );

    expect(distanceOperator.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: riverside.latitude,
        longitude: riverside.longitude,
      }),
      expect.anything(),
      { unit: "kilometers" }
    );
  });
});
const expectedLocations = [
  { name: "Riverside", latitude: 33.9533, longitude: -117.3962 },
  { name: "Redlands", latitude: 34.0556, longitude: -117.1825 },
  { name: "Palm Springs", latitude: 33.8303, longitude: -116.5453 },
  { name: "Los Angeles", latitude: 34.052, longitude: -118.244 },
  { name: "San Diego", latitude: 32.716, longitude: -117.165 },
  { name: "Bakersfield", latitude: 35.373, longitude: -119.019 },
  { name: "San Francisco", latitude: 37.775, longitude: -122.419 },
  { name: "Sacramento", latitude: 38.582, longitude: -121.494 },
  { name: "San Jose", latitude: 37.339, longitude: -121.895 },
  { name: "Fresno", latitude: 36.748, longitude: -119.772 },
];

describe("California search location configuration", () => {
  it("contains all ten city reference points with their geographic coordinates", () => {
    expect(searchLocations).toEqual(expectedLocations);
    expect(new Set(searchLocations.map(({ name }) => name)).size).toBe(10);
  });

  it("offers six Southern California locations and all ten statewide without changing the configuration", () => {
    const before = structuredClone(searchLocations);
    expect(getSearchLocationsForRegion("southernCalifornia")).toEqual(expectedLocations.slice(0, 6));
    expect(getSearchLocationsForRegion("california")).toEqual(expectedLocations);
    expect(searchLocations).toEqual(before);
  });
});

describe("Northern California radius searches", () => {
  // Coordinate-based spherical distance stub: ArcGIS's geodetic WASM asset
  // requires browser loading. Production continues to use the ArcGIS operator.
  beforeEach(() => {
    vi.mocked(distanceOperator.load).mockResolvedValue(undefined);
    vi.mocked(distanceOperator.execute).mockImplementation((from, to) => {
      if (!("latitude" in from) || !("latitude" in to) ||
          !("longitude" in from) || !("longitude" in to) ||
          typeof from.latitude !== "number" || typeof to.latitude !== "number" ||
          typeof from.longitude !== "number" || typeof to.longitude !== "number") return NaN;
      const radians = (degrees: number) => degrees * Math.PI / 180;
      const dLat = radians(to.latitude - from.latitude);
      const dLon = radians(to.longitude - from.longitude);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) *
        Math.cos(radians(to.latitude)) * Math.sin(dLon / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    });
  });

  it.each([25, 50, 100])("filters earthquakes around San Francisco within %i km", async (radius) => {
    const location = searchLocations.find(({ name }) => name === "San Francisco")!;
    const data = [
      { ...earthquakes[0], id: "sf", latitude: location.latitude, longitude: location.longitude },
      { ...earthquakes[0], id: "oakland", latitude: 37.8044, longitude: -122.2712 },
      { ...earthquakes[0], id: "san-jose", latitude: 37.339, longitude: -121.895 },
      { ...earthquakes[0], id: "sacramento", latitude: 38.582, longitude: -121.494 },
      ...earthquakes,
    ];
    const before = structuredClone(data);
    const results = await searchEarthquakesByRadius(filterEarthquakesByRegion(data, "california"), location, radius);
    expect(results.map(({ id }) => id)).toEqual(radius === 100 ? ["sf", "oakland", "san-jose"] : ["sf", "oakland"]);
    expect(data).toEqual(before);
  });

  it("retains Southern California geodetic searches", async () => {
    const results = await searchEarthquakesByRadius(
      filterEarthquakesByRegion(earthquakes, "southernCalifornia"), riverside, 50
    );
    expect(results.map(({ id }) => id)).toEqual(["1", "2"]);
  });
});
