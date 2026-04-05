"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import {
  SHARED_UI_TRANSITION_DURATION_MS,
  evaluateSharedUiTransitionEasing,
} from "@/lib/ui/animation/transitions";

const VIEW_OFFSET_Y = 0;
const MS_PER_SECOND = 1000;

type CameraViewOffsetControllerProps = {
  targetOffsetPx: number;
};

export default function CameraViewOffsetController({
  targetOffsetPx,
}: CameraViewOffsetControllerProps) {
  const { camera, size } = useThree();
  const currentOffsetRef = useRef(targetOffsetPx);
  const animationStartOffsetRef = useRef(targetOffsetPx);
  const animationTargetOffsetRef = useRef(targetOffsetPx);
  const animationElapsedMsRef = useRef(SHARED_UI_TRANSITION_DURATION_MS);

  useFrame((_, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) {
      return;
    }

    if (animationTargetOffsetRef.current !== targetOffsetPx) {
      animationStartOffsetRef.current = currentOffsetRef.current;
      animationTargetOffsetRef.current = targetOffsetPx;
      animationElapsedMsRef.current = 0;
    }

    const nextElapsedMs = Math.min(
      animationElapsedMsRef.current + delta * MS_PER_SECOND,
      SHARED_UI_TRANSITION_DURATION_MS
    );
    animationElapsedMsRef.current = nextElapsedMs;

    const transitionProgress = nextElapsedMs / SHARED_UI_TRANSITION_DURATION_MS;
    const easedProgress = evaluateSharedUiTransitionEasing(transitionProgress);

    const nextOffset = THREE.MathUtils.lerp(
      animationStartOffsetRef.current,
      animationTargetOffsetRef.current,
      easedProgress
    );
    currentOffsetRef.current = nextOffset;

    camera.setViewOffset(
      size.width,
      size.height,
      nextOffset,
      VIEW_OFFSET_Y,
      size.width,
      size.height
    );
    camera.updateProjectionMatrix();
  });

  return null;
}
