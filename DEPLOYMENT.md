# Guia de Deployment Gratuito - N0 Error Tracker

Este guia mostra como fazer deploy do N0 Error Tracker em plataformas gratuitas ou de baixo custo.

## Opção 1: Railway (Recomendado - Crédito Gratuito)

Railway oferece $5 de crédito gratuito por mês, suficiente para rodar a aplicação.

### Passo 1: Preparar o Repositório

```bash
# Fazer push do código para GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/n0-error-tracker.git
git push -u origin main
```

### Passo 2: Conectar ao Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub"
4. Autentique e selecione o repositório `n0-error-tracker`

### Passo 3: Configurar Variáveis de Ambiente

No painel do Railway:

1. Vá para "Variables"
2. Adicione todas as variáveis de `.env`:

```
DATABASE_URL=mysql://...
JWT_SECRET=seu-secret
VITE_APP_ID=seu-app-id
... (todas as outras variáveis)
```

### Passo 4: Configurar Banco de Dados

1. No Railway, clique em "+ New"
2. Selecione "MySQL"
3. O `DATABASE_URL` será preenchido automaticamente
4. Execute as migrations:

```bash
# Via Railway CLI
railway run pnpm db:push
```

### Passo 5: Deploy

Railway fará deploy automaticamente quando você fizer push para `main`.

**Custo**: $5/mês de crédito gratuito (suficiente para aplicação pequena)

---

## Opção 2: Render (Alternativa Gratuita)

Render oferece tier gratuito com limitações, mas é uma boa opção para começar.

### Passo 1: Preparar o Código

Criar arquivo `render.yaml` na raiz do projeto:

```yaml
services:
  - type: web
    name: n0-error-tracker
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      # ... outras variáveis
  
  - type: mysql
    name: n0-error-tracker-db
    version: "8.0"
```

### Passo 2: Conectar ao Render

1. Acesse [render.com](https://render.com)
2. Clique em "New +"
3. Selecione "Web Service"
4. Conecte seu repositório GitHub

### Passo 3: Configurar Variáveis

Adicione todas as variáveis de ambiente no painel do Render.

### Passo 4: Deploy

Render fará deploy automaticamente.

**Custo**: Gratuito (com limitações: 0.5 CPU, 512 MB RAM, dorme após 15 min inatividade)

---

## Opção 3: Heroku (Alternativa Paga, mas com Free Tier Antigo)

Se você ainda tem acesso ao free tier do Heroku (antes de novembro 2022):

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login
heroku login

# Criar app
heroku create seu-app-name

# Adicionar MySQL
heroku addons:create cleardb:ignite

# Configurar variáveis
heroku config:set JWT_SECRET=seu-secret
heroku config:set VITE_APP_ID=seu-app-id
# ... outras variáveis

# Deploy
git push heroku main
```

**Custo**: Pago (Dynos custam $7+/mês)

---

## Opção 4: Vercel + Supabase (Recomendado para Escalabilidade)

Vercel é gratuito para frontend, Supabase oferece tier gratuito para banco de dados.

### Passo 1: Preparar o Projeto

Separar frontend e backend:

```bash
# Frontend em Vercel
# Backend em Railway ou Render
```

### Passo 2: Deploy Frontend no Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Passo 3: Deploy Backend

Use Railway ou Render (ver opções acima).

### Passo 4: Conectar Supabase para Banco

1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto (gratuito)
3. Use a `DATABASE_URL` do Supabase

**Custo**: Gratuito (com limitações: 500 MB storage, 2 GB bandwidth/mês)

---

## Opção 5: Docker + VPS Barato (DigitalOcean, Linode)

Para mais controle e melhor performance, use um VPS barato com Docker.

### Passo 1: Criar Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Passo 2: Criar docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://user:password@db:3306/n0_error_tracker
      - JWT_SECRET=${JWT_SECRET}
      # ... outras variáveis
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=n0_error_tracker
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

### Passo 3: Deploy em VPS

```bash
# SSH no servidor
ssh root@seu-vps

# Clonar repositório
git clone seu-repo
cd n0-error-tracker

# Iniciar com Docker
docker-compose up -d

# Executar migrations
docker-compose exec app pnpm db:push
```

**Custo**: $5-10/mês (DigitalOcean Droplet básico)

---

## Comparação de Opções

| Plataforma | Custo | Facilidade | Performance | Recomendação |
|-----------|-------|-----------|-------------|--------------|
| Railway | $5/mês | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Melhor custo-benefício |
| Render | Gratuito | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Bom para começar |
| Vercel + Supabase | Gratuito | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Escalável |
| Heroku | $7+/mês | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ Caro |
| Docker VPS | $5-10/mês | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Melhor controle |

---

## Passos Finais para Qualquer Plataforma

### 1. Verificar Saúde da Aplicação

```bash
# Testar endpoint de health check
curl https://seu-dominio.com/api/health
```

### 2. Configurar Domínio Customizado

A maioria das plataformas oferece domínio gratuito, mas você pode usar seu próprio:

1. Compre domínio em [Namecheap](https://namecheap.com) (~$1/ano)
2. Aponte DNS para a plataforma
3. Configure SSL (gratuito em todas as plataformas)

### 3. Monitorar Aplicação

Configure alertas para:
- Erros de aplicação
- Tempo de resposta lento
- Falhas de banco de dados

### 4. Backup de Dados

Configure backups automáticos:

```bash
# Backup manual do banco
mysqldump -u user -p database > backup.sql

# Restaurar
mysql -u user -p database < backup.sql
```

---

## Troubleshooting

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
pnpm install
pnpm build
```

### Erro: "Database connection refused"

1. Verificar `DATABASE_URL`
2. Verificar firewall do banco
3. Verificar credenciais

### Erro: "Port already in use"

```bash
# Usar porta diferente
PORT=3001 pnpm start
```

### Aplicação dorme em Render

Render coloca apps gratuitos em sleep após 15 min de inatividade. Use:

- [Kaffeine](https://kaffeine.herokuapp.com) para manter vivo
- Ou upgrade para plano pago

---

## Próximos Passos

1. ✅ Escolher plataforma de deployment
2. ✅ Seguir guia específico acima
3. ✅ Testar aplicação em produção
4. ✅ Configurar domínio customizado
5. ✅ Configurar backups automáticos
6. ✅ Monitorar performance

**Suporte**: Para dúvidas, consulte a documentação de cada plataforma ou abra uma issue no repositório.
