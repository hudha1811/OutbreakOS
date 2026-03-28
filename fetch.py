"""
OutbreakOS — Data Pipeline
Pulls real Johns Hopkins COVID-19 data, classifies trajectory,
estimates resource gaps, outputs predictions.json

Install dependencies first:
    pip install pandas numpy requests

Then run:
    python fetch_data.py
"""

import pandas as pd
import numpy as np
import requests
import json
import os
from datetime import datetime

# ══════════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════════

COUNTRIES = {
    "India":     {"population": 1_400_000_000, "region": "South Asia",    "disease": "COVID-19"},
    "Brazil":    {"population":   215_000_000, "region": "Latin America", "disease": "COVID-19"},
    "Germany":   {"population":    84_000_000, "region": "Europe",        "disease": "COVID-19"},
}

HOSPITALISATION_RATE    = 0.05   # WHO: ~5% of cases need hospital beds
HERD_IMMUNITY_THRESHOLD = 0.70   # WHO: 70% for herd immunity

JHU_URL = (
    "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/"
    "csse_covid_19_data/csse_covid_19_time_series/"
    "time_series_covid19_confirmed_global.csv"
)

# ══════════════════════════════════════════════════════════════
# FETCH
# ══════════════════════════════════════════════════════════════

def fetch_data():
    print("Fetching Johns Hopkins data...")
    df = pd.read_csv(JHU_URL)
    print(f"Loaded: {df.shape[0]} regions, {df.shape[1] - 4} days")
    return df

# ══════════════════════════════════════════════════════════════
# PROCESS
# ══════════════════════════════════════════════════════════════

def process_country(df, country):
    subset = df[df["Country/Region"] == country]
    subset = subset.drop(columns=["Province/State", "Lat", "Long"])
    series = subset.groupby("Country/Region").sum().iloc[0]
    daily  = series.diff().fillna(0).clip(lower=0)
    last63 = daily.values[-63:]
    weeks  = [int(last63[i*7:(i+1)*7].sum()) for i in range(9)]
    return {"total_cumulative": int(series.values[-1]), "weekly_cases": weeks}

# ══════════════════════════════════════════════════════════════
# CLASSIFIER
# ══════════════════════════════════════════════════════════════

def classify_trajectory(weekly):
    w = weekly[-4:]
    def g(a, b): return (b - a) / (a + 1)
    g1 = g(w[0], w[1])
    g2 = g(w[1], w[2])
    g3 = g(w[2], w[3])
    avg  = np.mean([g1, g2, g3])
    accel = g3 - g1
    if avg < -0.05:                                      return "contained"
    if avg >= 0.25 or (avg >= 0.15 and accel > 0.10):   return "exponential"
    return "escalating"

# ══════════════════════════════════════════════════════════════
# RESOURCE GAP ESTIMATOR
# ══════════════════════════════════════════════════════════════

def estimate_resources(weekly, trajectory, population, total_cumulative):
    avg_weekly = float(np.mean(weekly[-4:]))
    multiplier = {"contained": 0.85, "escalating": 1.30, "exponential": 1.75}[trajectory]
    projected  = int(avg_weekly * 4 * multiplier)
    beds       = int(projected * HOSPITALISATION_RATE)
    immune     = min(total_cumulative / population, 1.0)
    vax_gap    = round(max(0, HERD_IMMUNITY_THRESHOLD - immune) * 100, 1)

    urgency = {"contained": 10, "escalating": 35, "exponential": 60}[trajectory]
    if vax_gap > 60: urgency += 25
    elif vax_gap > 30: urgency += 15
    else: urgency += 5
    growth = (weekly[-1] - weekly[-2]) / (weekly[-2] + 1)
    if growth > 0.3: urgency += 15
    elif growth > 0.1: urgency += 8
    urgency = min(urgency, 100)

    label = "CRITICAL" if urgency >= 80 else "HIGH" if urgency >= 60 else "MODERATE" if urgency >= 40 else "LOW"
    return {
        "avg_weekly_cases":     round(avg_weekly),
        "projected_cases_30d":  projected,
        "hospital_beds_needed": beds,
        "vaccination_gap_pct":  vax_gap,
        "urgency_score":        urgency,
        "urgency_label":        label
    }

# ══════════════════════════════════════════════════════════════
# CHART DATA
# ══════════════════════════════════════════════════════════════

def build_chart(weekly, trajectory):
    history = [int(w) for w in weekly[-9:]]
    mults   = {
        "contained":   [0.93, 0.88, 0.84, 0.81, 0.79, 0.77, 0.76, 0.75],
        "escalating":  [1.15, 1.32, 1.50, 1.70, 1.92, 2.15, 2.40, 2.68],
        "exponential": [1.35, 1.82, 2.46, 3.32, 4.48, 6.05, 8.17, 11.0]
    }
    base     = history[-1]
    forecast = [int(base * m) for m in mults[trajectory]]
    return history, forecast

# ══════════════════════════════════════════════════════════════
# RECOMMENDATIONS
# ══════════════════════════════════════════════════════════════

RECS = {
    "exponential": "IMMEDIATE ACTION REQUIRED. Activate emergency response protocols. Deploy surge hospital capacity and pre-position critical medical supplies. Initiate accelerated vaccination in highest-risk districts. Issue public health advisory within 24 hours.",
    "escalating":  "Increase surveillance frequency and expand testing capacity. Accelerate vaccination in under-covered regions. Pre-position medical supplies at district level. Monitor weekly — escalation to CRITICAL possible within 2 weeks.",
    "contained":   "Current interventions are working. Maintain coverage levels and do not prematurely withdraw measures. Continue vaccination to consolidate immunity gains. Schedule formal de-escalation review in 3 weeks if trend holds."
}

# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════

def main():
    print("\n" + "="*50)
    print("  OutbreakOS — Data Pipeline")
    print("="*50 + "\n")

    df      = fetch_data()
    results = []

    for country, meta in COUNTRIES.items():
        print(f"\nProcessing {country}...")
        data       = process_country(df, country)
        trajectory = classify_trajectory(data["weekly_cases"])
        resources  = estimate_resources(
            data["weekly_cases"], trajectory,
            meta["population"], data["total_cumulative"]
        )
        history, forecast = build_chart(data["weekly_cases"], trajectory)

        print(f"  Trajectory : {trajectory.upper()}")
        print(f"  Avg weekly : {resources['avg_weekly_cases']:,}")
        print(f"  Projected  : {resources['projected_cases_30d']:,}")
        print(f"  Beds needed: {resources['hospital_beds_needed']:,}")
        print(f"  Vax gap    : {resources['vaccination_gap_pct']}%")
        print(f"  Urgency    : {resources['urgency_label']}")

        results.append({
            "id":               country.lower(),
            "name":             country,
            "disease":          meta["disease"],
            "region":           meta["region"],
            "trajectory":       trajectory,
            **resources,
            "recommendation":   RECS[trajectory],
            "history":          history,
            "forecast":         forecast,
            "last_updated":     datetime.today().strftime("%Y-%m-%d")
        })

    os.makedirs("output", exist_ok=True)
    with open("output/predictions.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n{'='*50}")
    print(f"predictions.json saved to output/")
    print(f"{len(results)} countries processed")
    print("Now open index.html in your browser")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
