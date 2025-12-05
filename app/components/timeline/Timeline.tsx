"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const MARGIN = { top: 30, right: 0, bottom: 30, left: 50 };
const TIMELINE_WIDTH = 50;

type TimelineProps = {
  height: number;
  minYear: number;
  maxYear: number;
};

export const Timeline = ({
  height,
  minYear,
  maxYear,
}: TimelineProps) => {
  const axisRef = useRef<SVGGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const boundsHeight = height - MARGIN.top - MARGIN.bottom;
  const centerY = boundsHeight / 2;

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

    svgElement
      .append("line")
      .attr("x1", 0)
      .attr("x2", -6)
      .attr("y1", centerY)
      .attr("y2", centerY)
      .attr("stroke", "#000")
      .attr("stroke-width", 2);
  }, [minYear, maxYear, boundsHeight, centerY]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ width: TIMELINE_WIDTH, height: height }}
    >
      <svg width={TIMELINE_WIDTH} height={height} className="block">
        <g
          ref={axisRef}
          transform={`translate(${MARGIN.left},${MARGIN.top})`}
        />
      </svg>
    </div>
  );
};
