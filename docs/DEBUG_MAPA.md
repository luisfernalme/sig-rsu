# 🐛 Guia de Debug - Pontos Não Aparecem no Mapa

## 🔍 Problema Relatado
"Estou selecionando os pontos mas eles não aparecem no mapa"

## ✅ Correções Implementadas

### 1. **Logs de Debug Adicionados**
Agora o console do browser mostrará:
- Pontos de coleta disponíveis
- Pontos sendo selecionados
- Coordenadas sendo processadas
- Possíveis erros de formato

### 2. **Suporte a Múltiplos Formatos**
O código agora aceita coordenadas em diferentes formatos:

```javascript
// Formato 1: GeoJSON (padrão PostGIS)
{
  location: {
    type: "Point",
    coordinates: [-47.8825, -15.7942]  // [lng, lat]
  }
}

// Formato 2: Coordenadas diretas
{
  location: {
    coordinates: [-47.8825, -15.7942]
  }
}

// Formato 3: Latitude/Longitude separados
{
  latitude: -15.7942,
  longitude: -47.8825
}
```

### 3. **Visualização Melhorada**
- Pontos selecionados: ícone verde grande
- Pontos não selecionados: ícone cinza pequeno
- Marcadores numerados na rota

## 🧪 Como Testar

### Passo 1: Abrir Console do Browser
1. Pressione **F12**
2. Vá na aba **Console**
3. Limpe o console (ícone 🚫 ou Ctrl+L)

### Passo 2: Abrir Modal de Nova Rota
1. Clique em "Nova Rota"
2. Observe as mensagens no console:

```
RouteModal mounted/updated
Pontos de coleta recebidos: [...]
Rota recebida: null
```

### Passo 3: Selecionar Pontos
1. Marque um ponto de coleta
2. Observe no console:

```
updateRouteFromPoints chamada com: [1]
collectionPoints disponíveis: [...]
Procurando ponto 1: {...}
Ponto tem location? true {...}
Coordenadas encontradas: [-47.8825, -15.7942]
Convertendo Centro Histórico: [-47.8825, -15.7942] -> [-15.7942, -47.8825]
Pontos processados para rota: [[-15.7942, -47.8825]]
```

### Passo 4: Verificar Mapa
- ✅ Ponto deve aparecer com ícone **VERDE**
- ✅ Marcador numerado "1" deve aparecer
- ⚠️ Linha só aparece com 2+ pontos

## 🔍 Diagnóstico de Problemas

### Problema 1: "Pontos de coleta recebidos: []"
**Causa:** Backend não está retornando pontos  
**Solução:**
```bash
# Verificar backend
docker-compose logs backend

# Criar pontos de coleta via admin
http://localhost:8000/admin
```

### Problema 2: "Ponto tem location? false"
**Causa:** Pontos sem coordenadas no banco  
**Solução:**
```bash
# Verificar no Django shell
docker-compose exec backend python manage.py shell

from apps.collection_points.models import CollectionPoint
points = CollectionPoint.objects.all()
for p in points:
    print(f"{p.name}: {p.location}")
```

### Problema 3: "Formato de location não reconhecido"
**Causa:** Formato de coordenadas diferente  
**Console mostrará:**
```
Formato de location não reconhecido: {...}
```

**Solução:** Adicionar suporte para esse formato

### Problema 4: Pontos aparecem mas não no lugar certo
**Causa:** Coordenadas invertidas (lat/lng vs lng/lat)  
**Verificar:** Se pontos aparecem no meio do oceano, coordenadas estão invertidas

## 🎯 Checklist de Verificação

Execute no console do browser:

```javascript
// 1. Verificar se pontos estão sendo passados
console.log('Pontos:', collectionPoints);

// 2. Verificar estrutura de um ponto
console.log('Primeiro ponto:', collectionPoints[0]);

// 3. Verificar coordenadas
console.log('Coordenadas:', collectionPoints[0]?.location);

// 4. Verificar pontos selecionados
console.log('Selecionados:', selectedPoints);

// 5. Verificar pontos da rota
console.log('Rota:', routePoints);
```

## 🛠️ Soluções Rápidas

### Solução 1: Recarregar Dados
```javascript
// No console do browser
window.location.reload();
```

### Solução 2: Limpar Estado
1. Fechar modal
2. Abrir novamente
3. Tentar selecionar novamente

### Solução 3: Verificar Backend
```bash
# Ver logs
docker-compose logs -f backend

# Reiniciar
docker-compose restart backend
```

### Solução 4: Criar Ponto de Teste
```python
# Django shell
docker-compose exec backend python manage.py shell

from django.contrib.gis.geos import Point
from apps.collection_points.models import CollectionPoint

# Criar ponto de teste
point = CollectionPoint.objects.create(
    name="Teste Mapa",
    code="TEST001",
    location=Point(-47.8825, -15.7942),  # lng, lat (Brasília)
    address="Rua Teste",
    collection_type="residential",
    status="active"
)
print(f"Ponto criado: {point.name} em {point.location}")
```

## 📊 O Que Esperar

### Comportamento Correto:

1. **Ao abrir modal:**
   - Mapa centrado em Brasília
   - Todos os pontos de coleta visíveis (cinza)

2. **Ao marcar 1º ponto:**
   - Ícone fica verde
   - Marcador "1" aparece
   - Distância: 0 km

3. **Ao marcar 2º ponto:**
   - Ambos ficam verdes
   - Marcadores "1" e "2"
   - Linha azul conectando
   - Distância calculada (ex: 5.3 km)

4. **Ao marcar 3º+ pontos:**
   - Linha continua conectando
   - Distância aumenta
   - Todos numerados

## 🚨 Erros Comuns

### Erro 1: "Cannot read property 'coordinates' of undefined"
```javascript
// Antes (quebrava):
const [lng, lat] = point.location.coordinates;

// Depois (seguro):
if (point.location && point.location.coordinates) {
  const [lng, lat] = point.location.coordinates;
}
```

### Erro 2: Mapa em branco
**Causa:** Leaflet CSS não carregou  
**Solução:** Verificar import:
```javascript
import 'leaflet/dist/leaflet.css';
```

### Erro 3: Marcadores não aparecem
**Causa:** Ícones do Leaflet não carregados  
**Já corrigido no código com:**
```javascript
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({...});
```

## 📞 Próximos Passos

Se o problema persistir:

1. **Capture os logs:**
   ```
   - Screenshot do console (F12)
   - Screenshot do Network (aba Network)
   - Screenshot do erro (se houver)
   ```

2. **Informações úteis:**
   - Quantos pontos de coleta existem?
   - Os pontos têm coordenadas no banco?
   - O backend está retornando os pontos na API?

3. **Teste a API diretamente:**
   ```
   http://localhost:8000/api/collection-points/
   ```
   
   Deve retornar algo como:
   ```json
   [
     {
       "id": 1,
       "name": "Centro",
       "code": "CP001",
       "location": {
         "type": "Point",
         "coordinates": [-47.8825, -15.7942]
       }
     }
   ]
   ```

## ✅ Teste Confirmado

Quando funcionar, você deve ver:

1. ✅ Console sem erros
2. ✅ Pontos verdes aparecendo ao selecionar
3. ✅ Linha azul conectando os pontos
4. ✅ Distância calculada automaticamente
5. ✅ Marcadores numerados (1, 2, 3...)

---

**Última Atualização:** 09/10/2025  
**Status:** Correções implementadas - Pronto para teste
