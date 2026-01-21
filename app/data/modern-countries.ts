import type {
  PartialTimeBoundGeographicRegion,
  PartialTimeBoundGeographicRegionGroup,
  TimeRange,
} from "./types";
import type { GeoJSON } from "geojson";
import countriesData from "./modern-countries.json";
import independenceData from "./country-by-independence-date.json";

type CountryIndependence = {
  country: string;
  independence: number | null;
};

function findCountryFeature(
  countryName: string,
  geojson: GeoJSON.FeatureCollection
): GeoJSON.Feature | null {
  return (
    geojson.features.find(
      (feature) =>
        feature.properties?.name?.toLowerCase() === countryName.toLowerCase()
    ) || null
  );
}

function createTimeBoundRegionForCountry(
  countryName: string,
  independenceYear: number,
  feature: GeoJSON.Feature
): PartialTimeBoundGeographicRegion {
  const featureCollection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [feature],
  };

  const timeRange: TimeRange = [independenceYear, null];

  return {
    timeRange,
    geographicRegions: [featureCollection],
    metadata: {
      id: `country-${countryName.toLowerCase().replace(/\s+/g, "-")}`,
      title: countryName,
      description: `${countryName}, independent since ${independenceYear}`,
      color: "#00ff80",
    },
  };
}

export function generateModernCountriesData(): PartialTimeBoundGeographicRegionGroup {
  const countriesIndependence = independenceData as CountryIndependence[];
  const geojson = countriesData as GeoJSON.FeatureCollection;

  const timeBoundRegions: PartialTimeBoundGeographicRegion[] = countriesIndependence
    .filter((country) => country.independence !== null)
    .map((country) => {
      const feature = findCountryFeature(country.country, geojson);
      if (!feature) {
        console.warn(
          `Could not find GeoJSON feature for country: ${country.country}`
        );
        return null;
      }
      return createTimeBoundRegionForCountry(
        country.country,
        country.independence as number,
        feature
      );
    })
    .filter(
      (region): region is PartialTimeBoundGeographicRegion => region !== null
    );

  return {
    children: timeBoundRegions,
    metadata: {
      id: "modern-countries",
      title: "Modern Countries",
      description: "Countries of the world by independence date",
    },
  };
}
