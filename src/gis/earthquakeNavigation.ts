import type MapView from "@arcgis/core/views/MapView";
import type { Earthquake } from "./earthquakeLayer";

export async function zoomToEarthquake(
  view: Pick<MapView, "goTo" | "zoom">,
  earthquake: Earthquake
): Promise<void> {
  try {
    await view.goTo({
      center: [earthquake.longitude, earthquake.latitude],
      zoom: Math.max(view.zoom, 11),
    });
  } catch (error) {
    // A second selection can interrupt an in-progress navigation.
    if (error instanceof Error && error.name === "AbortError") return;
    throw error;
  }
}
