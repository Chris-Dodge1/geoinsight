import { type ReactElement, type ReactNode } from "react";
import { beforeEach, expect, it, vi } from "vitest";

// Exercise App's actual event handlers and effects without loading a WebGL map.
const harness = vi.hoisted(() => ({
  values: [] as unknown[], cursor: 0, effects: [] as (() => unknown)[],
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = harness.cursor++;
    if (!(index in harness.values)) harness.values[index] = initial;
    return [harness.values[index], (value: unknown) => { harness.values[index] = value; }];
  },
  useRef: (initial: unknown) => {
    const index = harness.cursor++;
    if (!(index in harness.values)) harness.values[index] = { current: initial };
    return harness.values[index];
  },
  useMemo: (fn: () => unknown) => fn(),
  useEffect: (fn: () => unknown, dependencies: unknown[]) => {
    const index = harness.cursor++;
    const previous = harness.values[index] as unknown[] | undefined;
    if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
      harness.values[index] = dependencies;
      harness.effects.push(fn);
    }
  },
}));
vi.mock("./gis/earthquakeLayer", () => ({ createEarthquakeLayer: vi.fn((earthquakes) => ({ id: "earthquake-markers", earthquakes })) }));
vi.mock("./gis/earthquakeNavigation", () => ({ zoomToEarthquake: vi.fn() }));
vi.mock("./gis/spatialSearch", async (original) => ({
  ...await original<typeof import("./gis/spatialSearch")>(),
  searchEarthquakesByRadius: vi.fn(async (data) => data.slice(0, 1)),
  createSearchRadiusLayer: vi.fn(async () => ({ id: "search-radius" })),
}));
vi.mock("./services/usgsService", () => ({ fetchEarthquakes: vi.fn(async () => ({ features: [
  ["south", -117, 34, 4], ["north", -122, 38, 4.5], ["small", -118, 34, 1], ["outside", -74, 40, 5],
].map(([id, lon, lat, mag]) => ({ id, properties: { mag }, geometry: { coordinates: [lon, lat, 5] } })) })) }));

import App from "./App";
import EarthquakeResults from "./components/EarthquakeResults";
import EarthquakeDashboard from "./components/EarthquakeDashboard";
import { searchEarthquakesByRadius } from "./gis/spatialSearch";
import { fetchEarthquakes } from "./services/usgsService";

type Node = ReactElement<Record<string, unknown>>;
let tree: Node;
function nodes(node: ReactNode): Node[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as Node;
  return [element, ...nodes(element.props.children as ReactNode)];
}
function find(predicate: (node: Node) => boolean) { return nodes(tree).find(predicate)!; }
function render() {
  harness.cursor = 0;
  tree = App();
  harness.effects.splice(0).forEach((effect) => effect());
}
function change(id: string, value: string) {
  (find((node) => node.props.id === id).props.onChange as (event: unknown) => void)({ target: { value } });
  render();
}
function resultIds() {
  return (find((node) => node.type === EarthquakeResults).props.earthquakes as { id: string }[]).map(({ id }) => id);
}

beforeEach(() => { harness.values = []; harness.effects = []; vi.clearAllMocks(); });

