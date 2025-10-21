# Workflow operacional do Sistema de Coleta RSU

Este documento descreve: visão geral, fluxo de uso ponta-a-ponta, como o frontend consome a API, e uma lista objetiva de ajustes prioritários para o sistema funcionar de ponta a ponta em ambiente docker.

## Atualização (2025-10-21)

- Dashboard (frontend) refatorado para alinhar com os campos reais do endpoint `GET /api/reports/dashboard/` e com os relatórios `GET /api/reports/collections/` e `GET /api/reports/efficiency/`:
  - KPIs ajustados: total/ativas (rotas e veículos), pontos de coleta, coletas/execuções do dia, métricas e alertas semanais.
  - Gráficos agora usam dados reais: coletas diárias (últimos 30 dias), coletas por tipo de ponto e eficiência por rota (taxa de conclusão).
  - Removidos campos inexistentes (custos mensais, eficiência global e resíduos mensais).

## Visão geral

- Backend: Django + Django REST Framework + PostGIS (PostgreSQL) + Celery/Redis.
- Frontend: React (build servido por `serve` na porta 3000).
- Infra: docker-compose com serviços db (PostGIS), redis, backend (Django), frontend (React), celery e celery-beat.
- Autenticação: JWT (SimpleJWT), com endpoints customizados de login/registro em `api/auth/*` e endpoints padrão JWT.
- Domínios de negócio:
  - Rotas de coleta (geometria LineString, frequência, status, pontos associados, execução e otimização).
  - Pontos de coleta (coordenadas GIS, capacidade, status, fotos, histórico de coletas).
  - Veículos (frota, manutenção, tracking GPS).
  - Relatórios (dashboard e estatísticas operacionais).
  - API pública (consulta de agenda, dados para mapa público).

## Fluxo operacional (end-to-end)

1) Acesso e autenticação
- Usuário acessa http://localhost:3000, realiza login (email+senha) via `POST /api/auth/login/`.
- Tokens JWT (access/refresh) são guardados em cookies; axios injeta Authorization: Bearer <access> automaticamente.

2) Cadastro de veículos
- Em “Veículos”, criar itens via `POST /api/vehicles/`. Campos principais: placa, modelo, tipo, capacidades, status.
- É possível atribuir motoristas, checar manutenção pendente, e consultar tracking (`/vehicles/{id}/tracking/`).

3) Cadastro de pontos de coleta
- Em “Pontos de Coleta”, criar pontos pelo mapa: selecionar local (lat/lng) e salvar via `POST /api/collection-points/`.
- O backend converte lat/lng para PointField e persiste. Fotos podem ser enviadas em `POST /api/collection-points/{id}/photos/` (multipart).
- Histórico de coletas do ponto em `GET /api/collection-points/{id}/collection_history/`.

4) Criação de rotas
- Em “Rotas”, selecionar múltiplos pontos; o UI pode usar OSRM para traçar uma rota “real” e calcular distância/tempo.
- Salvar rota via `POST /api/routes/` com:
  - geometry: GeoJSON LineString
  - estimated_distance (km) e estimated_duration (HH:MM:SS)
  - collection_points: [{ point_id, sequence_order, estimated_collection_time }]

5) Programação e execução
- (Backend) `RouteSchedule` define dias/turnos. Execuções (`RouteExecution`) são instâncias programadas (data/hora, veículo, motorista).
- A execução pode ser iniciada/finalizada via actions `POST /api/executions/{id}/start/` e `POST /api/executions/{id}/complete/`.
- Coletas em pontos durante a execução são registradas via `POST /api/collection-points/{id}/collect/` (atualiza fill level e last/next collection).

6) Relatórios e dashboard
- Estatísticas gerais em `GET /api/reports/dashboard/` e outras rotas específicas (`/api/reports/collections/`, `/api/reports/efficiency/`).
- Exportações (CSV inicialmente) via `POST /api/reports/export` com payload informando tipo/intervalo/formato.

7) API pública
- Consulta de agenda por endereço (`GET /api/public/schedule?address=...`).
- Dados de mapa: `/api/collection-points-map/` (pontos) e `/api/routes-map/` (rotas ativas).

## Mapeamento Frontend → Backend (principais)

- Auth
  - FE: `POST /auth/login/` → BE: `POST /api/auth/login/`
  - FE: `GET /auth/profile/` → BE: `GET /api/auth/profile/`
  - Refresh automático: `POST /api/auth/token/refresh/`

- Pontos de coleta
  - FE: `GET/POST/PUT/DELETE /collection-points/` → BE: ViewSet `CollectionPointViewSet`
  - Registrar coleta: `POST /collection-points/{id}/collect/`
  - Fotos: `GET/POST /collection-points/{id}/photos/`, `POST /photos/{photoId}/set_primary/`

- Rotas
  - FE: `GET/POST/PUT/DELETE /routes/` → BE: `RouteViewSet`
  - Otimização: `POST /routes/{id}/optimize/`

- Veículos
  - FE: `GET/POST/PUT/DELETE /vehicles/` → BE: `VehicleViewSet`
  - Tracking: `GET /vehicles/{id}/tracking/`

