export const CENTURY_TICK_THICKNESS = 2;
export const REGULAR_TICK_THICKNESS = 1;

export const TIMELINE_WIDTH = 50;
export const TICK_LENGTH = 6;
export const TICK_OFFSET = 10;

export const DECADE_FONT_SIZE = 12;
export const CENTURY_FONT_SIZE = 16;

export const MIN_TICK_SPACING_MULTIPLIER = 1.5;

export type DensityLevel =
  | "centuries"
  | "centuries-and-half-centuries"
  | "centuries-25"
  | "centuries-and-half-decades"
  | "centuries-decades"
  | "centuries-years";

export const generateTicksAtResolution =
  (resolution: number, excludeCenturies: boolean = true) =>
  (minYear: number, maxYear: number): number[] => {
    const startMark = Math.floor(minYear / resolution) * resolution;
    const endMark = Math.ceil(maxYear / resolution) * resolution;
    const ticks: number[] = [];

    for (let year = startMark; year <= endMark; year += resolution) {
      if (!excludeCenturies || year % 100 !== 0) {
        ticks.push(year);
      }
    }

    return ticks;
  };

export const generateCenturyTicks = generateTicksAtResolution(100, false);

export const generateTwentyFiveYearMarks = generateTicksAtResolution(25);

export const generateHalfDecadeMarks = generateTicksAtResolution(5);

export const generateDecadeTicks = generateTicksAtResolution(10);

export const generateIndividualYearTicks = generateTicksAtResolution(1);

export const generateHalfCenturyMarks = generateTicksAtResolution(50);

export const isCentury = (year: number): boolean => {
  return year % 100 === 0;
};

export const isHalfCentury = (year: number): boolean => {
  return year % 50 === 0 && year % 100 !== 0;
};

export const isTwentyFiveYearMark = (year: number): boolean => {
  return year % 25 === 0 && year % 100 !== 0;
};

export const isDecade = (year: number): boolean => {
  return year % 10 === 0 && year % 100 !== 0;
};

export const getTickThickness = (year: number): number => {
  return isCentury(year) ? CENTURY_TICK_THICKNESS : REGULAR_TICK_THICKNESS;
};

export const calculateMinTickSpacing = (
  numTicks: number,
  height: number
): number => {
  if (numTicks <= 1) return height;
  return height / (numTicks - 1);
};

export const determineDensityLevel = (
  height: number,
  minYear: number,
  maxYear: number,
  fontSize: number
): DensityLevel => {
  const minimumSpacing = fontSize * MIN_TICK_SPACING_MULTIPLIER;

  const centuryTicks = generateCenturyTicks(minYear, maxYear);
  const centuriesCount = centuryTicks.length;

  const halfCenturyMarks = generateHalfCenturyMarks(minYear, maxYear);
  const centuriesHalfCenturiesCount = centuriesCount + halfCenturyMarks.length;

  const twentyFiveYearMarks = generateTwentyFiveYearMarks(minYear, maxYear);
  const centuries25Count = centuriesCount + twentyFiveYearMarks.length;

  const halfDecadeMarks = generateHalfDecadeMarks(minYear, maxYear);
  const centuriesHalfDecadesCount = centuriesCount + halfDecadeMarks.length;

  const decadeTicks = generateDecadeTicks(minYear, maxYear);
  const centuriesDecadesCount = centuriesCount + decadeTicks.length;

  const individualYearTicks = generateIndividualYearTicks(minYear, maxYear);
  const centuriesYearsCount = centuriesCount + individualYearTicks.length;

  const centuriesSpacing = calculateMinTickSpacing(centuriesCount, height);
  const centuriesHalfCenturiesSpacing = calculateMinTickSpacing(
    centuriesHalfCenturiesCount,
    height
  );
  const centuries25Spacing = calculateMinTickSpacing(centuries25Count, height);
  const centuriesHalfDecadesSpacing = calculateMinTickSpacing(
    centuriesHalfDecadesCount,
    height
  );
  const centuriesDecadesSpacing = calculateMinTickSpacing(
    centuriesDecadesCount,
    height
  );
  const centuriesYearsSpacing = calculateMinTickSpacing(
    centuriesYearsCount,
    height
  );

  if (centuriesYearsSpacing >= minimumSpacing) {
    return "centuries-years";
  }

  if (centuriesHalfDecadesSpacing >= minimumSpacing) {
    return "centuries-and-half-decades";
  }

  if (centuriesDecadesSpacing >= minimumSpacing) {
    return "centuries-decades";
  }

  if (centuries25Spacing >= minimumSpacing) {
    return "centuries-25";
  }

  if (centuriesHalfCenturiesSpacing >= minimumSpacing) {
    return "centuries-and-half-centuries";
  }

  return "centuries";
};

export const generateTicksForDensityLevel = (
  densityLevel: DensityLevel,
  minYear: number,
  maxYear: number
): number[] => {
  const centuryTicks = generateCenturyTicks(minYear, maxYear);

  switch (densityLevel) {
    case "centuries":
      return centuryTicks;
    case "centuries-and-half-centuries":
      return [
        ...centuryTicks,
        ...generateHalfCenturyMarks(minYear, maxYear),
      ].sort((a, b) => a - b);
    case "centuries-25":
      return [
        ...centuryTicks,
        ...generateTwentyFiveYearMarks(minYear, maxYear),
      ].sort((a, b) => a - b);
    case "centuries-and-half-decades":
      return [
        ...centuryTicks,
        ...generateHalfDecadeMarks(minYear, maxYear),
      ].sort((a, b) => a - b);
    case "centuries-decades":
      return [...centuryTicks, ...generateDecadeTicks(minYear, maxYear)].sort(
        (a, b) => a - b
      );
    case "centuries-years":
      return [
        ...centuryTicks,
        ...generateIndividualYearTicks(minYear, maxYear),
      ].sort((a, b) => a - b);
  }
};