it("defaults to Southern California and synchronizes map, dashboard, table and region switches", async () => {
  const layers = new Map<string, unknown>();
  const map = {
    findLayerById: (id: string) => layers.get(id),
    add: vi.fn((layer) => layers.set(layer.id, layer)),
    remove: vi.fn((layer) => layers.delete(layer.id)),
  };
  render();
  expect(find((node) => node.props.id === "region").props.value).toBe("southernCalifornia");
  await vi.waitFor(() => { render(); expect(resultIds()).toEqual(["south", "small"]); });
  (find((node) => node.type === "arcgis-map").props.onarcgisViewReadyChange as (event: unknown) => void)({ target: { ready: true, map, view: {} } });
  render();
  change("minimum-magnitude", "4");
  const search = find((node) => node.type === "button" && node.props.className === "search-button");
  await (search.props.onClick as () => Promise<void>)();
  render();
  expect(layers.has("search-radius")).toBe(true);
  expect(vi.mocked(searchEarthquakesByRadius).mock.calls[0][0].map((q) => q.id)).toEqual(["south", "small"]);
  change("region", "california");
  expect(layers.has("search-radius")).toBe(false);
  expect(find((node) => node.props.id === "minimum-magnitude").props.value).toBe("4");
  expect(resultIds()).toEqual(["south", "north"]);
  const results = find((node) => node.type === EarthquakeResults).props.earthquakes;
  expect((layers.get("earthquake-markers") as { earthquakes: unknown }).earthquakes).toBe(results);
  expect(find((node) => node.type === EarthquakeDashboard).props.stats).toMatchObject({ totalEarthquakes: 2, strongestMagnitude: 4.5 });
  expect(find((node) => node.type === EarthquakeDashboard).props.scopeLabel).toBe("All of California · Magnitude 4.0+");
  expect(find((node) => node.type === "arcgis-map").props.zoom).toBe(5);
  change("region", "southernCalifornia");
  expect(resultIds()).toEqual(["south"]);
  expect(fetchEarthquakes).toHaveBeenCalledTimes(1);
  expect(find((node) => node.type === "arcgis-map").props.zoom).toBe(8);
});

function locationOptions() {
  const select = find((node) => node.props.id === "location");
  return nodes(select.props.children as ReactNode).map((node) => node.props.value);
}

it("shows region-aware locations, falls back to Riverside, and clears a northern radius search", async () => {
  const southern = ["Riverside", "Redlands", "Palm Springs", "Los Angeles", "San Diego", "Bakersfield"];
  const northern = ["San Francisco", "Sacramento", "San Jose", "Fresno"];
  const layers = new Map<string, unknown>();
  const map = {
    findLayerById: (id: string) => layers.get(id),
    add: vi.fn((layer) => layers.set(layer.id, layer)),
    remove: vi.fn((layer) => layers.delete(layer.id)),
  };
  render();
  expect(locationOptions()).toEqual(southern);
  expect(find((node) => node.props.id === "location").props.value).toBe("Riverside");
  await vi.waitFor(() => { render(); expect(resultIds()).toEqual(["south", "small"]); });
  (find((node) => node.type === "arcgis-map").props.onarcgisViewReadyChange as (event: unknown) => void)({ target: { ready: true, map, view: {} } });
  render();
  change("region", "california");
  expect(locationOptions()).toEqual([...southern, ...northern]);
  expect(find((node) => node.props.id === "location").props.value).toBe("Riverside");
  change("location", "San Francisco");
  change("minimum-magnitude", "4");
  await (find((node) => node.type === "button" && node.props.className === "search-button").props.onClick as () => Promise<void>)();
  render();
  expect(layers.has("search-radius")).toBe(true);
  const call = vi.mocked(searchEarthquakesByRadius).mock.calls[0];
  expect(call[0].map(({ id }) => id)).toEqual(["south", "north", "small"]);
  expect(call[1]).toMatchObject({ name: "San Francisco", latitude: 37.775, longitude: -122.419 });
  expect(call[2]).toBe(50);
  expect(find((node) => node.type === EarthquakeDashboard).props.scopeLabel).toContain("San Francisco");
  change("region", "southernCalifornia");
  expect(locationOptions()).toEqual(southern);
  expect(find((node) => node.props.id === "location").props.value).toBe("Riverside");
  expect(find((node) => node.props.id === "minimum-magnitude").props.value).toBe("4");
  expect(layers.has("search-radius")).toBe(false);
  expect(find((node) => node.type === EarthquakeDashboard).props.scopeLabel).toBe("Southern California · Magnitude 4.0+");
  expect(resultIds()).toEqual(["south"]);

  // Supported Southern California choices survive round trips through statewide coverage.
  change("location", "Los Angeles");
  change("region", "california");
  change("region", "southernCalifornia");
  expect(find((node) => node.props.id === "location").props.value).toBe("Los Angeles");
  for (const location of northern) {
    change("region", "california");
    change("location", location);
    change("region", "southernCalifornia");
    expect(find((node) => node.props.id === "location").props.value).toBe("Riverside");
  }
  expect(fetchEarthquakes).toHaveBeenCalledTimes(1);
});
