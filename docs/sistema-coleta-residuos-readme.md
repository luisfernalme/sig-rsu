# Sistema Web para Controle da Coleta de Resíduos Sólidos Urbanos

Sistema web baseado em tecnologias de Sistema de Informação Geográfica (SIG) para auxiliar no controle e monitoramento da coleta de RSU em municípios de pequeno porte.

## Objetivo

Desenvolver uma plataforma funcional que permita a visualização de rotas de coleta, o cadastro de dados operacionais e a geração de relatórios, servindo como uma ferramenta de baixo custo para apoiar a tomada de decisão, otimizar a logística e promover a transparência na gestão de resíduos.

## Funcionalidades a Implementar

### 1. Gestão de Rotas
- **Visualização de rotas de coleta** em mapas interativos
- **Cadastro e edição de rotas** de coleta
- **Otimização de rotas** para reduzir distâncias e tempo percorrido
- **Monitoramento em tempo real** dos veículos de coleta (GPS)
- **Histórico de rotas** executadas

### 2. Pontos de Descarte
- **Mapeamento de pontos de descarte** e lixeiras
- **Cadastro de contêineres** com informações de capacidade
- **Status de coleta** por ponto (coletado/pendente)
- **Geolocalização precisa** de todos os pontos

### 3. Dados Operacionais
- **Cadastro de veículos** de coleta com dados técnicos
- **Registro de funcionários** e equipes
- **Controle de frequência** de coleta por área
- **Quantidade de resíduos coletados** por rota/período
- **Custos operacionais** (combustível, manutenção, pessoal)

### 4. Relatórios e Análises
- **Relatórios de desempenho** da coleta
- **Indicadores de eficiência** operacional
- **Relatórios de transparência** para a população
- **Análise de custos** e produtividade
- **Estatísticas de geração** de resíduos por região
- **Exportação de dados** em formato CSV/PDF

### 5. Interface de Usuário
- **Dashboard administrativo** com indicadores principais
- **Mapa interativo** para visualização das operações
- **Sistema de autenticação** e controle de acesso
- **Interface responsiva** para dispositivos móveis
- **Portal público** para consulta de horários e rotas

### 6. Funcionalidades de Transparência
- **Portal público** com informações da coleta
- **Calendário de coleta** por bairro/rua
- **Indicadores públicos** de desempenho
- **Canal de comunicação** com a população
- **Dados abertos** sobre a gestão de resíduos

## Tecnologias Previstas

### Frontend
- **HTML5, CSS3, JavaScript** - Estrutura e interatividade
- **React** - Framework para interfaces responsivas
- **Leaflet** - Biblioteca para mapas interativos
- **Bootstrap** - Framework CSS para responsividade

### Backend
- **Python** - Linguagem de programação principal
- **Django** - Framework web robusto
- **Django REST Framework** - APIs RESTful
- **Celery** - Tarefas assíncronas e agendamento

### Banco de Dados
- **PostgreSQL** - Banco de dados principal
- **PostGIS** - Extensão espacial para dados geográficos
- **Redis** - Cache e broker para Celery

### Ferramentas Complementares
- **QGIS** - Preparação e análise de dados espaciais
- **GeoServer** - Serviços geográficos (WMS, WFS)
- **Git/GitHub** - Controle de versão
- **Docker** - Containerização da aplicação

## Requisitos Funcionais (RF)

### RF01 - Autenticação e Autorização
- Login de usuários com diferentes níveis de acesso
- Controle de permissões por funcionalidade
- Recuperação de senha por email

### RF02 - Gestão de Rotas
- CRUD completo de rotas de coleta
- Visualização de rotas em mapa interativo
- Cálculo automático de distâncias
- Otimização de percursos

### RF03 - Cadastro de Pontos
- Registro de pontos de coleta com coordenadas
- Informações de tipo e capacidade de contêiner
- Status de coleta (coletado/pendente)

### RF04 - Controle Operacional
- Cadastro de veículos e equipes
- Registro de coletas realizadas
- Controle de horários e frequências

### RF05 - Relatórios
- Geração de relatórios personalizados
- Exportação em diferentes formatos
- Dashboards com indicadores visuais

### RF06 - API Pública
- Endpoints para dados de coleta
- Informações de horários por endereço
- Dados para aplicativos terceiros

## Requisitos Não Funcionais (RNF)

