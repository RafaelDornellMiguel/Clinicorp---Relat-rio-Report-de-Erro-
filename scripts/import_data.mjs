import { getDb } from '../server/db.ts';
import { errorReports } from '../drizzle/schema.ts';
import { spawn } from 'child_process';

function mapOrigin(origin) {
  const mapping = {
    'Onbording': 'Onboarding',
    'Onboarding': 'Onboarding',
    'Outro': 'Other'
  };
  return mapping[origin] || 'Other';
}

function mapReason(reason) {
  const mapping = {
    'Cliente (Base)': 'ClientBase',
    'Cliente Base': 'ClientBase',
    'Modelador': 'Modelador',
    'Analista': 'Analista',
    'Engenharia': 'Engenharia',
    'Em análise': 'EmAnalise'
  };
  return mapping[reason] || 'EmAnalise';
}

function mapStatus(status) {
  const mapping = {
    'No prazo': 'NoPrazo',
    'SLA Vencida': 'SLAVencida',
    'Crítico': 'Critico',
    'Resolvido': 'Resolvido'
  };
  return mapping[status] || 'NoPrazo';
}

async function importData() {
  try {
    console.log('📂 Lendo dados do Excel...');
    
    const pythonCode = `
import openpyxl
import json
import sys

wb = openpyxl.load_workbook('relatorio.xlsx')
ws = wb.active

data = []
for i, row in enumerate(ws.iter_rows(min_row=4, values_only=True)):
    if row[0]:
        try:
            if not row[2]:
                continue
            try:
                key_int = int(float(row[2]))
            except (ValueError, TypeError):
                continue
            
            data.append({
                'id': str(row[0]).strip(),
                'key': str(key_int),
                'modules': str(row[3]).strip() if row[3] else 'Não especificado',
                'origin': str(row[4]).strip() if row[4] else 'Outro',
                'reason': str(row[5]).strip() if row[5] else 'Em análise',
                'agent': str(row[6]).strip() if row[6] else 'Não atribuído',
                'records': str(row[7]).strip() if row[7] else '',
                'status': str(row[8]).strip() if row[8] else 'No prazo',
                'ticket': str(row[9]).strip() if row[9] else '',
                'action': str(row[10]).strip() if row[10] else ''
            })
        except:
            continue

print(json.dumps(data, ensure_ascii=False))
`;

    const python = spawn('python3', ['-c', pythonCode]);
    let output = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    await new Promise((resolve, reject) => {
      python.on('close', (code) => {
        if (code !== 0) reject(new Error('Python error'));
        else resolve();
      });
    });

    const data = JSON.parse(output);
    console.log(`✅ Encontrados ${data.length} reports`);

    const db = await getDb();
    if (!db) throw new Error('DB connection failed');

    let imported = 0;
    for (const report of data) {
      try {
        await db.insert(errorReports).values({
          clientId: report.id,
          key: report.key,
          modules: report.modules,
          origin: mapOrigin(report.origin),
          reason: mapReason(report.reason),
          assignedAgent: report.agent,
          records: report.records,
          status: mapStatus(report.status),
          ticketUrl: report.ticket || null,
          recommendedAction: report.action || null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        imported++;
        if (imported % 5 === 0) console.log(`  ✓ ${imported}/${data.length}...`);
      } catch (e) {
        console.error(`  ❌ ${report.id}: ${e.message}`);
      }
    }

    console.log(`\n✅ ${imported} reports importados!`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  }
}

importData();
