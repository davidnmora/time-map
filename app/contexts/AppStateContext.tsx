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

const DEFAULT_ZOOM = 2.175393325182904;
const DEFAULT_CENTER: [number, number] = [
  -85.53107857918121, 34.06934691684232,
];
const DEFAULT_PITCH = 3.4;
const DEFAULT_BEARING = 11.9;
const DEFAULT_TIMELINE_EXPANDED = true;
const DEFAULT_MIN_YEAR = 1731;
const DEFAULT_MAX_YEAR = 2050;
const DEFAULT_CURRENT_YEAR = calculateMidpointYear(
  DEFAULT_MIN_YEAR,
  DEFAULT_MAX_YEAR
);

// Note: due to our timeline choice, we always place the currentYear at the midpoint of the min and max years
function calculateMidpointYear(minYear: number, maxYear: number): number {
  return maxYear - (maxYear - minYear) / 2;
}

function getDefaultState(): AppState {
  return {
    zoom: DEFAULT_ZOOM,
    center: DEFAULT_CENTER,
    pitch: DEFAULT_PITCH,
    bearing: DEFAULT_BEARING,
    currentYear: DEFAULT_CURRENT_YEAR,
    minYear: DEFAULT_MIN_YEAR,
    maxYear: DEFAULT_MAX_YEAR,
    timelineExpanded: DEFAULT_TIMELINE_EXPANDED,
  };
}

function readStateFromURL(searchParams: URLSearchParams): PartialAppState {
  const zoomParam = searchParams.get("zoom");
  const zoom = zoomParam ? parseFloat(zoomParam) : undefined;

  const centerParam = searchParams.get("center");
  const center = (() => {
    if (!centerParam) return undefined;
    try {
      const [lng, lat] = centerParam.split(",").map(Number);
      if (isNaN(lng) || isNaN(lat)) return undefined;
      return [lng, lat] as [number, number];
    } catch {
      return undefined;
    }
  })();

  const currentYearParam = searchParams.get("currentYear");
  const currentYear = currentYearParam
    ? parseFloat(currentYearParam)
    : undefined;

  const minYearParam = searchParams.get("minYear");
  const minYear = minYearParam ? parseFloat(minYearParam) : undefined;

  const maxYearParam = searchParams.get("maxYear");
  const maxYear = maxYearParam ? parseFloat(maxYearParam) : undefined;

  const pitchParam = searchParams.get("pitch");
  const pitch = pitchParam ? parseFloat(pitchParam) : undefined;

  const bearingParam = searchParams.get("bearing");
  const bearing = bearingParam ? parseFloat(bearingParam) : undefined;

  const timelineExpandedParam = searchParams.get("timelineExpanded");
  const timelineExpanded =
    timelineExpandedParam === null
      ? undefined
      : timelineExpandedParam === "true";

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

  const finalMinYear = result.minYear;
  const finalMaxYear = result.maxYear;
  if (isFinite(finalMinYear) && isFinite(finalMaxYear)) {
    result.currentYear = calculateMidpointYear(finalMinYear, finalMaxYear);
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
        stateUpdates.currentYear = calculateMidpointYear(
          stateUpdates.minYear,
          stateUpdates.maxYear
        );
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
        updates.currentYear = calculateMidpointYear(minYear, maxYear);
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

