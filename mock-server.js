const http = require('http');

const PORT = 4010;

const server = http.createServer((req, res) => {
  // Handle CORS for local frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/route-context') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      // Return the mock JSON data matching the OpenAPI YAML spec
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        base_crime_level: 5.5,
        base_traffic_level: 4.0,
        base_lighting_level: 6.0,
        weather_hazard: false
      }));
      console.log(`[POST] /api/route-context - Responded with Mock Context Data`);
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Endpoint Not Found" }));
});

server.listen(PORT, () => {
  console.log(`Custom Mock API Server successfully running at http://127.0.0.1:${PORT}`);
});
