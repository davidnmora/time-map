const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;

function calcBezierA(a1: number, a2: number) {
  return 1.0 - 3.0 * a2 + 3.0 * a1;
}

function calcBezierB(a1: number, a2: number) {
  return 3.0 * a2 - 6.0 * a1;
}

function calcBezierC(a1: number) {
  return 3.0 * a1;
}

function calcBezier(t: number, a1: number, a2: number) {
  return ((calcBezierA(a1, a2) * t + calcBezierB(a1, a2)) * t + calcBezierC(a1)) * t;
}

function calcBezierSlope(t: number, a1: number, a2: number) {
  return 3.0 * calcBezierA(a1, a2) * t * t + 2.0 * calcBezierB(a1, a2) * t + calcBezierC(a1);
}

function binarySubdivide(x: number, a: number, b: number, x1: number, x2: number) {
  let currentX: number;
  let currentT: number;
  let i = 0;
  let low = a;
  let high = b;
  do {
    currentT = low + (high - low) / 2.0;
    currentX = calcBezier(currentT, x1, x2) - x;
    if (currentX > 0.0) {
      high = currentT;
    } else {
      low = currentT;
    }
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT;
}

function newtonRaphson(x: number, guessT: number, x1: number, x2: number) {
  let currentT = guessT;
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const slope = calcBezierSlope(currentT, x1, x2);
    if (slope === 0.0) {
      return currentT;
    }
    const currentX = calcBezier(currentT, x1, x2) - x;
    currentT -= currentX / slope;
  }
  return currentT;
}

export function createCubicBezierEasing(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  if (x1 === y1 && x2 === y2) {
    return (t) => t;
  }

  const SAMPLE_TABLE_SIZE = 11;
  const STEP = 1.0 / (SAMPLE_TABLE_SIZE - 1);
  const sampleValues = new Float32Array(SAMPLE_TABLE_SIZE);
  for (let i = 0; i < SAMPLE_TABLE_SIZE; ++i) {
    sampleValues[i] = calcBezier(i * STEP, x1, x2);
  }

  function getTForX(x: number) {
    const lastSampleIndex = SAMPLE_TABLE_SIZE - 1;
    let intervalStart = 0.0;
    let currentSample = 1;

    while (currentSample !== lastSampleIndex && sampleValues[currentSample] <= x) {
      intervalStart += STEP;
      ++currentSample;
    }
    --currentSample;

    const dist = (x - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessT = intervalStart + dist * STEP;

    const initialSlope = calcBezierSlope(guessT, x1, x2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphson(x, guessT, x1, x2);
    }
    if (initialSlope === 0.0) {
      return guessT;
    }
    return binarySubdivide(x, intervalStart, intervalStart + STEP, x1, x2);
  }

  return (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return calcBezier(getTForX(t), y1, y2);
  };
}

export const MAPBOX_EASE = createCubicBezierEasing(0.25, 0.1, 0.25, 1.0);
