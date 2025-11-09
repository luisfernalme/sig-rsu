# 🚀 Comandos Rápidos - Testar Registro

## ▶️ Iniciar o Sistema

```powershell
# Na raiz do projeto
docker-compose up -d
```

## 🌐 Acessar a Aplicação

```
Frontend:  http://localhost:3000
Registro:  http://localhost:3000/register
Login:     http://localhost:3000/login
Admin:     http://localhost:8000/admin
API Docs:  http://localhost:8000/api/docs/
```

## 👤 Criar Usuário via Interface

1. Abra: `http://localhost:3000/register`
2. Preencha o formulário
3. Clique em "Criar Conta"

## 📝 Dados de Teste Rápido

```
Username: teste123
Email: teste@email.com
Nome: João
Sobrenome: Silva
Telefone: 11987654321
Função: Visualizador
Senha: SenhaForte123
Confirmar: SenhaForte123
```

## 🧪 Testar API Diretamente

### Registrar via cURL

```powershell
curl -X POST http://localhost:8000/api/auth/register/ `
  -H "Content-Type: application/json" `
  -d '{
    \"username\": \"teste456\",
    \"email\": \"teste456@email.com\",
    \"first_name\": \"Maria\",
    \"last_name\": \"Santos\",
    \"password\": \"SenhaForte123\",
    \"password_confirm\": \"SenhaForte123\",
    \"role\": \"viewer\"
  }'
```

### Login via cURL

```powershell
curl -X POST http://localhost:8000/api/auth/login/ `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"teste@email.com\",
    \"password\": \"SenhaForte123\"
  }'
```

## 🔍 Verificar Usuários Criados

### Via Django Admin

```powershell
# 1. Criar superuser (se não existir)
docker-compose exec backend python manage.py createsuperuser

# 2. Acessar
# http://localhost:8000/admin
# 3. Login com superuser
# 4. Ir em Users
```

### Via Django Shell

```powershell
# Acessar shell
docker-compose exec backend python manage.py shell

# Listar usuários
from apps.authentication.models import User
User.objects.all()

# Ver último usuário criado
User.objects.last()

# Contar usuários
User.objects.count()
```

### Via SQL (PostgreSQL)

```powershell
# Acessar banco
docker-compose exec db psql -U residuos_user -d residuos_db

# Ver usuários
SELECT id, username, email, first_name, last_name, role FROM users;

# Sair
\q
```

## 📊 Ver Logs

### Logs do Frontend

```powershell
docker-compose logs -f frontend
```

### Logs do Backend

```powershell
docker-compose logs -f backend
```

### Logs de Todos os Serviços

```powershell
docker-compose logs -f
```

## 🔄 Reiniciar Serviços

### Reiniciar Frontend

```powershell
docker-compose restart frontend
```

### Reiniciar Backend

```powershell
docker-compose restart backend
```

### Reiniciar Tudo

```powershell
docker-compose restart
```

## 🧹 Limpar e Reconstruir

### Parar tudo

```powershell
docker-compose down
```

### Parar e remover volumes (⚠️ apaga dados)

```powershell
docker-compose down -v
```

### Reconstruir imagens

```powershell
docker-compose build --no-cache
docker-compose up -d
```

## 🐛 Debug

### Erro: Porta 3000 em uso

```powershell
# Ver processo na porta
netstat -ano | findstr :3000

# Matar processo (substitua <PID>)
taskkill /PID <PID> /F
```

### Erro: Porta 8000 em uso

```powershell
# Ver processo na porta
netstat -ano | findstr :8000

# Matar processo (substitua <PID>)
taskkill /PID <PID> /F
```

### Erro: Docker não responde

```powershell
# Reiniciar Docker Desktop
# Ou via PowerShell como Admin:
Restart-Service docker
```

## 📦 Instalar Dependências (se necessário)

### Backend

```powershell
docker-compose exec backend pip install -r requirements.txt
```

### Frontend

```powershell
docker-compose exec frontend npm install
```

## 🔐 Gerenciar Usuários

### Criar Superuser

```powershell
docker-compose exec backend python manage.py createsuperuser
```

### Alterar Senha de Usuário

```powershell
docker-compose exec backend python manage.py changepassword <username>
```

### Desativar Usuário (via shell)

```powershell
docker-compose exec backend python manage.py shell

from apps.authentication.models import User
user = User.objects.get(email='teste@email.com')
user.is_active = False
user.save()
```

## 📸 Capturar Screenshots

### Via Navegador

1. Abra `http://localhost:3000/register`
2. Pressione `F12` (DevTools)
3. `Ctrl+Shift+P` → "Capture screenshot"

## ✅ Checklist de Teste

```powershell
# 1. Sistema iniciado?
docker-compose ps

# 2. Frontend acessível?
curl http://localhost:3000

# 3. Backend acessível?
curl http://localhost:8000/api/auth/login/

# 4. Banco de dados acessível?
docker-compose exec db pg_isready

# 5. Redis acessível?
docker-compose exec redis redis-cli ping
```

## 🎯 Teste Completo em 5 Minutos

```powershell
# 1. Iniciar (30s)
docker-compose up -d

# 2. Aguardar inicialização (30s)
Start-Sleep -Seconds 30

# 3. Abrir navegador (manual)
Start-Process "http://localhost:3000/register"

# 4. Preencher formulário (2min)
# ... preencher manualmente ...

# 5. Verificar no admin (1min)
Start-Process "http://localhost:8000/admin"

# 6. Ver logs (30s)
docker-compose logs backend | Select-String "POST /api/auth/register"
```

## 🔥 Atalhos Úteis

```powershell
# Alias para comandos frequentes (adicionar ao seu profile)
function dcup { docker-compose up -d }
function dcdown { docker-compose down }
function dclogs { docker-compose logs -f }
function dcrestart { docker-compose restart }
function dcshell { docker-compose exec backend python manage.py shell }
function dctest { docker-compose exec backend python manage.py test }
```

## 📞 Se Precisar de Ajuda

1. **Verificar logs**: `docker-compose logs -f`
2. **Verificar status**: `docker-compose ps`
3. **Reiniciar**: `docker-compose restart`
4. **Documentação**: Ver `docs/REGISTRO_USUARIOS.md`
5. **Problemas comuns**: Ver `docs/TESTE_REGISTRO.md`

---

**Última atualização**: 9 de novembro de 2025
