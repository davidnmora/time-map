"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
  type ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { completeDataset } from "../data/complete-dataset";
import { getMinMaxYears } from "../data/data-utils";

type AppState = {
  zoom: number;
  center: [number, number];
  pitch: number;
  bearing: number;
  currentYear: number;
  minYear: number;
  maxYear: number;
  timelineExpanded: boolean;
};

type PartialAppState = {
  zoom?: number;
  center?: [number, number];
  pitch?: number;
  bearing?: number;
  currentYear?: number;
  minYear?: number;
  maxYear?: number;
  timelineExpanded?: boolean;
};

type UpdateOptions = {
  autoCalculateYear?: boolean;
};

type AppStateContextType = {
  zoom: number;
  center: [number, number];
  pitch: number;
  bearing: number;
  currentYear: number;
  minYear: number;
  maxYear: number;
  timelineExpanded: boolean;
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
const DEFAULT_PITCH = 0;
const DEFAULT_BEARING = 0;
const DEFAULT_TIMELINE_EXPANDED = true;

function getDefaultState(): AppState {
  const { min: dataMinYear, max: dataMaxYear } =
    getMinMaxYears(completeDataset);
  const defaultYear = isFinite(dataMinYear)
    ? dataMinYear
    : new Date().getFullYear();

  return {
    zoom: DEFAULT_ZOOM,
    center: DEFAULT_CENTER,
    pitch: DEFAULT_PITCH,
    bearing: DEFAULT_BEARING,
    currentYear: defaultYear,
    minYear: dataMinYear,
    maxYear: dataMaxYear,
    timelineExpanded: DEFAULT_TIMELINE_EXPANDED,
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

  const currentYear = (() => {
    const currentYearParam = searchParams.get("currentYear");
    return currentYearParam ? parseFloat(currentYearParam) : undefined;
  })();

  const minYear = (() => {
    const minYearParam = searchParams.get("minYear");
    return minYearParam ? parseFloat(minYearParam) : undefined;
  })();

  const maxYear = (() => {
    const maxYearParam = searchParams.get("maxYear");
    return maxYearParam ? parseFloat(maxYearParam) : undefined;
  })();

  const pitch = (() => {
    const pitchParam = searchParams.get("pitch");
    return pitchParam ? parseFloat(pitchParam) : undefined;
  })();

  const bearing = (() => {
    const bearingParam = searchParams.get("bearing");
    return bearingParam ? parseFloat(bearingParam) : undefined;
  })();

  const timelineExpanded = (() => {
    const timelineExpandedParam = searchParams.get("timelineExpanded");
    if (timelineExpandedParam === null) return undefined;
    return timelineExpandedParam === "true";
  })();

  return {
    zoom,
    center,
    pitch,
    bearing,
    currentYear,
    minYear,
    maxYear,
    timelineExpanded,
  };
}

const APP_STATE_KEYS: Array<keyof AppState> = [
  "zoom",
  "center",
  "pitch",
  "bearing",
  "currentYear",
  "minYear",
  "maxYear",
  "timelineExpanded",
];

function isCompleteAppState(state: PartialAppState): state is AppState {
  return APP_STATE_KEYS.every((key) => state[key] !== undefined);
}

function mergeAppState(partial: PartialAppState, complete: AppState): AppState {
  const result = {} as AppState;
  for (const key of APP_STATE_KEYS) {
    const value = partial[key];
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    } else {
      (result as Record<string, unknown>)[key] = complete[key];
    }
  }
  return result;
}

function writeStateToURL(
  state: PartialAppState,
  currentParams: URLSearchParams
): string {
  const params = new URLSearchParams(currentParams.toString());

  APP_STATE_KEYS.forEach((key) => {
    const value = state[key];
    if (value !== undefined) {
      if (key === "center") {
        const center = value as [number, number];
        params.set(key, `${center[0]},${center[1]}`);
      } else if (key === "timelineExpanded") {
        params.set(key, (value as boolean).toString());
      } else {
        params.set(key, (value as number).toString());
      }
    }
  });

  return params.toString();
}

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AppState>(() => {
    const urlState = readStateFromURL(searchParams);
    const defaults = getDefaultState();
    return mergeAppState(urlState, defaults);
  });
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<PartialAppState>({});
  const hasInitializedRef = useRef(false);
  const previousURLRef = useRef<string>("");

  useEffect(() => {
    const urlState = readStateFromURL(searchParams);
    const defaults = getDefaultState();
    const currentURL = searchParams.toString();

    if (hasInitializedRef.current) {
      if (previousURLRef.current !== currentURL) {
        previousURLRef.current = currentURL;
        startTransition(() => {
          setState((prevState) => mergeAppState(urlState, prevState));
        });
      }
      return;
    }

    const hasURLParams = searchParams.toString().length > 0;
    const needsInitialization = !hasURLParams || !isCompleteAppState(urlState);

    if (needsInitialization) {
      const initialState = mergeAppState(urlState, defaults);
      // Syncing URL state to React state on initialization is a valid use case
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(initialState);
      const newParams = writeStateToURL(initialState, new URLSearchParams());
      router.replace(`${pathname}?${newParams}`);
      previousURLRef.current = newParams;
    } else {
      setState(urlState);
      previousURLRef.current = currentURL;
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

      if (
        options?.autoCalculateYear &&
        stateUpdates.minYear !== undefined &&
        stateUpdates.maxYear !== undefined
      ) {
        stateUpdates.currentYear =
          stateUpdates.maxYear -
          (stateUpdates.maxYear - stateUpdates.minYear) / 2;
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
        updates.currentYear = maxYear - (maxYear - minYear) / 2;
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
    ...state,
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

