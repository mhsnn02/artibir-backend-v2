import os
import sqlite3
import time

# Veritabanı dosyanın adını buraya yaz
db_name = "artibir.db" 

def nuke_it():
    if os.path.exists(db_name):
        try:
            # Önce dosyanın kilitli olup olmadığını anlamak için basitçe silmeyi dene
            os.remove(db_name)
            print(f"✅ {db_name} başarıyla silindi. Geçmişe bir sünger çektik.")
        except PermissionError:
            print(f"❌ HATA: Dosya hala kilitli! Lütfen terminaldeki sunucuyu (Uvicorn) ve DB programlarını kapatıp tekrar dene.")
        except Exception as e:
            print(f"❌ Beklenmedik hata: {e}")
    else:
        print(f"🤔 {db_name} zaten yok Patron, ya adı farklı ya da çoktan uçmuş.")

if __name__ == "__main__":
    nuke_it()
