import os
import json
import sqlite3
from datetime import datetime
import sys

# Ensure project root is in path
sys.path.append(os.getcwd())

def get_project_structure(startpath):
    """Proje dosya yapısını JSON formatına uygun şekilde tarar."""
    structure = {}
    for root, dirs, files in os.walk(startpath):
        # Gizli klasörleri ve venv'i geç
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'venv' and d != '__pycache__']
        
        path = root.replace(startpath, '').lstrip(os.sep)
        parts = path.split(os.sep) if path else []
        
        current = structure
        for part in parts:
            if part not in current:
                current[part] = {}
            current = current[part]
        
        for f in files:
            if not f.startswith('.'):
                current[f] = "file"
    return structure

def get_database_data(db_path):
    """SQLite veritabanındaki tüm verileri export eder."""
    if not os.path.exists(db_path):
        return {"error": "Database file not found"}
    
    conn = sqlite3.connect(db_path)
    # Satırları dict olarak almak için row_factory ayarla
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Tüm tabloları al
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall() if not row[0].startswith('sqlite_')]
    
    db_data = {}
    for table in tables:
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        db_data[table] = [dict(row) for row in rows]
    
    conn.close()
    return db_data

def get_api_routes():
    """FastAPI rotalarını basit bir liste olarak döner."""
    try:
        from main import app
        routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                routes.append({
                    "path": route.path,
                    "name": route.name,
                    "methods": list(route.methods) if hasattr(route, 'methods') else []
                })
        return routes
    except Exception as e:
        return {"error": str(e)}

def generate_snapshot():
    print("Generating backend snapshot...")
    
    snapshot = {
        "generated_at": datetime.now().isoformat(),
        "project_name": "ArtıBir Backend V2",
        "structure": get_project_structure(os.getcwd()),
        "api_endpoints": get_api_routes(),
        "database_content": get_database_data("artibir.db")
    }
    
    output_path = os.path.join("data", "backend_snapshot.json")
    os.makedirs("data", exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False, indent=4)
    
    print(f"Snapshot created successfully: {output_path}")
    return output_path

if __name__ == "__main__":
    generate_snapshot()
