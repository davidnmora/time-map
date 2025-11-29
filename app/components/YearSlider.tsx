"use client";

type YearSliderProps = {
  minYear: number;
  maxYear: number;
  currentYear: number;
  onYearChange: (year: number) => void;
};

export default function YearSlider({
  minYear,
  maxYear,
  currentYear,
  onYearChange,
}: YearSliderProps) {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white p-4 rounded-lg shadow-lg">
      <label htmlFor="year-slider" className="block text-sm font-medium mb-2">
        Year: {currentYear}
      </label>
      <input
        id="year-slider"
        type="range"
        min={minYear}
        max={maxYear}
        value={currentYear}
        onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
        className="w-64"
      />
    </div>
  );
}


