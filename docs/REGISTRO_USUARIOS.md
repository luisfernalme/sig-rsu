# 📝 Sistema de Registro de Usuários

## 🎯 Visão Geral

Foi implementado um sistema completo de registro de novos usuários, permitindo que pessoas possam se cadastrar no sistema sem depender da criação manual pelo superuser do Django.

## ✨ Funcionalidades Implementadas

### 1. **Página de Registro** (`/register`)

- Formulário completo de cadastro com validações
- Campos obrigatórios e opcionais claramente identificados
- Validações em tempo real
- Feedback visual de erros
- Design responsivo e moderno

### 2. **Campos do Formulário**

#### Obrigatórios (\*):

- **Nome de Usuário**: Único no sistema, mínimo 3 caracteres
- **E-mail**: Único no sistema, formato válido
- **Nome**: Primeiro nome do usuário
- **Sobrenome**: Sobrenome do usuário
- **Senha**: Mínimo 8 caracteres, deve conter letras maiúsculas, minúsculas e números
- **Confirmar Senha**: Deve coincidir com a senha
- **Função**: Papel do usuário no sistema

#### Opcionais:

- **Telefone**: Número de contato (validado se preenchido)

### 3. **Funções Disponíveis**

| Função            | Descrição                    | Permissões                   |
| ----------------- | ---------------------------- | ---------------------------- |
| **Visualizador**  | Apenas visualiza dados       | Somente leitura              |
| **Operador**      | Registra coletas e operações | Leitura e escrita de coletas |
| **Administrador** | Acesso total ao sistema      | Todas as permissões          |

> **Padrão**: Novos usuários são criados como **Visualizador** por segurança.

## 🔒 Validações Implementadas

### Frontend (React)

```javascript
✅ Nome de usuário com mínimo 3 caracteres
✅ E-mail com formato válido
✅ Senha com mínimo 8 caracteres
✅ Senha com letras maiúsculas, minúsculas e números
✅ Confirmação de senha coincidente
✅ Telefone com formato válido (se preenchido)
✅ Todos os campos obrigatórios preenchidos
```

### Backend (Django)

```python
✅ Validação de senha forte (Django password validators)
✅ E-mail e username únicos no banco de dados
✅ Campos obrigatórios validados
✅ Criação automática de UserProfile
✅ Hash seguro de senhas
```

## 🚀 Como Usar

### Para Usuários

1. **Acesse a página de login** (`http://localhost:3000/login`)
2. **Clique em "Cadastre-se aqui"** no rodapé
3. **Preencha o formulário** com seus dados
4. **Escolha sua função** (padrão: Visualizador)
5. **Clique em "Criar Conta"**
6. **Login automático**: Após o cadastro, você será automaticamente autenticado

### Fluxo de Navegação

```
Login (/login)
    ↓ (não tem conta)
Registro (/register)
    ↓ (sucesso)
Dashboard (/dashboard)

Registro (/register)
    ↓ (já tem conta)
Login (/login)
```

## 🔐 Segurança

### Medidas de Segurança Implementadas:

1. **Validação de Senha Forte**

   - Mínimo 8 caracteres
   - Letras maiúsculas e minúsculas
   - Números obrigatórios
   - Validadores Django integrados

2. **E-mail Único**

   - Previne duplicação de contas
   - Usado como identificador principal

3. **Hash de Senhas**

   - Senhas nunca armazenadas em texto plano
   - Algoritmo bcrypt via Django

4. **Tokens JWT**

   - Autenticação stateless
   - Tokens de acesso (1 hora)
   - Tokens de refresh (7 dias)
   - Blacklist de tokens ao logout

5. **Proteção CSRF**
   - Proteção contra Cross-Site Request Forgery
   - Cookies HttpOnly

## 📡 API Endpoints

### POST `/api/auth/register/`

Cria um novo usuário no sistema.

**Request Body:**

```json
{
  "username": "joaosilva",
  "email": "joao@email.com",
  "first_name": "João",
  "last_name": "Silva",
  "phone": "(11) 98765-4321",
  "password": "SenhaForte123",
  "password_confirm": "SenhaForte123",
  "role": "viewer"
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": 1,
    "username": "joaosilva",
    "email": "joao@email.com",
    "first_name": "João",
    "last_name": "Silva",
    "phone": "(11) 98765-4321",
    "role": "viewer",
    "is_active": true,
    "date_joined": "2025-11-09T10:30:00Z"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Response (400 Bad Request):**

```json
{
  "email": ["Este e-mail já está cadastrado."],
  "username": ["Este nome de usuário já existe."],
  "password": ["Esta senha é muito comum."]
}
```

## 🎨 Interface do Usuário

### Design

- **Card centralizado** com sombra suave
- **Ícone de reciclagem** no topo
- **Formulário em duas colunas** (responsivo)
- **Botões com ícones** do Font Awesome
- **Validação visual** (bordas vermelhas em erros)
- **Loading state** durante processamento
- **Links de navegação** entre login e registro

### Responsividade

- **Desktop**: Formulário em 2 colunas
- **Tablet**: Formulário em 2 colunas
- **Mobile**: Formulário em 1 coluna

### Acessibilidade

- Labels claros e descritivos
- Mensagens de erro específicas
- Botão de mostrar/ocultar senha
- Indicação visual de campos obrigatórios
- Contraste adequado de cores

## 🧪 Testando a Funcionalidade

### Teste Manual

1. **Acesse o frontend**: `http://localhost:3000/register`

