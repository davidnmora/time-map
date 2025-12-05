"use client";

import { useRef, useEffect } from "react";
import { Timeline } from "./Timeline";
import { TimelineRegions } from "./TimelineRegions";
import { useAppState } from "../../contexts/AppStateContext";
import type { TimeRange, Metadata } from "../../data/types";

type RegionData = {
  id: string;
  timeRange: TimeRange;
  color?: string;
  metadata?: Metadata;
  hierarchy?: string[];
  area: number;
};

type TimelineAndTimelineRegionsProps = {
  height: number;
  currentYear: number;
  regions: RegionData[];
  widthEncodingKey?: keyof RegionData;
};

export const TimelineAndTimelineRegions = ({
  height,
  currentYear,
  regions,
  widthEncodingKey,
}: TimelineAndTimelineRegionsProps) => {
  const { minYear, maxYear, updateTimelineRange } = useAppState();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    y: number;
    minYear: number;
    maxYear: number;
  } | null>(null);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      const range = maxYear - minYear;
      const halfRange = range / 2;
      const newHalfRange = halfRange * zoomFactor;
      const newMinYear = currentYear - newHalfRange;
      const newMaxYear = currentYear + newHalfRange;
      updateTimelineRange(newMinYear, newMaxYear, { autoCalculateYear: true });
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      hasMovedRef.current = false;
      dragStartRef.current = {
        y: e.clientY,
        minYear,
        maxYear,
      };
    };

    const MINIMUM_DRAG_DISTANCE = 0.5;
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
      if (deltaY > MINIMUM_DRAG_DISTANCE) {
        hasMovedRef.current = true;
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          container.style.cursor = "grabbing";
          container.style.userSelect = "none";
        }
      }

      if (isDraggingRef.current && dragStartRef.current) {
        const deltaY = e.clientY - dragStartRef.current.y;
        const range =
          dragStartRef.current.maxYear - dragStartRef.current.minYear;
        const yearPerPixel = range / height;
        const yearDelta = deltaY * yearPerPixel;

        const newMinYear = dragStartRef.current.minYear + yearDelta;
        const newMaxYear = dragStartRef.current.maxYear + yearDelta;

        updateTimelineRange(newMinYear, newMaxYear, {
          autoCalculateYear: true,
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        if (hasMovedRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
        isDraggingRef.current = false;
        dragStartRef.current = null;
        hasMovedRef.current = false;
        container.style.cursor = "grab";
        container.style.userSelect = "";
      }
    };

    const handleMouseLeave = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        dragStartRef.current = null;
        hasMovedRef.current = false;
        container.style.cursor = "grab";
        container.style.userSelect = "";
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [height, minYear, maxYear, currentYear, updateTimelineRange]);

  return (
    <div
      ref={containerRef}
      className="flex overflow-hidden"
      style={{ height: height, cursor: "grab" }}
    >
      <Timeline height={height} minYear={minYear} maxYear={maxYear} />
      <TimelineRegions
        height={height}
        minYear={minYear}
        maxYear={maxYear}
        currentYear={currentYear}
        regions={regions}
        widthEncodingKey={widthEncodingKey}
      />
    </div>
  );
};
