
export interface EarthquakeProperties {
  mag: number | null;
  place: string | null;
  time: number;
  updated: number;
  url: string;
  title: string;
  status: string;
  tsunami: number;
  type: string;
}

export interface EarthquakeGeometry {
  type: "Point";
  coordinates: [number, number, number];
}

export interface EarthquakeFeature {
  type: "Feature";
  properties: EarthquakeProperties;
  geometry: EarthquakeGeometry;
  id: string;
}

export interface EarthquakeCollection {
  type: "FeatureCollection";
  features: EarthquakeFeature[];
}
