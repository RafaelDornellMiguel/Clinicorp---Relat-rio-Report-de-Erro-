# N0 Error Tracker - Documentação Completa

## Visão Geral

O **N0 Error Tracker** é um sistema Full Stack moderno e robusto para acompanhamento em tempo real de reports de erro. Desenvolvido com React 19, Express 4, tRPC 11 e banco de dados MySQL, o sistema oferece uma solução completa para gerenciar, analisar e resolver problemas de forma eficiente e transparente.

## Arquitetura do Sistema

### Stack Tecnológico

| Componente | Tecnologia | Versão |
|-----------|-----------|--------|
| Frontend | React 19 + Tailwind CSS 4 | 19.2.1 |
| Backend | Express 4 + tRPC 11 | 4.21.2 / 11.6.0 |
| Banco de Dados | MySQL + Drizzle ORM | 3.15.0 / 0.44.5 |
| Autenticação | Manus OAuth | Built-in |
| Exportação | XLSX + PDF-lib | 0.18.5 / 1.17.1 |
| Testes | Vitest | 2.1.4 |

### Estrutura de Pastas

```
n0-error-tracker/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── contexts/         # React contexts
│   │   ├── lib/              # Utilidades e configurações
│   │   └── App.tsx           # Componente raiz
│   └── public/               # Arquivos estáticos
├── server/                    # Backend Express
│   ├── routers.ts            # Definição de procedures tRPC
│   ├── db.ts                 # Helpers de banco de dados
│   ├── alerts.ts             # Sistema de alertas automáticos
│   ├── reports-export.ts     # Geração de relatórios
│   ├── _core/                # Infraestrutura interna
│   └── *.test.ts             # Testes unitários
├── drizzle/                  # Schema e migrations
│   └── schema.ts             # Definição de tabelas
└── shared/                   # Código compartilhado
```

## Funcionalidades Implementadas

### 1. Dashboard Principal

O dashboard oferece uma visão geral em tempo real do status de todos os reports de erro:

- **Métricas KPI**: Total de reports, Críticos, SLA Vencida, Resolvidos
- **Gráficos de Distribuição**: Pie chart por status, Bar chart por agente, Area chart de tendências
- **Indicadores de SLA**: Taxa de conformidade, tempo médio de resolução
- **Atualização em Tempo Real**: Dados sincronizados automaticamente

### 2. Gerenciamento de Reports

Sistema CRUD completo para gerenciar reports de erro:

- **Criação**: Formulário intuitivo com todos os campos necessários
- **Listagem**: Tabela com paginação e filtros avançados
- **Edição**: Atualização de informações e status com histórico
- **Detalhes**: Visualização completa com histórico de mudanças e comentários
- **Deleção**: Apenas para administradores

### 3. Filtros Avançados

Busca e filtragem por múltiplos critérios:

- Filtro por status (No prazo, SLA Vencida, Crítico, Resolvido)
- Filtro por agente responsável
- Filtro por origem (Onboarding, Production, Testing, Other)
- Filtro por motivo (Cliente Base, Modelador, Analista, Engenharia, Em análise)
- Filtro por prioridade (Baixa, Média, Alta, Crítica)
- Filtro por período de criação (data de início e término)
- Busca por texto (ID do cliente, Chave, Módulos)
- Combinação de múltiplos filtros

### 4. Histórico de Status

Rastreamento completo de todas as mudanças:

- Registro automático de cada mudança de status
- Identificação de quem fez a mudança e quando
- Motivo da mudança documentado
- Visualização do histórico completo na página de detalhes

### 5. Comentários e Anotações

Sistema de comentários por report:

- Adicionar comentários com contexto
- Visualizar histórico de comentários
- Identificação do autor e data
- Facilita comunicação entre equipes

### 6. Exportação de Relatórios

Geração automática de relatórios em múltiplos formatos:

- **PDF**: Relatório formatado para impressão com todas as informações
- **Excel**: Planilha estruturada com abas separadas (Report, Histórico, Comentários)
- Inclui informações completas, histórico e comentários
- Acessível diretamente da página de detalhes do report

