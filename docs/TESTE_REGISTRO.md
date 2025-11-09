# 🧪 Guia Rápido de Teste - Registro de Usuários

## Como Testar Agora

### 1️⃣ Inicie o Sistema

```bash
# No PowerShell, na raiz do projeto
docker-compose up -d
```

### 2️⃣ Acesse a Página de Registro

```
http://localhost:3000/register
```

### 3️⃣ Preencha o Formulário

**Dados de Exemplo**:

- **Nome de usuário**: `teste123`
- **E-mail**: `teste@email.com`
- **Nome**: `João`
- **Sobrenome**: `Silva`
- **Telefone**: `11987654321` (opcional)
- **Função**: `Visualizador`
- **Senha**: `SenhaForte123`
- **Confirmar Senha**: `SenhaForte123`

### 4️⃣ Clique em "Criar Conta"

**Resultado Esperado**:

- ✅ Mensagem de sucesso: "Cadastro realizado com sucesso! Bem-vindo!"
- ✅ Redirecionamento automático para o dashboard
- ✅ Navegação visível no topo
- ✅ Usuário logado

### 5️⃣ Teste a Navegação

1. **Faça logout**: Clique no seu nome → Sair
2. **Volte para login**: `http://localhost:3000/login`
3. **Veja o link de registro**: "Não tem uma conta? Cadastre-se aqui"
4. **Clique no link**: Deve ir para `/register`
5. **Faça login com o usuário criado**:
   - E-mail: `teste@email.com`
   - Senha: `SenhaForte123`

## ❌ Testes de Validação

### Teste 1: E-mail Inválido

```
E-mail: teste@teste
Resultado: ❌ "E-mail inválido"
```

### Teste 2: Senha Fraca

```
Senha: 123456
Resultado: ❌ "Senha deve conter letras maiúsculas, minúsculas e números"
```

### Teste 3: Senhas Diferentes

```
Senha: SenhaForte123
Confirmar: SenhaForte456
Resultado: ❌ "As senhas não coincidem"
```

### Teste 4: Username Curto

```
Nome de usuário: ab
Resultado: ❌ "Nome de usuário deve ter no mínimo 3 caracteres"
```

### Teste 5: E-mail Duplicado

```
1. Registre: teste@email.com
2. Tente registrar novamente: teste@email.com
Resultado: ❌ "Este e-mail já está cadastrado"
```

## ✅ Checklist de Funcionalidades

- [ ] Página de registro carrega corretamente
- [ ] Todos os campos estão visíveis
- [ ] Validações funcionam em tempo real
- [ ] Botão de mostrar/ocultar senha funciona
- [ ] Formulário envia dados corretamente
- [ ] Mensagens de erro são claras
- [ ] Login automático após registro
- [ ] Redirecionamento para dashboard
- [ ] Link entre login e registro funciona
- [ ] Usuário autenticado não pode acessar /register

## 🔍 Verificar no Backend

### Admin Django

```
1. Acesse: http://localhost:8000/admin
2. Login com superuser
3. Vá em Users
4. Verifique se o novo usuário foi criado
```

### API Diretamente

```bash
# Ver todos os usuários (precisa estar autenticado como admin)
curl http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🐛 Se Algo Der Errado

### Erro: Página não carrega

```bash
# Reinicie o frontend
docker-compose restart frontend
# Ou
cd frontend
npm start
```

### Erro: API não responde

```bash
# Verifique os logs do backend
docker-compose logs backend

# Reinicie o backend
docker-compose restart backend
```

### Erro: CORS

```bash
# Verifique se o CORS está configurado em settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
```

## 📸 Screenshots Esperados

### Página de Registro

- Card centralizado com fundo claro
- Ícone de reciclagem no topo
- Formulário com 2 colunas (em desktop)
- Campos com ícones
- Botão azul "Criar Conta"
- Link "Já tem conta? Faça login aqui"

### Após Registro

- Notificação verde no canto superior direito
- Dashboard carregado
- Nome do usuário na navegação
- Menu lateral visível

## 🎯 Próximos Passos

Após confirmar que o registro funciona:

1. **Testar diferentes funções**:

   - Crie usuário como Visualizador
   - Crie usuário como Operador
   - Crie usuário como Administrador

2. **Testar permissões**:

   - Verificar o que cada função pode fazer
   - Implementar controle de acesso nas páginas

3. **Adicionar funcionalidades**:
   - Recuperação de senha
   - Confirmação de e-mail
   - Edição de perfil

---

**Tempo estimado de teste**: 10-15 minutos  
**Última atualização**: 9 de novembro de 2025
