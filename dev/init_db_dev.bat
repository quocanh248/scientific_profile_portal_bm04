@echo off
setlocal
cd /d "%~dp0.."
echo Khoi tao MySQL database research_profiles_dev tu database\bm04_dev_full_v8.sql
echo He thong se yeu cau mat khau MySQL root.
mysql -u root -p < database\bm04_dev_full_v8.sql
if errorlevel 1 (
  echo [LOI] Khong khoi tao duoc database. Kiem tra MySQL va PATH.
  pause
  exit /b 1
)
echo [OK] Database DEV da duoc khoi tao.
pause
endlocal
