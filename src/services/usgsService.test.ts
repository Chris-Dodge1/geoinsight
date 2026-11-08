import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

it("fetches the past-day feed only once for concurrent and later callers", async () => {
  const feed = { features: [] };
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => feed });
  vi.stubGlobal("fetch", fetch);
  const { fetchEarthquakes } = await import("./usgsService");
  expect(await Promise.all([fetchEarthquakes(), fetchEarthquakes()])).toEqual([feed, feed]);
  expect(await fetchEarthquakes()).toBe(feed);
  expect(fetch).toHaveBeenCalledExactlyOnceWith("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson");
});

it("allows a new request after a failed fetch", async () => {
  const fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) });
  vi.stubGlobal("fetch", fetch);
  const { fetchEarthquakes } = await import("./usgsService");
  await expect(fetchEarthquakes()).rejects.toThrow("503");
  await expect(fetchEarthquakes()).resolves.toEqual({ features: [] });
  expect(fetch).toHaveBeenCalledTimes(2);
});
