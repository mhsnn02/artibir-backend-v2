import asyncio
import websockets
import requests
import json
import sys

# Windows Proactor Event Loop sorunu için
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000"

def register_and_login(email, password, name):
    # Register
    requests.post(f"{BASE_URL}/auth/signup", json={
        "email": email,
        "password": password,
        "full_name": name,
        "phone_number": "+905551234567"
    })
    
    # Login
    # Backend UserLogin şeması beklediği için JSON göndermeliyiz
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login Failed for {email}: {response.text}")
    return None

async def test_chat():
    print("--- 1. Kullanıcılar Oluşturuluyor ---")
    token1 = register_and_login("user1@univ.edu.tr", "Password123", "User One")
    token2 = register_and_login("user2@univ.edu.tr", "Password123", "User Two")
    
    if not token1 or not token2:
        print("Token alınamadı, test iptal.")
        return

    # ID'leri basitçe 1 ve 2 varsayıyoruz (DB sıfırlandığı için)
    user1_id = 1
    user2_id = 2

    print("\n--- 2. WebSocket Bağlantısı Kuruluyor ---")
    async with websockets.connect(f"{WS_URL}/ws/chat/{token1}") as ws1:
        print("User 1 Bağlandı")
        
        # Test 1: Normal Mesaj
        message = {
            "receiver_id": user2_id,
            "content": "Merhaba User 2, nasılsın?"
        }
        await ws1.send(json.dumps(message))
        
        response = await ws1.recv()
        print(f"\nUser 1 Gelen Yanıt (Kendi Mesajı): {response}")
        
        # Test 2: Sansürlü Mesaj
        bad_message = {
            "receiver_id": user2_id,
            "content": "Sen bir aptal ve gerizekalı mısın?"
        }
        print(f"\nUser 1 Yasaklı Mesaj Gönderiyor: {bad_message['content']}")
        await ws1.send(json.dumps(bad_message))
        
        response = await ws1.recv()
        print(f"User 1 Gelen Yanıt (Sansürlenmiş Olmalı): {response}")
        
    print("\n--- 3. Geçmiş Kontrolü (History) ---")
    # API üzerinden geçmişi çek (Şifresi çözülmüş gelmeli)
    headers = {"Authorization": f"Bearer {token1}"}
    resp = requests.get(f"{BASE_URL}/chat/history/{user2_id}", headers=headers)
    if resp.status_code == 200:
        history = resp.json()
        print(f"Mesaj Geçmişi ({len(history)} adet):")
        for msg in history:
            print(f"- {msg['content']}")
    else:
        print(f"Geçmiş çekilemedi: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_chat())
