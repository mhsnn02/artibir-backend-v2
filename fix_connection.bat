@echo off
cls
color 0A
echo ==================================================
echo   ARTIBIR BAGLANTI VE VERITABANI ONARIM ARACI
echo ==================================================
echo.
echo Bu arac asagidaki islemleri yapacak:
echo 1. Windows Guvenlik Duvari'nda 8000 portunu acacak.
echo 2. Uyumsuzluk yaratan eski veritabanini (artibir.db) silecek.
echo.
echo [!] ONEMLI: Lutfen backend terminalini kapatin (CTRL+C) yoksa silme islemi basarisiz olur.
echo.
pause

echo.
echo [1/2] Guvenlik Duvari Kurali Ekleniyor...
netsh advfirewall firewall delete rule name="Artibir Backend" >nul 2>&1
netsh advfirewall firewall add rule name="Artibir Backend" dir=in action=allow protocol=TCP localport=8000
if %ERRORLEVEL% NEQ 0 (
    echo [!] HATA: Yonetici izni gerekli. Lutfen "Yonetici Olarak Calistir" yapin.
) else (
    echo [OK] 8000 portu erisime acildi.
)

echo.
echo [2/2] Veritabani Temizleniyor...
taskkill /F /IM uvicorn.exe /T >nul 2>&1
if exist artibir.db (
    del artibir.db
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Eski veritabani silindi.
    ) else (
        echo [!] HATA: artibir.db silinemedi. Backend terminali hala acik olabilir.
    )
) else (
    echo [OK] Veritabani dosyasi zaten yok.
)

echo.
echo ==================================================
echo ISLEM TAMAMLANDI.
echo.
echo Yapmaniz gerekenler:
echo 1. 'run_backend.bat' ile sunucuyu tekrar baslatin.
echo 2. Flutter uygulamasini tamamen kapatip tekrar acin ('flutter run').
echo 3. Mobilden kayit olmayi deneyin.
echo ==================================================
echo.
pause
