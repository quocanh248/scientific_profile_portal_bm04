@echo off
setlocal
cd /d %~dp0..
if not exist dev\dev_env.bat (
  echo [LOI] Chua co dev\dev_env.bat. Hay copy dev_env.bat.example thanh dev_env.bat va cau hinh truoc.
  exit /b 1
)
call dev\dev_env.bat

echo Dang nang cap database V6.3.x -^> V6.4...
mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% --password="%MYSQL_PASSWORD%" %MYSQL_DATABASE% < database\bm04_v6_3_to_v6_4_work_evidence_required.sql
if errorlevel 1 (
  echo [LOI] Nang cap database that bai. Kiem tra MySQL va file dev_env.bat.
  exit /b 1
)
echo [OK] Database da nang cap V6.4.
endlocal
