import { useMemo, useState } from "react";
import type { Earthquake } from "../gis/earthquakeLayer";
import { sortEarthquakes, type ResultsSort } from "./resultsSort";

interface EarthquakeResultsProps {
  earthquakes: Earthquake[];
  status: "loading" | "ready" | "error";
  mapReady: boolean;
  onSelect: (earthquake: Earthquake) => void;
}

export default function EarthquakeResults({
  earthquakes, status, mapReady, onSelect,
}: EarthquakeResultsProps) {
  const [sort, setSort] = useState<ResultsSort>("magnitude-desc");
  const sorted = useMemo(() => sortEarthquakes(earthquakes, sort), [earthquakes, sort]);

  return (
    <section className="earthquake-results" aria-labelledby="results-heading" aria-busy={status === "loading"}>
      <div className="dashboard-header">
        <div>
          <h2 id="results-heading">Earthquake Results</h2>
          <p>Select a location or click a row to zoom to its earthquake.</p>
        </div>
        <div className="search-field">
          <label htmlFor="results-sort">Sort results</label>
          <select id="results-sort" value={sort} onChange={(event) => setSort(event.target.value as ResultsSort)}>
            <option value="magnitude-desc">Magnitude: highest first</option>
            <option value="magnitude-asc">Magnitude: lowest first</option>
            <option value="depth-asc">Depth: shallowest first</option>
            <option value="location-asc">Location: A–Z</option>
          </select>
        </div>
      </div>
      {status !== "ready" ? (
        <p role="status">{status === "loading" ? "Loading earthquake results…" : "Earthquake results are unavailable. Check the USGS data error above."}</p>
      ) : sorted.length === 0 ? (
        <p role="status">No earthquakes match your current search and magnitude filters.</p>
      ) : (
        <>
          <p role="status">{sorted.length} earthquake(s) shown.{!mapReady && " Waiting for the map to enable zoom."}</p>
          <div className="results-table-scroll" role="region" aria-label="Earthquake results table" tabIndex={0}>
            <table className="results-table">
              <caption>Currently displayed earthquakes. Depth is in kilometers.</caption>
              <thead>
                <tr>
                  <th scope="col" aria-sort={sort === "location-asc" ? "ascending" : "none"}>Location</th>
                  <th scope="col" aria-sort={sort === "magnitude-desc" ? "descending" : sort === "magnitude-asc" ? "ascending" : "none"}>Magnitude</th>
                  <th scope="col" aria-sort={sort === "depth-asc" ? "ascending" : "none"}>Depth (km)</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((earthquake) => (
                  <tr key={earthquake.id} className={mapReady ? "result-row-active" : undefined} onClick={() => { if (mapReady) onSelect(earthquake); }}>
                    <th scope="row">
                      <button type="button" className="result-location" disabled={!mapReady} aria-label={`Zoom to ${earthquake.place}, magnitude ${earthquake.magnitude}`} onClick={(event) => { event.stopPropagation(); onSelect(earthquake); }}>
                        {earthquake.place}
                      </button>
                    </th>
                    <td>{earthquake.magnitude.toFixed(1)}</td>
                    <td>{earthquake.depthKm.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
