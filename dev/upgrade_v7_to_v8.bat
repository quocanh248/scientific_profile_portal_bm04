@echo off
setlocal
cd /d "%~dp0.."
echo Nang cap quy tac nghiep vu V7 -> V8 (khong doi schema)
echo Se yeu cau mat khau MySQL.
mysql -u root -p < database\bm04_v7_to_v8_business_rules.sql
if errorlevel 1 (
  echo [LOI] Khong cap nhat duoc danh muc V8.
  pause
  exit /b 1
)
echo [OK] Da cap nhat danh muc nhiem vu khoa hoc V8.
pause
endlocal
