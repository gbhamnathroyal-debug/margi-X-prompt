# 🚦 SafeRoute AI

### AI-Powered Urban Safety Routing Prototype

## 📌 Overview

Urban commuters often face unsafe routes, unpredictable delays, and poor decision-making due to lack of real-time insights.

**SafeRoute AI** is a lightweight, AI-powered web prototype that helps users choose the **safest route** instead of just the fastest one.

This project focuses on **decision intelligence**, not just maps.

---

## 🎯 Problem Statement

Commuters lack:

* Real-time safety insights
* Awareness of high-risk areas
* Tools to balance safety vs efficiency

---

## 💡 Solution

SafeRoute AI analyzes multiple factors like:

* Crime intensity
* Street lighting
* Traffic congestion

It then computes a **safety score** and recommends the best route within seconds.

---

## ⚙️ How It Works

### 1. Input

* Start location
* Destination

### 2. Data (Simulated)

Each area/node contains:

* Crime score (0–10)
* Lighting score (0–10)
* Traffic density (0–10)

### 3. AI Scoring Logic

Routes are evaluated using a weighted formula:

```
Safety Score = (0.5 × Lighting) - (0.3 × Crime) - (0.2 × Traffic)
```

### 4. Output

* Best route (highlighted)
* Alternative routes
* Safety score
* Visual risk indicators (Safe / Moderate / Risky)

---

## 🧠 Key Features

* ⚡ Real-time simulation of urban conditions
* 🧮 AI-based weighted scoring system
* 🎨 Visual route safety indicators
* 🔁 Dynamic updates (simulated live data)
* 🌐 Fully browser-based (no backend required initially)

---

## 🛠️ Tech Stack

* HTML
* CSS
* JavaScript
* Express.js (for deployment-ready backend)
* Google Cloud Run (deployment)

---

## 🚀 Getting Started

### Run Locally

1. Clone the repository

```
git clone https://github.com/your-username/saferoute-ai.git
cd saferoute-ai
```

2. Install dependencies

```
npm install
```

3. Start server

```
npm start
```

4. Open browser:

```
http://localhost:8080
```

---

## ☁️ Deployment (Google Cloud Run)

```
gcloud run deploy margi-ai \
--source . \
--region us-central1 \
--allow-unauthenticated
```

---

## 🔮 Future Improvements

* 📍 Real map integration (Google Maps / Leaflet)
* 🧭 Graph-based routing (Dijkstra Algorithm)
* 🌐 Real-time APIs (traffic, crime, weather)
* 🤖 Route explanation engine ("Why this route?")
* ⚖️ Mode toggle (Fastest vs Safest vs Balanced)

---

## 📸 Demo Preview

(Add screenshots here)

---

## 📢 Why This Project Matters

Most navigation systems optimize for **speed**.
SafeRoute AI introduces **safety-first decision making**, which is critical for:

* Night commuters
* Students
* Urban pedestrians
* Women’s safety

---

## 🤝 Contributing

This is a prototype, but contributions are welcome to:

* Improve algorithms
* Add real datasets
* Enhance UI/UX

---

## 📜 License

This project is open-source and available under the MIT License.

---

## 👨‍💻 Author

Developed by *[Your Name]*
First step towards building intelligent urban mobility solutions 🚀
