
import { fetchEarthquakes } from "./services/usgsService";
import {
  validateEarthquakes,
  filterCaliforniaEarthquakes,
  sortEarthquakesByMagnitude,
} from "./services/earthquakeProcessor";
import { calculateEarthquakeStats } from "./services/earthquakeStats";

async function testEarthquakeData() {
  try {
    const data = await fetchEarthquakes();

    const validEarthquakes = validateEarthquakes(data);
    const californiaEarthquakes =
      filterCaliforniaEarthquakes(validEarthquakes);

    const sortedEarthquakes =
      sortEarthquakesByMagnitude(californiaEarthquakes);

    const stats = calculateEarthquakeStats(sortedEarthquakes);

    console.log("=== GeoInsight California Earthquake Test ===");
    console.log("USGS records:", data.features.length);
    console.log("Valid records:", validEarthquakes.length);
    console.log("California region:", californiaEarthquakes.length);
    console.log("Average magnitude:", stats.averageMagnitude);
    console.log("Strongest magnitude:", stats.strongestMagnitude);
    console.log("Magnitude 4+:", stats.magnitude4Plus);
    console.log(
      "Most recent earthquake:",
      stats.recentEarthquake?.properties.place ?? "None"
    );
  } catch (error) {
    console.error("Earthquake test failed:", error);
  }
}

testEarthquakeData();