- Relatórios
  - FE: `GET /reports/dashboard/` → BE: `ReportsViewSet.dashboard`
  - FE: `GET /reports/collections/`, `GET /reports/efficiency/`
  - Exportação (correto): `POST /reports/export` com body { report_type, format, start_date, end_date }

## Ajustes prioritários (bugs e inconsistências)

1) Dashboard: nomes de campos esperados pelo FE ≠ retornados pelo BE
- FE (`frontend/src/pages/Dashboard.js`) espera: total_points, today_collections, weekly_waste, monthly_waste, efficiency, monthly_costs.
- BE (`ReportsViewSet.dashboard`) retorna: total_collection_points, collections_today, waste_collected_week, etc.
- Correção proposta: ajustar o FE para usar os nomes do BE ou padronizar o BE para também retornar aliases compatíveis. (Preferível ajustar FE agora.)

2) Registro de coleta: status incorreto no FE
- FE (`CollectionPoints.js`) envia status: 'completed' ao registrar coleta.
- BE (`CollectionRecord.status`) aceita: 'collected', 'partially_collected', 'not_collected', 'inaccessible'.
- Correção: alterar o FE para enviar 'collected'.

3) Update de ponto de coleta com payload “cheio”
- FE usa `updateCollectionPoint(id, {...point, status: newStatus})`, enviando campos somente leitura e extra.
- DRF rejeita campos desconhecidos.
- Correção: mudar para PATCH com payload mínimo, ex.: `{ status: 'inactive' }` e/ou construir objeto somente com campos editáveis.

4) Geometria da rota como string
- FE (`RouteModal.js`) envia `geometry: JSON.stringify(geometry)`.
- BE espera objeto GeoJSON (não string) para `LineStringField`.
- Correção: enviar `geometry` como objeto JSON (GeoJSON) diretamente.

5) Bugs em Rotas (backend)
- `RouteScheduleViewSet.today`: usa `strftime('%A')` (string) vs `day_of_week` inteiro (0..6). Corrigir para `today.weekday()`.
- `RouteOptimizationViewSet.stats`: agrega `savings_distance` e usa `route`, mas o modelo usa `distance_saved` e `original_route`. Ajustar nomes.

6) Relatórios – export e custos
- FE chama `GET /reports/export/{reportType}/` (blob), mas BE implementa `POST /reports/export` com body.
- FE chama `GET /reports/costs/` (não existe no BE).
- Correção: alinhar FE para `POST /reports/export` e remover/implementar endpoint de custos.

7) Veículos – performance por manutenção
- `ReportsViewSet.vehicle_performance` usa `completed_date__gte`, mas o modelo `VehicleMaintenance` tem `actual_date`.
- Correção: trocar `completed_date` → `actual_date`.

8) Schedule/Execuções – UI ausente
- BE tem `RouteSchedule` e `RouteExecution`, mas o FE não expõe telas claras para programar execuções.
- Sugestão: incluir UI simples para criar agendamentos (semana/turno) e instanciar execuções diárias com veículo/motorista.

9) Docker/Static/Media
- `static_volume:/app/static` não corresponde ao `STATIC_ROOT` (`/app/staticfiles`); volume está ocioso.
- `media_volume` está definido, mas o backend mapeia `./backend/media:/app/media`. Unificar (ou remover `media_volume`).

10) Debug Toolbar
- `urls.py` inclui `debug_toolbar` quando DEBUG, mas a app não aparece em `INSTALLED_APPS`. Conferir `requirements.txt` e/ou remover integração se não usada.

## Melhorias adicionais (roadmap curto)

- Segurança/Prod: remover `makemigrations` do entrypoint; gerar migrações em desenvolvimento e só `migrate` em prod. Configurar SECRET_KEY/env para prod.
- Permissões por papel: criar `permissions.py` com checagem de `User.role` (admin/operator/viewer) para operações sensíveis (ex.: exclusão de rotas, coleta em lote, etc.).
- Validações UX: no FE, guiar o usuário com toasts/labels corretos (ex.: status de coleta válidos, mensagens de erro de API).
- Testes: adicionar testes unitários básicos (serializers e actions principais: `collect`, `optimize`, `start/complete`).
- Observabilidade: padronizar logging (evitar prints no backend), logar erros de validação com `logger.warning/error`.
- CI/CD: pipeline simples (lint+tests+build docker) e publicação de imagens.

## Sequência prática para “funcionar de ponta a ponta”

1) Subir stack com Docker (start.bat).
2) Criar superusuário: `docker-compose exec backend python manage.py createsuperuser` (opcional para admin).
3) Login pelo FE (email/senha).
4) Cadastrar veículos e pontos de coleta (usando o mapa para definir localização).
5) Criar rota (selecionando pontos); garantir que o FE envie geometry como objeto GeoJSON.
6) (Opcional) Criar agendamento e instanciar execuções; iniciar/encerrar execuções e registrar coletas.
7) Verificar dashboard/relatórios após ajustes de campos no FE.

---