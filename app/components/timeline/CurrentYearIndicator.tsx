"use client";

import { useRef, useEffect } from "react";
import * as d3 from "d3";

type CurrentYearIndicatorProps = {
  height: number;
  minYear: number;
  maxYear: number;
  currentYear: number;
  totalWidth: number;
};

export const CurrentYearIndicator = ({
  height,
  minYear,
  maxYear,
  currentYear,
  totalWidth,
}: CurrentYearIndicatorProps) => {
  const overlayRef = useRef<SVGSVGElement | null>(null);

  const boundsHeight = height;

  useEffect(() => {
    if (!overlayRef.current) return;

    const yScale = d3
      .scaleLinear()
      .domain([minYear, maxYear])
      .range([boundsHeight, 0]);

    const currentYearY = yScale(currentYear);

    const svgElement = d3.select(overlayRef.current);
    svgElement.selectAll("*").remove();

    svgElement
      .append("line")
      .attr("x1", 0)
      .attr("x2", totalWidth)
      .attr("y1", currentYearY)
      .attr("y2", currentYearY)
      .attr("stroke", "#000")
      .attr("stroke-width", 4);

    svgElement
      .append("text")
      .attr("x", totalWidth / 2)
      .attr("y", currentYearY - 8)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "14px")
      .attr("fill", "#000")
      .text(`Current Year: ${currentYear}`);
  }, [currentYear, minYear, maxYear, boundsHeight, totalWidth]);

  return (
    <svg
      ref={overlayRef}
      width={totalWidth}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
    />
  );
};

