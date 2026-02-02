import os
import json
import sqlite3
from datetime import datetime

def get_matrix_database(db_path):
    """Veritabanı verilerini 'satır-sütun' matrisi şeklinde döner."""
    if not os.path.exists(db_path):
        return {}
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall() if not row[0].startswith('sqlite_')]
    
    matrix_db = {}
    for table in tables:
        # Sütun isimlerini al
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Verileri al
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        
        # Matris yapısı: [ [header], [row1], [row2], ... ]
        matrix_db[table] = {
            "headers": columns,
            "rows": [list(row) for row in rows],
            "shape": f"{len(rows)}x{len(columns)}"
        }
    
    conn.close()
    return matrix_db

def generate_matrix_report():
    print("Generating Matrix (Square) JSON report...")
    
    report = {
        "metadata": {
            "type": "Matrix/Grid Report",
            "generated_at": datetime.now().isoformat(),
            "description": "Compact representation of data in matrix (row/column) format."
        },
        "database_matrix": get_matrix_database("artibir.db"),
        "api_summary": "More details in master_snapshot.json"
    }
    
    output_path = os.path.join("data", "backend_matrix_report.json")
    os.makedirs("data", exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        # separators=(',', ':') kullanarak daha sıkışık (inline) bir görünüm sağlanabilir ama 
        # kullanıcı 'düzgün' dediği için indent=2 ile devam ediyoruz.
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"Matrix report created: {output_path}")
    return output_path

if __name__ == "__main__":
    generate_matrix_report()
