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

const EXCLUDED_COUNTRY_IDS = new Set(["ATA"]);

const COUNTRY_NAME_MAPPING: Record<string, string> = {
  "North Macedonia": "Macedonia",
  "Eswatini": "Swaziland",
  "Fiji Islands": "Fiji",
  "The Democratic Republic of Congo": "Democratic Republic of the Congo",
  "Congo": "Republic of the Congo",
  "Serbia": "Republic of Serbia",
  "Tanzania": "United Republic of Tanzania",
  "Guinea-Bissau": "Guinea Bissau",
  "United States": "United States of America",
};

function normalizeCountryName(countryName: string): string {
  return COUNTRY_NAME_MAPPING[countryName] || countryName;
}

function shouldIncludeCountryFeature(feature: GeoJSON.Feature): boolean {
  const featureId = feature.id;
  if (typeof featureId !== "string") {
    return true;
  }
  return !EXCLUDED_COUNTRY_IDS.has(featureId);
}

const RAW_MODERN_COUNTRIES_GEOJSON = countriesData as GeoJSON.FeatureCollection;

export const modernCountriesGeoJson: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: RAW_MODERN_COUNTRIES_GEOJSON.features.filter(
    shouldIncludeCountryFeature
  ),
};

function findCountryFeature(
  countryName: string,
  geojson: GeoJSON.FeatureCollection
): GeoJSON.Feature | null {
  const normalizedName = normalizeCountryName(countryName);
  return (
    geojson.features.find(
      (feature) =>
        feature.properties?.name?.toLowerCase() === normalizedName.toLowerCase()
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
      color: "black",
    },
  };
}

export function generateModernCountriesData(): PartialTimeBoundGeographicRegionGroup {
  const countriesIndependence = independenceData as CountryIndependence[];
  const geojson = modernCountriesGeoJson;

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
