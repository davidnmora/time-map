import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  STANDARD_SMOOTH_EASE,
  createCubicBezierEasing,
} from "@/lib/math/cubic-bezier";
import {
  ORBIT_MIN_DISTANCE_FROM_CENTER,
  ORBIT_MAX_DISTANCE,
  ZOOM_WHEEL_RATE,
  ZOOM_TRACKPAD_RATE,
  ZOOM_MAX_SCALE_PER_FRAME,
  ZOOM_WHEEL_EASING_DURATION_MS,
  ZOOM_WHEEL_DELTA_DIVISOR,
} from "../scene/constants";

const LINE_DELTA_MULTIPLIER = 40;
const TRACKPAD_ABS_THRESHOLD = 4;
const TRACKPAD_TIMING_THRESHOLD = 200;
const TYPE_RESET_TIMEOUT_MS = 400;

type InputType = "wheel" | "trackpad";

type ZoomAnimation = {
  startDistance: number;
  targetDistance: number;
  startTime: number;
  easing: (t: number) => number;
};

function classifyInputType(
  deltaY: number,
  timeSinceLastEvent: number,
  previousType: InputType | null
): InputType {
  if (deltaY !== 0 && deltaY % ZOOM_WHEEL_DELTA_DIVISOR === 0) {
    return "wheel";
  }
  if (deltaY !== 0 && Math.abs(deltaY) < TRACKPAD_ABS_THRESHOLD) {
    return "trackpad";
  }
  if (timeSinceLastEvent > TYPE_RESET_TIMEOUT_MS) {
    return "wheel";
  }
  if (previousType !== null) {
    return previousType;
  }
  return Math.abs(timeSinceLastEvent * deltaY) < TRACKPAD_TIMING_THRESHOLD
    ? "trackpad"
    : "wheel";
}

function sigmoidScale(delta: number, rate: number): number {
  return ZOOM_MAX_SCALE_PER_FRAME / (1 + Math.exp(-Math.abs(delta * rate)));
}

function buildChainedEasing(
  prevEasing: (t: number) => number,
  prevT: number
): (t: number) => number {
  const SAMPLE_OFFSET = 0.01;
  const SPEED_SCALE_X = 0.27;
  const SPEED_SCALE_Y = 0.01;
  const MIN_DENOMINATOR = 0.0001;

  const speed =
    prevEasing(Math.min(prevT + SAMPLE_OFFSET, 1)) - prevEasing(prevT);
  const x = (SPEED_SCALE_X * speed) / Math.max(MIN_DENOMINATOR, speed);
  const y = (SPEED_SCALE_Y * speed) / Math.max(MIN_DENOMINATOR, speed);

  return createCubicBezierEasing(x, y, 0.25, 1);
}

export default function useEasedOrbitZoom(
  controlsRef: React.RefObject<OrbitControlsImpl | null>
) {
  const gl = useThree((state) => state.gl);

  const deltaRef = useRef(0);
  const inputTypeRef = useRef<InputType | null>(null);
  const lastWheelTimeRef = useRef(0);
  const animationRef = useRef<ZoomAnimation | null>(null);
  const typeResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const now = performance.now();
      const timeSinceLastEvent = now - lastWheelTimeRef.current;
      lastWheelTimeRef.current = now;

      const rawDelta =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? e.deltaY * LINE_DELTA_MULTIPLIER
          : e.deltaY;

      const value = e.shiftKey ? rawDelta / 4 : rawDelta;

      inputTypeRef.current = classifyInputType(
        value,
        timeSinceLastEvent,
        inputTypeRef.current
      );

      deltaRef.current -= value;

      if (typeResetTimerRef.current !== null) {
        clearTimeout(typeResetTimerRef.current);
      }
      typeResetTimerRef.current = setTimeout(() => {
        inputTypeRef.current = null;
      }, TYPE_RESET_TIMEOUT_MS);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      if (typeResetTimerRef.current !== null) {
        clearTimeout(typeResetTimerRef.current);
      }
    };
  }, [gl]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const delta = deltaRef.current;
    if (delta === 0 && animationRef.current === null) return;

    const camera = controls.object;
    const currentDistance = camera.position.length();

    if (delta !== 0) {
      const rate =
        inputTypeRef.current === "wheel" ? ZOOM_WHEEL_RATE : ZOOM_TRACKPAD_RATE;

      const rawScale = sigmoidScale(delta, rate);
      const scale = delta < 0 ? 1 / rawScale : rawScale;

      const currentTarget =
        animationRef.current?.targetDistance ?? currentDistance;
      const newTarget = Math.max(
        ORBIT_MIN_DISTANCE_FROM_CENTER,
        Math.min(ORBIT_MAX_DISTANCE, currentTarget / scale)
      );

      deltaRef.current = 0;

      if (inputTypeRef.current === "wheel") {
        const now = performance.now();
        const prevAnimation = animationRef.current;
        const easing =
          prevAnimation !== null
            ? buildChainedEasing(
                prevAnimation.easing,
                Math.min(
                  (now - prevAnimation.startTime) / ZOOM_WHEEL_EASING_DURATION_MS,
                  1
                )
              )
            : STANDARD_SMOOTH_EASE;

        animationRef.current = {
          startDistance: currentDistance,
          targetDistance: newTarget,
          startTime: now,
          easing,
        };
      } else {
        animationRef.current = null;
        if (currentDistance > 0) {
          camera.position.multiplyScalar(newTarget / currentDistance);
        }
      }
    }

    const anim = animationRef.current;
    if (anim === null) return;

    const now = performance.now();
    const elapsed = now - anim.startTime;
    const t = Math.min(elapsed / ZOOM_WHEEL_EASING_DURATION_MS, 1);
    const easedT = anim.easing(t);

    const animatedDistance =
      anim.startDistance + (anim.targetDistance - anim.startDistance) * easedT;

    if (currentDistance > 0) {
      camera.position.multiplyScalar(animatedDistance / currentDistance);
    }

    if (t >= 1) {
      animationRef.current = null;
    }
  });
}
