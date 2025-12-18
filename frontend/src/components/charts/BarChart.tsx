"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  width?: number;
  height?: number;
  title?: string;
}

export default function BarChart({ 
  data, 
  width = 500, 
  height = 300,
  title = "Statistics"
}: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) as number])
      .range([innerHeight, 0]);

    // Draw axes
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .style("color", "#9CA3AF")
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "10px");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .style("color", "#9CA3AF");

    // Draw bars
    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.label) as number)
      .attr("y", d => yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", d => innerHeight - yScale(d.value))
      .attr("fill", d => d.color || "#3B82F6")
      .attr("rx", 4)
      .style("opacity", 0.8)
      .on("mouseover", function() {
        d3.select(this).style("opacity", 1);
      })
      .on("mouseout", function() {
        d3.select(this).style("opacity", 0.8);
      });

    // Add value labels on top of bars
    g.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => (xScale(d.label) as number) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.value) - 5)
      .attr("text-anchor", "middle")
      .style("fill", "#E5E7EB")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => d.value);

  }, [data, width, height]);

  return (
    <div>
      <h4 style={{ color: "#E5E7EB", marginBottom: "10px", fontSize: "14px" }}>{title}</h4>
      <svg ref={svgRef}></svg>
    </div>
  );
}
