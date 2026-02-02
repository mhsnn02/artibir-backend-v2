import os
import json
from datetime import datetime

def generate_project_paths():
    print("Generating project paths JSON...")
    
    startpath = os.getcwd()
    paths_list = []
    
    for root, dirs, files in os.walk(startpath):
        # Gizli klasörleri ve venv'i geç
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'venv' and d != '__pycache__']
        
        # Klasör yolunu ekle (relatif)
        rel_root = os.path.relpath(root, startpath)
        if rel_root != ".":
            paths_list.append(rel_root.replace(os.sep, '/'))
            
        # Dosya yollarını ekle
        for f in files:
            if not f.startswith('.'):
                rel_file = os.path.relpath(os.path.join(root, f), startpath)
                paths_list.append(rel_file.replace(os.sep, '/'))
    
    # Sırala
    paths_list.sort()
    
    output_data = {
        "generated_at": datetime.now().isoformat(),
        "total_items": len(paths_list),
        "paths": paths_list
    }
    
    output_path = os.path.join("data", "project_paths.json")
    os.makedirs("data", exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=4)
    
    print(f"Project paths JSON created successfully: {output_path}")
    return output_path

if __name__ == "__main__":
    generate_project_paths()
