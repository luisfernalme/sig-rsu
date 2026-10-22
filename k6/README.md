# Testes de carga com k6

Scripts de teste de carga para a API Django do sistema SIG-RSU.

## Pré-requisitos

Instalar o k6:

- Linux/macOS: `brew install k6` ou baixar de https://grafana.com/docs/k6/latest/set-up/install-k6/
- Ubuntu/Debian: `sudo gpg -k https://dl.k6.io/key.gpg && echo 'deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main' | sudo tee /etc/apt/sources.list.d/k6.list && sudo apt update && sudo apt install k6`

O sistema deve estar rodando: `docker compose up --build`

Para o teste de carga refletir um ambiente de produção, rode o backend com Gunicorn
(DEBUG=0). Em desenvolvimento (DEBUG=1) o `runserver` é usado e não representa
capacidade de produção:

```bash
DEBUG=0 docker compose up -d backend
```

O `docker-compose.yml` usa `DEBUG=1` por padrão, então sem essa variável o
`runserver` é iniciado. O entrypoint aceita `true`/`1`/`yes` (sem diferenciar
maiúsculas), a mesma regra do `settings.py`.

## Popular o banco (opcional, recomendado para testes realistas)

```bash
# Padrão: 1.000 pontos, 200 rotas, 10.000 registros, 100 veículos, 50 motoristas
docker compose exec -T backend python manage.py seed_data

# Personalizar volumes
docker compose exec -T backend python manage.py seed_data --points 2000 --routes 400 --records 50000

# Rodar de novo apagando os dados anteriores
docker compose exec -T backend python manage.py seed_data --reset
```

Cria um usuário `admin@example.com` / `admin123` (role admin) se não existir.

## Uso

### Smoke test (1 VU, verificação rápida)

```bash
EMAIL=admin@example.com PASSWORD=admin123 k6 run k6/load-test.js
```

### Teste de carga completo (perfis em `options.scenarios`)

```bash
EMAIL=admin@example.com PASSWORD=admin123 BASE_URL=http://localhost:8000 k6 run k6/load-test.js
```

### Teste sequencial (RNF-01, sem concorrência)

```bash
ITERATIONS=50 k6 run k6/sequential-test.js
```

Este script aplica os limites do RNF-01 (P95 < 300 ms) por endpoint principal.
O `load-test.js` usa um orçamento diferente (P95 < 4 s sob até 50 VUs), que
mede capacidade sob concorrência e não substitui o RNF-01.

### Ajustar parâmetros

- `BASE_URL`: URL da API (padrão `http://localhost:8000`)
- `EMAIL`/`PASSWORD`: credenciais do usuário usado no teste
- `PAGE_SIZE`: tamanho de página das listagens (padrão da API: 20). Os
  resultados de referência abaixo foram obtidos com listagens completas;
  para reproduzi-los use `PAGE_SIZE=10000`.
- Dentro do arquivo `k6/load-test.js`, ajuste os cenários em `options.scenarios`
  (VUs, duração das stages, etc.) e os limites em `options.thresholds`.

## Endpoints cobertos

- `POST /api/auth/login/` — autenticação JWT
- `GET /api/auth/profile/`
- `GET /api/collection-points/`
- `GET /api/waste-types/`
- `GET /api/collections/`
- `GET /api/routes/`
- `GET /api/vehicles/`
- `GET /api/drivers/`
- `GET /api/quick-stats/`
- `GET /api/collection-points-map/`

## Relatórios

- JSON: `k6 run --out json=results.json k6/load-test.js`
- CSV: `k6 run --out csv=results.csv k6/load-test.js`
- Grafana Cloud: `k6 run --out cloud k6/load-test.js`

## Resultados de referência

Resultados de uma execução com banco populado (1.000 pontos, 200 rotas,
10.000 registros), backend Gunicorn (4 workers × 4 threads) em máquina local
(AMD Ryzen 5 4600H, 7,2 GB RAM):

| Métrica | Valor |
|---|---|
| Requisições | 5.551 |
| Erros HTTP | 0,00% |
| Throughput | 20,5 req/s |
| Latência média | 1,08 s |
| Latência p95 | 3,79 s |
| Dados recebidos | 1,0 GB |

Os arquivos brutos (`results.json`, `results.csv`) são gerados em `k6/results/`
e não são versionados; o resumo fica em `k6/results/test-data-summary.md`.