2. **Teste de Validação de Campos**:

   ```
   ❌ Deixar campo obrigatório vazio
   ❌ E-mail inválido (teste@teste)
   ❌ Username muito curto (ab)
   ❌ Senha fraca (123456)
   ❌ Senhas não coincidem
   ✅ Todos os campos válidos
   ```

3. **Teste de Duplicação**:

   ```
   1. Registre um usuário (user1@test.com)
   2. Tente registrar com mesmo e-mail
   3. Deve receber erro: "Este e-mail já está cadastrado"
   ```

4. **Teste de Login Automático**:

   ```
   1. Complete o registro
   2. Verifique redirecionamento para /dashboard
   3. Confirme que está autenticado (navegação visível)
   ```

5. **Teste de Navegação**:
   ```
   1. Acesse /register enquanto autenticado
   2. Deve redirecionar para /dashboard
   3. Faça logout
   4. Tente acessar /dashboard
   5. Deve redirecionar para /login
   ```

### Teste via API (curl/Postman)

```bash
# Registrar novo usuário
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teste",
    "email": "teste@email.com",
    "first_name": "Teste",
    "last_name": "Silva",
    "password": "SenhaForte123",
    "password_confirm": "SenhaForte123",
    "role": "viewer"
  }'

# Fazer login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@email.com",
    "password": "SenhaForte123"
  }'
```

## 🐛 Possíveis Erros e Soluções

### Erro: "Este e-mail já está cadastrado"

**Causa**: E-mail já existe no banco de dados  
**Solução**: Use um e-mail diferente

### Erro: "As senhas não coincidem"

**Causa**: Senha e confirmação diferentes  
**Solução**: Digite a mesma senha nos dois campos

### Erro: "Senha muito fraca"

**Causa**: Senha não atende aos requisitos mínimos  
**Solução**: Use pelo menos 8 caracteres com letras e números

### Erro: "Token inválido"

**Causa**: Token JWT expirado ou inválido  
**Solução**: Faça login novamente

### Erro de conexão

**Causa**: Backend não está rodando  
**Solução**: Execute `docker-compose up` ou `python manage.py runserver`

## 📝 Melhorias Futuras

### Curto Prazo

- [ ] Confirmação de e-mail
- [ ] Recuperação de senha
- [ ] Verificação de força da senha em tempo real
- [ ] Captcha para prevenir bots
- [ ] Limite de tentativas de registro

### Médio Prazo

- [ ] Login social (Google, Facebook)
- [ ] Autenticação de dois fatores (2FA)
- [ ] Sistema de convites
- [ ] Aprovação de novos usuários por admin
- [ ] Auditoria de registros

### Longo Prazo

- [ ] Integração com Active Directory/LDAP
- [ ] SSO (Single Sign-On)
- [ ] Biometria
- [ ] Análise de comportamento suspeito

## 📊 Estatísticas de Implementação

| Aspecto          | Status           |
| ---------------- | ---------------- |
| **Frontend**     | ✅ Completo      |
| **Backend**      | ✅ Completo      |
| **Validações**   | ✅ Completo      |
| **Segurança**    | ✅ Implementada  |
| **Testes**       | ⚠️ Manual apenas |
| **Documentação** | ✅ Completa      |

## 🔗 Arquivos Relacionados

- **Frontend**:

  - `frontend/src/pages/Register.js` - Página de registro
  - `frontend/src/pages/Login.js` - Página de login (atualizada)
  - `frontend/src/App.js` - Rotas atualizadas
  - `frontend/src/services/api.js` - Função `authAPI.register()`
  - `frontend/src/index.css` - Estilos de autenticação

- **Backend**:
  - `backend/apps/authentication/views.py` - View `register()`
  - `backend/apps/authentication/serializers.py` - `UserRegistrationSerializer`
  - `backend/apps/authentication/models.py` - Model `User` e `UserProfile`
  - `backend/apps/authentication/urls.py` - Rota `/register/`

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a [Documentação Completa](DOCUMENTACAO_COMPLETA.md)
2. Verifique os logs do backend: `docker-compose logs backend`
3. Verifique o console do navegador (F12)
4. Abra uma issue no repositório

---

**Última atualização**: 9 de novembro de 2025  
**Versão**: 1.0.0
