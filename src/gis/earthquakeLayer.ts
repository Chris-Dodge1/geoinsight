
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";

export interface Earthquake {
  id: string;
  longitude: number;
  latitude: number;
  magnitude: number;
  depthKm: number;
  place: string;
}

// Demonstration locations, not actual earthquake events.
export const sampleEarthquakes: Earthquake[] = [
  {
    id: "demo-1",
    longitude: -117.3962,
    latitude: 33.9533,
    magnitude: 2.1,
    depthKm: 5,
    place: "Demo - Riverside",
  },
  {
    id: "demo-2",
    longitude: -116.5453,
    latitude: 33.8303,
    magnitude: 3.2,
    depthKm: 8,
    place: "Demo - Palm Springs",
  },
  {
    id: "demo-3",
    longitude: -117.1825,
    latitude: 34.0556,
    magnitude: 4.5,
    depthKm: 12,
    place: "Demo - Redlands",
  },
];

export function createEarthquakeLayer(
  earthquakes: Earthquake[]
): GraphicsLayer {
  const layer = new GraphicsLayer({
    id: "earthquake-markers",
    title: "Earthquake Locations",
  });

  const graphics = earthquakes.map((earthquake) => {
    const color =
      earthquake.magnitude >= 4
        ? "#dc2626"
        : earthquake.magnitude >= 2.5
        ? "#f59e0b"
        : "#22c55e";

    return new Graphic({
      geometry: new Point({
        longitude: earthquake.longitude,
        latitude: earthquake.latitude,
      }),

      symbol: new SimpleMarkerSymbol({
        style: "circle",
        color,
        size: 14,
        outline: {
          color: "#ffffff",
          width: 1.5,
        },
      }),

      attributes: {
        id: earthquake.id,
        place: earthquake.place,
        magnitude: earthquake.magnitude,
        depthKm: earthquake.depthKm,
      },

      popupTemplate: {
        title: "{place}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              {
                fieldName: "magnitude",
                label: "Magnitude",
              },
              {
                fieldName: "depthKm",
                label: "Depth (km)",
              },
            ],
          },
        ],
      },
    });
  });

  layer.addMany(graphics);

  return layer;
}