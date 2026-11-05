# GeoInsight

**Interactive Earthquake Visualization and Geospatial Analytics**

GeoInsight is a web-based GIS application for exploring earthquake activity across Southern California and surrounding areas. Built with React, TypeScript, and Esri's ArcGIS Maps SDK for JavaScript, it combines earthquake observations from the U.S. Geological Survey (USGS) with interactive mapping, geographic searches, magnitude filtering, and statistical analysis.

The project demonstrates practical applications of geospatial computing, third-party API integration, frontend development, and automated software testing.

**Repository:** https://github.com/Chris-Dodge1/geoinsight

## Features

### Interactive Earthquake Map

- Visualizes earthquake locations using ArcGIS GraphicsLayer and geographic coordinates.
- Uses magnitude-based marker colors to distinguish earthquake intensity.
- Provides interactive popups displaying location, magnitude, and depth.
- Supports map navigation, zooming, and exploration.

### Geographic Radius Search

- Searches for earthquakes within 25, 50, or 100 kilometers of supported locations.
- Includes Riverside, Redlands, and Palm Springs as predefined search centers.
- Uses ArcGIS geodetic distance calculations to determine whether earthquakes fall within a search radius.
- Displays geographic search boundaries with geodesic buffers.

### Magnitude Filtering

- Filters observations by all magnitudes, magnitude 2.5+, or magnitude 4.0+.
- Combines magnitude filters with geographic radius searches.
- Automatically synchronizes filtered results across the map, analytics dashboard, and results table.

### Earthquake Analytics Dashboard

Displays statistics calculated from the currently filtered earthquake observations:

- Total earthquakes
- Average magnitude
- Strongest magnitude
- Number of earthquakes with magnitude 4.0 or greater

Statistics update as users change their search criteria.

### Interactive Earthquake Results

- Displays earthquake locations, magnitudes, and depths in a sortable table.
- Supports sorting by magnitude, depth, and location.
- Allows users to select an earthquake and navigate directly to its location using `MapView.goTo`.
- Includes responsive layouts, keyboard-accessible controls, and empty-state handling.

### USGS Earthquake Data Integration

- Retrieves earthquake observations from the USGS GeoJSON past-day feed.
- Validates and transforms incoming data for ArcGIS visualization.
- Filters observations to an approximate Southern California geographic region.
- Provides loading and error states when retrieving external data.

**Note:** The earthquake feed is fetched when the application opens. The current implementation does not continuously stream data or automatically refresh the feed.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, HTML, CSS |
| Build Tool | Vite |
| GIS and Mapping | Esri ArcGIS Maps SDK for JavaScript |
| Geographic Operations | ArcGIS geodetic distance and geodesic buffer operators |
| Earthquake Data | USGS GeoJSON API |
| Testing | Vitest |
| Version Control | Git, GitHub |

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- A modern web browser

### Installation

Clone the repository:

```bash
git clone https://github.com/Chris-Dodge1/geoinsight.git
cd geoinsight
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local address printed by Vite, typically:

`http://localhost:5173/`

For the latest results-list functionality before it is merged into `main`, use:

```bash
git switch feature/chris-live-earthquake-map
```

## Running Tests

GeoInsight uses Vitest for automated testing of core application functionality.

Run the test suite:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

**Latest verified development-branch results:**

- 44 passing automated tests
- Successful TypeScript production build
- Successful ESLint checks

Testing covers earthquake data transformation, spatial searches, magnitude filtering, dashboard behavior, and earthquake results functionality.

## Application Architecture

GeoInsight separates external data retrieval, geographic processing, visualization, and user-interface components.

### Data Flow

1. **Data retrieval:** Fetch earthquake observations from the USGS GeoJSON API.
2. **Validation:** Validate and convert earthquake records into the application's internal data structure.
3. **Regional filtering:** Keep observations within the configured geographic bounding box.
4. **Spatial processing:** Apply optional geographic radius searches.
5. **Magnitude filtering:** Apply the selected minimum magnitude.
6. **Visualization:** Render matching earthquakes on the ArcGIS map.
7. **Analytics:** Calculate statistics from the filtered observations.
8. **Results:** Display matching earthquakes in a sortable, interactive table.

### Key Source Files

| File or Directory | Responsibility |
|---|---|
| `src/App.tsx` | Main application state and component integration |
| `src/services/usgsService.ts` | USGS earthquake data retrieval |
| `src/gis/usgsAdapter.ts` | Data validation, conversion, and regional filtering |
| `src/gis/earthquakeLayer.ts` | ArcGIS earthquake markers and popups |
| `src/gis/spatialSearch.ts` | Geographic radius searches and search boundaries |
| `src/gis/magnitudeFilter.ts` | Magnitude-based filtering |
| `src/gis/earthquakeNavigation.ts` | Map navigation to selected earthquakes |
| `src/components/EarthquakeDashboard.tsx` | Statistical dashboard |
| `src/components/EarthquakeResults.tsx` | Sortable earthquake results |
| `src/components/dashboardStats.ts` | Dashboard statistics calculations |

## Data Source and Limitations

Earthquake observations are provided by the [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php).

GeoInsight currently uses the USGS past-day earthquake feed:

https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson

The application uses an approximate geographic bounding box rather than official administrative boundaries. Consequently, observations from nearby regions outside California may also appear.

Earthquake counts and statistical values vary depending on the time the feed is retrieved and the filters applied.

GeoInsight is intended for geographic exploration and software development demonstrations, not as an official earthquake alerting or emergency response system.

## Contributors

### Christopher Dodge

- ArcGIS earthquake visualization, markers, and popups
- Geographic radius search and geospatial operations
- Magnitude filtering
- Integration of USGS observations into the map
- Interactive earthquake analytics dashboard
- Sortable results table and map navigation
- Automated testing and frontend integration

### Caleb Sandoval

- Initial USGS earthquake data-fetching service
- Additional earthquake data validation, processing, and statistics development on a separate feature branch
- Associated data-processing tests

Both contributors collaborate on the development and integration of GeoInsight.

## Future Improvements

- Integrate the additional earthquake-processing and statistical modules.
- Deploy a publicly accessible web application.
- Add automatic earthquake feed refresh.
- Improve initial map framing and geographic exploration.
- Add additional geographic search options.
- Optimize production bundle sizes.

## Project Status

GeoInsight is under active development.

The core interactive map, geographic search, magnitude filtering, and analytics dashboard are implemented. The earthquake results list and map navigation are implemented on the development branch.

The project has been tested locally and is being prepared for public deployment.

---

**GeoInsight — Built with React, TypeScript, Esri ArcGIS Maps SDK, and USGS earthquake data.**