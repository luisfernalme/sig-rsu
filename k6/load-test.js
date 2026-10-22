import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const EMAIL = __ENV.EMAIL || 'admin@example.com';
const PASSWORD = __ENV.PASSWORD || 'admin123';
// Opcional: tamanho de página das listagens (ex.: PAGE_SIZE=10000)
const LIST_QUERY = __ENV.PAGE_SIZE ? `?page_size=${__ENV.PAGE_SIZE}` : '';

const loginFailureRate = new Rate('auth_login_failures');
const loginTrend = new Trend('auth_login_duration_ms', true);

export const options = {
  scenarios: {
    smoke: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      exec: 'loginFlow',
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      exec: 'apiFlow',
      startTime: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    // Orçamento de latência sob concorrência (até 50 VUs). NÃO é o RNF-01:
    // o limite de 300 ms do RNF-01 vale para requisições sem concorrência e é
    // verificado em k6/sequential-test.js e em backend/tests/test_rnf01_performance.py.
    http_req_duration: ['p(95)<4000'],
    auth_login_failures: ['rate<0.05'],
    checks: ['rate>0.95'],
  },
};

function login(email, password) {
  const payload = JSON.stringify({ email, password });
  const res = http.post(`${BASE_URL}/api/auth/login/`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'auth_login' },
  });
  loginTrend.add(res.timings.duration);
  loginFailureRate.add(res.status !== 200);

  if (res.status !== 200) {
    return null;
  }
  return res.json().tokens.access;
}

function authedGet(token, url, tag) {
  return http.get(`${BASE_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: tag },
  });
}

export function loginFlow() {
  const token = login(EMAIL, PASSWORD);
  check(token, { 'login retornou token': (t) => t !== null });
  sleep(1);
}

export function apiFlow() {
  const token = login(EMAIL, PASSWORD);
  if (!token) {
    return;
  }

  const checks = {
    'profile 200': authedGet(token, '/api/auth/profile/', 'profile'),
    'collection-points 200': authedGet(token, `/api/collection-points/${LIST_QUERY}`, 'collection-points'),
    'waste-types 200': authedGet(token, '/api/waste-types/', 'waste-types'),
    'collections 200': authedGet(token, `/api/collections/${LIST_QUERY}`, 'collections'),
    'routes 200': authedGet(token, `/api/routes/${LIST_QUERY}`, 'routes'),
    'vehicles 200': authedGet(token, `/api/vehicles/${LIST_QUERY}`, 'vehicles'),
    'drivers 200': authedGet(token, `/api/drivers/${LIST_QUERY}`, 'drivers'),
    'quick-stats 200': authedGet(token, '/api/quick-stats/', 'quick-stats'),
    'collection-points-map 200': authedGet(token, '/api/collection-points-map/', 'collection-points-map'),
  };

  for (const [name, res] of Object.entries(checks)) {
    check(res, {
      [name]: (r) => r.status === 200,
    });
  }

  sleep(1);
}