### RNF01 - Usabilidade
- Interface intuitiva e acessível
- Compatibilidade com navegadores modernos
- Design responsivo para dispositivos móveis

### RNF02 - Performance
- Tempo de resposta inferior a 3 segundos
- Otimização de consultas geoespaciais
- Cache de dados frequentemente acessados

### RNF03 - Segurança
- Criptografia de dados sensíveis
- Proteção contra ataques comuns (CSRF, XSS)
- Backup automático de dados

### RNF04 - Escalabilidade
- Arquitetura preparada para crescimento
- Suporte a múltiplos municípios
- Balanceamento de carga quando necessário

### RNF05 - Disponibilidade
- Sistema disponível 24/7
- Monitoramento de falhas
- Recuperação automática de erros

## Estrutura do Projeto

```
sistema-coleta-rsu/
├── backend/
│   ├── apps/
│   │   ├── authentication/
│   │   ├── routes/
│   │   ├── vehicles/
│   │   ├── collection_points/
│   │   ├── reports/
│   │   └── public_api/
│   ├── config/
│   ├── static/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── database/
│   ├── migrations/
│   └── fixtures/
├── docs/
│   ├── api/
│   ├── user-guide/
│   └── technical/
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

## Cronograma de Desenvolvimento

### Fase 1 - Levantamento de Requisitos (1 mês)
- Análise da legislação ambiental
- Estudo de sistemas similares
- Definição completa de requisitos
- Validação com stakeholders

### Fase 2 - Projeto da Arquitetura (1 mês)
- Design da arquitetura de software
- Modelagem do banco de dados geoespacial
- Definição de APIs e integrações
- Prototipagem de interfaces

### Fase 3 - Desenvolvimento e Implementação (2 meses)
- Configuração do ambiente de desenvolvimento
- Implementação do backend (Django + PostGIS)
- Desenvolvimento do frontend (React + Leaflet)
- Integração com serviços de mapas

### Fase 4 - Validação e Testes (1 mês)
- Testes unitários e de integração
- Testes de usabilidade
- Validação com usuários finais
- Correção de bugs e otimizações

### Fase 5 - Documentação e Finalização (1 mês)
- Documentação técnica completa
- Manual do usuário
- Guia de instalação e configuração
- Preparação para implantação

## Resultados Esperados

### Produtos Finais
1. **Sistema Web Completo**: Aplicação funcional com todas as funcionalidades implementadas
2. **Documentação Técnica**: Guias de instalação, configuração e manutenção
3. **Manual do Usuário**: Instruções detalhadas para uso do sistema
4. **API Documentada**: Endpoints públicos para integração

### Benefícios Esperados
- **Otimização de rotas**: Redução de até 40% nas distâncias percorridas
- **Transparência**: Acesso público a informações de coleta
- **Eficiência operacional**: Melhor controle e planejamento
- **Redução de custos**: Otimização de recursos e combustível
- **Conformidade legal**: Atendimento às exigências da PNRS

## Considerações Técnicas

### Banco de Dados Geoespacial
- Utilização do PostGIS para consultas espaciais eficientes
- Índices espaciais para otimização de performance
- Estrutura preparada para grandes volumes de dados

### Integração com Serviços de Mapas
- OpenStreetMap como base cartográfica principal
- Suporte a camadas WMS/WFS via GeoServer
- Geocodificação de endereços

### Arquitetura de Microserviços
- Separação clara entre frontend e backend
- APIs RESTful para comunicação
- Possibilidade de escalonamento independente

## Instalação e Configuração

### Pré-requisitos
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+ com PostGIS
- Redis (opcional, para cache)

### Configuração Básica
```bash
# Clone do repositório
git clone https://github.com/usuario/sistema-coleta-rsu.git

# Configuração do backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic

# Configuração do frontend
cd ../frontend
npm install
npm run build

# Execução em desenvolvimento
python manage.py runserver  # Backend
npm start                   # Frontend
```

## Contribuições

Este projeto está sendo desenvolvido como Trabalho de Conclusão de Curso em Sistemas de Informação pela Universidade Federal de Viçosa - Campus Rio Paranaíba.

**Autor**: Luís Fernando Almeida  
**Orientadora**: Adriana Zanella Martinhago  
**Ano**: 2025

---

*Sistema desenvolvido para atender às necessidades de municípios de pequeno porte na gestão eficiente e transparente da coleta de resíduos sólidos urbanos, em conformidade com a Política Nacional de Resíduos Sólidos.*