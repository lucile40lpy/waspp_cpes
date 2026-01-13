"use strict";

document.addEventListener("DOMContentLoaded", async function () {
  // 1. Setup Menu
  setupMenu();

  // 2. Fetch Data
  const apiUrl = window.flaskUrls ? window.flaskUrls.sheetApiUrl : null;

  if (apiUrl) {
    try {
      const rawData = await fetchData(apiUrl);
      if (rawData && rawData.length > 0) {
        document.getElementById("loading-message").style.display = "none";

        // 3. Process & Display Results
        calculateKeyFigures(rawData);
        generateAllCharts(rawData);
        performRegression(rawData);
      } else {
        document.getElementById("loading-message").textContent =
          "No data found.";
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      document.getElementById("loading-message").textContent =
        "Error loading data.";
    }
  } else {
    console.error("API URL not configured.");
    document.getElementById("loading-message").textContent =
      "Configuration Error.";
  }
});

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// ============================================================================
// SECTION 1: KEY FIGURES (N and N')
// ============================================================================

function calculateKeyFigures(data) {
  // N: Total number of rows/responses
  const N = data.length;
  const totalNElement = document.getElementById("total-n");
  if (totalNElement) totalNElement.textContent = N;

  // N': Number of "complete" profiles (no empty variables)
  // We ignore specific optional fields: ID, study-tips, remarks-admin, timestamp
  const ignoredFields = [
    "timestamp",
    "anonymous-id",
    "study-tips",
    "remarks-admin",
  ];

  let validCount = 0;

  data.forEach((row) => {
    let isComplete = true;
    for (let key in row) {
      // Skip the ignored fields
      if (ignoredFields.includes(key)) continue;

      // Check if value is essentially empty
      if (row[key] === "" || row[key] === null || row[key] === undefined) {
        isComplete = false;
        break;
      }
    }
    if (isComplete) validCount++;
  });

  const validNElement = document.getElementById("valid-n");
  if (validNElement) validNElement.textContent = validCount;
}

// ============================================================================
// SECTION 2: DATA DESCRIPTION (CHARTS)
// ============================================================================

function generateAllCharts(data) {
  const container = d3.select("#charts-container");
  container.html(""); // Clear any loading text

  // List of variables to plot
  const variables = [
    {
      key: "clear-instructions",
      title: "Clear instructions before evaluating",
    },
    { key: "grading-scale", title: "Teacher provides a grading scale" },
    { key: "eval-content", title: "Evaluated purely on course content" },
    { key: "resources", title: "Additional resources to dig further" },
    { key: "practice", title: "Practicing what was taught" },
    { key: "limit-time", title: "Produce assignments in limited time" },
    { key: "feedback", title: "Personal feedback and annotations" },
    { key: "explanation", title: "Explanations provided after assignment" },
    { key: "correction", title: "Asked to correct mistakes after evaluation" },
    { key: "interaction", title: "Interact with other students" },
    { key: "group-work", title: "Work in groups" },
    { key: "workload", title: "Ability hampered by workload" },
  ];

  variables.forEach((v) => {
    createBarChart(container, data, v.key, v.title);
  });
}

function createBarChart(container, data, key, title) {
  // 1. Process Data: Count frequency of 1-5
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  data.forEach((row) => {
    const val = row[key];
    const strVal = String(val); // Ensure it's a string key
    if (counts[strVal] !== undefined) {
      counts[strVal]++;
    }
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

  // 2. Setup Dimensions (Responsive viewBox)
  // Designed for 3-column grid
  const margin = { top: 20, right: 10, bottom: 70, left: 30 };
  const width = 250 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;

  // 3. Append Wrapper
  const chartDiv = container.append("div").attr("class", "chart-wrapper");

  // Title
  chartDiv
    .append("h3")
    .text(title)
    .style("font-size", "0.8rem")
    .style("text-align", "center")
    .style("margin-bottom", "5px")
    .style("min-height", "30px"); // Keeps grid aligned

  // 4. SVG
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

  // 5. Scales
  const x = d3
    .scaleBand()
    .domain(["1", "2", "3", "4", "5"])
    .range([0, width])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(plotData, (d) => d.count) || 5]) // Default max to 5 if empty
    .range([height, 0]);

  // 6. Axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat((d) => labelMap[d]))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)")
    .style("font-size", "9px");

  svg
    .append("g")
    .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("d")))
    .style("font-size", "9px");

  // 7. Bars
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
    .attr("fill", "#4c282e"); // Standard brand color
}

// ============================================================================
// SECTION 3: ANALYSIS (REGRESSION)
// ============================================================================

