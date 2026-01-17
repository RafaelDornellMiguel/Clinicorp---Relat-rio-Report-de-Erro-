import openpyxl from 'openpyxl';
import { getDb } from '../server/db.ts';
import { errorReports } from '../drizzle/schema.ts';

/**
 * Script para importar dados do Excel para o banco de dados
 * Uso: node scripts/import-excel-data.mjs <caminho-do-arquivo>
 */

const excelFilePath = process.argv[2];

if (!excelFilePath) {
  console.error('❌ Erro: Caminho do arquivo Excel não fornecido');
  console.error('Uso: node scripts/import-excel-data.mjs <caminho-do-arquivo>');
  process.exit(1);
}

async function importExcelData() {
  try {
    console.log('📂 Carregando arquivo Excel...');
    
    // Usar Python para ler o Excel (já que openpyxl não está disponível em Node)
    const { execSync } = await import('child_process');
    const fs = await import('fs');
    
    // Criar script Python temporário
    const pythonScript = `
import openpyxl
import json
import sys

filename = sys.argv[1]
wb = openpyxl.load_workbook(filename)
ws = wb.active

data = []
for i, row in enumerate(ws.iter_rows(min_row=4, values_only=True)):
    if row[0]:  # Se tem ID
        data.append({
            'id': row[0],
            'key': str(int(row[2])) if row[2] else None,
            'modules': row[3] or 'Não especificado',
            'origin': row[4] or 'Outro',
            'reason': row[5] or 'Em análise',
            'agent': row[6] or 'Não atribuído',
            'records': row[7] or '',
            'status': row[8] or 'No prazo',
            'ticket': row[9] or '',
            'action': row[10] or ''
        })

print(json.dumps(data, ensure_ascii=False))
`;

    const tempPythonFile = '/tmp/import_excel.py';
    fs.writeFileSync(tempPythonFile, pythonScript);
    
    console.log('🔄 Lendo dados do Excel...');
    const result = execSync(`python3 ${tempPythonFile} "${excelFilePath}"`).toString();
    const data = JSON.parse(result);
    
    console.log(`✅ Encontrados ${data.length} reports para importar`);
    
    // Conectar ao banco de dados
    const db = await getDb();
    if (!db) {
      throw new Error('Não foi possível conectar ao banco de dados');
    }
    
    // Mapear valores para os enums corretos
    const mapOrigin = (origin) => {
      const map = {
        'Onbording': 'onboarding',
        'Onboarding': 'onboarding',
        'Outro': 'other'
      };
      return map[origin] || 'other';
    };
    
    const mapReason = (reason) => {
      const map = {
        'Cliente (Base)': 'client_base',
        'Cliente Base': 'client_base',
        'Modelador': 'modeler',
        'Analista': 'analyst',
        'Engenharia': 'engineering',
        'Em análise': 'in_analysis'
      };
      return map[reason] || 'in_analysis';
    };
    
    const mapStatus = (status) => {
      const map = {
        'No prazo': 'on_time',
        'SLA Vencida': 'sla_expired',
        'Crítico': 'critical',
        'Resolvido': 'resolved'
      };
      return map[status] || 'on_time';
    };
    
    // Importar dados
    let imported = 0;
    let errors = 0;
    
    for (const report of data) {
      try {
        await db.insert(errorReports).values({
          clientId: report.id,
          key: report.key,
          modules: report.modules,
          origin: mapOrigin(report.origin),
          reason: mapReason(report.reason),
          agent: report.agent,
          records: report.records,
          status: mapStatus(report.status),
          ticket: report.ticket || null,
          recommendedAction: report.action || null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`  ✓ ${imported} reports importados...`);
        }
      } catch (err) {
        errors++;
        console.error(`  ❌ Erro ao importar report ${report.id}:`, err.message);
      }
    }
    
    console.log(`\n✅ Importação concluída!`);
    console.log(`   📊 ${imported} reports importados com sucesso`);
    if (errors > 0) {
      console.log(`   ⚠️  ${errors} erros durante a importação`);
    }
    
    // Limpar arquivo temporário
    fs.unlinkSync(tempPythonFile);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante importação:', error.message);
    process.exit(1);
  }
}

importExcelData();
