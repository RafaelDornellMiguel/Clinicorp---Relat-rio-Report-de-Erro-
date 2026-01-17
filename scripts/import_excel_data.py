#!/usr/bin/env python3
"""
Script para importar dados do Excel para o banco de dados N0 Error Tracker
Uso: python3 scripts/import_excel_data.py <caminho-do-arquivo> [database-url]
"""

import openpyxl
import sys
import os
from datetime import datetime
import mysql.connector

def map_origin(origin):
    """Mapear origem para enum do banco"""
    mapping = {
        'Onbording': 'onboarding',
        'Onboarding': 'onboarding',
        'Outro': 'other'
    }
    return mapping.get(origin, 'other')

def map_reason(reason):
    """Mapear motivo para enum do banco"""
    mapping = {
        'Cliente (Base)': 'client_base',
        'Cliente Base': 'client_base',
        'Modelador': 'modeler',
        'Analista': 'analyst',
        'Engenharia': 'engineering',
        'Em análise': 'in_analysis'
    }
    return mapping.get(reason, 'in_analysis')

def map_status(status):
    """Mapear status para enum do banco"""
    mapping = {
        'No prazo': 'on_time',
        'SLA Vencida': 'sla_expired',
        'Crítico': 'critical',
        'Resolvido': 'resolved'
    }
    return mapping.get(status, 'on_time')

def import_excel_data(excel_file, db_url):
    """Importar dados do Excel para o banco de dados"""
    
    print(f"📂 Carregando arquivo Excel: {excel_file}")
    
    # Validar arquivo
    if not os.path.exists(excel_file):
        print(f"❌ Erro: Arquivo não encontrado: {excel_file}")
        sys.exit(1)
    
    # Carregar workbook
    try:
        wb = openpyxl.load_workbook(excel_file)
        ws = wb.active
    except Exception as e:
        print(f"❌ Erro ao abrir arquivo Excel: {e}")
        sys.exit(1)
    
    # Extrair dados (começando da linha 4, pulando headers)
    data = []
    for i, row in enumerate(ws.iter_rows(min_row=4, values_only=True), 1):
        if row[0]:  # Se tem ID
            try:
                # Validar que a chave é um número
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
                print(f"⚠️  Erro ao processar linha {i}: {e}")
                continue
    
    print(f"✅ Encontrados {len(data)} reports para importar")
    
    # Conectar ao banco de dados
    print("🔄 Conectando ao banco de dados...")
    try:
        # Parse database URL
        # Formato: mysql://user:password@host:port/database
        db_url = db_url.replace('mysql://', '')
        # Dividir em user:password@host:port/database
        auth_part, host_part = db_url.split('@')
        user, password = auth_part.split(':')
        host_db_part, database = host_part.split('/')
        # Separar host e port
        if ':' in host_db_part:
            host, port = host_db_part.split(':')
            port = int(port)
        else:
            host = host_db_part
            port = 3306
        
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port
        )
        cursor = conn.cursor()
    except Exception as e:
        print(f"❌ Erro ao conectar ao banco de dados: {e}")
        sys.exit(1)
    
    # Importar dados
    imported = 0
    errors = 0
    
    for report in data:
        try:
            query = """
            INSERT INTO error_reports 
            (clientId, key, modules, origin, reason, agent, records, status, ticket, recommendedAction, createdAt, updatedAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (
                report['id'],
                report['key'],
                report['modules'],
                map_origin(report['origin']),
                map_reason(report['reason']),
                report['agent'],
                report['records'],
                map_status(report['status']),
                report['ticket'] if report['ticket'] else None,
                report['action'] if report['action'] else None,
                datetime.now(),
                datetime.now()
            )
            
            cursor.execute(query, values)
            imported += 1
            
            if imported % 10 == 0:
                print(f"  ✓ {imported} reports importados...")
        
        except Exception as e:
            errors += 1
            print(f"  ❌ Erro ao importar report {report['id']}: {e}")
    
    # Confirmar transação
    try:
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Erro ao confirmar importação: {e}")
        sys.exit(1)
    
    print(f"\n✅ Importação concluída!")
    print(f"   📊 {imported} reports importados com sucesso")
    if errors > 0:
        print(f"   ⚠️  {errors} erros durante a importação")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("❌ Erro: Caminho do arquivo Excel não fornecido")
        print("Uso: python3 scripts/import_excel_data.py <caminho-do-arquivo> [database-url]")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    
    # Usar DATABASE_URL da variável de ambiente se não fornecido
    db_url = sys.argv[2] if len(sys.argv) > 2 else os.environ.get('DATABASE_URL')
    
    if not db_url:
        print("❌ Erro: DATABASE_URL não fornecido e não encontrado nas variáveis de ambiente")
        sys.exit(1)
    
    import_excel_data(excel_file, db_url)
