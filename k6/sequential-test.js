import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const EMAIL = __ENV.EMAIL || 'admin@example.com';
const PASSWORD = __ENV.PASSWORD || 'admin123';
const ITERATIONS = __ENV.ITERATIONS || 100;
// Opcional: tamanho de página das listagens (ex.: PAGE_SIZE=10000 para
// reproduzir o cenário de listagem completa usado pelo frontend).
const LIST_QUERY = __ENV.PAGE_SIZE ? `?page_size=${__ENV.PAGE_SIZE}` : '';

// RNF-01: P95 das APIs principais abaixo de 300 ms (sem concorrência)
const RNF01_P95 = ['p(95)<300'];

export const options = {
  scenarios: {
    sequential: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: ITERATIONS,
      maxDuration: '20m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.95'],
    'http_req_duration{name:routes}': RNF01_P95,
    'http_req_duration{name:collection-points}': RNF01_P95,
    'http_req_duration{name:vehicles}': RNF01_P95,
    'http_req_duration{name:drivers}': RNF01_P95,
    'http_req_duration{name:collections}': RNF01_P95,
  },
};

const loginPayload = JSON.stringify({ email: EMAIL, password: PASSWORD });

export default function () {
  const login = http.post(`${BASE_URL}/api/auth/login/`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'auth_login' },
  });
  const loginOk = check(login, { 'login 200': (r) => r.status === 200 });
  if (!loginOk) {
    return;
  }
  const token = login.json().tokens?.access;
  if (!token) {
    return;
  }

  const endpoints = {
    'collection-points': `/api/collection-points/${LIST_QUERY}`,
    'collections': `/api/collections/${LIST_QUERY}`,
    'routes': `/api/routes/${LIST_QUERY}`,
    'vehicles': `/api/vehicles/${LIST_QUERY}`,
    'drivers': `/api/drivers/${LIST_QUERY}`,
    'waste-types': '/api/waste-types/',
    'quick-stats': '/api/quick-stats/',
    'collection-points-map': '/api/collection-points-map/',
    'profile': '/api/auth/profile/',
  };

  const headers = { Authorization: `Bearer ${token}` };
  for (const [name, url] of Object.entries(endpoints)) {
    const res = http.get(`${BASE_URL}${url}`, {
      headers,
      tags: { name },
    });
    check(res, {
      [`${name} 200`]: (r) => r.status === 200,
    });
  }
}
