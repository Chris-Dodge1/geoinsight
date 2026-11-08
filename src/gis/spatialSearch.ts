import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";

import * as geodeticDistanceOperator from
  "@arcgis/core/geometry/operators/geodeticDistanceOperator";

import * as geodesicBufferOperator from
  "@arcgis/core/geometry/operators/geodesicBufferOperator";

import type { Earthquake } from "./earthquakeLayer";
import { regions, type RegionId } from "./regions";

export interface SearchLocation {
  name: string;
  latitude: number;
  longitude: number;
}

// City reference points (not municipal boundaries). New coordinates from GeoNames:
// https://www.geonames.org/US/CA/largest-cities-in-california.html
export const searchLocations: SearchLocation[] = [
  {
    name: "Riverside",
    latitude: 33.9533,
    longitude: -117.3962,
  },
  {
    name: "Redlands",
    latitude: 34.0556,
    longitude: -117.1825,
  },
  {
    name: "Palm Springs",
    latitude: 33.8303,
    longitude: -116.5453,
  },
  { name: "Los Angeles", latitude: 34.052, longitude: -118.244 },
  { name: "San Diego", latitude: 32.716, longitude: -117.165 },
  { name: "Bakersfield", latitude: 35.373, longitude: -119.019 },
  { name: "San Francisco", latitude: 37.775, longitude: -122.419 },
  { name: "Sacramento", latitude: 38.582, longitude: -121.494 },
  { name: "San Jose", latitude: 37.339, longitude: -121.895 },
  { name: "Fresno", latitude: 36.748, longitude: -119.772 },
];

// Use the same approximate region envelopes as earthquake filtering.
export function getSearchLocationsForRegion(regionId: RegionId): SearchLocation[] {
  const bounds = regions[regionId].bounds;
  return searchLocations.filter(({ latitude, longitude }) =>
    latitude >= bounds.minLatitude && latitude <= bounds.maxLatitude &&
    longitude >= bounds.minLongitude && longitude <= bounds.maxLongitude
  );
}

// Convert geographic coordinates into ArcGIS Points.
function createPoint(
  latitude: number,
  longitude: number
): Point {
  return new Point({
    latitude,
    longitude,
    spatialReference: { wkid: 4326 },
  });
}

// Find earthquakes inside a given radius.
export async function searchEarthquakesByRadius(
  earthquakes: Earthquake[],
  location: SearchLocation,
  radiusKm: number
): Promise<Earthquake[]> {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    throw new Error("Radius must be a positive number.");
  }

  await geodeticDistanceOperator.load();

  const center = createPoint(
    location.latitude,
    location.longitude
  );

  return earthquakes.filter((earthquake) => {
    const point = createPoint(
      earthquake.latitude,
      earthquake.longitude
    );

    const distance = geodeticDistanceOperator.execute(
      center,
      point,
      { unit: "kilometers" }
    );

    return Number.isFinite(distance) &&
      distance <= radiusKm;
  });
}

// Create a visible geographic search boundary.
export async function createSearchRadiusLayer(
  location: SearchLocation,
  radiusKm: number
): Promise<GraphicsLayer> {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    throw new Error("Radius must be a positive number.");
  }

  await geodesicBufferOperator.load();

  const center = createPoint(
    location.latitude,
    location.longitude
  );

  const buffer = geodesicBufferOperator.execute(
    center,
    radiusKm,
    { unit: "kilometers" }
  );

  const layer = new GraphicsLayer({
    id: "search-radius",
    title: "Search Radius",
  });

  if (buffer) {
    layer.add(
      new Graphic({
        geometry: buffer,
        symbol: new SimpleFillSymbol({
          color: [37, 99, 235, 0.1],
          outline: {
            color: [37, 99, 235, 0.9],
            width: 2,
          },
        }),
      })
    );
  }

  return layer;
}