### 7. Analytics e Insights

Painel de analytics com gráficos e métricas avançadas:

- **Gráfico de Tendências**: Evolução de reports ao longo do tempo
- **Taxa de Resolução**: Percentual de reports resolvidos vs pendentes
- **Conformidade SLA**: Taxa de reports dentro do prazo
- **Distribuição por Motivo**: Análise dos tipos de erro mais comuns
- **Performance por Agente**: Comparação de produtividade entre agentes
- **Tempo Médio de Resolução**: Métrica de eficiência

### 8. Ações em Massa

Operações em lote para administradores:

- Selecionar múltiplos reports
- Atualizar status em massa
- Deletar reports em massa
- Confirmação de segurança antes de operações destrutivas

### 9. Sistema de Alertas Automáticos

Notificações automáticas para eventos críticos:

- **Alertas Críticos**: Notificação imediata quando report é marcado como crítico
- **Alertas SLA**: Notificação quando SLA está próximo do vencimento (3-4 dias)
- **SLA Vencido**: Atualização automática de status quando SLA expira (4+ dias)
- **Notificações para Admins**: Todos os administradores recebem as notificações
- **Job Scheduler**: Verificação automática a cada 5 minutos

### 10. Centro de Notificações

Interface centralizada para gerenciar notificações:

- Ícone de sino com contador de notificações não lidas
- Painel deslizável com lista de notificações
- Marcar como lido individualmente ou em massa
- Links diretos para os reports relacionados
- Tipos de notificação com cores e ícones distintos

### 11. Autenticação e Controle de Acesso

Sistema de roles baseado em permissões:

- **Admin**: Acesso completo a todas as funcionalidades
- **User**: Visualização e edição apenas de seus próprios reports
- **Proteção de Endpoints**: Todas as operações sensíveis verificam permissões
- **Manus OAuth**: Integração com sistema de autenticação Manus

## API tRPC - Referência Completa

### Reports Router

```typescript
// Listar reports com filtros
trpc.reports.list.useQuery({
  search?: string,
  status?: "NoPrazo" | "SLAVencida" | "Critico" | "Resolvido",
  reason?: string,
  origin?: string,
  assignedAgent?: string,
  priority?: "Low" | "Medium" | "High" | "Critical",
  startDate?: Date,
  endDate?: Date,
  limit?: number
})

// Obter report por ID
trpc.reports.getById.useQuery(reportId)

// Criar novo report (admin only)
trpc.reports.create.useMutation({
  clientId: string,
  key: string,
  modules?: string,
  origin?: string,
  reason?: string,
  assignedAgent?: string,
  priority?: string
})

// Atualizar report
trpc.reports.update.useMutation({
  id: number,
  status?: string,
  reason?: string,
  assignedAgent?: string,
  priority?: string,
  resolutionDescription?: string
})

// Deletar report (admin only)
trpc.reports.delete.useMutation(reportId)

// Obter estatísticas
trpc.reports.stats.useQuery()

// Tempo médio de resolução
trpc.reports.avgResolutionTime.useQuery()
```

### Comments Router

```typescript
// Adicionar comentário
trpc.comments.add.useMutation({
  reportId: number,
  comment: string
})

// Obter comentários do report
trpc.comments.getByReportId.useQuery(reportId)
```

### Notifications Router

```typescript
// Listar notificações
trpc.notifications.list.useQuery({
  unreadOnly?: boolean
})

// Marcar como lido
trpc.notifications.markAsRead.useMutation(notificationId)
```

### Export Router

```typescript
// Exportar para PDF
trpc.export.pdf.useMutation(reportId)

// Exportar para Excel
trpc.export.excel.useMutation(reportId)
```

## Modelo de Dados

