"use client";

import { useRef, useEffect } from "react";
import { Timeline } from "./Timeline";
import { TimelineRegions } from "./TimelineRegions";
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
  minYear: number;
  maxYear: number;
  selectedYear: number;
  regions: RegionData[];
  widthEncodingKey?: keyof RegionData;
  onYearChange: (year: number) => void;
  onZoomChange: (minYear: number, maxYear: number) => void;
};

export const TimelineAndTimelineRegions = ({
  height,
  minYear,
  maxYear,
  selectedYear,
  regions,
  widthEncodingKey,
  onYearChange,
  onZoomChange,
}: TimelineAndTimelineRegionsProps) => {
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
      const newMinYear = selectedYear - newHalfRange;
      const newMaxYear = selectedYear + newHalfRange;
      onZoomChange(newMinYear, newMaxYear);
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

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
      if (deltaY > 3) {
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
        const yearDelta = -deltaY * yearPerPixel;

        const newMinYear = dragStartRef.current.minYear + yearDelta;
        const newMaxYear = dragStartRef.current.maxYear + yearDelta;

        onZoomChange(newMinYear, newMaxYear);
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
  }, [height, minYear, maxYear, selectedYear, onZoomChange]);

  return (
    <div
      ref={containerRef}
      className="flex overflow-hidden"
      style={{ height: height, cursor: "grab" }}
    >
      <Timeline
        height={height}
        minYear={minYear}
        maxYear={maxYear}
        selectedYear={selectedYear}
        onYearChange={onYearChange}
        onZoomChange={onZoomChange}
      />
      <TimelineRegions
        height={height}
        minYear={minYear}
        maxYear={maxYear}
        regions={regions}
        widthEncodingKey={widthEncodingKey}
      />
    </div>
  );
};
