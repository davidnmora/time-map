"use client";

import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

const MARGIN = { top: 30, right: 0, bottom: 30, left: 50 };
const TIMELINE_WIDTH = 50;

type TimelineProps = {
  height: number;
  minYear: number;
  maxYear: number;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onZoomChange: (minYear: number, maxYear: number) => void;
};

export const Timeline = ({
  height,
  minYear,
  maxYear,
  selectedYear,
  onYearChange,
  onZoomChange,
}: TimelineProps) => {
  const axisRef = useRef<SVGGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const boundsHeight = height - MARGIN.top - MARGIN.bottom;
  const centerY = boundsHeight / 2;

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([minYear, maxYear])
      .range([boundsHeight, 0]);
  }, [minYear, maxYear, boundsHeight]);

  useEffect(() => {
    if (!axisRef.current) return;

    const svgElement = d3.select(axisRef.current);
    svgElement.selectAll("*").remove();

    const yAxisGenerator = d3
      .axisLeft(yScale)
      .tickFormat((d) => d.toString())
      .ticks(Math.floor(boundsHeight / 30));

    const axisG = svgElement.append("g").call(yAxisGenerator);

    axisG.selectAll(".tick line").attr("x2", -6);
    axisG.selectAll(".tick text").attr("x", -10);

    svgElement
      .append("line")
      .attr("x1", 0)
      .attr("x2", -6)
      .attr("y1", centerY)
      .attr("y2", centerY)
      .attr("stroke", "#000")
      .attr("stroke-width", 2);
  }, [yScale, boundsHeight, centerY]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const isZoom = e.ctrlKey || e.metaKey;

      if (isZoom) {
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        const range = maxYear - minYear;
        const halfRange = range / 2;
        const newHalfRange = halfRange * zoomFactor;
        const newMinYear = selectedYear - newHalfRange;
        const newMaxYear = selectedYear + newHalfRange;
        onZoomChange(newMinYear, newMaxYear);
      } else {
        const deltaY = e.deltaY;
        const range = maxYear - minYear;
        const scrollSpeed = range / 100;
        const newYear = selectedYear + (deltaY > 0 ? scrollSpeed : -scrollSpeed);
        const roundedYear = Math.round(newYear);
        
        const halfRange = range / 2;
        const newMinYear = roundedYear - halfRange;
        const newMaxYear = roundedYear + halfRange;
        
        onYearChange(roundedYear);
        onZoomChange(newMinYear, newMaxYear);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [selectedYear, minYear, maxYear, onYearChange, onZoomChange]);

  return (
    <div
      ref={containerRef}
      style={{
        width: TIMELINE_WIDTH,
        height: height,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg width={TIMELINE_WIDTH} height={height} style={{ display: "block" }}>
        <g
          ref={axisRef}
          transform={`translate(${MARGIN.left},${MARGIN.top})`}
        />
      </svg>
    </div>
  );
};
