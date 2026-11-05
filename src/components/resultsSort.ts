import type { Earthquake } from "../gis/earthquakeLayer";

export type ResultsSort = "magnitude-desc" | "magnitude-asc" | "depth-asc" | "location-asc";

export function sortEarthquakes(
  earthquakes: readonly Earthquake[],
  sort: ResultsSort
): Earthquake[] {
  return [...earthquakes].sort((a, b) => {
    switch (sort) {
      case "magnitude-desc": return b.magnitude - a.magnitude;
      case "magnitude-asc": return a.magnitude - b.magnitude;
      case "depth-asc": return a.depthKm - b.depthKm;
      case "location-asc": return a.place.localeCompare(b.place);
    }
  });
}
