# Roteamento Real - Sistema de Coleta RSU

## 📍 Visão Geral

O sistema agora suporta **roteamento real** seguindo as ruas e respeitando as regras de trânsito (mão única, sentidos, etc.), similar a um GPS de verdade!

## 🚀 Funcionalidades Implementadas

### 1. Roteamento via OSRM (Open Source Routing Machine)

- **API Utilizada**: https://router.project-osrm.org
- **Baseado em**: OpenStreetMap
- **Gratuito**: Sim, API pública disponível
- **Precisão**: Alta - considera todas as ruas e regras de trânsito

### 2. Modos de Roteamento

O sistema oferece **dois modos** de roteamento que podem ser alternados com um clique:

#### Modo GPS (Recomendado) 🛣️
- Rota segue as ruas reais
- Respeita mão única e sentidos
- Calcula distância real do trajeto
- Estima tempo de viagem
- Ícone: `🚗 GPS`

#### Modo Linha Reta 📐
- Linha reta entre os pontos (como antes)
- Útil para visualização simplificada
- Cálculo de distância usando fórmula de Haversine
- Ícone: `📐 Linha`

### 3. Toggle Fácil

```
┌─────────────────────────────────────────────┐
│  Visualização da Rota                       │
│  [🚗 GPS] [✏️ Auto] [✨ Otimizar] [↶] [🗑️]  │
└─────────────────────────────────────────────┘
```

Basta clicar no botão **GPS/Linha** para alternar entre os modos.

## 🔧 Como Funciona

### Fluxo de Roteamento Real

1. **Seleção de Pontos**: Usuário seleciona pontos de coleta
2. **Requisição OSRM**: Sistema envia coordenadas para API
3. **Cálculo de Rota**: OSRM calcula melhor rota seguindo ruas
4. **Retorno**: API retorna:
   - Geometria completa da rota (centenas de pontos)
   - Distância em metros
   - Tempo estimado em segundos
5. **Visualização**: Rota é desenhada no mapa Leaflet

### Exemplo de Requisição OSRM

```
GET https://router.project-osrm.org/route/v1/driving/
    -46.6333,-23.55;
    -46.6911,-23.5447;
    -46.5674,-23.6240
    ?overview=simplified&geometries=geojson
```

**Parâmetros**:
- `overview=full`: Geometria completa detalhada (500-1000+ pontos)
- `geometries=geojson`: Formato de retorno GeoJSON
- Simplificação posterior: Reduz para máximo 200 pontos mantendo detalhes

**Retorno**:
```json
{
  "code": "Ok",
  "routes": [{
    "geometry": {
      "coordinates": [[lon,lat], [lon,lat], ...],  // 500-1000+ pontos → simplificado para ~200
      "type": "LineString"
    },
    "distance": 16550.2,  // metros
    "duration": 1823.4    // segundos (convertido para HH:MM:SS)
  }]
}
```

## 📊 Vantagens do Roteamento Real

### Precisão
- ✅ Distância real do trajeto (não "em linha reta")
- ✅ Tempo estimado considerando velocidades médias
- ✅ Respeita sentidos de ruas e mão única

### Planejamento
- ✅ Melhor estimativa de combustível
- ✅ Otimização real da rota
- ✅ Identificação de vias bloqueadas ou sem acesso

### Operacional
- ✅ Motoristas podem seguir a rota exata
- ✅ Supervisores veem trajeto real
- ✅ Relatórios mais precisos

## 🎯 Exemplo Prático

### Antes (Linha Reta)
```
Ponto A → Ponto B → Ponto C
Distância: 12.3 km (em linha reta)
Problema: Motorista precisa seguir ruas = ~18 km real
```

