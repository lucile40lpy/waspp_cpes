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

        // --- Filter out "test" IDs ---
        const cleanData = rawData.filter((row) => {
          const id = String(row["anonymous-id"] || "").toLowerCase();
          return !id.startsWith("test");
        });

        // Use 'cleanData' instead of 'rawData' for all functions
        calculateKeyFigures(cleanData);
        generateAllCharts(cleanData);
        performRegression(cleanData);
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
  const mainContainer = d3.select("#charts-container");
  mainContainer.html(""); // Clear previous content

  // Define Groups
  const chartSections = [
    {
      title: "1. Academic Behavior",
      variables: [
        { key: "self-confidence", title: "Self-confidence" },
        { key: "stress", title: "Stress levels" },
        { key: "absence", title: "Frequent absences" },
        { key: "lateness", title: "Frequent lateness" },
        { key: "well-being", title: "General well-being" },
        { key: "knowledge-durability", title: "Knowledge retention" },
        { key: "cheating", title: "Tendency to cheat" },
        { key: "interest", title: "Interest in curriculum" },
        { key: "performance", title: "Academic performance" },
        { key: "workload", title: "Workload issues" },
      ],
    },
    {
      title: "2. Personal Motivations",
      variables: [
        { key: "curiosity", title: "Curiosity" },
        { key: "explanation-seeking", title: "Seeking explanations" },
        { key: "skill-acquisition", title: "Acquiring skills" },
        { key: "play", title: "Playfulness / Fun" },
        { key: "mental-time-travel", title: "Mental time travel" },
        { key: "pride", title: "Feeling of Pride" },
        { key: "shame", title: "Feeling of Shame" },
        { key: "affiliation", title: "Affiliation" },
        { key: "friendship", title: "Friendship" },
        { key: "reasoning", title: "Reasoning" },
        { key: "coalitional-affiliation", title: "Group affiliation" },
        { key: "status-seeking", title: "Status seeking" },
      ],
    },
    {
      title: "3. Pedagogical Preferences",
      variables: [
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
      ],
    },
  ];

  // Loop through sections
  chartSections.forEach((section) => {
    // 1. Append Section Title
    mainContainer
      .append("h2")
      .attr("class", "chart-section-title")
      .text(section.title);

    // 2. Append Grid Container for this section
    const gridDiv = mainContainer.append("div").attr("class", "charts-grid");

    // 3. Generate Charts for this section
    section.variables.forEach((v) => {
      createBarChart(gridDiv, data, v.key, v.title);
    });
  });
}

