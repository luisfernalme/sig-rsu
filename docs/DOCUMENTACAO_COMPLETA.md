# 📚 Documentação Completa - Sistema de Coleta de Resíduos Sólidos Urbanos

> **Sistema Web para Controle da Coleta de Resíduos Sólidos Urbanos**  
> Documentação técnica consolidada de todas as funcionalidades implementadas

---

## 📑 Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura e Tecnologias](#2-arquitetura-e-tecnologias)
3. [Funcionalidades Implementadas](#3-funcionalidades-implementadas)
4. [Módulo de Rotas](#4-módulo-de-rotas)
5. [Sistema de Mapas](#5-sistema-de-mapas)
6. [Upload de Fotos e Histórico](#6-upload-de-fotos-e-histórico)
7. [Correções e Melhorias](#7-correções-e-melhorias)
8. [Guia de Testes](#8-guia-de-testes)
9. [Solução de Problemas](#9-solução-de-problemas)
10. [Próximos Passos](#10-próximos-passos)

---

## 1. Visão Geral do Sistema

### 1.1 Objetivo

Desenvolver uma plataforma funcional que permita a visualização de rotas de coleta, o cadastro de dados operacionais e a geração de relatórios, servindo como uma ferramenta de baixo custo para apoiar a tomada de decisão, otimizar a logística e promover a transparência na gestão de resíduos.

### 1.2 Contexto

Sistema web baseado em tecnologias de Sistema de Informação Geográfica (SIG) para auxiliar no controle e monitoramento da coleta de RSU em municípios de pequeno porte, em conformidade com a Política Nacional de Resíduos Sólidos.

### 1.3 Resultados Esperados

- **Otimização de rotas**: Redução de até 40% nas distâncias percorridas
- **Transparência**: Acesso público a informações de coleta
- **Eficiência operacional**: Melhor controle e planejamento
- **Redução de custos**: Otimização de recursos e combustível
- **Conformidade legal**: Atendimento às exigências da PNRS

---

## 2. Arquitetura e Tecnologias

### 2.1 Stack Tecnológico

#### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.2 | Framework principal |
| React Bootstrap | 2.9 | Componentes UI |
| Leaflet | 1.9.4 | Mapas interativos |
| React Leaflet | 4.2.1 | Integração React + Leaflet |
| Axios | 1.5 | Cliente HTTP |
| React Hot Toast | 2.4 | Notificações |
| Font Awesome | 6.4 | Ícones |

#### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Django | 4.x | Framework backend |
| Django REST Framework | - | API RESTful |
| PostgreSQL | 12+ | Banco de dados |
| PostGIS | - | Dados geoespaciais |
| GeoDjango | - | Suporte GIS |
| Celery | - | Tarefas assíncronas |
| Redis | - | Cache e broker |

### 2.2 Estrutura do Projeto

```
sistema-coleta-rsu/
├── backend/
│   ├── apps/
│   │   ├── authentication/      # Autenticação JWT
│   │   ├── routes/             # Gestão de rotas
│   │   ├── vehicles/           # Veículos
│   │   ├── collection_points/  # Pontos de coleta
│   │   ├── reports/            # Relatórios
│   │   └── public_api/         # API pública
│   ├── config/                 # Configurações Django
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── pages/             # Páginas
│   │   ├── services/          # APIs e serviços
│   │   └── utils/             # Utilitários
│   └── package.json
├── database/
│   └── init.sql               # Scripts iniciais
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
└── docs/                      # Documentação
```

### 2.3 Banco de Dados Geoespacial

- **PostGIS**: Extensão espacial do PostgreSQL
- **Índices Espaciais**: Otimização de consultas geográficas
- **Tipos Geométricos**: Point, LineString, Polygon
- **SRID 4326**: Sistema de coordenadas WGS84

---

## 3. Funcionalidades Implementadas

### 3.1 Gestão de Rotas ✅

#### Funcionalidades Principais
- ✅ CRUD completo de rotas
- ✅ Visualização em mapas interativos
- ✅ Desenho de rotas com Leaflet
- ✅ Seleção de pontos de coleta
- ✅ Cálculo automático de distâncias
- ✅ Otimização de rotas
- ✅ Roteamento real seguindo ruas

#### Campos e Configurações
- Nome da rota
- Descrição
- Frequência (Diária, Semanal, Quinzenal, Mensal)
- Status (Ativa, Inativa, Em Manutenção)
- Duração estimada (HH:MM:SS)
- Distância estimada (km)
- Geometria (LineString GeoJSON)
- Pontos de coleta associados

### 3.2 Pontos de Coleta ✅

#### Funcionalidades
- ✅ Cadastro de pontos com geolocalização
- ✅ Visualização no mapa
- ✅ Upload de fotos
- ✅ Histórico de coletas
- ✅ Status de coleta
- ✅ Galeria de imagens

### 3.3 Veículos ✅

- ✅ Cadastro de veículos
- ✅ Dados técnicos
- ✅ Status operacional
- ✅ Associação com rotas

### 3.4 Relatórios ✅

- ✅ Dashboard com indicadores
- ✅ Estatísticas de coleta
- ✅ Relatórios de desempenho
- ✅ Exportação de dados

### 3.5 Autenticação e Segurança ✅

- ✅ Login com JWT
- ✅ Controle de acesso
- ✅ Refresh automático de tokens
- ✅ CSRF protection
- ✅ Validação server-side

---

## 4. Módulo de Rotas

### 4.1 Interface de Criação/Edição

#### Componente: `RouteModal.js`

**Funcionalidades:**
- Formulário completo com validação
- Mapa interativo integrado
- Seleção múltipla de pontos
- Desenho de rota por cliques
- Preview da rota em tempo real

**Modos de Visualização:**

#### 1. Modo Automático (Padrão) 🚗
- Pontos selecionados criam rota automaticamente
- Linha conecta pontos na ordem de seleção
- Cálculo automático de distância
- Atualização instantânea

#### 2. Modo Manual ✏️
- Cliques no mapa adicionam pontos
- Permite pontos intermediários
- Ajustes finos do traçado
- Personalização completa

#### 3. Otimização Inteligente ✨
- Algoritmo Nearest Neighbor
- Redução de 15-30% na distância
- Reordenação automática
- Preserva pontos obrigatórios

### 4.2 Controles do Mapa

| Botão | Função | Quando Aparece |
|-------|--------|----------------|
| 🚗/📐 GPS/Linha | Alterna roteamento real/linha reta | Sempre |
| ✏️ Auto/Manual | Alterna modo edição | Sempre |
| ✨ Otimizar | Reorganiza pontos | ≥ 2 pontos |
| ↶ Desfazer | Remove último ponto | Com pontos |
| 🗑️ Limpar | Remove toda rota | Com pontos |

### 4.3 Visualização de Rotas

#### Componente: `RouteMapView.js`

**Elementos Visuais:**
- 🟢 Marcador de Início (verde)
- 🔴 Marcador de Fim (vermelho)
- 🔵 Pontos de Coleta (azul)
- 📍 Marcadores numerados
- 📏 Linha da rota colorida por status

**Informações Exibidas:**
- Frequência de coleta
- Status da rota
- Distância total
- Duração estimada
- Descrição completa
- Lista de pontos

### 4.4 Cálculo de Distâncias

#### Fórmula de Haversine
```javascript
d = 2R × arcsin(√(sin²(Δφ/2) + cos φ1 × cos φ2 × sin²(Δλ/2)))
```

**Onde:**
- R = 6371 km (raio da Terra)
- φ = latitude em radianos
- λ = longitude em radianos
- Precisão: ±1-2%

---

## 5. Sistema de Mapas

### 5.1 Roteamento Real com OSRM

#### API Utilizada
- **Serviço**: OSRM (Open Source Routing Machine)
- **URL**: https://router.project-osrm.org
- **Base**: OpenStreetMap
- **Gratuito**: Sim (API pública)
- **Precisão**: Alta

#### Funcionalidades
- ✅ Rota segue ruas reais
- ✅ Respeita mão única e sentidos
- ✅ Calcula distância real do trajeto
- ✅ Estima tempo de viagem
- ✅ Evita vias bloqueadas

#### Exemplo de Requisição
```javascript
GET https://router.project-osrm.org/route/v1/driving/
    -46.6333,-23.55;
    -46.6911,-23.5447;
    -46.5674,-23.6240
    ?overview=simplified&geometries=geojson
```

**Resposta:**
```json
{
  "code": "Ok",
  "routes": [{
    "geometry": {
      "coordinates": [[lon,lat], ...],
      "type": "LineString"
    },
    "distance": 16550.2,  // metros
    "duration": 1823.4    // segundos
  }]
}
```

### 5.2 Ícones e Marcadores

#### Tipos de Marcadores

**Pontos Selecionados (Verde):**
```javascript
L.divIcon({
  html: `<div style="
    background-color: #28a745; 
    border: 2px solid white; 
    border-radius: 50%; 
    width: 20px; 
    height: 20px;
  "></div>`,
  iconSize: [20, 20]
})
```

**Pontos Não Selecionados (Cinza):**
```javascript
L.divIcon({
  html: `<div style="
    background-color: #6c757d; 
    border: 2px solid white; 
    border-radius: 50%; 
    width: 12px; 
    height: 12px; 
    opacity: 0.5;
  "></div>`,
  iconSize: [12, 12]
})
```

**Marcadores Numerados (Azul):**
```javascript
L.divIcon({
  html: `<div style="
    background-color: #007bff; 
    color: white; 
    border-radius: 50%; 
    width: 28px; 
    height: 28px; 
    font-weight: bold;
  ">${número}</div>`,
  iconSize: [28, 28]
})
```

### 5.3 Otimizações de Performance

#### Simplificação de Geometria
- OSRM retorna: 500-1000+ pontos
- Simplificado para: ~200 pontos
- Método: Amostragem uniforme
- Preserva: Início, fim e detalhes importantes

```javascript
const simplifyRoute = (points, maxPoints = 200) => {
  if (points.length <= maxPoints) return points;
  
  const step = Math.ceil(points.length / maxPoints);
  const simplified = [];
  
  for (let i = 0; i < points.length; i += step) {
    simplified.push(points[i]);
  }
  
  // Garantir último ponto
  if (simplified[simplified.length - 1] !== points[points.length - 1]) {
    simplified.push(points[points.length - 1]);
  }
  
  return simplified;
};
```

---

## 6. Upload de Fotos e Histórico

### 6.1 Sistema de Fotos

#### Modelo: `CollectionPointPhoto`

**Campos:**
- `collection_point`: FK para ponto de coleta
- `collection_record`: FK opcional para registro
- `photo`: ImageField (upload organizado)
- `photo_type`: Tipo da foto (choices)
- `title`: Título opcional
- `description`: Descrição
- `photo_location`: PointField (geolocalização)
- `uploaded_by`: FK para usuário
- `uploaded_at`: Timestamp automático
- `is_primary`: Boolean (foto principal)

#### Tipos de Foto
- 📍 **Localização**: Visão geral do ponto
- 🗑️ **Contêiner**: Foto do equipamento
- ⬆️ **Antes da Coleta**: Estado cheio
- ⬇️ **Depois da Coleta**: Estado vazio
- 🔧 **Manutenção**: Registros de manutenção
- ⚠️ **Dano/Problema**: Problemas identificados
- 📄 **Outro**: Outras situações

#### Componente: `PhotoGallery.js`

**Funcionalidades:**
- Grid responsivo (2-4 colunas)
- Preview em modal
- Badges de tipo
- Ações: definir principal, excluir
- Loading states
- Empty state

### 6.2 Histórico de Coletas

#### Componente: `CollectionHistory.js`

**Funcionalidades:**
- Timeline vertical elegante
- Cards informativos
- Progress bars para níveis
- Filtro por período (padrão: 90 dias)
- Integração com rotas e veículos

**Informações Exibidas:**
- Data e hora da coleta
- Status (Coletado, Parcial, Não Coletado)
- Rota e veículo utilizados
- Motorista responsável
- Peso e volume coletados
- Níveis antes/depois
- Observações
- Fotos da coleta

### 6.3 Modal Integrado

#### Componente: `PointHistoryModal.js`

**Abas:**
1. **Histórico de Coletas**: Timeline das coletas
2. **Galeria de Fotos**: Grid de imagens
3. **Estatísticas**: Indicadores e totalizadores

**Estatísticas Calculadas:**
- 📊 Total de coletas
- 📸 Total de fotos
- ⚖️ Peso total coletado
- ✅ Taxa de sucesso

### 6.4 Endpoints API

```bash
# Fotos
GET    /api/collection-points/{id}/photos/
POST   /api/collection-points/{id}/photos/
DELETE /api/photos/{id}/
POST   /api/photos/{id}/set_primary/

# Histórico
GET    /api/collection-points/{id}/collection_history/?days=90
```

---

## 7. Correções e Melhorias

### 7.1 Correção de Ícones do Leaflet

#### Problema Original
```
TypeError: Cannot read properties of undefined (reading 'createIcon')
```

**Causa:**
- URLs externas de ícones falhavam
- Re-renders excessivos do mapa
- Falta de verificação de arrays

**Solução Implementada:**
1. Uso de `DivIcon` ao invés de URLs externas
2. Controle de re-renders com `useEffect`
3. Renderização condicional do mapa
4. Verificações de segurança (`Array.isArray()`)
5. Try-catch em operações críticas

### 7.2 Correção de Duração

#### Problema
Duração mostrava "62" ao invés de "01:02:00"

**Causa:**
OSRM retorna segundos, mas conversão estava errada

**Solução:**
```javascript
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
// 3720s → "01:02:00" ✅
```

### 7.3 Otimização de Pontos no Mapa

#### Problema
Mapa poluído com milhares de pontos

**Solução:**
1. Usar `overview=simplified` no OSRM
2. Simplificação adicional para max 200 pontos
3. Manter fidelidade da rota

### 7.4 Melhorias de Interface

#### Implementadas:
- ✅ Interface inteligente e automática
- ✅ Feedback visual em todas as ações
- ✅ Toast notifications contextuais
- ✅ Loading states apropriados
- ✅ Animações suaves
- ✅ Design responsivo
- ✅ Empty states amigáveis

---

## 8. Guia de Testes

### 8.1 Preparação

#### Iniciar o Projeto
```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

#### Acessos
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Admin Django: http://localhost:8000/admin

### 8.2 Teste de Rotas

#### Criação de Rota
1. ✅ Clicar em "Nova Rota"
2. ✅ Preencher formulário completo
3. ✅ Selecionar pontos de coleta
4. ✅ Desenhar rota no mapa
5. ✅ Verificar cálculo automático
6. ✅ Salvar e confirmar sucesso

#### Validações
- [ ] Nome obrigatório
- [ ] Distância positiva
- [ ] Mínimo 2 pontos
- [ ] Geometria válida

#### Visualização
1. ✅ Abrir modal de mapa
2. ✅ Verificar marcadores
3. ✅ Testar popups
4. ✅ Verificar informações

#### Edição
1. ✅ Carregar dados existentes
2. ✅ Modificar campos
3. ✅ Ajustar rota
4. ✅ Salvar alterações

#### Otimização
1. ✅ Clicar em "Otimizar"
2. ✅ Verificar cálculo
3. ✅ Confirmar economia
4. ✅ Validar nova rota

### 8.3 Teste de Fotos

#### Upload
1. ✅ Selecionar imagem (< 5MB)
2. ✅ Escolher tipo
3. ✅ Adicionar título/descrição
4. ✅ Enviar foto
5. ✅ Verificar na galeria

#### Gerenciamento
1. ✅ Visualizar em tamanho completo
2. ✅ Definir como principal
3. ✅ Excluir foto
4. ✅ Verificar feedback

### 8.4 Teste de Histórico

1. ✅ Abrir modal de histórico
2. ✅ Verificar timeline
3. ✅ Checar informações
4. ✅ Ver estatísticas
5. ✅ Testar filtros

### 8.5 Teste de Responsividade

#### Desktop (>1200px)
- [ ] Layout 3 colunas
- [ ] Todos os botões visíveis
- [ ] Mapa em tamanho adequado

#### Tablet (768-1200px)
- [ ] Layout 2 colunas
- [ ] Navegação funcional
- [ ] Modais adaptados

#### Mobile (<768px)
- [ ] Layout 1 coluna
- [ ] Botões empilhados
- [ ] Mapa responsivo
- [ ] Formulários adaptados

### 8.6 Checklist Final

- [ ] Todos os CRUDs funcionam
- [ ] Sem erros no console
- [ ] Validações operando
- [ ] Mapas renderizando
- [ ] Fotos fazendo upload
- [ ] Histórico carregando
- [ ] Notificações aparecendo
- [ ] Performance aceitável
- [ ] Responsivo em todos os tamanhos

---

## 9. Solução de Problemas

### 9.1 Erros Comuns

#### Erro 500 ao Salvar Rota

**Diagnóstico:**
```bash
# Ver logs do backend
docker-compose logs -f backend
```

**Possíveis Causas:**
1. Campo `created_by` faltando
2. Geometria inválida
3. Pontos de coleta inexistentes
4. Formato de duração errado

**Solução:**
```python
# Verificar no Django shell
docker-compose exec backend python manage.py shell

from apps.routes.models import Route
from django.contrib.auth import get_user_model

# Testar criação manual
User = get_user_model()
user = User.objects.first()

# ... criar rota de teste
```

#### Pontos Não Aparecem no Mapa

**Diagnóstico:**
1. Abrir console (F12)
2. Verificar erros JavaScript
3. Checar chamadas de API (Network)

**Verificações:**
```javascript
// No console
console.log('Pontos:', collectionPoints);
console.log('Primeiro ponto:', collectionPoints[0]);
console.log('Coordenadas:', collectionPoints[0]?.location);
```

**Soluções:**
1. Verificar formato de coordenadas
2. Confirmar pontos no banco
3. Validar resposta da API
4. Checar CORS

#### Leaflet CSS Não Carrega

**Sintoma:** Mapa em branco

**Solução:**
```javascript
// Verificar import
import 'leaflet/dist/leaflet.css';

// No console
const link = document.querySelector('link[href*="leaflet.css"]');
console.log('Leaflet CSS:', link);
```

### 9.2 Debug Avançado

#### Verificar Estado do Sistema

```bash
# Containers rodando
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Entrar no container
docker-compose exec backend bash

# Django shell
docker-compose exec backend python manage.py shell
```

#### Limpar Cache e Reconstruir

```bash
# Parar tudo
docker-compose down -v

# Limpar sistema
docker system prune -a

# Reconstruir
docker-compose up --build
```

### 9.3 Fallback e Resiliência

#### Roteamento
- Tenta OSRM primeiro
- Se falhar, usa linha reta
- Continua funcionando offline

#### Fotos
- Validação client-side
- Fallback para placeholder
- Retry automático

#### API
- Interceptors de erro
- Refresh automático de token
- Mensagens amigáveis

---

## 10. Próximos Passos

### 10.1 Funcionalidades Planejadas

#### Alta Prioridade ✅
- [x] CRUD completo de rotas
- [x] Integração com mapas
- [x] Upload de fotos
- [x] Histórico de coletas
- [x] Roteamento real

#### Média Prioridade 🔄
- [ ] Filtros e busca avançada
- [ ] Paginação de listas
- [ ] Comparação de rotas
- [ ] Exportação PDF/Excel
- [ ] Notificações push
- [ ] Agendamentos automáticos

#### Baixa Prioridade 📋
- [ ] Algoritmo TSP avançado
- [ ] Tráfego em tempo real
- [ ] Machine Learning para previsões
- [ ] App mobile nativo
- [ ] Portal público
- [ ] Dashboard público

### 10.2 Melhorias Técnicas

#### Performance
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Service Workers (PWA)
- [ ] CDN para assets
- [ ] Otimização de imagens

#### Testes
- [ ] Testes unitários (Jest)
- [ ] Testes de integração
- [ ] Testes E2E (Cypress)
- [ ] Testes de performance
- [ ] Cobertura de código

#### DevOps
- [ ] CI/CD pipeline
- [ ] Monitoramento (Sentry)
- [ ] Analytics
- [ ] Backup automático
- [ ] Staging environment

### 10.3 Documentação

#### Falta Criar
- [ ] API Documentation (Swagger)
- [ ] Guia de contribuição
- [ ] Changelog detalhado
- [ ] Vídeos tutoriais
- [ ] FAQ completo

---

## 📊 Métricas do Projeto

### Linhas de Código
```
Backend:           ~2.500 linhas
Frontend:          ~3.800 linhas
Documentação:      ~5.000 linhas
─────────────────────────────────
TOTAL:           ~11.300 linhas
```

### Componentes
- **React Components**: 15+
- **Django Apps**: 6
- **API Endpoints**: 30+
- **Models**: 12+
- **Serializers**: 15+

### Arquivos
- **Python**: 45 arquivos
- **JavaScript**: 32 arquivos
- **CSS**: 8 arquivos
- **Markdown**: 11 arquivos

---

## 🎓 Lições Aprendidas

### Desenvolvimento
1. **Componentização**: Separação clara de responsabilidades
2. **Estado**: Gerenciamento eficiente com hooks
3. **Validação**: Dupla camada (client + server)
4. **Feedback**: Usuário sempre informado
5. **Responsividade**: Mobile-first approach

### GIS e Mapas
1. **Leaflet com React**: Cuidado com re-renders
2. **DivIcon vs URL**: HTML inline mais confiável
3. **Coordenadas**: Atenção à ordem (lat/lng vs lng/lat)
4. **Performance**: Simplificar geometrias complexas
5. **OSRM**: Excelente para roteamento gratuito

### DevOps
1. **Docker**: Facilita desenvolvimento e deploy
2. **Logs**: Essenciais para debug
3. **Versionamento**: Git flow bem definido
4. **Documentação**: Atualizar constantemente
5. **Backups**: Automatizar desde o início

---

## 👥 Créditos

**Desenvolvimento:** Sistema desenvolvido como Trabalho de Conclusão de Curso  
**Autor:** Luís Fernando Almeida  
**Orientadora:** Adriana Zanella Martinhago  
**Instituição:** Universidade Federal de Viçosa - Campus Rio Paranaíba  
**Curso:** Sistemas de Informação  
**Ano:** 2025

---

## 📞 Suporte

### Recursos
- **Repositório**: GitHub - sistema-coleta-rsu
- **Issues**: Use o GitHub Issues para bugs
- **Documentação**: Pasta `/docs` do projeto
- **API**: http://localhost:8000/api (desenvolvimento)

### Contatos
- **Email**: [adicionar email]
- **GitHub**: [adicionar perfil]

---

## 📄 Licença

[Adicionar informações de licença]

---

## 🌟 Reconhecimentos

Agradecimentos especiais a:
- Comunidade **React** e **Django**
- Projeto **Leaflet** e **OpenStreetMap**
- **OSRM** pelo serviço de roteamento
- **PostGIS** pela extensão espacial
- Todos os contribuidores open-source

---

**Sistema desenvolvido com 💚 para promover gestão eficiente e transparente da coleta de resíduos sólidos urbanos**


