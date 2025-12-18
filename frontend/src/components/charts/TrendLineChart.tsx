"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface TrendDataPoint {
  date: string;
  value: number;
}

interface TrendLineChartProps {
  data: TrendDataPoint[];
  title?: string;
  color?: string;
  width?: number;
  height?: number;
}

export default function TrendLineChart({ 
  data, 
  title = "Performance Trend",
  color = "#3B82F6",
  width = 600, 
  height = 300 
}: TrendLineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Parse dates
    const parseDate = d3.timeParse("%Y-%m-%d");
    const parsedData = data.map(d => ({
      date: parseDate(d.date) as Date,
      value: d.value
    }));

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => d.value) as number])
      .range([innerHeight, 0]);

    // Line generator
    const line = d3.line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw axes
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .style("color", "#9CA3AF");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .style("color", "#9CA3AF");

    // Draw line
    g.append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", line);

    // Draw area under line
    const area = d3.area<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(parsedData)
      .attr("fill", color)
      .attr("fill-opacity", 0.2)
      .attr("d", area);

    // Draw points
    g.selectAll(".dot")
      .data(parsedData)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.value))
      .attr("r", 4)
      .attr("fill", color)
      .attr("stroke", "#1F2937")
      .attr("stroke-width", 2);

  }, [data, color, width, height]);

  return (
    <div>
      <h4 style={{ color: "#E5E7EB", marginBottom: "10px", fontSize: "14px" }}>{title}</h4>
      <svg ref={svgRef}></svg>
    </div>
  );
}
