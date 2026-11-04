import { describe, it, expect, vi, beforeEach } from "vitest";

import * as distanceOperator from
  "@arcgis/core/geometry/operators/geodeticDistanceOperator";

import {
  searchEarthquakesByRadius,
  searchLocations,
} from "./spatialSearch";

import type { Earthquake } from "./earthquakeLayer";

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