### Agora (Roteamento Real)
```
Ponto A → [Rua 1] → [Av. 2] → Ponto B → [Rua 3] → Ponto C
Distância: 18.4 km (real, seguindo ruas)
Tempo: 35 minutos
✅ Motorista sabe exatamente qual caminho seguir
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React Leaflet**: Visualização de mapas
- **OSRM API**: Cálculo de rotas reais
- **Fetch API**: Requisições HTTP assíncronas

### Backend (PostGIS)
- Geometria armazenada como `LineString`
- Suporta tanto GeoJSON quanto WKT
- Compatível com rotas complexas (centenas de pontos)

## 🔄 Fallback e Resiliência

O sistema possui **fallback automático**:

1. Tenta buscar rota via OSRM
2. Se falhar (sem internet, API fora do ar):
   - ⚠️ Usa linha reta entre pontos
   - ⚠️ Exibe console log do erro
   - ✅ Sistema continua funcionando

```javascript
try {
  const route = await fetchRealRoute(points);
  setRoutePoints(route.points);
} catch (error) {
  console.warn('OSRM falhou, usando linha reta');
  setRoutePoints(fallbackStraightRoute(points));
}
```

## 🎨 Interface do Usuário

### Botões de Controle

| Botão | Função | Ícone |
|-------|--------|-------|
| GPS/Linha | Alternar modo de roteamento | 🚗/📐 |
| Auto/Manual | Modo de edição | ✏️ |
| Otimizar | Otimizar ordem dos pontos | ✨ |
| Desfazer | Remover último ponto | ↶ |
| Limpar | Limpar toda a rota | 🗑️ |

### Indicadores Visuais

- **Spinner**: Aparece ao calcular rota real
- **Mensagem**: "Calculando rota seguindo as ruas..."
- **Overlay**: Mapa fica semi-transparente durante carregamento

## 📝 Notas Técnicas

### Performance
- Requisição OSRM: ~200-500ms
- Geometria detalhada: máximo 200 pontos (reduzido de 500-1000+)
- Leaflet renderiza suavemente
- Otimização: Simplificação por amostragem aplicada automaticamente
- Balance perfeito entre detalhamento e performance

### Limitações
- API pública tem rate limit (uso razoável)
- Requer conexão com internet
- Mapas baseados no OpenStreetMap (atualização periódica)

### Alternativas (Futuro)
- **OSRM auto-hospedado**: Sem limites de requisições
- **GraphHopper**: Alternativa open-source
- **Mapbox Directions**: Pago, mais features

## 🚀 Como Usar

### Para Usuários

1. Abra modal de criar/editar rota
2. Selecione pontos de coleta (checkboxes)
3. Aguarde cálculo automático da rota
4. **Clique em "GPS"** para usar roteamento real
5. Ajuste pontos se necessário
6. Salve a rota

### Para Desenvolvedores

```javascript
// Ativar roteamento real
setUseRealRouting(true);

// Buscar rota
const result = await fetchRealRoute(points);
// result.points: Array de [lat, lng]
// result.distance: km
// result.duration: minutos
```

## � Correções Aplicadas

### Bug 1: Duração Incorreta ❌ → ✅
**Problema**: Duração mostrava valores absurdos (ex: "62" ao invés de "01:02:00")

**Causa**: OSRM retorna duração em segundos (ex: 3720s), mas estava dividindo por 60 incorretamente

**Solução**:
```javascript
// Antes (ERRADO)
estimated_duration: Math.round(result.duration / 60)  // 3720/60 = 62

// Depois (CORRETO)
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
// 3720s → "01:02:00" ✅
```

### Bug 2: Excesso de Pontos no Mapa ❌ → ✅
**Problema**: Mapa ficava poluído com centenas/milhares de pontos

**Causa**: OSRM retorna geometria detalhada (`overview=full`) com 300-1000+ pontos

**Soluções Aplicadas**:

1. **Usar `overview=simplified`**: OSRM já retorna geometria reduzida
```javascript
// Antes
overview=full  // ~500 pontos

// Depois
overview=simplified  // ~50-100 pontos
```

2. **Simplificação Adicional**: Algoritmo de decimação inteligente
```javascript
const simplifyRoute = (points, maxPoints = 200) => {
  if (points.length <= maxPoints) return points;
  
  // Amostragem uniforme mantendo detalhes importantes
  const step = Math.ceil(points.length / maxPoints);
  const simplified = [];
  
  for (let i = 0; i < points.length; i += step) {
    simplified.push(points[i]);
  }
  
  // Garantir último ponto
  if (simplified[simplified.length - 1] !== points[points.length - 1]) {
    simplified.push(points[points.length - 1]);
  }
  
  return simplified;  // ~200 pontos
};
```

**Resultado**: Máximo de 200 pontos na visualização, mantendo alta fidelidade da rota 🎯

**Ajuste de Detalhamento**: Limite aumentado de 50 → 200 pontos após feedback do usuário para preservar mais detalhes das curvas e contornos das ruas.

## �🔮 Melhorias Futuras

- [ ] Suporte para múltiplos perfis (carro, caminhão, moto)
- [ ] Considerar restrições de peso/altura
- [ ] Evitar pedágios (opção)
- [ ] Rota mais rápida vs mais curta
- [ ] Integração com tráfego em tempo real
- [ ] OSRM server próprio (sem limites)
- [ ] Cache de rotas frequentes

## 📚 Referências

- [OSRM Documentation](http://project-osrm.org/)
- [OSRM HTTP API](https://github.com/Project-OSRM/osrm-backend/blob/master/docs/http.md)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Leaflet Routing Machine](https://www.liedman.net/leaflet-routing-machine/)

---

**Status**: ✅ Implementado e Funcional  
**Versão**: 1.0  
**Data**: Janeiro 2025
