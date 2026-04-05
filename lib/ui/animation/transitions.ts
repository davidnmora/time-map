import { createCubicBezierEasing } from "@/lib/math/cubic-bezier";

const SHARED_UI_TRANSITION_EASING_CONTROL_POINTS = [0.25, 0.1, 0.25, 1] as const;
const MIN_TRANSITION_PROGRESS = 0;
const MAX_TRANSITION_PROGRESS = 1;
const [EASING_X1, EASING_Y1, EASING_X2, EASING_Y2] =
  SHARED_UI_TRANSITION_EASING_CONTROL_POINTS;
const SHARED_UI_EASING = createCubicBezierEasing(
  EASING_X1,
  EASING_Y1,
  EASING_X2,
  EASING_Y2
);

export const SHARED_UI_TRANSITION_DURATION_MS = 700;
export const SHARED_UI_TRANSITION_TIMING_FUNCTION = `cubic-bezier(${EASING_X1}, ${EASING_Y1}, ${EASING_X2}, ${EASING_Y2})`;

export function evaluateSharedUiTransitionEasing(progress: number): number {
  const clampedProgress = Math.min(
    MAX_TRANSITION_PROGRESS,
    Math.max(MIN_TRANSITION_PROGRESS, progress)
  );
  return SHARED_UI_EASING(clampedProgress);
}
