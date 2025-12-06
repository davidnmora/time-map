"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { getAllData } from "../data/all-data";
import { getMinMaxYears } from "../utils/data";

type AppState = {
  zoom: number;
  center: [number, number];
  year: number;
  minYear: number;
  maxYear: number;
};

type PartialAppState = {
  zoom?: number;
  center?: [number, number];
  year?: number;
  minYear?: number;
  maxYear?: number;
};

type UpdateOptions = {
  autoCalculateYear?: boolean;
};

type AppStateContextType = {
  zoom: number;
  center: [number, number];
  year: number;
  minYear: number;
  maxYear: number;
  updateState: (updates: PartialAppState, options?: UpdateOptions) => void;
  updateTimelineRange: (
    minYear: number,
    maxYear: number,
    options?: UpdateOptions
  ) => void;
};

const AppStateContext = createContext<AppStateContextType | undefined>(
  undefined
);

const URL_DEBOUNCE_MS = 300;

const DEFAULT_ZOOM = 3;
const DEFAULT_CENTER: [number, number] = [-68.137343, 45.137451];

function getDefaultState(): AppState {
  const allData = getAllData();
  const { min: dataMinYear, max: dataMaxYear } = getMinMaxYears(allData);
  const defaultYear = isFinite(dataMinYear) ? dataMinYear : new Date().getFullYear();

  return {
    zoom: DEFAULT_ZOOM,
    center: DEFAULT_CENTER,
    year: defaultYear,
    minYear: dataMinYear,
    maxYear: dataMaxYear,
  };
}

function readStateFromURL(searchParams: URLSearchParams): PartialAppState {
  const zoom = (() => {
    const zoomParam = searchParams.get("zoom");
    return zoomParam ? parseFloat(zoomParam) : undefined;
  })();

  const center = (() => {
    const centerParam = searchParams.get("center");
    if (!centerParam) return undefined;
    try {
      const [lng, lat] = centerParam.split(",").map(Number);
      if (isNaN(lng) || isNaN(lat)) return undefined;
      return [lng, lat] as [number, number];
    } catch {
      return undefined;
    }
  })();

  const year = (() => {
    const yearParam = searchParams.get("year");
    return yearParam ? parseFloat(yearParam) : undefined;
  })();

  const minYear = (() => {
    const minYearParam = searchParams.get("minYear");
    return minYearParam ? parseFloat(minYearParam) : undefined;
  })();

  const maxYear = (() => {
    const maxYearParam = searchParams.get("maxYear");
    return maxYearParam ? parseFloat(maxYearParam) : undefined;
  })();

  return { zoom, center, year, minYear, maxYear };
}

function isCompleteAppState(state: PartialAppState): state is AppState {
  return (
    state.zoom !== undefined &&
    state.center !== undefined &&
    state.year !== undefined &&
    state.minYear !== undefined &&
    state.maxYear !== undefined
  );
}

function writeStateToURL(state: PartialAppState, currentParams: URLSearchParams): string {
  const params = new URLSearchParams(currentParams.toString());

  if (state.zoom !== undefined) {
    params.set("zoom", state.zoom.toString());
  }
  if (state.center !== undefined) {
    params.set("center", `${state.center[0]},${state.center[1]}`);
  }
  if (state.year !== undefined) {
    params.set("year", state.year.toString());
  }
  if (state.minYear !== undefined) {
    params.set("minYear", state.minYear.toString());
  }
  if (state.maxYear !== undefined) {
    params.set("maxYear", state.maxYear.toString());
  }

  return params.toString();
}

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AppState>(() => {
    const urlState = readStateFromURL(searchParams);
    const defaults = getDefaultState();
    return {
      zoom: urlState.zoom ?? defaults.zoom,
      center: urlState.center ?? defaults.center,
      year: urlState.year ?? defaults.year,
      minYear: urlState.minYear ?? defaults.minYear,
      maxYear: urlState.maxYear ?? defaults.maxYear,
    };
  });
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<PartialAppState>({});
  const hasInitializedRef = useRef(false);
  const lastWrittenStateRef = useRef<PartialAppState | null>(null);

  useEffect(() => {
    const urlState = readStateFromURL(searchParams);
    const defaults = getDefaultState();
    
    if (hasInitializedRef.current) {
      setState((prevState) => ({
        zoom: urlState.zoom ?? prevState.zoom,
        center: urlState.center ?? prevState.center,
        year: urlState.year ?? prevState.year,
        minYear: urlState.minYear ?? prevState.minYear,
        maxYear: urlState.maxYear ?? prevState.maxYear,
      }));
      return;
    }

    const hasURLParams = searchParams.toString().length > 0;
    const needsInitialization = !hasURLParams || !isCompleteAppState(urlState);

    if (needsInitialization) {
      const initialState = {
        minYear: urlState.minYear ?? defaults.minYear,
        maxYear: urlState.maxYear ?? defaults.maxYear,
        year: urlState.year ?? defaults.year,
        zoom: urlState.zoom ?? defaults.zoom,
        center: urlState.center ?? defaults.center,
      };

      setState(initialState);
      const newParams = writeStateToURL(initialState, new URLSearchParams());
      router.replace(`${pathname}?${newParams}`);
    } else {
      setState(urlState);
    }
    hasInitializedRef.current = true;
  }, [searchParams, router, pathname]);

  const flushURLUpdate = useCallback(() => {
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
      urlUpdateTimeoutRef.current = null;
    }

    const updates = pendingUpdatesRef.current;
    if (Object.keys(updates).length === 0) return;

    const newParams = writeStateToURL(updates, searchParams);
    router.push(`${pathname}?${newParams}`);
    pendingUpdatesRef.current = {};
  }, [searchParams, router, pathname]);

  const scheduleURLUpdate = useCallback(
    (updates: PartialAppState) => {
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }

      urlUpdateTimeoutRef.current = setTimeout(() => {
        flushURLUpdate();
      }, URL_DEBOUNCE_MS);
    },
    [flushURLUpdate]
  );

  const updateState = useCallback(
    (updates: PartialAppState, options?: UpdateOptions) => {
      const stateUpdates = { ...updates };

      if (options?.autoCalculateYear && stateUpdates.minYear !== undefined && stateUpdates.maxYear !== undefined) {
        stateUpdates.year = stateUpdates.maxYear - (stateUpdates.maxYear - stateUpdates.minYear) / 2;
      }

      setState((prevState) => ({ ...prevState, ...stateUpdates }));
      scheduleURLUpdate(stateUpdates);
    },
    [scheduleURLUpdate]
  );

  const updateTimelineRange = useCallback(
    (minYear: number, maxYear: number, options?: UpdateOptions) => {
      const updates: PartialAppState = { minYear, maxYear };
      if (options?.autoCalculateYear !== false) {
        updates.year = maxYear - (maxYear - minYear) / 2;
      }
      updateState(updates);
    },
    [updateState]
  );

  useEffect(() => {
    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        flushURLUpdate();
      }
    };
  }, [flushURLUpdate]);

  const contextValue: AppStateContextType = {
    zoom: state.zoom,
    center: state.center,
    year: state.year,
    minYear: state.minYear,
    maxYear: state.maxYear,
    updateState,
    updateTimelineRange,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
};

