let map;
let defaultMapCenter = { lat: 20, lng: 0 }; // World view
let polylines = [];

// Application State
let timeOfDay = 'day';     // 'day' | 'night'
let optMode = 'safest';    // 'safest' | 'fastest'

// Weights
const weights = {
  safest: { crime: 2.0, timeMultiplierNight: 1.5, lighting: 1.5, traffic: 0.5 },
  fastest: { crime: 0.5, timeMultiplierNight: 1.0, lighting: 0.2, traffic: 2.0 }
};

// Map Layers
const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap | CARTO', subdomains: 'abcd', maxZoom: 20
});
const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap | CARTO', subdomains: 'abcd', maxZoom: 20
});
const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap | &copy; OpenTopoMap', maxZoom: 17
});

function initMap() {
  // Zoom control True for global navigation
  map = L.map('map', { zoomControl: true }).setView([defaultMapCenter.lat, defaultMapCenter.lng], 3);
  darkLayer.addTo(map);

  const baseMaps = {
    "Dark Mode": darkLayer,
    "Light Mode": lightLayer,
    "Topographic": topoLayer
  };
  
  // Position controls nicely
  L.control.layers(baseMaps, {}, { position: 'topright' }).addTo(map);
  map.zoomControl.setPosition('bottomright');
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();

  const calcBtn = document.getElementById('calc-btn');
  const timeToggle = document.getElementById('time-toggle');
  const modeToggle = document.getElementById('mode-toggle');

  // Toggles
  timeToggle.addEventListener('click', () => {
    if (timeOfDay === 'day') {
      timeOfDay = 'night';
      timeToggle.innerText = '🌙 Night';
    } else {
      timeOfDay = 'day';
      timeToggle.innerText = '🌞 Day';
    }
  });

  modeToggle.addEventListener('click', () => {
    if (optMode === 'safest') {
      optMode = 'fastest';
      modeToggle.innerText = '⚡ Fastest';
    } else {
      optMode = 'safest';
      modeToggle.innerText = '🛡️ Safest';
    }
  });

  // Calculate
  calcBtn.addEventListener('click', calculateRoutes);

  // BorderGlow Mouse Tracking Setup
  const dashboardElement = document.querySelector('.dashboard');
  if (dashboardElement) {
    dashboardElement.addEventListener('mousemove', (e) => {
      const rect = dashboardElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      dashboardElement.style.setProperty('--mouse-x', `${x}px`);
      dashboardElement.style.setProperty('--mouse-y', `${y}px`);
    });
  }
});

// GEOLOCATION API (Nominatim)
async function geocode(address) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: address };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// ROUTING API (OSRM)
async function getRoutesFromOSRM(src, dest) {
  try {
    // requesting alternatives = true
    const url = `https://router.project-osrm.org/route/v1/driving/${src.lng},${src.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&alternatives=true`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return [];

    const routesPromises = data.routes.map(async (r, i) => {
      // GeoJSON paths are [lng, lat], we need {lat, lng}
      const pathPoints = r.geometry.coordinates.map(coord => ({ lat: coord[1], lng: coord[0] }));
      const distanceKm = (r.distance / 1000).toFixed(2);
      const durationMins = Math.round(r.duration / 60);
      const routeId = "route_" + i;
      
      // FETCH DATA FROM UNIFIED SERVER API
      let backendData = { base_crime_level: 5, base_traffic_level: 5, base_lighting_level: 5, weather_hazard: false };
      try {
        const mockRes = await fetch('/api/route-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ route_id: routeId, distance_km: parseFloat(distanceKm) })
        });
        if (mockRes.ok) {
           backendData = await mockRes.json();
        }
      } catch (e) {
        console.warn("Backend server not reachable, using failover defaults.");
      }

      // Add a small route-specific fluctuation so the mocked routes aren't totally identical in the UI
      const fluctuation = (Math.random() * 2) - 1; // -1.0 to +1.0
      
      let warnings = i > 0 && Math.random() > 0.5 ? ["Alternative path hazard offset"] : [];
      if (backendData.weather_hazard) warnings.push("Hazardous Weather Detected from API");

      return {
        id: routeId,
        from: src.name,
        to: dest.name,
        name: i === 0 ? "Fastest Route" : `Alternative Route ${i}`,
        pathPoints: pathPoints,
        crime_level: Math.max(1, Math.min(10, backendData.base_crime_level + fluctuation + (i*0.5))),
        lighting: Math.max(1, Math.min(10, backendData.base_lighting_level - fluctuation)),
        traffic: Math.max(1, Math.min(10, backendData.base_traffic_level + fluctuation)),
        distance: distanceKm,               // Keep as formatted string
        duration: durationMins,
        warnings: warnings
      };
    });
    
    return Promise.all(routesPromises);
  } catch (error) {
    console.error("OSRM/Backend Routing error:", error);
    return [];
  }
}

