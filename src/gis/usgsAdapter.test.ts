import { describe, it, expect } from "vitest";
import { convertUSGSFeed } from "./usgsAdapter";

function makeFeature(
  id: string,
  longitude: number,
  latitude: number,
  depth: number,
  magnitude: number | null,
  place: string | null = "Test earthquake"
) {
  return {
    type: "Feature",
    id,
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude, depth],
    },
    properties: {
      mag: magnitude,
      place,
    },
  };
}

function makeFeed(features: unknown[]) {
  return {
    type: "FeatureCollection",
    features,
  };
}

describe("GeoInsight USGS adapter", () => {
  it("converts valid USGS earthquake data", () => {
    const feed = makeFeed([
      makeFeature("eq1", -117.3962, 33.9533, 5, 2.5, "Riverside"),
    ]);

    expect(convertUSGSFeed(feed)).toEqual([
      {
        id: "eq1",
        longitude: -117.3962,
        latitude: 33.9533,
        depthKm: 5,
        magnitude: 2.5,
        place: "Riverside",
      },
    ]);
  });

  it("filters earthquakes outside Southern California", () => {
    const feed = makeFeed([
      makeFeature("riverside", -117.4, 33.95, 5, 2.1),
      makeFeature("sf", -122.42, 37.77, 8, 3.5),
      makeFeature("ny", -74.0, 40.71, 10, 4.0),
    ]);

    const results = convertUSGSFeed(feed);

    expect(results.map((eq) => eq.id)).toEqual(["riverside"]);
  });

  it("rejects invalid coordinates", () => {
    const feed = makeFeed([
      makeFeature("invalid", -200, 33.95, 5, 2.0),
      makeFeature("valid", -117.4, 33.95, 5, 2.0),
    ]);

    const results = convertUSGSFeed(feed);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("valid");
  });

  it("rejects missing magnitudes", () => {
    const feed = makeFeed([
      makeFeature("missing", -117.4, 33.95, 5, null),
    ]);

    expect(convertUSGSFeed(feed)).toEqual([]);
  });

  it("rejects non-finite numeric values", () => {
    const feed = makeFeed([
      makeFeature("nan", -117.4, 33.95, 5, NaN),
      makeFeature("infinite", -117.4, 33.95, 5, Infinity),
    ]);

    expect(convertUSGSFeed(feed)).toEqual([]);
  });

  it("handles missing location names", () => {
    const feed = makeFeed([
      makeFeature("eq1", -117.4, 33.95, 5, 2.0, null),
    ]);

    const results = convertUSGSFeed(feed);

    expect(results[0].place).toBe("Unknown location");
  });

  it("handles an empty dataset", () => {
    expect(convertUSGSFeed(makeFeed([]))).toEqual([]);
  });

  it("rejects malformed API responses", () => {
    expect(() => convertUSGSFeed(null)).toThrow();
    expect(() => convertUSGSFeed({})).toThrow();
    expect(() =>
      convertUSGSFeed({ features: "invalid" })
    ).toThrow();
  });

  it("includes earthquakes on regional boundaries", () => {
    const feed = makeFeed([
      makeFeature("southwest", -121, 32, 5, 2),
      makeFeature("northeast", -114, 36.5, 5, 2),
    ]);

    expect(convertUSGSFeed(feed)).toHaveLength(2);
  });
});