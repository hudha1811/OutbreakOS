const API_KEY = "";

let DATA = [];
let selected = null;
let chart = null;

const NODE_CLUSTERS = [
  [26, 27, 50, 51, 74, 75],
  [155, 156, 179, 180, 203, 204],
  [16, 17, 40, 41, 64, 65],
];

// START
document.addEventListener("DOMContentLoaded", async () => {
  updateClock();
  setInterval(updateClock, 1000);
  buildDotGrid();
  await loadData();
});

// CLOCK
function updateClock() {
  document.getElementById("clock").textContent =
    new Date().toUTCString().slice(17, 25) + " UTC";
}

// GRID
function buildDotGrid() {
  const grid = document.getElementById("dotGrid");
  for (let i = 0; i < 288; i++) {
    const n = document.createElement("div");
    n.className = "dnode";
    n.id = `n${i}`;
    grid.appendChild(n);
  }
}

// LOAD DATA
async function loadData() {
  DATA = [
    {
      id: "india",
      name: "India",
      disease: "COVID-19",
      region: "South Asia",
      trajectory: "exponential",
      avg_weekly_cases: 1719,
      projected_cases_30d: 12033,
      hospital_beds_needed: 601,
      vaccination_gap_pct: 66.8,
      urgency_score: 100,
      urgency_label: "CRITICAL",
      recommendation: "IMMEDIATE ACTION REQUIRED...",
      history: [1210,893,787,686,740,2022,958,1546,2350],
      forecast: [3172,4277,5781,7802,10528,14217,19199,25850],
    },
    {
      id: "brazil",
      name: "Brazil",
      region: "Latin America",
      trajectory: "contained",
      avg_weekly_cases: 44234,
      projected_cases_30d: 150394,
      hospital_beds_needed: 7519,
      vaccination_gap_pct: 52.8,
      urgency_score: 25,
      urgency_label: "LOW",
      recommendation: "Maintain current interventions...",
      history: [174797,79909,90833,69266,67258,66239,38431,54520,17745],
      forecast: [16502,15615,14905,14373,14018,13663,13486,13308],
    },
    {
      id: "germany",
      name: "Germany",
      region: "Europe",
      trajectory: "contained",
      avg_weekly_cases: 88792,
      projected_cases_30d: 301892,
      hospital_beds_needed: 15094,
      vaccination_gap_pct: 24.5,
      urgency_score: 15,
      urgency_label: "LOW",
      recommendation: "Maintain interventions...",
      history: [98156,64992,68637,82044,83693,92858,103339,112482,46489],
      forecast: [43234,40910,39050,37656,36726,35796,35331,34866],
    }
  ];

  DATA.forEach((o, i) => { o._nodes = NODE_CLUSTERS[i] || []; });

  paintMap();
  renderList();
  renderHeader();
  renderAlert();
  selectOutbreak(DATA[0].id);
}

// HEADER
function renderHeader() {
  document.getElementById("hTotal").textContent = DATA.length;
  document.getElementById("hCountries").textContent = DATA.length;
  document.getElementById("hCritical").textContent =
    DATA.filter(o => o.trajectory === "exponential").length;
}

// ALERT
function renderAlert() {
  const critical = DATA.find(o => o.trajectory === "exponential");
  if (!critical) return;

  document.getElementById("alertMsg").textContent =
    `${critical.name} is in EXPONENTIAL growth. Immediate action required.`;
}

// MAP
function paintMap() {
  DATA.forEach(o => {
    o._nodes.forEach(idx => {
      const node = document.getElementById(`n${idx}`);
      if (!node) return;

      node.className = `dnode active-node ${o.trajectory}`;
      node.onclick = () => selectOutbreak(o.id);
    });
  });
}

// LIST
function renderList() {
  const container = document.getElementById("outbreakList");
  container.innerHTML = "";

  DATA.forEach(o => {
    const el = document.createElement("div");
    el.className = "ob-item";

    el.innerHTML = `
      <div class="ob-dot ${o.trajectory}"></div>
      <div class="ob-info">
        <div class="ob-name">${o.name}</div>
        <div class="ob-region">${o.region}</div>
      </div>
    `;

    el.onclick = () => selectOutbreak(o.id);
    container.appendChild(el);
  });
}

// SELECT
function selectOutbreak(id) {
  const o = DATA.find(x => x.id === id);
  if (!o) return;

  selected = o;
  renderChart(o);
  renderDetail(o);
}

