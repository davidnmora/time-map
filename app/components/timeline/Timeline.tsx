"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const TIMELINE_WIDTH = 50;

type TimelineProps = {
  height: number;
  minYear: number;
  maxYear: number;
};

export const Timeline = ({ height, minYear, maxYear }: TimelineProps) => {
  const axisRef = useRef<SVGGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const boundsHeight = height;

  useEffect(() => {
    if (!axisRef.current) return;

    const yScale = d3
      .scaleLinear()
      .domain([minYear, maxYear])
      .range([boundsHeight, 0]);

    const svgElement = d3.select(axisRef.current);
    svgElement.selectAll("*").remove();

    const yAxisGenerator = d3
      .axisLeft(yScale)
      .tickFormat((d) => d.toString())
      .ticks(Math.floor(boundsHeight / 30));

    const axisG = svgElement.append("g").call(yAxisGenerator);

    axisG.selectAll(".tick line").attr("x2", -6);
    axisG.selectAll(".tick text").attr("x", -10);
  }, [minYear, maxYear, boundsHeight]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ width: TIMELINE_WIDTH, height: height }}
    >
      <svg width={TIMELINE_WIDTH} height={height} className="block">
        <g ref={axisRef} transform={`translate(${TIMELINE_WIDTH}, 0)`} />
      </svg>
    </div>
  );
};
