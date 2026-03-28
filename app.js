const API_KEY = ""
let DATA = [];
let selected = null;
let chart = null;

const NODE_CLUSTERS = [
  [26, 27, 50, 51, 74, 75],     // India
  [155, 156, 179, 180, 203, 204], // Brazil
  [16, 17, 40, 41, 64, 65],     // Germany
];

// 🚀 START
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

// 🔥 LOAD DATA
async function loadData() {
  try {
    // 🔥 DIRECT DATA (no fetch, no server issues)
    DATA = [
      {
        "id": "india",
        "name": "India",
        "disease": "COVID-19",
        "region": "South Asia",
        "trajectory": "exponential",
        "avg_weekly_cases": 1719,
        "projected_cases_30d": 12033,
        "hospital_beds_needed": 601,
        "vaccination_gap_pct": 66.8,
        "urgency_score": 100,
        "urgency_label": "CRITICAL",
        "recommendation": "IMMEDIATE ACTION REQUIRED...",
        "history": [1210,893,787,686,740,2022,958,1546,2350],
        "forecast": [3172,4277,5781,7802,10528,14217,19199,25850],
        "last_updated": "2026-03-28"
      },
      {
        "id": "brazil",
        "name": "Brazil",
        "disease": "COVID-19",
        "region": "Latin America",
        "trajectory": "contained",
        "avg_weekly_cases": 44234,
        "projected_cases_30d": 150394,
        "hospital_beds_needed": 7519,
        "vaccination_gap_pct": 52.8,
        "urgency_score": 25,
        "urgency_label": "LOW",
        "recommendation": "Maintain current interventions...",
        "history": [174797,79909,90833,69266,67258,66239,38431,54520,17745],
        "forecast": [16502,15615,14905,14373,14018,13663,13486,13308],
        "last_updated": "2026-03-28"
      },
      {
        "id": "germany",
        "name": "Germany",
        "disease": "COVID-19",
        "region": "Europe",
        "trajectory": "contained",
        "avg_weekly_cases": 88792,
        "projected_cases_30d": 301892,
        "hospital_beds_needed": 15094,
        "vaccination_gap_pct": 24.5,
        "urgency_score": 15,
        "urgency_label": "LOW",
        "recommendation": "Maintain interventions...",
        "history": [98156,64992,68637,82044,83693,92858,103339,112482,46489],
        "forecast": [43234,40910,39050,37656,36726,35796,35331,34866],
        "last_updated": "2026-03-28"
      }
    ];

    // attach nodes
    DATA.forEach((o, i) => { o._nodes = NODE_CLUSTERS[i] || []; });

    // render everything
    paintMap();
    renderList();
    renderHeader();
    renderAlert();
    selectOutbreak(DATA[0].id);

  } catch (err) {
    document.getElementById("outbreakList").innerHTML =
      `<div style="color:red">⚠ Failed to load data</div>`;
    console.error(err);
  }
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
      node.title = `${o.name} (${o.region})`;

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

// 🔥 SELECT OUTBREAK
function selectOutbreak(id) {
  const o = DATA.find(x => x.id === id);
  if (!o) {
    console.log("NOT FOUND:", id);
    return;
  }

  console.log("SELECTED:", o.name);

  selected = o;

  renderChart(o);
  renderDetail(o);
}

// 📊 CHART
function renderChart(o) {
  document.getElementById("chartPlaceholder").style.display = "none";

  const labels = [
    ...o.history.map((_, i) => `W-${i + 1}`),
    ...o.forecast.map((_, i) => `F+${i + 1}`)
  ];

  const data = [...o.history, ...o.forecast];

  if (chart) chart.destroy();

  const ctx = document.getElementById("mainChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: `${o.name} Cases`,
        data: data,
        borderColor: "#00e5ff",
        backgroundColor: "rgba(0,229,255,0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true }
      },
      scales: {
        x: { ticks: { color: "#ccc" } },
        y: { ticks: { color: "#ccc" } }
      }
    }
  });
}

// DETAIL PANEL
function renderDetail(o) {
  document.getElementById("detailPlaceholder").style.display = "none";
  document.getElementById("detailPanel").style.display = "flex";

  document.getElementById("dName").textContent = o.name;
  document.getElementById("dRegion").textContent = `${o.region} · ${o.disease}`;

  document.getElementById("dWeekly").textContent =
    o.avg_weekly_cases.toLocaleString();

  document.getElementById("dProjected").textContent =
    o.projected_cases_30d.toLocaleString();

const rec = o.recommendation && o.recommendation.trim() !== ""
  ? o.recommendation
  : "No recommendation available";

document.getElementById("recText").textContent = rec;

setBar(
  "rBeds",
  "rBedsBar",
  (o.hospital_beds_needed || 0).toLocaleString(),
  Math.min((o.hospital_beds_needed || 0) / 20000 * 100, 100)
);

setBar(
  "rVax",
  "rVaxBar",
  `${o.vaccination_gap_pct || 0}%`,
  o.vaccination_gap_pct || 5
);

setBar(
  "rUrgency",
  "rUrgencyBar",
  o.urgency_label || "—",
  o.urgency_score || 10
);
}

function setBar(labelId, fillId, text, pct) {
  document.getElementById(labelId).textContent = text;

  const bar = document.getElementById(fillId);

  // 🔥 Ensure visible width
  let width = Math.max(pct, 5); // minimum 5%
  if (width > 100) width = 100;

  bar.style.width = width + "%";
}

// 🤖 AI BUTTON (simple for now)
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

    const text = `
${o.name} is currently experiencing a ${o.trajectory} trajectory driven by transmission dynamics and population exposure patterns.
The most critical risk factor is the current vaccination gap of ${o.vaccination_gap_pct}%, which could accelerate spread in the next 2 weeks.
If no intervention occurs, cases may reach approximately ${o.projected_cases_30d.toLocaleString()} within 30 days, placing severe pressure on healthcare systems.
Immediate priority should be rapid vaccination expansion and targeted containment in high-risk regions.
    `.trim();

    // typewriter effect
    let i = 0;
    const type = setInterval(() => {
      output.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(type);
    }, 15);

    btn.disabled = false;
  }, 1200);
}
