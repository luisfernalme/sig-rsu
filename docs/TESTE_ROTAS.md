# 🧪 Guia de Teste - Funcionalidades de Rotas

## ⚡ Preparação

### 1. Iniciar o Projeto
```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

### 2. Acessar o Sistema
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Admin Django: http://localhost:8000/admin

### 3. Login
Use as credenciais configuradas ou crie um superusuário:
```bash
docker-compose exec backend python manage.py createsuperuser
```

## ✅ Checklist de Testes

### 1. Teste de Carregamento da Página
- [ ] Acesse `/routes` no menu
- [ ] Verifique se a página carrega sem erros
- [ ] Confirme que o spinner de loading aparece
- [ ] Verifique se a lista de rotas é exibida (ou estado vazio)

### 2. Teste de Criação de Rota

#### Passo a Passo:
1. [ ] Clique no botão **"Nova Rota"**
2. [ ] Verifique se o modal abre corretamente
3. [ ] Preencha o formulário:
   - Nome: "Rota Teste Centro"
   - Descrição: "Rota de teste para o centro da cidade"
   - Frequência: "Diária"
   - Status: "Ativa"
   - Duração: "02:30:00"
   - Distância: "15.5"
4. [ ] Selecione alguns pontos de coleta
5. [ ] Desenhe a rota no mapa (clique em vários pontos)
6. [ ] Verifique se os pontos são numerados
7. [ ] Teste o botão **"Desfazer"**
8. [ ] Redesenhe a rota
9. [ ] Clique em **"Criar Rota"**
10. [ ] Verifique se aparece mensagem de sucesso (toast)
11. [ ] Confirme que a rota aparece na lista

#### Validações:
- [ ] Tente criar sem nome (deve mostrar erro)
- [ ] Tente criar sem pontos de coleta (deve mostrar erro)
- [ ] Tente criar sem desenhar rota (deve mostrar erro)
- [ ] Tente criar com distância negativa (deve mostrar erro)

### 3. Teste de Visualização no Mapa

#### Passo a Passo:
1. [ ] Clique no botão **"Ver Mapa"** de uma rota
2. [ ] Verifique se o modal de mapa abre
3. [ ] Confirme que a rota é exibida no mapa
4. [ ] Verifique marcadores de início (verde) e fim (vermelho)
5. [ ] Clique nos marcadores e veja os popups
6. [ ] Passe o mouse sobre pontos de coleta (tooltips)
7. [ ] Verifique se as informações da rota estão corretas
8. [ ] Teste zoom in/out do mapa
9. [ ] Feche o modal

### 4. Teste de Edição de Rota

#### Passo a Passo:
1. [ ] Clique no botão **"Editar"** de uma rota
2. [ ] Verifique se o modal abre com dados preenchidos
3. [ ] Modifique alguns campos:
   - Altere o nome
   - Mude a frequência
   - Ajuste a distância
4. [ ] Modifique pontos de coleta selecionados
5. [ ] Ajuste a rota no mapa
6. [ ] Clique em **"Atualizar Rota"**
7. [ ] Verifique mensagem de sucesso
8. [ ] Confirme que as mudanças aparecem no card

### 5. Teste de Otimização

#### Passo a Passo:
1. [ ] Clique no botão **"Otimizar"** de uma rota
2. [ ] Verifique o spinner no botão
3. [ ] Aguarde o processamento
4. [ ] Confirme mensagem de sucesso com economia
5. [ ] Verifique se a distância foi atualizada no card
6. [ ] Abra o mapa e confirme a otimização

### 6. Teste de Exclusão

#### Passo a Passo:
1. [ ] Clique no botão de **Excluir** (lixeira)
2. [ ] Confirme que aparece popup de confirmação
3. [ ] Clique em "Cancelar" (deve manter a rota)
4. [ ] Clique novamente em **Excluir**
5. [ ] Clique em "OK" para confirmar
6. [ ] Verifique mensagem de sucesso
7. [ ] Confirme que a rota sumiu da lista

### 7. Teste de Estado Vazio

#### Passo a Passo:
1. [ ] Delete todas as rotas
2. [ ] Verifique se aparece o estado vazio
3. [ ] Confirme ícone e mensagem amigável
4. [ ] Clique em **"Criar Primeira Rota"**
5. [ ] Verifique se abre o modal de criação

### 8. Teste de Responsividade

#### Desktop (> 1200px):
- [ ] Verifique layout de 3 colunas
- [ ] Confirme que cards ficam lado a lado
- [ ] Teste todos os botões

#### Tablet (768px - 1200px):
- [ ] Redimensione janela ou use DevTools
- [ ] Verifique layout de 2 colunas
- [ ] Teste navegação

#### Mobile (< 768px):
- [ ] Redimensione para mobile
- [ ] Verifique layout de 1 coluna
- [ ] Confirme que botões ficam em coluna
- [ ] Teste modal de criação
- [ ] Verifique mapa responsivo

### 9. Teste de Notificações (Toasts)

- [ ] Criação bem-sucedida → Toast verde
- [ ] Atualização bem-sucedida → Toast verde
- [ ] Exclusão bem-sucedida → Toast verde
- [ ] Otimização bem-sucedida → Toast verde com detalhes
- [ ] Erro de rede → Toast vermelho
- [ ] Erro de validação → Toast vermelho

### 10. Teste de Performance

- [ ] Crie 10+ rotas
- [ ] Verifique tempo de carregamento
- [ ] Teste scroll suave
- [ ] Verifique animações de hover
- [ ] Teste múltiplas operações seguidas

### 11. Teste de Erros

#### Sem Backend:
1. [ ] Pare o backend: `docker-compose stop backend`
2. [ ] Tente acessar rotas
3. [ ] Verifique mensagem de erro amigável
4. [ ] Reinicie: `docker-compose start backend`

#### Token Expirado:
1. [ ] Simule token expirado (espere ou force)
2. [ ] Faça uma operação
3. [ ] Verifique refresh automático

#### Dados Inválidos:
- [ ] Tente criar rota com coordenadas inválidas
- [ ] Tente criar com ponto de coleta inexistente
- [ ] Verifique tratamento de erros

### 12. Teste de Integração com Backend

#### Via Django Admin:
1. [ ] Acesse `/admin`
2. [ ] Vá em Rotas
3. [ ] Crie uma rota manualmente
4. [ ] Volte ao frontend
5. [ ] Recarregue a página
6. [ ] Confirme que a rota aparece

#### Via API Direta:
```bash
# Listar rotas
curl -H "Authorization: Bearer {token}" http://localhost:8000/api/routes/

