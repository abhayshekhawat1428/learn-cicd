const http = require('http');

let livenessOk = true;
let readinessOk = true;
let requestCount = 0;

const config = {
  APP_NAME: process.env.APP_NAME || 'dd-api',
  VERSION: process.env.APP_VERSION || 'v1',
  LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
  DB_HOST: process.env.DB_HOST || 'not-set',
  PLATFORM: 'EKS',
  POD_NAME: process.env.POD_NAME || 'local',
  POD_IP: process.env.POD_IP || '127.0.0.1',
};

const HOMEPAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>coldstart.space | API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .hero {
      text-align: center;
      padding: 80px 20px 40px;
      max-width: 700px;
    }
    .hero h1 {
      font-size: 3rem;
      font-weight: 700;
      background: linear-gradient(135deg, #00d4ff, #7b2ff7, #ff6b6b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 12px;
    }
    .hero .tagline {
      font-size: 1.15rem;
      color: #888;
      margin-bottom: 8px;
    }
    .hero .sub {
      font-size: 0.9rem;
      color: #555;
      margin-bottom: 40px;
    }
    .status-bar {
      display: flex;
      gap: 24px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 50px;
    }
    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #aaa;
    }
    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e88;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .endpoints {
      width: 100%;
      max-width: 640px;
      padding: 0 20px;
    }
    .endpoints h2 {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #555;
      margin-bottom: 16px;
    }
    .endpoint {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      margin-bottom: 8px;
      background: #141414;
      border: 1px solid #222;
      border-radius: 10px;
      transition: all 0.2s;
      text-decoration: none;
      color: inherit;
    }
    .endpoint:hover {
      border-color: #444;
      background: #1a1a1a;
      transform: translateX(4px);
    }
    .endpoint .method {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      background: #1a3a2a;
      color: #22c55e;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .endpoint .path {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.9rem;
      color: #ccc;
      flex-grow: 1;
    }
    .endpoint .desc {
      font-size: 0.75rem;
      color: #666;
      margin-left: 12px;
      flex-shrink: 0;
    }
    .endpoint .arrow {
      color: #444;
      margin-left: 8px;
    }
    .infra {
      max-width: 640px;
      width: 100%;
      padding: 50px 20px 20px;
    }
    .infra h2 {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #555;
      margin-bottom: 16px;
    }
    .infra-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .infra-item {
      padding: 12px 16px;
      background: #141414;
      border: 1px solid #1a1a1a;
      border-radius: 8px;
    }
    .infra-item .label {
      font-size: 0.7rem;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .infra-item .value {
      font-size: 0.85rem;
      color: #aaa;
      font-family: 'SF Mono', monospace;
      margin-top: 4px;
    }
    footer {
      padding: 40px 20px;
      text-align: center;
      font-size: 0.75rem;
      color: #333;
    }
    footer a { color: #555; text-decoration: none; }
    footer a:hover { color: #888; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>coldstart.space</h1>
    <p class="tagline">A live API running on Kubernetes, deployed via CI/CD</p>
    <p class="sub">Built from scratch to understand how code goes from git push to production</p>
  </div>

  <div class="status-bar">
    <div class="status-item"><div class="dot"></div> Pods healthy</div>
    <div class="status-item"><div class="dot"></div> EKS cluster active</div>
    <div class="status-item"><div class="dot"></div> CI/CD pipeline green</div>
  </div>

  <div class="endpoints">
    <h2>API Endpoints</h2>
    <a class="endpoint" href="/dd/api/v1/config">
      <span class="method">GET</span>
      <span class="path">/dd/api/v1/config</span>
      <span class="desc">App configuration</span>
      <span class="arrow">&rarr;</span>
    </a>
    <a class="endpoint" href="/dd/api/v1/syndicators">
      <span class="method">GET</span>
      <span class="path">/dd/api/v1/syndicators</span>
      <span class="desc">Sample data</span>
      <span class="arrow">&rarr;</span>
    </a>
    <a class="endpoint" href="/dd/api/v1/version">
      <span class="method">GET</span>
      <span class="path">/dd/api/v1/version</span>
      <span class="desc">Version &amp; runtime</span>
      <span class="arrow">&rarr;</span>
    </a>
    <a class="endpoint" href="/dd/api/v1/status">
      <span class="method">GET</span>
      <span class="path">/dd/api/v1/status</span>
      <span class="desc">Health &amp; uptime</span>
      <span class="arrow">&rarr;</span>
    </a>
    <a class="endpoint" href="/dd/api/v1/metrics">
      <span class="method">GET</span>
      <span class="path">/dd/api/v1/metrics</span>
      <span class="desc">Request metrics</span>
      <span class="arrow">&rarr;</span>
    </a>
    <a class="endpoint" href="/dd/api/v1/health/liveness">
      <span class="method">GET</span>
      <span class="path">/dd/api/v1/health/liveness</span>
      <span class="desc">Liveness probe</span>
      <span class="arrow">&rarr;</span>
    </a>
  </div>

  <div class="infra">
    <h2>Infrastructure</h2>
    <div class="infra-grid">
      <div class="infra-item">
        <div class="label">Platform</div>
        <div class="value">AWS EKS (K8s 1.32)</div>
      </div>
      <div class="infra-item">
        <div class="label">Region</div>
        <div class="value">ap-south-1 (Mumbai)</div>
      </div>
      <div class="infra-item">
        <div class="label">Runtime</div>
        <div class="value">Node.js 18 Alpine</div>
      </div>
      <div class="infra-item">
        <div class="label">Deploy</div>
        <div class="value">Helm + GitHub Actions</div>
      </div>
      <div class="infra-item">
        <div class="label">Registry</div>
        <div class="value">ghcr.io (GHCR)</div>
      </div>
      <div class="infra-item">
        <div class="label">DNS + TLS</div>
        <div class="value">Cloudflare</div>
      </div>
    </div>
  </div>

  <footer>
    Built by Abhay Shekhawat &middot;
    <a href="https://github.com/abhayshekhawat1428/learn-cicd">Source on GitHub</a>
  </footer>
</body>
</html>`;

const server = http.createServer((req, res) => {
  requestCount++;

  // Serve homepage
  if (req.url === '/' || req.url === '/index.html') {
    res.setHeader('Content-Type', 'text/html');
    res.end(HOMEPAGE);
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/dd/api/v1/health/liveness') {
    res.statusCode = livenessOk ? 200 : 503;
    res.end(JSON.stringify({ status: livenessOk ? 'UP' : 'DOWN', probe: 'liveness' }));
  } else if (req.url === '/dd/api/v1/health/readiness') {
    res.statusCode = readinessOk ? 200 : 503;
    res.end(JSON.stringify({ status: readinessOk ? 'UP' : 'DOWN', probe: 'readiness' }));
  } else if (req.url === '/dd/api/v1/config') {
    res.end(JSON.stringify(config));
  } else if (req.url === '/dd/api/v1/syndicators') {
    res.end(JSON.stringify({
      data: [
        { id: 1, name: 'ABC Network' },
        { id: 2, name: 'CBS Radio' },
      ],
    }));
  } else if (req.url === '/dd/api/v1/version') {
    res.end(JSON.stringify({
      app: config.APP_NAME,
      version: config.VERSION,
      node: process.version,
      uptime: Math.floor(process.uptime()),
    }));
  } else if (req.url === '/dd/api/v1/status') {
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: Math.floor(process.uptime()),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      timestamp: new Date().toISOString(),
    }));
  } else if (req.url === '/dd/api/v1/metrics') {
    res.end(JSON.stringify({
      requests_total: requestCount,
      uptime_seconds: Math.floor(process.uptime()),
      memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      cpu_user_ms: Math.round(process.cpuUsage().user / 1000),
    }));
  } else if (req.url === '/dd/api/v1/break-liveness') {
    livenessOk = false;
    res.end(JSON.stringify({ message: 'Liveness broken!' }));
  } else if (req.url === '/dd/api/v1/break-readiness') {
    readinessOk = false;
    res.end(JSON.stringify({ message: 'Readiness broken!' }));
  } else if (req.url.startsWith('/dd')) {
    res.end(JSON.stringify({ path: req.url, message: 'dd-api on EKS' }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found', hint: 'Try visiting / for the homepage' }));
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`dd-api-sim listening on :${PORT}`));

module.exports = { server, config };
