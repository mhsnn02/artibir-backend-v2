import os
import json
import sqlite3
import base64
from datetime import datetime
import sys

# Ensure project root is in path
sys.path.append(os.getcwd())

def get_file_content(filepath):
    """Dosya içeriğini metin veya base64 (binary ise) olarak döner."""
    try:
        # Önce metin olarak okumayı dene
        with open(filepath, 'r', encoding='utf-8') as f:
            return {
                "type": "text",
                "content": f.read()
            }
    except UnicodeDecodeError:
        # Binary ise base64'e çevir
        try:
            with open(filepath, 'rb') as f:
                return {
                    "type": "binary",
                    "content": base64.b64encode(f.read()).decode('utf-8')
                }
        except Exception as e:
            return {"error": str(e)}
    except Exception as e:
        return {"error": str(e)}

def get_complete_project_data(startpath):
    """Tüm proje yapısını ve dosya içeriklerini JSON formatında toplar."""
    data = {}
    for root, dirs, files in os.walk(startpath):
        # Gizli klasörleri ve venv'i geç
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'venv' and d != '__pycache__']
        
        path = os.path.relpath(root, startpath)
        if path == ".":
            path = "root"
        
        # Windows pathlerini normalize et
        path = path.replace(os.sep, '/')
        
        data[path] = {
            "directories": dirs,
            "files": {}
        }
        
        for f in files:
            if not f.startswith('.'):
                filepath = os.path.join(root, f)
                # Kendi snapshot dosyalarını ve veritabanını içeriye metin olarak alma (çok büyük olabilir)
                if f in ['master_backend_snapshot.json', 'backend_snapshot.json', 'artibir.db']:
                    data[path]["files"][f] = {"type": "reference", "note": "Large file, skipped content"}
                else:
                    data[path]["files"][f] = get_file_content(filepath)
                    
    return data

def get_database_full_data(db_path):
    """SQLite veritabanındaki tüm tabloları ve verileri detaylıca alur."""
    if not os.path.exists(db_path):
        return {"error": "Database file not found"}
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall() if not row[0].startswith('sqlite_')]
    
    db_data = {}
    for table in tables:
        # Tablo şemasını al
        cursor.execute(f"PRAGMA table_info({table})")
        schema = [dict(row) for row in cursor.fetchall()]
        
        # Verileri al
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        
        db_data[table] = {
            "schema": schema,
            "row_count": len(rows),
            "data": [dict(row) for row in rows]
        }
    
    conn.close()
    return db_data

def get_detailed_routes():
    """FastAPI rotalarını detaylı bir şekilde döner."""
    try:
        from main import app
        routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                route_info = {
                    "path": route.path,
                    "name": route.name,
                    "methods": list(route.methods) if hasattr(route, 'methods') else [],
                }
                # Varsa docstring veya detaylar
                if hasattr(route, 'endpoint') and route.endpoint.__doc__:
                    route_info["description"] = route.endpoint.__doc__.strip()
                
                routes.append(route_info)
        return routes
    except Exception as e:
        return {"error": str(e)}

def generate_master_snapshot():
    print("Generating MASTER backend snapshot (including source code)...")
    
    start_time = datetime.now()
    
    master_snapshot = {
        "metadata": {
            "generated_at": start_time.isoformat(),
            "project_name": "ArtıBir Backend V2",
            "info": "This is a comprehensive master snapshot including code content, database, and structure."
        },
        "source_code": get_complete_project_data(os.getcwd()),
        "database": get_database_full_data("artibir.db"),
        "api_documentation": get_detailed_routes()
    }
    
    output_path = os.path.join("data", "master_backend_snapshot.json")
    os.makedirs("data", exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(master_snapshot, f, ensure_ascii=False, indent=4)
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print(f"MASTER Snapshot created successfully in {duration:.2f} seconds: {output_path}")
    return output_path

if __name__ == "__main__":
    generate_master_snapshot()
