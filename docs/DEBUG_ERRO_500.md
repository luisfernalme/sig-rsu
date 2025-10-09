# 🐛 Debug - Erro 500 ao Salvar Rota

## 📋 Problema

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

## 🔍 O que está acontecendo

1. ✅ **Frontend está enviando dados corretamente**
2. ✅ **Geometria está sendo criada**  
3. ❌ **Backend retorna erro 500**

## 🛠️ Como Debugar

### 1. Ver Logs do Backend

Abra um novo terminal e execute:

```bash
docker-compose logs -f backend
```

### 2. Tente Salvar a Rota Novamente

No navegador:
1. Preencha o formulário
2. Selecione os pontos
3. Clique em "Criar Rota"
4. **Observe os logs** no terminal

### 3. Procure por:

```
ERROR    : ...
Traceback: ...
```

## 📊 Dados que Estão Sendo Enviados

Console do browser deve mostrar:

```javascript
Enviando dados da rota: {
  name: "Rota teste",
  description: "Rota teste",
  frequency: "daily",
  status: "active",
  estimated_duration: "01:00:00",
  estimated_distance: 49.68,
  geometry: {
    type: "LineString",
    coordinates: [
      [-46.567, -23.624],
      [-46.633, -23.55],
      // ...
    ]
  },
  collection_points: [
    { point_id: 1, sequence_order: 1, estimated_collection_time: "00:15:00" },
    // ...
  ]
}
```

## 🔧 Possíveis Causas

### 1. Campo `created_by` Faltando

O modelo requer `created_by`, mas pode não estar sendo setado.

**Solução:** Verificar se o serializer está setando corretamente:

```python
# serializers.py
def create(self, validated_data):
    validated_data['created_by'] = self.context['request'].user
    # ...
```

### 2. Formato de Geometria Inválido

GeoDjango pode não estar aceitando o GeoJSON.

**Teste:** Enviar como WKT em vez de GeoJSON

### 3. Pontos de Coleta Inexistentes

Se algum `point_id` não existir, pode causar erro.

### 4. Campo `estimated_duration` com Formato Errado

Django espera um `timedelta`, mas estamos enviando string `"01:00:00"`.

## ✅ Correção Rápida

### Opção 1: Ver Erro Detalhado

Adicione print no serializer:

```python
# backend/apps/routes/serializers.py

def create(self, validated_data):
    print("=" * 50)
    print("DADOS RECEBIDOS:", validated_data)
    print("=" * 50)
    
    try:
        collection_points_data = validated_data.pop('collection_points', [])
        validated_data['created_by'] = self.context['request'].user
        
        route = Route.objects.create(**validated_data)
        # ...
    except Exception as e:
        print("ERRO AO CRIAR ROTA:", str(e))
        import traceback
        traceback.print_exc()
        raise
```

### Opção 2: Testar via Django Shell

```bash
docker-compose exec backend python manage.py shell
```

```python
from django.contrib.gis.geos import LineString
from apps.routes.models import Route
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first()

# Testar criação manual
coords = [
    (-46.567, -23.624),
    (-46.633, -23.55),
    (-46.691, -23.545)
]

line = LineString(coords, srid=4326)

route = Route.objects.create(
    name="Teste Manual",
    description="Teste",
    frequency="daily",
    status="active",
    geometry=line,
    estimated_duration="01:00:00",
    estimated_distance=10.5,
    created_by=user
)

print("Rota criada:", route.id)
```

## 📝 Checklist de Verificação

Execute no Django shell:

```python
# 1. Verificar usuário
from django.contrib.auth import get_user_model
User = get_user_model()
print("Usuários:", User.objects.count())

# 2. Verificar pontos de coleta
from apps.collection_points.models import CollectionPoint
print("Pontos:", CollectionPoint.objects.count())
print("IDs:", list(CollectionPoint.objects.values_list('id', flat=True)))

# 3. Testar geometria
from django.contrib.gis.geos import LineString
line = LineString([(-46.567, -23.624), (-46.633, -23.55)], srid=4326)
print("Geometria válida:", line.valid)
```

## 🎯 Próximos Passos

1. **Execute:** `docker-compose logs -f backend`
2. **Tente salvar** a rota novamente
3. **Copie o erro** completo dos logs
4. **Me envie** o erro para análise

## 📚 Formato Esperado pelo Backend

### GeoDjango aceita:

```python
# 1. GeoJSON (objeto)
{
    "type": "LineString",
    "coordinates": [[lng, lat], [lng, lat]]
}

# 2. WKT (string)
"LINESTRING(-46.567 -23.624, -46.633 -23.55)"

# 3. Objeto LineString
from django.contrib.gis.geos import LineString
LineString([(lng, lat), (lng, lat)], srid=4326)
```

---

**Me envie os logs do backend para continuarmos! 🔍**
