const http = require('http');

let livenessOk = true;
let readinessOk = true;

const config = {
  APP_NAME: process.env.APP_NAME || 'dd-api',
  VERSION: process.env.APP_VERSION || 'v1',
  LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
  DB_HOST: process.env.DB_HOST || 'not-set',
  PLATFORM: 'EKS',
  POD_NAME: process.env.POD_NAME || 'local',
  POD_IP: process.env.POD_IP || '127.0.0.1',
};

const server = http.createServer((req, res) => {
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
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`dd-api-sim listening on :${PORT}`));

module.exports = { server, config };
