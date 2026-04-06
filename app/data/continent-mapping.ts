export const CONTINENT_GROUP_NAMES = [
  "Europe",
  "Africa",
  "Middle East",
  "Asia and the Pacific",
  "North America",
  "South America",
] as const;

export type ContinentGroup = (typeof CONTINENT_GROUP_NAMES)[number];

type ContinentSortOverride = {
  priorityCountryTitles: readonly string[];
};

const CONTINENT_SORT_OVERRIDES: Partial<
  Record<ContinentGroup, ContinentSortOverride>
> = {
  "North America": {
    priorityCountryTitles: ["Canada", "United States", "Mexico"],
  },
};

const PRIORITY_FALLBACK_RANK = Number.MAX_SAFE_INTEGER;

function priorityRankForTitle(
  title: string,
  priorityTitles: readonly string[],
): number {
  const index = priorityTitles.indexOf(title);
  return index === -1 ? PRIORITY_FALLBACK_RANK : index;
}

export function sortRegionsForContinent<T>(
  continent: ContinentGroup,
  regions: T[],
  getLongitude: (region: T) => number,
  getCountryTitle: (region: T) => string,
): T[] {
  const override = CONTINENT_SORT_OVERRIDES[continent];
  const defaultCompare = (a: T, b: T) =>
    getLongitude(a) - getLongitude(b);
  if (!override) {
    return [...regions].sort(defaultCompare);
  }
  const { priorityCountryTitles } = override;
  return [...regions].sort((a, b) => {
    const rankA = priorityRankForTitle(
      getCountryTitle(a),
      priorityCountryTitles,
    );
    const rankB = priorityRankForTitle(
      getCountryTitle(b),
      priorityCountryTitles,
    );
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return defaultCompare(a, b);
  });
}