### Tabela: error_reports

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único |
| clientId | VARCHAR(255) | ID do cliente |
| key | VARCHAR(255) | Chave única do report |
| modules | TEXT | Módulos importados |
| origin | ENUM | Origem (Onboarding, Production, Testing, Other) |
| reason | ENUM | Motivo (ClientBase, Modelador, Analista, Engenharia, EmAnalise) |
| assignedAgent | VARCHAR(255) | Nome do agente responsável |
| records | TEXT | Descrição dos registros afetados |
| status | ENUM | Status (NoPrazo, SLAVencida, Critico, Resolvido) |
| ticketUrl | VARCHAR(500) | URL do ticket |
| recommendedAction | VARCHAR(255) | Ação recomendada |
| resolutionDescription | TEXT | Descrição da resolução |
| resolutionDate | TIMESTAMP | Data de resolução |
| priority | ENUM | Prioridade (Low, Medium, High, Critical) |
| createdAt | TIMESTAMP | Data de criação |
| updatedAt | TIMESTAMP | Data de atualização |
| createdBy | INT | ID do usuário que criou |

### Tabela: status_history

Rastreia todas as mudanças de status com quem fez e quando.

### Tabela: report_comments

Armazena comentários e anotações dos usuários sobre cada report.

### Tabela: notifications

Gerencia notificações automáticas do sistema.

## Guia de Deployment

### Pré-requisitos

- Node.js 22.13.0 ou superior
- MySQL 8.0 ou superior
- npm ou pnpm

### Instalação Local

```bash
# Clonar repositório
git clone <repository-url>
cd n0-error-tracker

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar migrations
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

### Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL=mysql://user:password@localhost:3306/n0_error_tracker

# Autenticação
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Proprietário
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id

# APIs Manus
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### Build para Produção

```bash
# Compilar frontend e backend
pnpm build

# Iniciar servidor de produção
pnpm start
```

## Testes

O projeto inclui testes unitários abrangentes usando Vitest:

```bash
# Executar todos os testes
pnpm test

# Executar testes com coverage
pnpm test --coverage

# Executar testes em modo watch
pnpm test --watch
```

### Cobertura de Testes

- ✅ Autenticação e logout
- ✅ CRUD de reports
- ✅ Filtros e busca
- ✅ Estatísticas e analytics
- ✅ Validação de entrada
- ✅ Controle de acesso
- ✅ Geração de relatórios

## Boas Práticas de Uso

### Para Administradores

1. **Gerenciamento de Agentes**: Atribua reports a agentes específicos para melhor distribuição de carga
2. **Monitoramento de SLA**: Revise regularmente o painel de analytics para identificar gargalos
3. **Ações em Massa**: Use a página de ações em massa para atualizar múltiplos reports simultaneamente
4. **Exportação de Relatórios**: Gere relatórios PDF para apresentação ao cliente

### Para Agentes

1. **Atualizar Status**: Mantenha o status do report atualizado conforme o progresso
2. **Adicionar Comentários**: Use comentários para documentar o progresso da resolução
3. **Respeitar SLA**: Priorize reports com SLA próximo do vencimento
4. **Documentar Resolução**: Preencha a descrição de resolução para futuras referências

## Suporte e Manutenção

### Logs e Debugging

Os logs do sistema estão disponíveis no console durante o desenvolvimento:

```bash
# Logs de alertas
[Alerts] Verificado X reports críticos
[Alerts] Verificado X reports com SLA próximo do vencimento

# Logs de banco de dados
[Database] Operação concluída com sucesso
```

### Troubleshooting

| Problema | Solução |
|----------|---------|
| Banco de dados não conecta | Verificar DATABASE_URL e credenciais MySQL |
| Alertas não funcionam | Verificar se o job scheduler foi iniciado |
| Notificações não aparecem | Verificar permissões do usuário e status do banco |
| Exportação falha | Verificar espaço em disco e permissões de arquivo |

## Roadmap Futuro

- [ ] Integração com webhooks para notificações por email/SMS
- [ ] Dashboard mobile responsivo
- [ ] Relatórios agendados automáticos
- [ ] Integração com sistemas de ticketing externos
- [ ] Análise preditiva de SLA
- [ ] Auditoria completa de alterações
- [ ] Backup automático de dados

## Licença

Este projeto é propriedade exclusiva e confidencial.

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2026  
**Desenvolvido por**: Manus AI
