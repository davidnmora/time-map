"use client";

/**
 * @deprecated This hook is deprecated. Use `useAppState` from `AppStateContext` instead.
 * The context provides the same functionality with optimistic local state updates and debounced URL synchronization.
 */

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

type URLState = {
  zoom?: number;
  center?: [number, number];
  currentYear?: number;
  minYear?: number;
  maxYear?: number;
};

type PartialURLState = {
  zoom?: number;
  center?: [number, number];
  currentYear?: number;
  minYear?: number;
  maxYear?: number;
};

/**
 * @deprecated Use `useAppState` from `AppStateContext` instead.
 */
export function useURLState(): URLState & {
  setURLState: (updates: PartialURLState) => void;
} {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const zoom = useMemo(() => {
    const zoomParam = searchParams.get("zoom");
    return zoomParam ? parseFloat(zoomParam) : undefined;
  }, [searchParams]);

  const center = useMemo(() => {
    const centerParam = searchParams.get("center");
    if (!centerParam) return undefined;
    try {
      const [lng, lat] = centerParam.split(",").map(Number);
      if (isNaN(lng) || isNaN(lat)) return undefined;
      return [lng, lat] as [number, number];
    } catch {
      return undefined;
    }
  }, [searchParams]);

  const currentYear = useMemo(() => {
    const currentYearParam = searchParams.get("currentYear");
    return currentYearParam ? parseInt(currentYearParam, 10) : undefined;
  }, [searchParams]);

  const minYear = useMemo(() => {
    const minYearParam = searchParams.get("minYear");
    return minYearParam ? parseInt(minYearParam, 10) : undefined;
  }, [searchParams]);

  const maxYear = useMemo(() => {
    const maxYearParam = searchParams.get("maxYear");
    return maxYearParam ? parseInt(maxYearParam, 10) : undefined;
  }, [searchParams]);

  const setURLState = useCallback(
    (updates: PartialURLState) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.zoom !== undefined) {
        params.set("zoom", updates.zoom.toString());
      }
      if (updates.center !== undefined) {
        params.set("center", `${updates.center[0]},${updates.center[1]}`);
      }
      if (updates.currentYear !== undefined) {
        params.set("currentYear", updates.currentYear.toString());
      }
      if (updates.minYear !== undefined) {
        params.set("minYear", updates.minYear.toString());
      }
      if (updates.maxYear !== undefined) {
        params.set("maxYear", updates.maxYear.toString());
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  return {
    zoom,
    center,
    currentYear,
    minYear,
    maxYear,
    setURLState,
  };
}

