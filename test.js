const http = require('http');
const { server } = require('./server');

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}`);
  }
}

function request(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8080${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    }).on('error', reject);
  });
}

async function runTests() {
  // Wait a tick for server to start
  await new Promise((r) => setTimeout(r, 100));

  console.log('\nRunning tests...\n');

  // Test 1: Liveness probe
  const health = await request('/dd/api/v1/health/liveness');
  assert('Liveness returns 200', health.status === 200);
  assert('Liveness status is UP', health.body.status === 'UP');

  // Test 2: Readiness probe
  const ready = await request('/dd/api/v1/health/readiness');
  assert('Readiness returns 200', ready.status === 200);
  assert('Readiness status is UP', ready.body.status === 'UP');

  // Test 3: Config endpoint
  const cfg = await request('/dd/api/v1/config');
  assert('Config returns 200', cfg.status === 200);
  assert('Config has APP_NAME', cfg.body.APP_NAME === 'dd-api');
  assert('Config has VERSION', cfg.body.VERSION === 'v1');

  // Test 4: Syndicators endpoint
  const syn = await request('/dd/api/v1/syndicators');
  assert('Syndicators returns 200', syn.status === 200);
  assert('Syndicators has data array', Array.isArray(syn.body.data));
  assert('Syndicators has 2 items', syn.body.data.length === 2);

  // Test 5: Version endpoint
  const ver = await request('/dd/api/v1/version');
  assert('Version returns 200', ver.status === 200);
  assert('Version has app name', ver.body.app === 'dd-api');
  assert('Version has node version', ver.body.node.startsWith('v'));

  // Test 6: Status endpoint
  const status = await request('/dd/api/v1/status');
  assert('Status returns 200', status.status === 200);
  assert('Status has uptime', typeof status.body.uptime === 'number');
  assert('Status has memory', status.body.memory.endsWith('MB'));

  // Test 7: 404 for unknown routes
  const notfound = await request('/unknown');
  assert('Unknown route returns 404', notfound.status === 404);

  // Test 6: dd-api catch-all
  const catchall = await request('/dd/some/other/path');
  assert('dd catch-all returns 200', catchall.status === 200);
  assert('dd catch-all has path', catchall.body.path === '/dd/some/other/path');

  // Report
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