function performRegression(data) {
  // Variables: Interest (Y) ~ Economic Situation (X)
  const points = [];

  data.forEach((d) => {
    // Ensure we parse numbers correctly.
    // Adjust keys if your sheet headers are different
    const xVal = parseFloat(d["economic-situation"]);
    const yVal = parseFloat(d["interest"]);

    if (!isNaN(xVal) && !isNaN(yVal)) {
      points.push({ x: xVal, y: yVal });
    }
  });

  // Need at least 2 points to make a line
  if (points.length < 2) {
    const tbody = document.getElementById("reg-table-body");
    if (tbody)
      tbody.innerHTML =
        "<tr><td colspan='2'>Not enough data for regression</td></tr>";
    return;
  }

  // Linear Regression Calculation (Least Squares Method)
  const n = points.length;
  const sumX = d3.sum(points, (d) => d.x);
  const sumY = d3.sum(points, (d) => d.y);
  const sumXY = d3.sum(points, (d) => d.x * d.y);
  const sumXX = d3.sum(points, (d) => d.x * d.x);
  const sumYY = d3.sum(points, (d) => d.y * d.y);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-Squared
  const ssTotal = sumYY - (sumY * sumY) / n;
  const ssRes = d3.sum(points, (d) => {
    const yPred = slope * d.x + intercept;
    return Math.pow(d.y - yPred, 2);
  });

  // R² is 1 - (SSres / SStotal). Guard against division by zero if all Y are same.
  const rSquared = ssTotal === 0 ? 0 : 1 - ssRes / ssTotal;

  // Update Table
  const tbody = document.getElementById("reg-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr><td>Slope (Coefficient)</td><td>${slope.toFixed(3)}</td></tr>
      <tr><td>Intercept</td><td>${intercept.toFixed(3)}</td></tr>
      <tr><td>R-Squared</td><td>${rSquared.toFixed(3)}</td></tr>
      <tr><td>Sample Size (n)</td><td>${n}</td></tr>
    `;
  }

  // Draw Regression Plot
  drawRegPlot(points, slope, intercept);

  // Interpretation Text
  const interpBox = document.getElementById("reg-interpretation");
  if (interpBox) {
    let text = "";
    if (Math.abs(slope) < 0.1) {
      text =
        "There is a negligible relationship between economic situation and program interest.";
    } else if (slope > 0) {
      text =
        "There is a positive relationship: as economic situation improves, interest in the program tends to increase.";
    } else {
      text =
        "There is a negative relationship: as economic situation improves, interest in the program tends to decrease.";
    }
    // Add strength context based on R²
    if (rSquared < 0.1) text += " However, the relationship is very weak.";
    else if (rSquared > 0.5) text += " The relationship is quite strong.";

    interpBox.textContent = text;
  }
}

function drawRegPlot(points, slope, intercept) {
  const container = d3.select("#reg-plot");
  container.html(""); // Clear placeholder

  // Get container width
  const containerNode = container.node();
  const containerWidth = containerNode
    ? containerNode.getBoundingClientRect().width
    : 400;

  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const width = containerWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Jitter function to prevent overlapping points
  const jitter = () => (Math.random() - 0.5) * 0.3;

  // Scales (1 to 5, plus padding)
  const x = d3.scaleLinear().domain([0.5, 5.5]).range([0, width]);
  const y = d3.scaleLinear().domain([0.5, 5.5]).range([height, 0]);

  // Axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));

  svg.append("g").call(d3.axisLeft(y).ticks(5));

  // Axis Labels
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 35)
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Economic Situation (1-5)");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -30)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Interest (1-5)");

  // Draw Points
  svg
    .selectAll(".dot")
    .data(points)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.x + jitter()))
    .attr("cy", (d) => y(d.y + jitter()))
    .attr("r", 4)
    .style("fill", "rgba(76, 40, 46, 0.5)"); // Transparent brand color

  // Draw Regression Line
  // Calc start and end points of the line within domain [1, 5]
  const lineData = [
    { x: 1, y: slope * 1 + intercept },
    { x: 5, y: slope * 5 + intercept },
  ];

  const line = d3
    .line()
    .x((d) => x(d.x))
    .y((d) => y(d.y));

  svg
    .append("path")
    .datum(lineData)
    .attr("fill", "none")
    .attr("stroke", "#e74c3c") // Red color for the line
    .attr("stroke-width", 2)
    .attr("d", line);
}

// ============================================================================
// MENU LOGIC
// ============================================================================

function setupMenu() {
  const dropdownTrigger = document.getElementById("dropdown-trigger");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const dropdownIcon = document.querySelector(".dropdown-icon");

  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdownMenu.classList.toggle("hidden");

      if (dropdownIcon) {
        dropdownIcon.style.transform = dropdownMenu.classList.contains("hidden")
          ? "rotate(0deg)"
          : "rotate(180deg)";
      }
    });

    document.addEventListener("click", function () {
      dropdownMenu.classList.add("hidden");
      if (dropdownIcon) dropdownIcon.style.transform = "rotate(0deg)";
    });

    dropdownMenu.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }
}

// Helper to scroll to sections smoothly
window.scrollToSection = function (sectionId) {
  const section = document.getElementById(sectionId);
  const dropdownMenu = document.getElementById("dropdown-menu");
  const dropdownIcon = document.querySelector(".dropdown-icon");

  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // Close menu after clicking
  if (dropdownMenu) dropdownMenu.classList.add("hidden");
  if (dropdownIcon) dropdownIcon.style.transform = "rotate(0deg)";
};