function createBarChart(container, data, key, title) {
  // 1. Process Data
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  data.forEach((row) => {
    const val = row[key];
    const strVal = String(val);
    if (counts[strVal] !== undefined) {
      counts[strVal]++;
    }
  });

  const plotData = Object.keys(counts).map((k) => ({
    score: k,
    count: counts[k],
  }));

  // Short labels for small 5-col charts
  const labelMap = {
    1: "Str. Disagree",
    2: "Disagree",
    3: "Neutral",
    4: "Agree",
    5: "Str. Agree",
  };

  // 2. Dimensions (Smaller for 5 columns)
  const margin = { top: 15, right: 5, bottom: 60, left: 25 };
  const width = 200 - margin.left - margin.right; // Narrower
  const height = 160 - margin.top - margin.bottom; // Shorter

  // 3. Wrapper
  const chartDiv = container.append("div").attr("class", "chart-wrapper");

  // Title
  chartDiv
    .append("h3")
    .text(title)
    .style("font-size", "0.75rem") // Smaller font
    .style("text-align", "center")
    .style("margin-bottom", "5px")
    .style("min-height", "25px");

  // 4. SVG
  const svg = chartDiv
    .append("svg")
    .attr(
      "viewBox",
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`,
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
    .domain([0, d3.max(plotData, (d) => d.count) || 5])
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
    .style("font-size", "8px"); // Tiny font

  svg
    .append("g")
    .call(d3.axisLeft(y).ticks(3).tickFormat(d3.format("d")))
    .style("font-size", "8px");

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
    .attr("fill", "#4c282e");
}

// ============================================================================
// SECTION 3: ANALYSIS (REGRESSION)
// ============================================================================

// Helper: Student's t-distribution CDF approximation for p-value calculation
function getTDistribution(t, df) {
  const x = Math.abs(t);
  const w = x / Math.sqrt(df);
  const th = Math.atan(w);
  if (df === 1) {
    return 1 - th / (Math.PI / 2);
  }
  let s = Math.sin(th);
  let c = Math.cos(th);
  if (df % 2 === 1) {
    return 1 - (th + s * c * statCom(c * c, 2, df - 3, -1)) / (Math.PI / 2);
  } else {
    return 1 - s * statCom(c * c, 1, df - 3, -1);
  }
}

function statCom(q, i, j, b) {
  let zz = 1;
  let z = zz;
  let k = i;
  while (k <= j) {
    zz = (zz * k * q) / (k + b);
    z += zz;
    k += 2;
  }
  return z;
}

function performRegression(data) {
  // 1. Data Parsing
  const points = [];
  data.forEach((d) => {
    // Make sure keys match your CSV/Sheet headers exactly
    const xVal = parseFloat(d["economic-situation"]);
    const yVal = parseFloat(d["interest"]);

    if (!isNaN(xVal) && !isNaN(yVal)) {
      points.push({ x: xVal, y: yVal });
    }
  });

  // Check for sufficient data
  if (points.length < 3) {
    // Need at least 3 points for valid p-value (df = n-2)
    const tbody = document.getElementById("reg-table-body");
    if (tbody)
      tbody.innerHTML = "<tr><td colspan='2'>Not enough data</td></tr>";
    return;
  }

  // 2. Linear Regression (Least Squares)
  const n = points.length;
  const sumX = d3.sum(points, (d) => d.x);
  const sumY = d3.sum(points, (d) => d.y);
  const sumXY = d3.sum(points, (d) => d.x * d.y);
  const sumXX = d3.sum(points, (d) => d.x * d.x); // Sum of X^2
  const sumYY = d3.sum(points, (d) => d.y * d.y); // Sum of Y^2

  // Slope (b1) & Intercept (b0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // 3. R-Squared Calculation
  // Total Sum of Squares (SStot)
  const ssTotal = sumYY - (sumY * sumY) / n;

  // Residual Sum of Squares (SSres)
  const ssRes = d3.sum(points, (d) => {
    const yPred = slope * d.x + intercept;
    return Math.pow(d.y - yPred, 2);
  });

  const rSquared = ssTotal === 0 ? 0 : 1 - ssRes / ssTotal;

  // 4. Significance (P-Value) Calculation
  // Degrees of freedom
  const df = n - 2;

  // Variance of the residuals (Mean Square Error)
  const mse = ssRes / df;

  // Sum of squared differences for X (Sxx)
  const sxx = sumXX - (sumX * sumX) / n;

  // Standard Error of the Slope
  const seSlope = Math.sqrt(mse / sxx);

  // T-Statistic
  const tStat = slope / seSlope;

  // P-Value (2-tailed)
  // We use the helper function getTDistribution here
  const pValue = 1 - getTDistribution(Math.abs(tStat), df);

  // 5. Update HTML Table
  const tbody = document.getElementById("reg-table-body");
  if (tbody) {
    // Format p-value: if very small, show "< 0.001"
    const pDisplay = pValue < 0.001 ? "< 0.001" : pValue.toFixed(3);

    tbody.innerHTML = `
      <tr><td>Slope</td><td>${slope.toFixed(3)}</td></tr>
      <tr><td>Intercept</td><td>${intercept.toFixed(3)}</td></tr>
      <tr><td>R-Squared</td><td>${rSquared.toFixed(3)}</td></tr>
      <tr><td>P-Value</td><td>${pDisplay}</td></tr>
      <tr><td>Sample Size (n)</td><td>${n}</td></tr>
    `;
  }

  // 6. Draw Plot (Assumes you have this function defined elsewhere)
  if (typeof drawRegPlot === "function") {
    drawRegPlot(points, slope, intercept);
  }

  // 7. Interpretation Text
  const interpBox = document.getElementById("reg-interpretation");
  if (interpBox) {
    let text = "";

    // Direction
    if (Math.abs(slope) < 0.05) {
      // Threshold for "negligible" slope
      text =
        "There is a negligible relationship between economic situation and interest.";
    } else if (slope > 0) {
      text =
        "There is a positive relationship: as economic situation improves, interest tends to increase.";
    } else {
      text =
        "There is a negative relationship: as economic situation improves, interest tends to decrease.";
    }

    // Strength (R2)
    if (rSquared < 0.1) text += " The relationship is very weak.";
    else if (rSquared > 0.5) text += " The relationship is quite strong.";

    // Significance (P-Value)
    // Common alpha level is 0.05
    if (pValue < 0.05) {
      text += ` <strong>The result is statistically significant (p = ${pDisplay}).</strong>`;
    } else {
      text += ` <strong>The result is not statistically significant (p = ${pDisplay}), meaning it could be due to chance.</strong>`;
    }

    interpBox.innerHTML = text; // Use innerHTML to support the <strong> tag
  }
}

// Graph : regplot
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
