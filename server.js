const express = require('express');
const app = express();
const path = require('path');

// Google Cloud Run intrinsically injects process.env.PORT, default to 8080.
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Serve all frontend HTML/CSS/JS files statically
app.use(express.static(__dirname));

// The Unified Mock Server Backend route
app.post('/api/route-context', (req, res) => {
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