// CHART (🔥 FIXED PROPERLY)
function renderChart(o) {
  document.getElementById("chartPlaceholder").style.display = "none";

  const historyLabels = o.history.map((_, i) => `W-${i + 1}`);
  const forecastLabels = o.forecast.map((_, i) => `F+${i + 1}`);
  const labels = [...historyLabels, ...forecastLabels];

  const historyData = [...o.history, ...Array(o.forecast.length).fill(null)];
  const forecastData = [
    ...Array(o.history.length - 1).fill(null),
    o.history[o.history.length - 1],
    ...o.forecast
  ];

  if (chart) chart.destroy();

  const ctx = document.getElementById("mainChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Historical",
          data: historyData,
          borderColor: "#00e5ff",
          backgroundColor: "rgba(0,229,255,0.15)",
          fill: true,
          tension: 0.4
        },
        {
          label: "Forecast",
          data: forecastData,
          borderColor: "#ffcc00",
          borderDash: [6,6],
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// DETAIL
function renderDetail(o) {
  document.getElementById("detailPlaceholder").style.display = "none";
  document.getElementById("detailPanel").style.display = "flex";

  document.getElementById("dName").textContent = o.name;
  document.getElementById("dRegion").textContent = o.region;

  document.getElementById("dWeekly").textContent = o.avg_weekly_cases;
  document.getElementById("dProjected").textContent = o.projected_cases_30d;

  document.getElementById("recText").textContent = o.recommendation;

  setBar("rBeds","rBedsBar",o.hospital_beds_needed, o.hospital_beds_needed/200);
  setBar("rVax","rVaxBar",o.vaccination_gap_pct+"%", o.vaccination_gap_pct);
  setBar("rUrgency","rUrgencyBar",o.urgency_label, o.urgency_score);
}

// BAR FIX
function setBar(labelId, fillId, text, pct) {
  document.getElementById(labelId).textContent = text;

  const bar = document.getElementById(fillId);
  let width = Math.max(pct, 5);
  if (width > 100) width = 100;

  bar.style.width = width + "%";
}

// AI
async function generateBrief() {
  if (!selected) return;

  const o = selected;
  const loader = document.getElementById("aiLoader");
  const output = document.getElementById("aiText");
  const btn = document.getElementById("aiBtn");

  loader.classList.add("on");
  output.textContent = "";
  btn.disabled = true;

  setTimeout(() => {
    loader.classList.remove("on");

    // 🔥 SMART ANALYSIS
    let riskLevel = "";
    let mainCause = "";
    let future = "";

    // Risk level
    if (o.trajectory === "exponential") {
      riskLevel = "CRITICAL exponential growth";
    } else if (o.trajectory === "escalating") {
      riskLevel = "rapidly escalating spread";
    } else {
      riskLevel = "controlled transmission";
    }

    // Main cause
    if (o.vaccination_gap_pct > 60) {
      mainCause = "a large unvaccinated population increasing transmission risk";
    } else if (o.vaccination_gap_pct > 30) {
      mainCause = "moderate vaccination gaps allowing continued spread";
    } else {
      mainCause = "relatively strong vaccination coverage limiting spread";
    }

    // Future prediction
    if (o.trajectory === "exponential") {
      future = "cases may surge rapidly and overwhelm healthcare systems";
    } else if (o.trajectory === "escalating") {
      future = "cases are expected to rise steadily over the coming weeks";
    } else {
      future = "cases are likely to stabilize or gradually decline";
    }

    const text = `
📍 ${o.name} Risk Analysis

• Current Situation:
${o.name} is experiencing ${riskLevel}, with an average of ${o.avg_weekly_cases.toLocaleString()} weekly cases.

• Key Driver:
The primary factor is ${mainCause}. The current vaccination gap stands at ${o.vaccination_gap_pct}% which significantly impacts spread dynamics.

• System Pressure:
Healthcare demand is increasing, with an estimated ${o.hospital_beds_needed.toLocaleString()} beds required.

• 30-Day Outlook:
If current conditions persist, ${future}, potentially reaching ${o.projected_cases_30d.toLocaleString()} cases.

• Recommended Priority:
Immediate targeted intervention, vaccination acceleration, and localized containment strategies are critical.
    `.trim();

    // ✨ Typewriter effect
    let i = 0;
    const type = setInterval(() => {
      output.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(type);
    }, 12);

    btn.disabled = false;

  }, 1000);
}
