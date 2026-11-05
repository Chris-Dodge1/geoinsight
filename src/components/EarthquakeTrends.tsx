
import { useEffect, useState } from "react";
import { fetchEarthquakes } from "../services/usgsService";
import { validateEarthquakes } from "../services/earthquakeProcessor";
import {
  calculateDailyEarthquakeTrends,
  type DailyEarthquakeTrend,
} from "../services/earthquakeStats";

export default function EarthquakeTrends() {
  const [trends, setTrends] = useState<DailyEarthquakeTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTrends() {
      try {
        const data = await fetchEarthquakes("week");
        const validEarthquakes = validateEarthquakes(data);
        const dailyTrends =
          calculateDailyEarthquakeTrends(validEarthquakes);

        if (!active) return;

        setTrends(dailyTrends);
        setError(null);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load earthquake trends."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTrends();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p>Loading earthquake trends...</p>;
  }

  if (error) {
    return <p role="alert">Error: {error}</p>;
  }

  return (
    <section className="earthquake-trends">
      <h2>Earthquake Activity Trends (Past 7 Days)</h2>

      {trends.length === 0 ? (
        <p>No earthquake activity available.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date (UTC)</th>
              <th>Earthquakes</th>
              <th>Average Magnitude</th>
              <th>Strongest Magnitude</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((trend) => (
              <tr key={trend.date}>
                <td>{trend.date}</td>
                <td>{trend.totalEarthquakes}</td>
                <td>
                  {trend.averageMagnitude?.toFixed(2) ?? "N/A"}
                </td>
                <td>
                  {trend.strongestMagnitude?.toFixed(1) ?? "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
