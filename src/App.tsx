import { useEffect, useRef, useState } from "react";
import type ArcGISMap from "@arcgis/core/Map";

import {
  createEarthquakeLayer,
  type Earthquake,
} from "./gis/earthquakeLayer";

import {
  searchLocations,
  searchEarthquakesByRadius,
  createSearchRadiusLayer,
} from "./gis/spatialSearch";

import { fetchEarthquakes } from "./services/usgsService";
import { convertUSGSFeed } from "./gis/usgsAdapter";

type FeedStatus = "loading" | "ready" | "error";

// Replace the map's earthquake markers.
function updateEarthquakeLayer(
  map: ArcGISMap,
  earthquakes: Earthquake[]
) {
  const existing = map.findLayerById("earthquake-markers");

  if (existing) {
    map.remove(existing);
  }

  map.add(createEarthquakeLayer(earthquakes));
}

function App() {
  const mapRef = useRef<ArcGISMap | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [feedStatus, setFeedStatus] = useState<FeedStatus>("loading");
  const [feedError, setFeedError] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] =
    useState("Riverside");

  const [radiusKm, setRadiusKm] = useState(50);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSummary, setSearchSummary] =
    useState<string | null>(null);
  const [searchError, setSearchError] =
    useState<string | null>(null);

  // Fetch and process live USGS earthquake observations.
  useEffect(() => {
    let active = true;

    async function loadEarthquakes() {
      try {
        const rawData = await fetchEarthquakes();
        const converted = convertUSGSFeed(rawData);

        if (!active) return;

        setEarthquakes(converted);
        setFeedStatus("ready");
      } catch (error) {
        if (!active) return;

        console.error("USGS data loading failed:", error);

        setFeedError(
          error instanceof Error
            ? error.message
            : "Unable to retrieve earthquake data."
        );

        setFeedStatus("error");
      }
    }

    void loadEarthquakes();

    return () => {
      active = false;
    };
  }, []);

  // Display live earthquake markers once the map and data are ready.
  useEffect(() => {
    const map = mapRef.current;

    if (!mapReady || !map || feedStatus !== "ready") {
      return;
    }

    updateEarthquakeLayer(map, earthquakes);
  }, [mapReady, earthquakes, feedStatus]);

  // Search the live earthquake dataset by geographic radius.
  const handleSearch = async () => {
    const map = mapRef.current;

    const location = searchLocations.find(
      (item) => item.name === selectedLocation
    );

    if (!map || !location || feedStatus !== "ready") {
      setSearchError("Map or earthquake data is not ready.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await searchEarthquakesByRadius(
        earthquakes,
        location,
        radiusKm
      );

      const radiusLayer = await createSearchRadiusLayer(
        location,
        radiusKm
      );

      // Remove the previous search boundary.
      const previousRadius = map.findLayerById("search-radius");

      if (previousRadius) {
        map.remove(previousRadius);
      }

      // Add the boundary first so markers appear above it.
      map.add(radiusLayer);
      updateEarthquakeLayer(map, results);

      setSearchSummary(
        `Found ${results.length} earthquake(s) within ` +
        `${radiusKm} km of ${location.name}.`
      );
    } catch (error) {
      console.error("Spatial search failed:", error);
      setSearchError("Unable to complete spatial search.");
    } finally {
      setIsSearching(false);
    }
  };

  // Restore all live earthquakes on the map.
  const resetSearch = () => {
    const map = mapRef.current;

    if (!map || feedStatus !== "ready") {
      return;
    }

    const radiusLayer = map.findLayerById("search-radius");

    if (radiusLayer) {
      map.remove(radiusLayer);
    }

    updateEarthquakeLayer(map, earthquakes);

    setSearchSummary(null);
    setSearchError(null);
  };

  const controlsDisabled =
    !mapReady || feedStatus !== "ready" || isSearching;

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>GeoInsight</h1>
        <p>Southern California Earthquake Analytics</p>
      </header>

      {/* Geographic Search Controls */}
      <section className="search-panel">
        <h2>Geographic Radius Search</h2>

        <div className="search-controls">
          <div className="search-field">
            <label htmlFor="location">Search Location</label>

            <select
              id="location"
              value={selectedLocation}
              onChange={(event) =>
                setSelectedLocation(event.target.value)
              }
            >
              {searchLocations.map((location) => (
                <option
                  key={location.name}
                  value={location.name}
                >
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="search-field">
            <label htmlFor="radius">Search Radius</label>

            <select
              id="radius"
              value={radiusKm}
              onChange={(event) =>
                setRadiusKm(Number(event.target.value))
              }
            >
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
            </select>
          </div>

          <div className="search-actions">
            <button
              className="search-button"
              onClick={handleSearch}
              disabled={controlsDisabled}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>

            <button
              className="reset-button"
              onClick={resetSearch}
              disabled={controlsDisabled}
            >
              Reset
            </button>
          </div>
        </div>

        {feedStatus === "loading" && (
          <p className="legend-note" role="status">
            Loading earthquake data from USGS...
          </p>
        )}

        {feedStatus === "ready" && (
          <p className="legend-note" role="status">
            Loaded {earthquakes.length} earthquake observations
            from the USGS past-day feed within the configured
            Southern California region.
          </p>
        )}

        {feedStatus === "error" && (
          <p className="search-error" role="alert">
            USGS data error: {feedError}
          </p>
        )}

        {searchSummary && (
          <p className="search-result" role="status">
            {searchSummary}
          </p>
        )}

        {searchError && (
          <p className="search-error" role="alert">
            {searchError}
          </p>
        )}
      </section>

      {/* ArcGIS Map */}
      <section className="map-container">
        <arcgis-map
          basemap="osm"
          center="-116.8, 34.0"
          zoom={8}
          onarcgisViewReadyChange={(event) => {
            const component = event.target;

            if (!component.ready || !component.map) {
              return;
            }

            mapRef.current = component.map;
            setMapReady(true);
          }}
          style={{
            display: "block",
            width: "100%",
            height: "65vh",
            minHeight: "400px",
          }}
        >
          <arcgis-zoom slot="top-left" />
        </arcgis-map>
      </section>

      {/* Magnitude Legend */}
      <section className="earthquake-legend">
        <h3>Earthquake Magnitude</h3>

        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot low"></span>
            <span>Below 2.5</span>
          </div>

          <div className="legend-item">
            <span className="legend-dot moderate"></span>
            <span>2.5 - 3.9</span>
          </div>

          <div className="legend-item">
            <span className="legend-dot high"></span>
            <span>4.0 and above</span>
          </div>
        </div>

        <p className="legend-note">
          Earthquake observations provided by USGS.
          Data is loaded when the application opens.
          Regional boundaries are approximate.
        </p>
      </section>

      <footer className="app-footer">
        <p>GeoInsight | Built with ArcGIS Maps SDK</p>
      </footer>
    </main>
  );
}

export default App;