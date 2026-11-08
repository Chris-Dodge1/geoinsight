import { describe, expect, it } from "vitest";
import { defaultRegion, filterEarthquakesByRegion, regions, type RegionId } from "./regions";
import type { Earthquake } from "./earthquakeLayer";

const quake = (latitude: number, longitude: number): Earthquake => ({
  id: `${latitude},${longitude}`, latitude, longitude, magnitude: 4, depthKm: 5, place: "Test",
});

describe("approximate geographic regions", () => {
  it("defaults to the existing Southern California bounds and map view", () => {
    expect(defaultRegion).toBe("southernCalifornia");
    expect(regions[defaultRegion]).toEqual({
      label: "Southern California", center: "-116.8, 34.0", zoom: 8,
      bounds: { minLatitude: 32, maxLatitude: 36.5, minLongitude: -121, maxLongitude: -114 },
    });
  });

  it("includes Northern California only in the statewide selection", () => {
    const data = [quake(34, -117), quake(37.77, -122.42), quake(41.7, -124.2), quake(40, -74)];
    expect(filterEarthquakesByRegion(data, defaultRegion)).toEqual(data.slice(0, 1));
    expect(filterEarthquakesByRegion(data, "california")).toEqual(data.slice(0, 3));
  });

  for (const id of Object.keys(regions) as RegionId[]) {
    it(`includes every edge and excludes points immediately outside ${id}`, () => {
      const b = regions[id].bounds;
      const midLat = (b.minLatitude + b.maxLatitude) / 2;
      const midLon = (b.minLongitude + b.maxLongitude) / 2;
      const inside = [quake(b.minLatitude, b.minLongitude), quake(b.maxLatitude, b.maxLongitude),
        quake(b.minLatitude, midLon), quake(b.maxLatitude, midLon),
        quake(midLat, b.minLongitude), quake(midLat, b.maxLongitude)];
      const outside = [quake(b.minLatitude - .00001, midLon), quake(b.maxLatitude + .00001, midLon),
        quake(midLat, b.minLongitude - .00001), quake(midLat, b.maxLongitude + .00001)];
      expect(filterEarthquakesByRegion([...inside, ...outside], id)).toEqual(inside);
    });
  }

  it("does not mutate frozen input observations or their order", () => {
    const data = [quake(37.77, -122.42), quake(34, -117)];
    const original = structuredClone(data);
    data.forEach(Object.freeze);
    Object.freeze(data);
    expect(filterEarthquakesByRegion(data, defaultRegion)).toEqual([data[1]]);
    expect(data).toEqual(original);
  });
});
