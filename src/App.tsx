import {
  createEarthquakeLayer,
  sampleEarthquakes,
} from "./gis/earthquakeLayer";

function App() {
  return (
    <main className="app-container">
      {/* Application Header */}
      <header className="app-header">
        <h1>GeoInsight</h1>
        <p>Southern California Earthquake Analytics</p>
      </header>

      {/* ArcGIS Map */}
      <section className="map-container">
        <arcgis-map
          basemap="osm"
          center="-116.8, 34.0"
          zoom={8}
          onarcgisViewReadyChange={(event) => {
            const mapComponent = event.target;

            // Wait until the map is ready
            if (!mapComponent.ready || !mapComponent.map) {
              return;
            }

            const map = mapComponent.map;

            // Prevent duplicate earthquake layers
            if (!map.findLayerById("earthquake-markers")) {
              const earthquakeLayer =
                createEarthquakeLayer(sampleEarthquakes);

              map.add(earthquakeLayer);
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

      {/* Earthquake Magnitude Legend */}
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
          Live USGS data coming soon.
        </p>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          GeoInsight | Built with ArcGIS Maps SDK
        </p>
      </footer>
    </main>
  );
}

export default App;