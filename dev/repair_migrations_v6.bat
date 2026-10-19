@echo off
setlocal
cd /d "%~dp0..\backend"

if not exist ".venv\Scripts\python.exe" (
  echo [LOI] Chua co backend\.venv. Hay chay run_backend_dev.bat mot lan de cai dependency.
  pause
  exit /b 1
)
if not exist "..\dev\dev_env.bat" (
  echo [LOI] Chua co dev\dev_env.bat.
  pause
  exit /b 1
)

call .venv\Scripts\activate
call "..\dev\dev_env.bat"

echo === 1. Tao migration portal neu chua co ===
if not exist "portal\migrations\0001_initial.py" (
  python manage.py makemigrations portal --noinput
  if errorlevel 1 goto :error
) else (
  echo portal\migrations\0001_initial.py da ton tai - bo qua makemigrations.
)

echo === 2. Dong bo migration voi database hien tai ===
python manage.py migrate --fake-initial --noinput
if errorlevel 1 goto :error

echo === 3. Kiem tra migration ===
python manage.py showmigrations portal
python manage.py showmigrations admin
python manage.py showmigrations auth

echo.
echo [OK] Da sua migration. Bay gio chay dev\run_backend_dev.bat.
pause
exit /b 0

:error
echo.
echo [LOI] Khong sua duoc migration. Gui toan bo log cho nguoi phat trien.
pause
exit /b 1
