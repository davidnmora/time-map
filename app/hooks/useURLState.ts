"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

type URLState = {
  zoom?: number;
  center?: [number, number];
  year?: number;
};

type PartialURLState = {
  zoom?: number;
  center?: [number, number];
  year?: number;
};

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

  const year = useMemo(() => {
    const yearParam = searchParams.get("year");
    return yearParam ? parseInt(yearParam, 10) : undefined;
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
      if (updates.year !== undefined) {
        params.set("year", updates.year.toString());
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  return {
    zoom,
    center,
    year,
    setURLState,
  };
}

