"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface RadarDataPoint {
  axis: string;
  value: number;
  maxValue: number;
}

interface PerformanceRadarChartProps {
  data: RadarDataPoint[];
  width?: number;
  height?: number;
}

export default function PerformanceRadarChart({ 
  data, 
  width = 400, 
  height = 400 
}: PerformanceRadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;
    const levels = 5;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Scales
    const angleSlice = (Math.PI * 2) / data.length;
    const rScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);

    // Draw circular grid
    for (let level = 0; level < levels; level++) {
      const levelRadius = radius * ((level + 1) / levels);
      
      g.append("circle")
        .attr("r", levelRadius)
        .style("fill", "none")
        .style("stroke", "#4B5563")
        .style("stroke-opacity", 0.3)
        .style("stroke-width", "1px");
    }

    // Draw axes
    const axis = g.selectAll(".axis")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "axis");

    axis.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .style("stroke", "#4B5563")
      .style("stroke-width", "1px")
      .style("stroke-opacity", 0.5);

    // Draw labels
    axis.append("text")
      .attr("x", (d, i) => (rScale(100) + 20) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => (rScale(100) + 20) * Math.sin(angleSlice * i - Math.PI / 2))
      .style("font-size", "12px")
      .style("fill", "#E5E7EB")
      .style("text-anchor", "middle")
      .text((d) => d.axis);

    // Draw radar area
    const radarLine = d3.lineRadial<RadarDataPoint>()
      .radius((d) => rScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    g.append("path")
      .datum(data)
      .attr("d", radarLine)
      .style("fill", "#3B82F6")
      .style("fill-opacity", 0.3)
      .style("stroke", "#3B82F6")
      .style("stroke-width", "2px");

    // Draw data points
    g.selectAll(".radarCircle")
      .data(data)
      .enter()
      .append("circle")
      .attr("r", 4)
      .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
      .style("fill", "#3B82F6")
      .style("stroke", "#1E3A8A")
      .style("stroke-width", "2px");

  }, [data, width, height]);

  return <svg ref={svgRef}></svg>;
}
