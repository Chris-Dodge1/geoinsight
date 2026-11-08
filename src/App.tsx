import { useEffect, useMemo, useRef, useState } from "react";
import type ArcGISMap from "@arcgis/core/Map";
import type MapView from "@arcgis/core/views/MapView";
import EarthquakeResults from "./components/EarthquakeResults";
import { zoomToEarthquake } from "./gis/earthquakeNavigation";
import EarthquakeDashboard from "./components/EarthquakeDashboard";
import { calculateDashboardStats } from "./components/dashboardStats";

import {
  createEarthquakeLayer,
  type Earthquake,
} from "./gis/earthquakeLayer";

import {
  getSearchLocationsForRegion,
  searchEarthquakesByRadius,
  createSearchRadiusLayer,
} from "./gis/spatialSearch";

import { filterEarthquakesByMagnitude } from "./gis/magnitudeFilter";
import { fetchEarthquakes } from "./services/usgsService";
import { convertUSGSFeed } from "./gis/usgsAdapter";

import { defaultRegion, regions, filterEarthquakesByRegion, type RegionId } from "./gis/regions";

type FeedStatus = "loading" | "ready" | "error";

interface ActiveSearch {
  locationName: string;
  radiusKm: number;
  earthquakes: Earthquake[];
}

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
  const [regionId, setRegionId] = useState<RegionId>(defaultRegion);
  const region = regions[regionId];
  const supportedLocations = getSearchLocationsForRegion(regionId);
  const mapRef = useRef<ArcGISMap | null>(null);
  const viewRef = useRef<MapView | null>(null);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [feedStatus, setFeedStatus] =
    useState<FeedStatus>("loading");
  const [feedError, setFeedError] = useState<string | null>(
    null
  );

  const [selectedLocation, setSelectedLocation] =
    useState("Riverside");

  const [radiusKm, setRadiusKm] = useState(50);

  // null means all earthquake magnitudes.
  const [minMagnitude, setMinMagnitude] = useState<
    number | null
  >(null);

  const [activeSearch, setActiveSearch] =
    useState<ActiveSearch | null>(null);

  const [isSearching, setIsSearching] = useState(false);

  const [searchError, setSearchError] = useState<
    string | null
  >(null);

  // Load live USGS observations when the application opens.
  useEffect(() => {
    let active = true;

    async function loadEarthquakes() {
      try {
        const rawData = await fetchEarthquakes();
        const converted = convertUSGSFeed(rawData);

        if (!active) return;

        setEarthquakes(filterEarthquakesByRegion(converted, "california"));
        setFeedError(null);
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

  const regionalEarthquakes = useMemo(
    () => filterEarthquakesByRegion(earthquakes, regionId),
    [earthquakes, regionId]
  );

  // Apply magnitude filtering to either all earthquakes
  // or the results of the current radius search.
  const visibleEarthquakes = useMemo(() => {
    const source = activeSearch
      ? activeSearch.earthquakes
      : regionalEarthquakes;

    return filterEarthquakesByMagnitude(
      source,
      minMagnitude
    );
  }, [regionalEarthquakes, activeSearch, minMagnitude]);

  // Use the same dataset as the markers, including both active filters.
  const dashboardStats = useMemo(
    () => calculateDashboardStats(visibleEarthquakes),
    [visibleEarthquakes]
  );

  const dashboardScope = `${activeSearch
    ? `Within ${activeSearch.radiusKm} km of ${activeSearch.locationName} · ${region.label}`
    : region.label} · ${minMagnitude === null
    ? "All magnitudes"
    : `Magnitude ${minMagnitude.toFixed(1)}+`}`;

  // Update ArcGIS markers whenever the visible dataset changes.
  useEffect(() => {
    const map = mapRef.current;

    if (!mapReady || !map || feedStatus !== "ready") {
      return;
    }

    updateEarthquakeLayer(map, visibleEarthquakes);
  }, [mapReady, feedStatus, visibleEarthquakes]);

  // Search earthquake observations within the chosen radius.
  const handleSearch = async () => {
    const map = mapRef.current;

    const location = supportedLocations.find(
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
        regionalEarthquakes,
        location,
        radiusKm
      );

      const radiusLayer = await createSearchRadiusLayer(
        location,
        radiusKm
      );

      const previousRadius =
        map.findLayerById("search-radius");

      if (previousRadius) {
        map.remove(previousRadius);
      }

      // Add the radius boundary below the earthquake markers.
      map.add(radiusLayer);

      // The magnitude filter is applied automatically.
      setActiveSearch({
        locationName: location.name,
        radiusKm,
        earthquakes: results,
      });
    } catch (error) {
      console.error("Spatial search failed:", error);
      setSearchError("Unable to complete spatial search.");
    } finally {
      setIsSearching(false);
    }
  };

  // Clear the radius search while keeping the magnitude filter.
  const resetSearch = () => {
    const map = mapRef.current;

    if (!map || feedStatus !== "ready") {
      return;
    }

    const radiusLayer = map.findLayerById("search-radius");

    if (radiusLayer) {
      map.remove(radiusLayer);
    }

    setActiveSearch(null);
    setSearchError(null);
  };

  const changeRegion = (nextRegion: RegionId) => {
    const map = mapRef.current;
    const radiusLayer = map?.findLayerById("search-radius");
    if (map && radiusLayer) map.remove(radiusLayer);
    setActiveSearch(null);
    setSearchError(null);
    setNavigationError(null);
    if (!getSearchLocationsForRegion(nextRegion).some(
      (location) => location.name === selectedLocation
    )) {
      setSelectedLocation("Riverside");
    }
    setRegionId(nextRegion);
  };

  const controlsDisabled =
    !mapReady || feedStatus !== "ready" || isSearching;

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>GeoInsight</h1>
        <p>{region.label} Earthquake Analytics</p>
      </header>

      <section className="search-panel">
        <h2>Earthquake Search &amp; Filtering</h2>

        <div className="search-controls">
          <div className="search-field">
            <label htmlFor="region">Region</label>
            <select id="region" value={regionId} disabled={isSearching}
              onChange={(event) => changeRegion(event.target.value as RegionId)}>
              {Object.entries(regions).map(([id, config]) => (
                <option key={id} value={id}>{config.label}</option>
              ))}
            </select>
          </div>
          <div className="search-field">
            <label htmlFor="location">
              Search Location
            </label>

            <select
              id="location"
              value={selectedLocation}
              disabled={isSearching}
              onChange={(event) =>
                setSelectedLocation(event.target.value)
              }
            >
              {supportedLocations.map((location) => (
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
            <label htmlFor="radius">
              Search Radius
            </label>

            <select
              id="radius"
              value={radiusKm}
              disabled={isSearching}
              onChange={(event) =>
                setRadiusKm(Number(event.target.value))
              }
            >
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
            </select>
          </div>

          <div className="search-field">
            <label htmlFor="minimum-magnitude">
              Minimum Magnitude
            </label>

            <select
              id="minimum-magnitude"
              value={
                minMagnitude === null
                  ? "all"
                  : String(minMagnitude)
              }
              disabled={feedStatus !== "ready"}
              onChange={(event) => {
                const value = event.target.value;

                setMinMagnitude(
                  value === "all" ? null : Number(value)
                );
              }}
            >
              <option value="all">All magnitudes</option>
              <option value="2.5">Magnitude 2.5+</option>
              <option value="4">Magnitude 4.0+</option>
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
            Showing {visibleEarthquakes.length} of{" "}
            {regionalEarthquakes.length} USGS past-day earthquake
            observations in the approximate {region.label} geographic region.
          </p>
        )}

        {feedStatus === "error" && (
          <p className="search-error" role="alert">
            USGS data error: {feedError}
          </p>
        )}

        {activeSearch && (
          <p className="search-result" role="status">
            Found {visibleEarthquakes.length} earthquake(s)
            within {activeSearch.radiusKm} km of{" "}
            {activeSearch.locationName} in {region.label}
            {minMagnitude !== null
              ? ` at magnitude ${minMagnitude.toFixed(1)}+`
              : ""}
            .
          </p>
        )}

        {searchError && (
          <p className="search-error" role="alert">
            {searchError}
          </p>
        )}
      </section>

      <EarthquakeDashboard
        stats={dashboardStats}
        status={feedStatus}
        scopeLabel={dashboardScope}
      />

      <section className="map-container">
        <arcgis-map
          basemap="osm"
          center={region.center}
          zoom={region.zoom}
          onarcgisViewReadyChange={(event) => {
            const component = event.target;

            if (!component.ready || !component.map) {
              return;
            }

            mapRef.current = component.map;
            viewRef.current = component.view;
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

      <EarthquakeResults
        earthquakes={visibleEarthquakes}
        status={feedStatus}
        mapReady={mapReady}
        onSelect={(earthquake) => {
          const view = viewRef.current;
          if (!view) return;
          setNavigationError(null);
          void zoomToEarthquake(view, earthquake).catch(() => {
            setNavigationError("Unable to zoom to this earthquake. Please try again.");
          });
        }}
      />
      {navigationError && <p className="search-error" role="alert">{navigationError}</p>}

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