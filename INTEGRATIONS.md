# Guia de Integrações - N0 Error Tracker

Este documento descreve como integrar o N0 Error Tracker com **N8n** e **HubSpot** para automação de workflows e sincronização de dados.

---

## 📡 Webhooks

O N0 Error Tracker possui um endpoint público de webhooks que aceita dados de sistemas externos:

**Endpoint**: `POST /api/trpc/webhooks.receive`

**Payload Base**:
```json
{
  "source": "n8n" | "hubspot" | "outro",
  "data": {
    // Dados específicos do source
  },
  "timestamp": "2024-01-17T10:00:00Z"
}
```

---

## 🔧 Integração com N8n

### Configuração do Webhook no N8n

1. **Criar novo Workflow** no N8n
2. **Adicionar nó "HTTP Request"**
3. **Configurar:**
   - **Method**: POST
   - **URL**: `https://seu-dominio.com/api/trpc/webhooks.receive`
   - **Headers**:
     ```
     Content-Type: application/json
     ```

### Payload N8n

```json
{
  "source": "n8n",
  "data": {
    "clientId": "CLIENT001",
    "key": "KEY-2024-001",
    "modules": "Module1,Module2",
    "origin": "Onboarding",
    "reason": "ClientBase",
    "assignedAgent": "Sarah",
    "records": "Record1,Record2",
    "status": "NoPrazo"
  },
  "timestamp": "{{ now() }}"
}
```

### Campos Suportados

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|------------|
| `clientId` | string | ID do cliente | ✅ |
| `key` | string | Chave única do report | ✅ |
| `modules` | string | Módulos importados | ❌ |
| `origin` | string | Origem (Onboarding, Production, Testing, Other) | ✅ |
| `reason` | string | Motivo (ClientBase, Modelador, Analista, Engenharia, Outro) | ✅ |
| `assignedAgent` | string | Agente responsável | ❌ |
| `records` | string | Registros afetados | ❌ |
| `status` | string | Status (NoPrazo, SLAVencida, Critico) | ✅ |

---

## 🤝 Integração com HubSpot

### Configuração de Custom Workflow no HubSpot

1. **Ir para Automation > Workflows**
2. **Criar novo workflow**
3. **Trigger**: Selecione o evento desejado (ex: "Contact created")
4. **Action**: Adicionar "Webhook" action
5. **Configurar:**
   - **URL**: `https://seu-dominio.com/api/trpc/webhooks.receive`
   - **Method**: POST
   - **Headers**: `Content-Type: application/json`

### Payload HubSpot

```json
{
  "source": "hubspot",
  "data": {
    "contact_id": "12345",
    "contact_name": "John Doe",
    "company_name": "Acme Corp",
    "issue_description": "Error in module X",
    "issue_type": "Bug",
    "created_at": "2024-01-17T10:00:00Z"
  },
  "timestamp": "2024-01-17T10:00:00Z"
}
```

### Mapeamento de Campos HubSpot → N0 Error Tracker

| HubSpot | N0 Error Tracker | Descrição |
|---------|------------------|-----------|
| `company_name` | `clientId` | Nome da empresa |
| `contact_id` | `key` | ID único do contato |
| `issue_type` | `modules` | Tipo de issue |
| `issue_description` | `records` | Descrição detalhada |
| `contact_name` | `assignedAgent` | Agente responsável |

---

## 🔐 Segurança

### Validação de Webhooks

Para proteger seus webhooks, você pode:

1. **Usar tokens de autenticação**:
   ```json
   {
     "source": "n8n",
     "token": "seu-token-secreto",
     "data": { ... }
   }
   ```

2. **Implementar IP Whitelist** no seu firewall

3. **Usar HTTPS** (obrigatório em produção)

---

## 📊 Exemplos de Automação

### Exemplo 1: Criar Report automaticamente quando contato é criado no HubSpot

```
HubSpot Contact Created
    ↓
Webhook para N0 Error Tracker
    ↓
Report criado automaticamente
    ↓
Notificação enviada ao agente
```

### Exemplo 2: Sincronizar reports do N8n baseado em eventos externos

```
Sistema Externo
    ↓
N8n processa dados
    ↓
Webhook para N0 Error Tracker
    ↓
Report criado com dados processados
    ↓
Dashboard atualizado em tempo real
```

---

## 🧪 Testando Webhooks

### Via cURL

```bash
curl -X POST https://seu-dominio.com/api/trpc/webhooks.receive \
  -H "Content-Type: application/json" \
  -d '{
    "source": "n8n",
    "data": {
      "clientId": "TEST001",
      "key": "TEST-KEY-001",
      "origin": "Onboarding",
      "reason": "ClientBase",
      "status": "NoPrazo"
    }
  }'
```

### Via Postman

1. **Method**: POST
2. **URL**: `https://seu-dominio.com/api/trpc/webhooks.receive`
3. **Body** (raw JSON):
   ```json
   {
     "source": "n8n",
     "data": {
       "clientId": "TEST001",
       "key": "TEST-KEY-001",
       "origin": "Onboarding",
       "reason": "ClientBase",
       "status": "NoPrazo"
     }
   }
   ```

---

## 📝 Logs e Monitoramento

Todos os webhooks recebidos são logados em:
- **Console do servidor**: `[Webhook] Received from {source}`
- **Database**: Tabela `error_reports` com `createdBy: 0` (sistema)

Para debugar, verifique os logs:
```bash
# Ver logs em tempo real
tail -f /var/log/n0-error-tracker.log
```

---

## ⚠️ Troubleshooting

### Webhook não está sendo recebido

1. Verifique se a URL está correta
2. Confirme que o servidor está rodando
3. Verifique firewall/proxy settings
4. Teste com cURL primeiro

### Dados não estão sendo salvos

1. Verifique se os campos obrigatórios estão presentes
2. Valide o formato do JSON
3. Verifique os logs do servidor
4. Confirme permissões de banco de dados

### Erro 401/403

1. Verifique token de autenticação (se implementado)
2. Confirme IP Whitelist
3. Verifique headers HTTP

---

## 📞 Suporte

Para mais informações ou problemas com integrações:
- Consulte a documentação do N8n: https://docs.n8n.io/
- Consulte a documentação do HubSpot: https://developers.hubspot.com/
- Abra uma issue no repositório do projeto
