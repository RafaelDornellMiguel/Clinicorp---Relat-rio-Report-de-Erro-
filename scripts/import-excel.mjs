#!/usr/bin/env node

import openpyxl from 'openpyxl';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { getDb } from '../server/db.ts';

/**
 * Script para importar dados do Excel para o banco de dados
 * Uso: node scripts/import-excel.mjs <caminho-do-arquivo>
 */

const excelFilePath = process.argv[2];

if (!excelFilePath) {
  console.error('❌ Erro: Caminho do arquivo Excel não fornecido');
  console.error('Uso: node scripts/import-excel.mjs <caminho-do-arquivo>');
  process.exit(1);
}

function mapOrigin(origin) {
  const mapping = {
    'Onbording': 'onboarding',
    'Onboarding': 'onboarding',
    'Outro': 'other'
  };
  return mapping[origin] || 'other';
}

function mapReason(reason) {
  const mapping = {
    'Cliente (Base)': 'client_base',
    'Cliente Base': 'client_base',
    'Modelador': 'modeler',
    'Analista': 'analyst',
    'Engenharia': 'engineering',
    'Em análise': 'in_analysis'
  };
  return mapping[reason] || 'in_analysis';
}

function mapStatus(status) {
  const mapping = {
    'No prazo': 'on_time',
    'SLA Vencida': 'sla_expired',
    'Crítico': 'critical',
    'Resolvido': 'resolved'
  };
  return mapping[status] || 'on_time';
}

async function readExcelWithPython(filePath) {
  return new Promise((resolve, reject) => {
    const pythonCode = `
import openpyxl
import json
import sys

filename = sys.argv[1]
wb = openpyxl.load_workbook(filename)
ws = wb.active

data = []
for i, row in enumerate(ws.iter_rows(min_row=4, values_only=True)):
    if row[0]:  # Se tem ID
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
        except Exception as e:
            continue

print(json.dumps(data, ensure_ascii=False))
`;

    const python = spawn('python3', ['-c', pythonCode, filePath]);
    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python error: ${error}`));
      } else {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      }
    });
  });
}

async function importExcelData() {
  try {
    console.log('📂 Carregando arquivo Excel...');
    const data = await readExcelWithPython(excelFilePath);
    
    console.log(`✅ Encontrados ${data.length} reports para importar`);
    
    // Conectar ao banco de dados
    const db = await getDb();
    if (!db) {
      throw new Error('Não foi possível conectar ao banco de dados');
    }
    
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
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante importação:', error.message);
    process.exit(1);
  }
}

importExcelData();