const COUNTRY_TO_CONTINENT: Record<string, ContinentGroup> = {
  "Albania": "Europe",
  "Andorra": "Europe",
  "Armenia": "Europe",
  "Austria": "Europe",
  "Azerbaijan": "Europe",
  "Belarus": "Europe",
  "Belgium": "Europe",
  "Bosnia and Herzegovina": "Europe",
  "Bulgaria": "Europe",
  "Croatia": "Europe",
  "Czech Republic": "Europe",
  "Denmark": "Europe",
  "Estonia": "Europe",
  "Finland": "Europe",
  "France": "Europe",
  "Georgia": "Europe",
  "Germany": "Europe",
  "Greece": "Europe",
  "Holy See (Vatican City State)": "Europe",
  "Hungary": "Europe",
  "Iceland": "Europe",
  "Ireland": "Europe",
  "Italy": "Europe",
  "Latvia": "Europe",
  "Liechtenstein": "Europe",
  "Lithuania": "Europe",
  "Luxembourg": "Europe",
  "Malta": "Europe",
  "Moldova": "Europe",
  "Monaco": "Europe",
  "Montenegro": "Europe",
  "Netherlands": "Europe",
  "North Macedonia": "Europe",
  "Norway": "Europe",
  "Poland": "Europe",
  "Portugal": "Europe",
  "Romania": "Europe",
  "Russia": "Europe",
  "San Marino": "Europe",
  "Serbia": "Europe",
  "Slovakia": "Europe",
  "Slovenia": "Europe",
  "Spain": "Europe",
  "Sweden": "Europe",
  "Switzerland": "Europe",
  "Ukraine": "Europe",
  "United Kingdom": "Europe",

  "Algeria": "Africa",
  "Angola": "Africa",
  "Benin": "Africa",
  "Botswana": "Africa",
  "Burkina Faso": "Africa",
  "Burundi": "Africa",
  "Cameroon": "Africa",
  "Cape Verde": "Africa",
  "Central African Republic": "Africa",
  "Chad": "Africa",
  "Comoros": "Africa",
  "Congo": "Africa",
  "Djibouti": "Africa",
  "Egypt": "Africa",
  "Equatorial Guinea": "Africa",
  "Eritrea": "Africa",
  "Eswatini": "Africa",
  "Ethiopia": "Africa",
  "Gabon": "Africa",
  "Gambia": "Africa",
  "Ghana": "Africa",
  "Guinea": "Africa",
  "Guinea-Bissau": "Africa",
  "Ivory Coast": "Africa",
  "Kenya": "Africa",
  "Lesotho": "Africa",
  "Liberia": "Africa",
  "Libya": "Africa",
  "Madagascar": "Africa",
  "Malawi": "Africa",
  "Mali": "Africa",
  "Mauritania": "Africa",
  "Mauritius": "Africa",
  "Morocco": "Africa",
  "Mozambique": "Africa",
  "Namibia": "Africa",
  "Niger": "Africa",
  "Nigeria": "Africa",
  "Rwanda": "Africa",
  "Sao Tome and Principe": "Africa",
  "Senegal": "Africa",
  "Seychelles": "Africa",
  "Sierra Leone": "Africa",
  "Somalia": "Africa",
  "South Africa": "Africa",
  "South Sudan": "Africa",
  "Sudan": "Africa",
  "Tanzania": "Africa",
  "The Democratic Republic of Congo": "Africa",
  "Togo": "Africa",
  "Tunisia": "Africa",
  "Uganda": "Africa",
  "Zambia": "Africa",
  "Zimbabwe": "Africa",

  "Bahrain": "Middle East",
  "Cyprus": "Middle East",
  "Iran": "Middle East",
  "Iraq": "Middle East",
  "Israel": "Middle East",
  "Jordan": "Middle East",
  "Kuwait": "Middle East",
  "Lebanon": "Middle East",
  "Oman": "Middle East",
  "Qatar": "Middle East",
  "Saudi Arabia": "Middle East",
  "Syria": "Middle East",
  "Turkey": "Middle East",
  "United Arab Emirates": "Middle East",
  "Yemen": "Middle East",

  "Afghanistan": "Asia and the Pacific",
  "Australia": "Asia and the Pacific",
  "Bangladesh": "Asia and the Pacific",
  "Bhutan": "Asia and the Pacific",
  "Brunei": "Asia and the Pacific",
  "Cambodia": "Asia and the Pacific",
  "China": "Asia and the Pacific",
  "Fiji Islands": "Asia and the Pacific",
  "India": "Asia and the Pacific",
  "Indonesia": "Asia and the Pacific",
  "Japan": "Asia and the Pacific",
  "Kazakhstan": "Asia and the Pacific",
  "Kiribati": "Asia and the Pacific",
  "Kyrgyzstan": "Asia and the Pacific",
  "Laos": "Asia and the Pacific",
  "Malaysia": "Asia and the Pacific",
  "Maldives": "Asia and the Pacific",
  "Marshall Islands": "Asia and the Pacific",
  "Micronesia, Federated States of": "Asia and the Pacific",
  "Mongolia": "Asia and the Pacific",
  "Myanmar": "Asia and the Pacific",
  "Nauru": "Asia and the Pacific",
  "Nepal": "Asia and the Pacific",
  "New Zealand": "Asia and the Pacific",
  "North Korea": "Asia and the Pacific",
  "Pakistan": "Asia and the Pacific",
  "Palau": "Asia and the Pacific",
  "Papua New Guinea": "Asia and the Pacific",
  "Philippines": "Asia and the Pacific",
  "Samoa": "Asia and the Pacific",
  "Singapore": "Asia and the Pacific",
  "Solomon Islands": "Asia and the Pacific",
  "South Korea": "Asia and the Pacific",
  "Sri Lanka": "Asia and the Pacific",
  "Tajikistan": "Asia and the Pacific",
  "Thailand": "Asia and the Pacific",
  "Tonga": "Asia and the Pacific",
  "Turkmenistan": "Asia and the Pacific",
  "Tuvalu": "Asia and the Pacific",
  "Uzbekistan": "Asia and the Pacific",
  "Vanuatu": "Asia and the Pacific",
  "Vietnam": "Asia and the Pacific",

  "Antigua and Barbuda": "North America",
  "Bahamas": "North America",
  "Barbados": "North America",
  "Belize": "North America",
  "Canada": "North America",
  "Costa Rica": "North America",
  "Cuba": "North America",
  "Dominica": "North America",
  "Dominican Republic": "North America",
  "El Salvador": "North America",
  "Grenada": "North America",
  "Guatemala": "North America",
  "Haiti": "North America",
  "Honduras": "North America",
  "Jamaica": "North America",
  "Mexico": "North America",
  "Nicaragua": "North America",
  "Panama": "North America",
  "Saint Kitts and Nevis": "North America",
  "Saint Lucia": "North America",
  "Saint Vincent and the Grenadines": "North America",
  "Trinidad and Tobago": "North America",
  "United States": "North America",

  "Argentina": "South America",
  "Bolivia": "South America",
  "Brazil": "South America",
  "Chile": "South America",
  "Colombia": "South America",
  "Ecuador": "South America",
  "Guyana": "South America",
  "Paraguay": "South America",
  "Peru": "South America",
  "Suriname": "South America",
  "Uruguay": "South America",
  "Venezuela": "South America",
};

export function getContinentForCountry(
  countryName: string
): ContinentGroup | null {
  return COUNTRY_TO_CONTINENT[countryName] ?? null;
}
