@echo off
title Upload Laporan Harian ke GitHub
color 0B
echo.
echo  =====================================================
echo   UPLOAD LAPORAN HARIAN KE GITHUB
echo  =====================================================
echo.
echo  Script ini akan:
echo  1. Inisialisasi Git di folder ini
echo  2. Commit semua file
echo  3. Push ke GitHub repository kamu
echo.
echo  -----------------------------------------------------
echo.

:: --- Tanya username GitHub ---
set /p GH_USER=Masukkan USERNAME GitHub kamu: 
if "%GH_USER%"=="" (
    echo [ERROR] Username tidak boleh kosong!
    pause
    exit /b
)

:: --- Tanya nama repo ---
echo.
set /p GH_REPO=Masukkan nama repository (default: laporan-harian): 
if "%GH_REPO%"=="" set GH_REPO=laporan-harian

echo.
echo  [*] Akan upload ke: https://github.com/%GH_USER%/%GH_REPO%
echo.
echo  PENTING: Pastikan kamu sudah membuat repository "%GH_REPO%"
echo  di GitHub dengan cara:
echo   - Buka https://github.com/new
echo   - Repository name: %GH_REPO%
echo   - Pilih PUBLIC
echo   - JANGAN centang "Add README"
echo   - Klik "Create repository"
echo.
pause

echo.
echo  [1/5] Inisialisasi Git...
git init
if errorlevel 1 goto :error

echo.
echo  [2/5] Menambahkan semua file...
git add .
if errorlevel 1 goto :error

echo.
echo  [3/5] Commit file...
git commit -m "Laporan Harian Kerja PWA - Initial Upload"
if errorlevel 1 goto :error

echo.
echo  [4/5] Mengatur branch utama...
git branch -M main
if errorlevel 1 goto :error

echo.
echo  [5/5] Menghubungkan ke GitHub dan upload...
git remote remove origin 2>nul
git remote add origin https://github.com/%GH_USER%/%GH_REPO%.git
git push -u origin main
if errorlevel 1 goto :push_error

echo.
echo  =====================================================
color 0A
echo   BERHASIL DIUPLOAD!
echo  =====================================================
echo.
echo  Sekarang aktifkan GitHub Pages:
echo.
echo  1. Buka: https://github.com/%GH_USER%/%GH_REPO%/settings/pages
echo  2. Di bagian "Source" pilih: Deploy from a branch
echo  3. Branch: main  /  Folder: / (root)
echo  4. Klik SAVE
echo.
echo  Tunggu 1-2 menit, lalu app kamu bisa diakses di:
echo.
echo   https://%GH_USER%.github.io/%GH_REPO%
echo.
echo  Salin link itu ke pwabuilder.com untuk buat APK!
echo.
goto :done

:push_error
echo.
color 0C
echo  [!] Gagal push. Kemungkinan penyebab:
echo      - Belum buat repo di GitHub (buat dulu!)
echo      - Belum login Git. Jalankan perintah:
echo        git config --global user.email "emailkamu@gmail.com"
echo        git config --global user.name "Nama Kamu"
echo      - Lalu jalankan script ini lagi.
echo.
goto :done

:error
echo.
color 0C
echo  [ERROR] Terjadi kesalahan, coba jalankan lagi.
echo.

:done
echo.
pause
