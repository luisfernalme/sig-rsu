-- Inicialização do banco de dados
-- Este arquivo é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensão PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verificar se as extensões foram instaladas
SELECT name, default_version, installed_version 
FROM pg_available_extensions 
WHERE name LIKE 'postgis%' OR name = 'postgis';

-- Criar usuário adicional se necessário
-- (o usuário principal já é criado pelas variáveis de ambiente)

-- Configurações iniciais
GRANT ALL PRIVILEGES ON DATABASE residuos_db TO residuos_user;

-- Comentário informativo
-- O PostGIS foi configurado com sucesso!