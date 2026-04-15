const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Google Cloud Run intrinsically injects process.env.PORT, default to 8080.
const PORT = process.env.PORT || 8080;

// Security 1: Helmet with strict Content-Security-Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Allow Leaflet JS and inline scripts
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      // Allow Google Fonts and Leaflet CSS
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
      // Allow Google Fonts injection
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      // Allow OpenStreetMap, CARTO UI tiles, OpenTopoMap tiles, and Leaflet markers
      imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://unpkg.com", "https://*.basemaps.cartocdn.com", "https://*.tile.opentopomap.org"],
      // Allow OSRM Routing & Nominatim Geocoding API connections
      connectSrc: ["'self'", "https://nominatim.openstreetmap.org", "https://router.project-osrm.org"],
    },
  },
}));

// Security 2: Rate Limiting to prevent DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Min Window
  max: 100,                 // 100 max hits per IP
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
// Apply limiter only to the mock API backend endpoint
app.use('/api', limiter);

app.use(express.json());

// Serve all frontend HTML/CSS/JS files statically
app.use(express.static(__dirname));

// The Unified Mock Server Backend route
app.post('/api/route-context', (req, res) => {
    // Security 3: Input Validation and Sanitization
    const { route_id, distance_km } = req.body;
    
    // Drop malicious payloads hitting the API natively 
    if (!route_id || typeof route_id !== 'string' || route_id.length > 50) {
        return res.status(400).json({ error: "Suspicious or missing route_id parameter." });
    }
    if (typeof distance_km !== 'number' || distance_km < 0 || distance_km > 20000) {
        return res.status(400).json({ error: "Suspicious or missing distance_km parameter." });
    }

    // Return precise static mock API data to mimic the OpenAPI Prism server
    res.json({
        base_crime_level: 5.5,
        base_traffic_level: 4.0,
        base_lighting_level: 6.0,
        weather_hazard: false
    });
});

app.listen(PORT, () => {
    console.log(`Unified Margi AI container safely serving on port ${PORT}`);
});
