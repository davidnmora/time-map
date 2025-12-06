const TIMELINE_WIDTH = 50;
const TICK_LENGTH = 6;
const TICK_OFFSET = 10;

const DECADE_FONT_SIZE = 12;
const CENTURY_FONT_SIZE = 16;
const BASELINE_OFFSET_RATIO = 0.67;

const calculateLabelTopOffset = (fontSize: number): number => {
  return -fontSize * BASELINE_OFFSET_RATIO;
};

const generateDecadeTicks = (minYear: number, maxYear: number): number[] => {
  const startDecade = Math.floor(minYear / 10) * 10;
  const endDecade = Math.ceil(maxYear / 10) * 10;
  const ticks: number[] = [];
  
  for (let year = startDecade; year <= endDecade; year += 10) {
    ticks.push(year);
  }
  
  return ticks;
};

const generateFiftyYearMarks = (minYear: number, maxYear: number): number[] => {
  const startMark = Math.floor(minYear / 50) * 50;
  const endMark = Math.ceil(maxYear / 50) * 50;
  const marks: number[] = [];
  
  for (let year = startMark; year <= endMark; year += 50) {
    marks.push(year);
  }
  
  return marks;
};

const isCentury = (year: number): boolean => {
  return year % 100 === 0;
};

export {
  TIMELINE_WIDTH,
  TICK_LENGTH,
  TICK_OFFSET,
  DECADE_FONT_SIZE,
  CENTURY_FONT_SIZE,
  BASELINE_OFFSET_RATIO,
  calculateLabelTopOffset,
  generateDecadeTicks,
  generateFiftyYearMarks,
  isCentury,
};

