@echo off
setlocal enabledelayedexpansion
echo Artibbir Backend Terminali Baslatiliyor... 🧬🦾🛡️
echo.

echo [ADIM 1] Cihaz Baglantisi Kontrol Ediliyor...
adb devices
echo.

echo [ADIM 2] Tünel Olusturuluyor (adb reverse)...
adb reverse tcp:8000 tcp:8000
if %ERRORLEVEL% NEQ 0 (
    echo [!] KRITIK UYARI: ADB tüneli olusturulamadi!
    echo [?] Telefonunuz USB ile bagli mi?
    echo [?] "USB Hata Ayiklama" acik mi?
    echo [?] Eger emülatör kullaniyorsaniz bu hatayi gormezden gelebilirsiniz.
) else (
    echo [OK] Tünel Aktif: Mobil cihaz artik "http://127.0.0.1:8000" uzerinden erisebilir.
)
echo.

echo Sanal ortam aktif ediliyor...
call .venv\Scripts\activate
echo Paketler yukleniyor/guncelleniyor...
pip install -r requirements.txt
echo ========================================================
echo Backend basariyla baslatiliyor!
echo Tarayicinizda: http://127.0.0.1:8000
echo ========================================================
echo Sunucu baslatiliyor...
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
