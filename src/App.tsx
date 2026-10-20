function App() {
  return (
    <main>
      <h1>GeoInsight</h1>
      <p>Southern California Earthquake Analytics</p>

      <arcgis-map
        basemap="osm"
        center="-116.8, 34.0"
        zoom={8}
        style={{
          display: "block",
          width: "100%",
          height: "75vh",
        }}
      >
        <arcgis-zoom slot="top-left" />
      </arcgis-map>
    </main>
  );
}

export default App;