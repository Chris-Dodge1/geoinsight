import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import EarthquakeResults from "./EarthquakeResults";
import { sortEarthquakes } from "./resultsSort";
import { filterEarthquakesByMagnitude } from "../gis/magnitudeFilter";
import { zoomToEarthquake } from "../gis/earthquakeNavigation";
import type { Earthquake } from "../gis/earthquakeLayer";

const data: Earthquake[] = [
  { id: "a", place: "Zulu", magnitude: 1, depthKm: 8, longitude: -117, latitude: 34 },
  { id: "b", place: "Alpha", magnitude: 4.5, depthKm: 2, longitude: -116, latitude: 33 },
  { id: "c", place: "Beta", magnitude: 2.5, depthKm: -1, longitude: -118, latitude: 35 },
];

function renderResults(earthquakes = data, status: "ready" | "loading" | "error" = "ready", mapReady = true) {
  return renderToStaticMarkup(<EarthquakeResults earthquakes={earthquakes} status={status} mapReady={mapReady} onSelect={vi.fn()} />);
}

describe("results sorting", () => {
  it.each([
    ["magnitude-desc", ["b", "c", "a"]],
    ["magnitude-asc", ["a", "c", "b"]],
    ["depth-asc", ["c", "b", "a"]],
    ["location-asc", ["b", "c", "a"]],
  ] as const)("sorts by %s without changing the map dataset", (sort, ids) => {
    expect(sortEarthquakes(data, sort).map((item) => item.id)).toEqual(ids);
    expect(data.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("handles empty data and preserves input order for ties", () => {
    expect(sortEarthquakes([], "magnitude-desc")).toEqual([]);
    const tied = data.map((item) => ({ ...item, magnitude: 0 }));
    expect(sortEarthquakes(tied, "magnitude-desc")).toEqual(tied);
  });
});

describe("earthquake results list", () => {
  it("renders highest magnitudes first with location, magnitude and depth", () => {
    const html = renderResults();
    expect(html.indexOf('>Alpha</button>')).toBeLessThan(html.indexOf('>Beta</button>'));
    expect(html.indexOf('>Beta</button>')).toBeLessThan(html.indexOf('>Zulu</button>'));
    expect(html).toContain('<td>4.5</td><td>2.0</td>');
    expect(html).toContain('aria-sort="descending"');
    expect(html).toContain('scope="col"');
    expect(html).toContain('aria-label="Zoom to Alpha, magnitude 4.5"');
    expect(html).toContain('Sort results');
    expect(html).toContain('Depth (km)');
  });

  it("renders only the supplied visible data after filters and reset", () => {
    const filtered = renderResults(filterEarthquakesByMagnitude(data.slice(0, 2), 4));
    expect(filtered).toContain('>Alpha</button>');
    expect(filtered).not.toContain('>Beta</button>');
    expect(filtered).not.toContain('>Zulu</button>');
    expect(renderResults()).toContain('>Zulu</button>');
  });

  it("shows a clear empty state", () => {
    expect(renderResults([])).toContain("No earthquakes match your current search and magnitude filters.");
    expect(renderResults([])).not.toContain('<table');
  });

  it.each(["loading", "error"] as const)("does not show stale rows or empty-match messages during %s", (status) => {
    const html = renderResults(data, status);
    expect(html).not.toContain('<table');
    expect(html).not.toContain('No earthquakes match');
    expect(html).toContain(status === "loading" ? "Loading earthquake results" : "Earthquake results are unavailable");
  });

  it("disables location buttons until the map is ready", () => {
    const html = renderResults(data, "ready", false);
    expect(html.match(/disabled=""/g)).toHaveLength(3);
    expect(html).toContain("Waiting for the map");
  });
});

describe("earthquake view navigation", () => {
  it("uses view.goTo with longitude first and a useful zoom", async () => {
    const view = { goTo: vi.fn().mockResolvedValue(undefined), zoom: 8 };
    await zoomToEarthquake(view, data[1]);
    expect(view.goTo).toHaveBeenCalledWith({ center: [-116, 33], zoom: 11 });
  });

  it("retains an already closer zoom", async () => {
    const view = { goTo: vi.fn().mockResolvedValue(undefined), zoom: 14 };
    await zoomToEarthquake(view, data[0]);
    expect(view.goTo).toHaveBeenCalledWith({ center: [-117, 34], zoom: 14 });
  });

  it("ignores interrupted navigation but reports real failures", async () => {
    const goTo = vi.fn().mockRejectedValue(Object.assign(new Error("Interrupted"), { name: "AbortError" }));
    await expect(zoomToEarthquake({ goTo, zoom: 8 }, data[0])).resolves.toBeUndefined();
    goTo.mockRejectedValue(new Error("Navigation failed"));
    await expect(zoomToEarthquake({ goTo, zoom: 8 }, data[0])).rejects.toThrow("Navigation failed");
  });
});
