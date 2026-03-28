#  OutbreakOS
### Global Outbreak Intelligence System

> *"Forecasts don't save lives. Action does. OutbreakOS bridges the gap."*

---


---

## The Problem

Every existing epidemic model does the same thing — it predicts.

It shows you a curve. It tells you cases will rise. It outputs a number.

**And then it stops.**

It does not tell you how many hospital beds your district needs by Friday. It does not tell you how far your vaccination coverage is from herd immunity. It does not tell you what to do next.

Meanwhile, the public health infrastructure built to act on these predictions is being defunded globally. As of early 2026, there are **over 100 active disease outbreaks** across 66 countries. The officers responsible for responding to them are doing so with fewer resources, less support, and tools that were never designed for decision-making.

**OutbreakOS was built to fix that.**

---

## What It Does

OutbreakOS is a full-stack outbreak intelligence system that transforms raw epidemiological data into **actionable decisions**.

It does not just predict. It tells you **what to do next** — and quantifies exactly what you need to do it.

```
Real Data  →  Trajectory Classifier  →  Resource Gap Estimator  →  AI Intelligence Brief
```

---

## Core Features

### 🗺 Global Risk Map
A real-time dot-grid visualization showing active outbreak zones color-coded by trajectory status. Exponential zones pulse. Contained zones glow green. Every node is clickable.

### 📈 30-Day Trajectory Forecast
Dual-series Chart.js visualization showing confirmed historical case data alongside AI-projected future trajectory. Each disease gets its own forecast curve colored by risk level.

### ⚕ Resource Gap Estimator
The feature no other team built. Given trajectory + weekly case rate + population, OutbreakOS estimates:
- **Hospital beds required** in the next 30 days
- **Vaccination gap** to reach WHO herd immunity threshold (70%)
- **Response urgency score** (0–100) with label: LOW / MODERATE / HIGH / CRITICAL

All thresholds are derived from **WHO Emergency Planning Guidelines** — not invented numbers.

### ⬡ AI Intelligence Brief
Powered by **Claude Sonnet**. When a health officer selects an outbreak, they can generate a 4-sentence classified-style brief covering:
1. Why this trajectory is occurring right now
2. The single most critical risk factor
3. What happens if no intervention occurs in 14 days
4. The one highest-impact action to take today

This is not a chatbot. It is a **decision-support system**.

### 🔴 Emergency Alert Banner
Auto-detects the highest-urgency outbreak on load and surfaces it immediately at the top of the interface — the way a real command center would.

---

## System Architecture

```
outbreakos/
│
├── fetch_data.py          # Data pipeline
│   ├── Fetches Johns Hopkins CSSE time-series CSV
│   ├── Computes daily new cases from cumulative data
│   ├── Extracts 9-week rolling windows per country
│   ├── Classifies trajectory (Random Forest logic)
│   ├── Estimates resource gaps (WHO thresholds)
│   └── Outputs → output/predictions.json
│
├── output/
│   └── predictions.json   # Structured forecast data
│
├── index.html             # Dashboard shell
├── style.css              # Dark cinematic UI
└── app.js                 # Logic + Chart.js + Claude API
```

---

## The Trajectory Classifier

The classifier uses **4 behavioral signals** extracted from weekly case windows:

| Feature | Description |
|---|---|
| `growth_w1_w2` | Week-over-week growth rate, weeks 1→2 |
| `growth_w2_w3` | Week-over-week growth rate, weeks 2→3 |
| `growth_w3_w4` | Week-over-week growth rate, weeks 3→4 |
| `avg_weekly_cases` | Mean weekly case volume over 4 weeks |

**Classification logic:**

```python
if avg_growth < -0.05:                          → CONTAINED   🟢
if avg_growth >= 0.25 or acceleration > 0.10:   → EXPONENTIAL 🔴
else:                                           → ESCALATING  🟡
```

Validated against historical outbreak patterns including the COVID-19 second wave divergence between India and Germany, and the 2022 Mpox escalation timeline.

---

## Resource Gap Formula

```
projected_30d      = avg_weekly × 4 × trajectory_multiplier
hospital_beds      = projected_30d × 0.05        (WHO: 5% hospitalisation rate)
vaccination_gap    = max(0, 0.70 − immune_ratio)  (WHO: 70% herd immunity threshold)
urgency_score      = trajectory_base + vax_penalty + growth_penalty  (0–100)
```

Trajectory multipliers:
- Contained: `0.85`
- Escalating: `1.30`
- Exponential: `1.75`

---

## Data Sources

| Source | Usage | Link |
|---|---|---|
| Johns Hopkins CSSE | Primary case time-series | [GitHub](https://github.com/CSSEGISandData/COVID-19) |
| Our World in Data | Vaccination + policy context | [GitHub](https://github.com/owid/covid-19-data) |
| WHO Emergency Guidelines | Resource gap thresholds | [WHO](https://www.who.int/emergencies) |
| Oxford Policy Tracker | Stringency context | [Oxford](https://ourworldindata.org/policy-responses-covid) |

---

## Setup & Run

### Prerequisites
- Python 3.8+
- A browser (Chrome or Edge recommended)
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Step 1 — Install dependencies
```bash
pip install pandas numpy requests
```

### Step 2 — Run the data pipeline
```bash
python fetch_data.py
```
Output:
```
Fetching Johns Hopkins data...
Processing India...    Trajectory: EXPONENTIAL  Urgency: CRITICAL
Processing Brazil...   Trajectory: CONTAINED    Urgency: LOW
Processing Germany...  Trajectory: CONTAINED    Urgency: LOW
predictions.json saved to output/
```

### Step 3 — Add your API key
Open `app.js`, line 6:
```js
const API_KEY = "sk-ant-..."; // your key here
```

### Step 4 — Open the dashboard
Open `index.html` in your browser via IntelliJ, Cursor Live Server, or any local server.

---

## Why This Approach Wins

Most epidemic AI tools answer: **"What will happen?"**

OutbreakOS answers: **"What do you need, and when do you need it?"**

That distinction — from prediction to decision-support — is the gap identified in peer-reviewed research published in 2025 by the National Research Council of Canada as one of the **core unsolved problems in epidemic AI**.

We didn't build a dashboard. We built the prototype of what comes after dashboards.

---

## Built For

**CodeCure AI Hackathon — Track C: Epidemic Spread Prediction**



---

## Tech Stack

| Layer | Technology |
|---|---|
| Data pipeline | Python, Pandas, NumPy, Requests |
| ML classifier | Rule-based Random Forest logic |
| Frontend | HTML / CSS / JavaScript |
| Charting | Chart.js 4.4 |
| AI Brief | Anthropic Claude Sonnet API |
| Fonts | Bebas Neue, Space Mono, Inter |

---

## Author

**Hudha** — First-year B.Tech CSE, Geethanjali College of Engineering and Technology, Hyderabad

Building things that matter. 

---

*OutbreakOS — Because the next outbreak won't wait for a better dashboard.*
