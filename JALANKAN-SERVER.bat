@echo off
title Laporan Harian Kerja - Server
color 0A
echo.
echo  ===================================================
echo   LAPORAN HARIAN KERJA - Local Server
echo  ===================================================
echo.

:: Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "169.254"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%

echo  [+] Menjalankan server di port 3456...
echo.
echo  ============================================
echo   Buka di HP Android kamu:
echo.
echo   http://%IP%:3456
echo.
echo   (Pastikan PC dan HP di WiFi yang sama!)
echo  ============================================
echo.
echo  Tekan CTRL+C untuk menghentikan server.
echo.

python -m http.server 3456

pause
