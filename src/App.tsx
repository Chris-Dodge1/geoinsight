import { useRef, useState } from "react";
import type ArcGISMap from "@arcgis/core/Map";

import {
  createEarthquakeLayer,
  sampleEarthquakes,
} from "./gis/earthquakeLayer";

import {
  searchLocations,
  searchEarthquakesByRadius,
  createSearchRadiusLayer,
} from "./gis/spatialSearch";

function App() {
  const mapRef = useRef<ArcGISMap | null>(null);

  const [selectedLocation, setSelectedLocation] =
    useState("Riverside");

  const [radiusKm, setRadiusKm] = useState(50);
  const [resultCount, setResultCount] =
    useState<number | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run a geographic radius search
  const handleSearch = async () => {
    const map = mapRef.current;

    const location = searchLocations.find(
      (item) => item.name === selectedLocation
    );

    if (!map || !location) {
      setError("Map or search location is not ready.");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Find earthquakes within the selected radius
      const results = await searchEarthquakesByRadius(
        sampleEarthquakes,
        location,
        radiusKm
      );

      // Create the geographic buffer circle
      const radiusLayer = await createSearchRadiusLayer(
        location,
        radiusKm
      );

      // Create markers for matching earthquakes
      const earthquakeLayer = createEarthquakeLayer(results);

      // Remove previous search layers
      const oldRadius = map.findLayerById("search-radius");
      const oldEarthquakes =
        map.findLayerById("earthquake-markers");

      if (oldRadius) {
        map.remove(oldRadius);
      }

      if (oldEarthquakes) {
        map.remove(oldEarthquakes);
      }

      // Add radius underneath earthquake markers
      map.add(radiusLayer);
      map.add(earthquakeLayer);

      setResultCount(results.length);
    } catch (err) {
      console.error("Spatial search failed:", err);
      setError("Unable to complete spatial search.");
    } finally {
      setIsSearching(false);
    }
  };

  // Restore the original map
  const resetSearch = () => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const oldRadius = map.findLayerById("search-radius");
    const oldEarthquakes =
      map.findLayerById("earthquake-markers");

    if (oldRadius) {
      map.remove(oldRadius);
    }

    if (oldEarthquakes) {
      map.remove(oldEarthquakes);
    }

    map.add(createEarthquakeLayer(sampleEarthquakes));

    setResultCount(null);
    setError(null);
  };

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
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>

            <button
              className="reset-button"
              onClick={resetSearch}
              disabled={isSearching}
            >
              Reset
            </button>
          </div>
        </div>

        {resultCount !== null && (
          <p className="search-result" role="status">
            Found {resultCount} earthquake(s) within
            {" "}{radiusKm} km of {selectedLocation}.
          </p>
        )}

        {error && (
          <p className="search-error" role="alert">
            {error}
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

            const map = component.map;
            mapRef.current = map;

            if (!map.findLayerById("earthquake-markers")) {
              map.add(
                createEarthquakeLayer(sampleEarthquakes)
              );
            }
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
          Demonstration earthquake data.
          Live USGS integration coming soon.
        </p>
      </section>

      <footer className="app-footer">
        <p>GeoInsight | Built with ArcGIS Maps SDK</p>
      </footer>
    </main>
  );
}

export default App;