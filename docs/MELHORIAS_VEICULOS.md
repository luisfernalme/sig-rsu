# Melhoria da Tela de Veículos

Data: 2025-11-09

## Resumo

A tela de **Gestão de Veículos** foi expandida para consumir a API real e oferecer operações de CRUD, filtros e visualização de rastreamento GPS.

## Novos Recursos

- Listagem dinâmica de veículos via `GET /vehicles/`.
- Filtros por: busca (placa, marca, modelo), status e tipo (`vehicle_type`).
- Criação e edição de veículos com modal (`VehicleModal`).
- Remoção de veículos (confirmação simples) via `DELETE /vehicles/{id}/`.
- Modal de rastreamento (`VehicleTrackingModal`) consultando `GET /vehicles/{id}/tracking/`.
- Indicador de manutenção vencida (badge vermelho se `next_maintenance <= hoje`).
- Placeholder para estatísticas futuras (`/vehicles/stats`).

## Arquivos Criados

- `frontend/src/components/VehicleModal.js`: Formulário completo de criação/edição.
- `frontend/src/components/VehicleTrackingModal.js`: Exibe histórico de posições GPS.

## Arquivo Atualizado

- `frontend/src/pages/Vehicles.js`: Substituído conteúdo estático por lógica dinâmica com integração à API.
- `README.md`: Ajustado para refletir funcionalidades ampliadas.

## API Utilizada

- `GET /vehicles/` (listagem com filtros `status`, `vehicle_type`, `search`).
- `POST /vehicles/` (criação).
- `PUT /vehicles/{id}/` (atualização).
- `DELETE /vehicles/{id}/` (remoção).
- `GET /vehicles/{id}/tracking/` (histórico GPS recente).

## Próximos Passos (Sugeridos)

1. Integrar estatísticas: consumir `GET /vehicles/stats` para painel resumido.
2. Adicionar ações de manutenção: modal para registrar manutenção (`VehicleMaintenance`).
3. Exibir nível real de combustível (campo ou cálculo baseado em telemetria futura).
4. Paginação e ordenação na listagem (usar parâmetros `ordering` e adicionar paginação local/servidor).
5. Botão para duplicar veículo (clone com ajustes rápidos).
6. Controle de motorista atual (`assign_driver` e `remove_driver`).
7. Exportação CSV/Excel da frota.

## Observações Técnicas

- Validações básicas no modal antes de enviar ao backend.
- Conversões numéricas garantidas (parseFloat/Number) para campos quantitativos.
- Manutenção vencida é calculada no frontend; backend já oferece `maintenance_due` no serializer — pode ser usado futuramente.
- Rastreamento usa Leaflet e mostra polyline simples; pode ser expandido para ícones diferenciados (início/fim) e tooltip de timestamp.

## Possíveis Melhorias de UX

- Colapsar filtros avançados.
- Loading skeletons em vez de spinner central.
- Barra de ações fixas em viewport.

---

Documento gerado automaticamente como parte da melhoria da tela de veículos.
