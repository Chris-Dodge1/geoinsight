export interface EarthquakeDashboardStats {
  totalEarthquakes: number;
  averageMagnitude: number | null;
  strongestMagnitude: number | null;
  magnitude4Plus: number;
}

interface EarthquakeDashboardProps {
  stats: EarthquakeDashboardStats;
  status: "loading" | "ready" | "error";
  scopeLabel: string;
}

export default function EarthquakeDashboard({
  stats,
  status,
  scopeLabel,
}: EarthquakeDashboardProps) {
  const formatMagnitude = (value: number | null) =>
    value === null ? "—" : value.toFixed(2);

  const displayValue = (value: string) =>
    status === "loading"
      ? "..."
      : status === "error"
        ? "—"
        : value;

  const cards = [
    {
      label: "Total Earthquakes",
      value: stats.totalEarthquakes.toLocaleString(),
    },
    {
      label: "Average Magnitude",
      value: formatMagnitude(stats.averageMagnitude),
    },
    {
      label: "Strongest Magnitude",
      value: formatMagnitude(stats.strongestMagnitude),
    },
    {
      label: "Magnitude 4.0+",
      value: stats.magnitude4Plus.toLocaleString(),
    },
  ];

  return (
    <section
      className="earthquake-dashboard"
      aria-label="Earthquake statistics"
      aria-busy={status === "loading"}
    >
      <div className="dashboard-header">
        <div>
          <h2>Earthquake Overview</h2>
          <p>{scopeLabel}</p>
        </div>
        <span className="dashboard-source">
          USGS Past-Day Feed
        </span>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <article className="dashboard-card" key={card.label}>
            <p className="dashboard-card-label">{card.label}</p>
            <p className="dashboard-card-value">
              {displayValue(card.value)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