# Criar rota
curl -X POST http://localhost:8000/api/routes/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

## 🔍 Pontos de Atenção

### Console do Browser (F12)
- [ ] Não deve haver erros em vermelho
- [ ] Warnings podem existir (Leaflet, etc)
- [ ] Verifique Network tab para chamadas API

### Console do Backend
```bash
docker-compose logs -f backend
```
- [ ] Não deve haver erros 500
- [ ] Requests devem retornar 200/201
- [ ] Verifique queries SQL (não devem ser excessivas)

### Database
```bash
docker-compose exec backend python manage.py shell
```
```python
from apps.routes.models import Route
Route.objects.all()  # Deve listar rotas criadas
```

## 🐛 Bugs Conhecidos / Limitações

1. **Algoritmo de Otimização**: Atualmente é simulado (15% de economia fixa)
2. **Geometria**: Pontos devem estar em ordem lógica
3. **Pontos de Coleta**: Devem existir antes de criar rotas
4. **Coordenadas**: Sistema usa Brasília como padrão inicial

## 📊 Critérios de Sucesso

### Must Have (Obrigatório):
- ✅ Criar rota com sucesso
- ✅ Editar rota com sucesso
- ✅ Visualizar rota no mapa
- ✅ Excluir rota com sucesso
- ✅ Validações funcionando
- ✅ Toasts aparecendo
- ✅ Responsividade básica

### Should Have (Desejável):
- ✅ Otimização funcionando
- ✅ Animações suaves
- ✅ Loading states
- ✅ Tratamento de erros
- ✅ Layout profissional

### Nice to Have (Opcional):
- ⏳ Filtros e busca
- ⏳ Paginação
- ⏳ Exportação
- ⏳ Estatísticas

## 📝 Relatório de Bugs

Se encontrar bugs, documente:

```markdown
## Bug: [Título]

**Descrição:** [O que aconteceu]

**Passos para Reproduzir:**
1. ...
2. ...
3. ...

**Comportamento Esperado:** [O que deveria acontecer]

**Comportamento Atual:** [O que realmente acontece]

**Screenshots:** [Se aplicável]

**Ambiente:**
- Browser: 
- OS: 
- Versão do Docker: 

**Logs:**
```
[Cole logs relevantes]
```
```

## ✅ Checklist Final

Antes de considerar concluído:

- [ ] Todos os testes básicos passam
- [ ] Não há erros no console
- [ ] Layout responsivo funciona
- [ ] Toasts aparecem corretamente
- [ ] Backend responde corretamente
- [ ] Validações funcionam
- [ ] Performance aceitável
- [ ] Documentação atualizada

## 🎉 Sucesso!

Se todos os testes passaram, as funcionalidades de alta prioridade estão **implementadas e funcionais**!

---

**Próximos Passos:**
1. Implementar funcionalidades de média prioridade
2. Adicionar testes automatizados
3. Melhorar algoritmo de otimização
4. Adicionar mais features

**Última atualização:** 09/10/2025
