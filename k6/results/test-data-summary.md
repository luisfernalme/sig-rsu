# Dados dos testes de desempenho (para redação do artigo)

## Contexto do ambiente

- **Máquina**: local (desktop) — AMD Ryzen 5 4600H, 12 threads, 7,2 GB RAM, Fedora Linux
- **Contêineres Docker**: sem limites artificiais de recursos (docker-compose sem `mem_limit`/`cpus`)
- **Servidor da aplicação**: Gunicorn 21.2.0, 4 workers x 4 threads, timeout 120s (rodando em modo produção, `DEBUG=0`)
- **Stack**: Django 4.2 + Django REST Framework + PostGIS (PostgreSQL 15), Redis/Celery
- **Banco de dados populado** (comando `seed_data`):
  - 1.000 pontos de coleta
  - 200 rotas
  - 10.000 registros de coleta
  - 100 veículos
  - 50 motoristas

## Ferramenta de carga

- k6 (Grafana), executado na mesma máquina via rede local
- Autenticação: JWT via `POST /api/auth/login/` por VU (token obtido antes das requisições)

## Cenário sem concorrência (sequencial, 1 VU)

- 50 iterações, 1 usuário virtual, 10 requests por iteração
- **Total: 500 requisições**, 0 erros
- Latência global: média **123,7 ms**, p95 **377,9 ms**
- Throughput: 8,1 req/s

### Por endpoint (sem concorrência)

| Endpoint | Requisições | média (ms) | p95 (ms) |
|---|---|---|---|
| auth_login | 50 | 156 | 172 |
| collection-points | 50 | 384 | 451 |
| collection-points-map | 50 | 52 | 118 |
| collections | 50 | 204 | 260 |
| drivers | 50 | 18 | 20 |
| profile | 50 | 8 | 9 |
| quick-stats | 50 | 16 | 18 |
| routes | 50 | 371 | 404 |
| vehicles | 50 | 29 | 30 |
| waste-types | 50 | 9 | 10 |

## Cenário concorrente (50 usuários virtuais)

- Ramp-up: 0 -> 20 VUs (1 min), 20 -> 50 VUs (2 min), 50 -> 0 (1 min); total 4 min de carga
- **Total: 5.551 requisições**, **0 erros** (0,00%)
- Latência global: média **1,08 s**, p95 **3,79 s**, p90 2,87 s
- Throughput: 20,5 req/s
- Dados recebidos: 1,0 GB

### Por endpoint (concorrente)

| Endpoint | Requisições | média (ms) | p95 (ms) |
|---|---|---|---|
| auth_login | 556 | 774 | 2.306 |
| collection-points | 555 | 3.465 | 5.777 |
| collection-points-map | 555 | 937 | 2.313 |
| collections | 555 | 1.173 | 2.628 |
| drivers | 555 | 572 | 1.873 |
| profile | 555 | 502 | 1.762 |
| quick-stats | 555 | 623 | 2.190 |
| routes | 555 | 1.710 | 3.256 |
| vehicles | 555 | 604 | 1.983 |
| waste-types | 555 | 502 | 1.787 |

## Nota importante

O `seed_data` recriou os usuários. Usuários válidos atuais: `admin@example.com` / `admin123`
e `lfn@gmail.com` / `Lolasd569@`. O teste acima usou `admin@example.com`.

## Como reproduzir

```bash
# Popular banco (se necessário)
docker compose exec -T backend python manage.py seed_data

# Backend em modo produção (Gunicorn)
DEBUG=0 docker compose up -d backend

# Cenário concorrente
EMAIL=admin@example.com PASSWORD=admin123 k6 run k6/load-test.js

# Cenário sequencial
EMAIL=admin@example.com PASSWORD=admin123 ITERATIONS=50 k6 run k6/sequential-test.js
```

## Melhorias aplicadas durante os testes (contexto para o artigo)

1. Correção de N+1: `collection-points` 1.002 -> 2 queries; `collections` 204 -> 4 queries
   (`select_related` + `annotate`), eliminando timeouts sob carga.
2. Servidor de produção Gunicorn no lugar do runserver (runserver não suporta carga).
3. `PAGE_SIZE` da API aumentado de 20 para 10.000 (o frontend não paginava).