async function calculateRoutes() {
  const sourceInput = document.getElementById('source').value;
  const destInput = document.getElementById('destination').value;
  
  if (!sourceInput || !destInput) {
    alert("Please enter both Source and Destination.");
    return;
  }

  // Show loading
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
  document.getElementById('calc-btn').disabled = true;

  try {
    // 1. Geocode
    const srcCoords = await geocode(sourceInput);
    const destCoords = await geocode(destInput);

    if (!srcCoords || !destCoords) {
      alert("Could not find one of the locations. Try being more specific (e.g. 'Eiffel Tower, Paris, France').");
      return;
    }

    // 2. Fetch Routes
    let availableRoutes = await getRoutesFromOSRM(srcCoords, destCoords);

    if (availableRoutes.length === 0) {
      alert("No driving route found between these locations (e.g., they might be separated by an ocean).");
      return;
    }

    // 3. Apply Scoring Algoritm
    const scoredRoutes = availableRoutes.map(route => {
      let effectiveCrime = route.crime_level;
      let effectiveLighting = route.lighting;

      if (timeOfDay === 'night') {
        effectiveCrime *= weights[optMode].timeMultiplierNight;
        effectiveLighting *= 0.5; 
      }

      const { crime: wCrime, lighting: wLight, traffic: wTraff } = weights[optMode];

      // Formula
      let score = 100 
        + (effectiveLighting * 5 * wLight) 
        - (effectiveCrime * 5 * wCrime) 
        - (route.traffic * 5 * wTraff);
      
      // Override if user prioritizes speed
      if (optMode === 'fastest') {
          score = 100 - (route.traffic * 8);
      }
      
      score = Math.max(0, Math.min(100, Math.round(score)));

      let category = "Risky";
      let cssClass = "badge-risky";
      let color = "#ef4444";
      
      if (score >= 70) {
        category = "Safe";
        cssClass = "badge-safe";
        color = "#22c55e";
      } else if (score >= 40) {
        category = "Moderate";
        cssClass = "badge-moderate";
        color = "#eab308";
      }

      return { ...route, score, category, cssClass, color };
    });

    // Rank routes by highest score
    scoredRoutes.sort((a, b) => b.score - a.score);

    renderResults(scoredRoutes);
    drawRoutesOnMap(scoredRoutes);
    triggerAlerts(scoredRoutes[0]);
  } catch (err) {
    console.error(err);
    alert("An error occurred during calculation. Check the console.");
  } finally {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('calc-btn').disabled = false;
  }
}

// ==== UI RENDERING FUNCTIONS ====

function renderResults(routes) {
  const routesList = document.getElementById('routes-list');
  const resultsDiv = document.getElementById('results');
  
  routesList.innerHTML = '';
  
  routes.forEach((route, index) => {
    const isSelected = index === 0;
    const card = document.createElement('div');
    card.className = `route-card ${isSelected ? 'selected' : ''}`;
    
    let warningsHtml = '';
    
    // Add real-time dynamic warnings based on score/time
    let dynamicWarnings = [...route.warnings];
    if (route.crime_level > 7) dynamicWarnings.push("Simulated High crime");
    if (timeOfDay === 'night' && route.lighting < 5) dynamicWarnings.push("Poorly lit sections");
    
    // Deduplicate array
    dynamicWarnings = [...new Set(dynamicWarnings)];

    if (dynamicWarnings.length > 0) {
      warningsHtml = `<div class="route-warnings">⚠️ ${dynamicWarnings.join(' • ')}</div>`;
    }

    card.innerHTML = `
      <div class="route-header">
        <span class="route-title">${route.name}</span>
        <span class="route-badge ${route.cssClass}">${route.category}</span>
      </div>
      <div class="route-score">
        <span>Score: <strong>${route.score}</strong>/100</span>
        <span>${route.distance} km (${route.duration} mins)</span>
      </div>
      ${warningsHtml}
    `;

    card.addEventListener('click', () => {
      // Manage visual selection states
      document.querySelectorAll('.route-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      // Update Layer Z-indexing on map
      highlightRouteOnMap(route.id);
    });

    routesList.appendChild(card);
  });

  resultsDiv.classList.remove('hidden');
}

function drawRoutesOnMap(routes) {
  if (!map) return;

  // Clear existing
  polylines.forEach(p => map.removeLayer(p));
  polylines = [];

  const bounds = L.latLngBounds();

  // Draw in reverse order so the highest scored route is drawn last (on top)
  [...routes].reverse().forEach((route) => {
    const isBest = route.id === routes[0].id;
    const latlngs = route.pathPoints.map(p => [p.lat, p.lng]);
    
    const polyline = L.polyline(latlngs, {
      color: route.color,
      weight: isBest ? 6 : 4,
      opacity: isBest ? 0.9 : 0.4,
    }).addTo(map);
    
    // Store route ID for later interaction
    polyline.routeId = route.id;
    polylines.push(polyline);

    latlngs.forEach(ll => bounds.extend(ll));
  });

  if (routes.length > 0) {
    // Zoom boundary so the entire route is neatly in frame
    map.fitBounds(bounds, { padding: [50, 50] });
    highlightRouteOnMap(routes[0].id); 
  }
}

function highlightRouteOnMap(routeId) {
  polylines.forEach(p => {
    if (p.routeId === routeId) {
      p.setStyle({ opacity: 0.9, weight: 6 });
      p.bringToFront();
    } else {
      p.setStyle({ opacity: 0.4, weight: 4 });
    }
  });
}

function triggerAlerts(bestRoute) {
  if (!bestRoute || bestRoute.score > 80) return; // very safe

  const container = document.getElementById('alert-container');
  
  if (timeOfDay === 'night' && bestRoute.score < 60) {
    const alert = document.createElement('div');
    alert.className = 'alert';
    alert.innerText = "Heads up: Your safest route still has moderate risks due to night conditions. Stay alert.";
    container.appendChild(alert);

    setTimeout(() => {
      alert.remove();
    }, 6000);
  }
}
