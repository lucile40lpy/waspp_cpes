"use strict";

document.addEventListener("DOMContentLoaded", async function () {
  setupMenu();

  // 1. Get User Answers from Local Storage
  const stored = localStorage.getItem("wasppUserAnswers");
  const userAnswers = stored ? JSON.parse(stored) : null;
  const apiUrl = window.flaskUrls ? window.flaskUrls.sheetApiUrl : null;

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data && data.length > 0) {
        document.getElementById("loading-message").style.display = "none";
        generateCharts(data, userAnswers);
      }
    } catch (error) {
      console.error(error);
      document.getElementById("loading-message").textContent =
        "Error loading data.";
    }
  }
});

function generateCharts(data, userAnswers) {
  const container = d3.select("#charts-container");
  container.html("");

  const variables = [
    { key: "clear-instructions", title: "Clear instructions" },
    { key: "grading-scale", title: "Grading scale provided" },
    { key: "eval-content", title: "Evaluated on content" },
    { key: "resources", title: "Additional resources" },
    { key: "practice", title: "Practice required" },
    { key: "limit-time", title: "Limited time assignments" },
    { key: "feedback", title: "Personal feedback" },
    { key: "explanation", title: "Post-assignment explanation" },
    { key: "correction", title: "Correcting mistakes" },
    { key: "interaction", title: "Student interaction" },
    { key: "group-work", title: "Group work" },
    { key: "workload", title: "Workload hinders quality" },
  ];

  variables.forEach((v) => {
    const userVal = userAnswers ? String(userAnswers[v.key]) : null;
    createBarChart(container, data, v.key, v.title, userVal);
  });
}

function createBarChart(container, data, key, title, userVal) {
  // Use ALL data points (N) for the chart
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  data.forEach((row) => {
    const val = String(row[key]);
    if (counts[val] !== undefined) counts[val]++;
  });

  const plotData = Object.keys(counts).map((k) => ({
    score: k,
    count: counts[k],
  }));
  const labelMap = {
    1: "Strongly Disagree",
    2: "Disagree",
    3: "Neutral",
    4: "Agree",
    5: "Strongly Agree",
  };

  const margin = { top: 20, right: 10, bottom: 70, left: 30 };
  const width = 250 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;

  const chartDiv = container.append("div").attr("class", "chart-wrapper");
  chartDiv
    .append("h3")
    .text(title)
    .style("font-size", "0.8rem")
    .style("text-align", "center")
    .style("min-height", "30px");

  const svg = chartDiv
    .append("svg")
    .attr(
      "viewBox",
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`
    )
    .style("width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .domain(["1", "2", "3", "4", "5"])
    .range([0, width])
    .padding(0.2);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(plotData, (d) => d.count) || 5])
    .range([height, 0]);

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat((d) => labelMap[d]))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-45)")
    .style("font-size", "9px");

  svg
    .append("g")
    .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("d")))
    .style("font-size", "9px");

  // Highlight Logic: Gold if it matches userVal
  svg
    .selectAll(".bar")
    .data(plotData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.score))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.count))
    .attr("fill", (d) => (d.score === userVal ? "#f1c40f" : "#4c282e"));
}

function setupMenu() {
  const dropdownTrigger = document.getElementById("dropdown-trigger");
  const dropdownMenu = document.getElementById("dropdown-menu");
  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("hidden");
    });
    document.addEventListener("click", () =>
      dropdownMenu.classList.add("hidden")
    );
  }
}
