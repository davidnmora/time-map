import { MAPBOX_EASE } from "@/lib/math/cubic-bezier";

const MAPBOX_EASE_X1 = 0.25;
const MAPBOX_EASE_Y1 = 0.1;
const MAPBOX_EASE_X2 = 0.25;
const MAPBOX_EASE_Y2 = 1;
const MIN_TRANSITION_PROGRESS = 0;
const MAX_TRANSITION_PROGRESS = 1;

export const SHARED_UI_TRANSITION_DURATION_MS = 700;
export const SHARED_UI_TRANSITION_TIMING_FUNCTION = `cubic-bezier(${MAPBOX_EASE_X1}, ${MAPBOX_EASE_Y1}, ${MAPBOX_EASE_X2}, ${MAPBOX_EASE_Y2})`;

export function evaluateSharedUiTransitionEasing(progress: number): number {
  const clampedProgress =
    progress < MIN_TRANSITION_PROGRESS
      ? MIN_TRANSITION_PROGRESS
      : progress > MAX_TRANSITION_PROGRESS
        ? MAX_TRANSITION_PROGRESS
        : progress;
  return MAPBOX_EASE(clampedProgress);
}
