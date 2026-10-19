@echo off
setlocal
cd /d "%~dp0..\backend"

if not exist ".venv\Scripts\python.exe" (
  echo [LOI] Chua co backend\.venv. Hay chay run_backend_dev.bat mot lan de cai dependencies.
  pause
  exit /b 1
)
call .venv\Scripts\activate

if not exist "..\dev\dev_env.bat" (
  echo [LOI] Chua co dev\dev_env.bat
  echo Hay copy dev_env.bat.example thanh dev_env.bat va cau hinh truoc.
  pause
  exit /b 1
)
call "..\dev\dev_env.bat"

REM Portal dung custom AUTH_USER_MODEL, can co 0001_initial trong migration graph.
if not exist "portal\migrations\0001_initial.py" (
  echo [DEV] Dang tao portal\migrations\0001_initial.py...
  python manage.py makemigrations portal --noinput
  if errorlevel 1 goto :error
)

echo.
echo [1/6] Danh dau migrations contenttypes theo schema SQL da co san...
python manage.py migrate contenttypes --fake --noinput
if errorlevel 1 goto :error

echo [2/6] Danh dau migrations auth theo schema SQL da co san...
python manage.py migrate auth --fake --noinput
if errorlevel 1 goto :error

echo [3/6] Danh dau portal 0001_initial theo schema SQL da co san...
python manage.py migrate portal --fake --noinput
if errorlevel 1 goto :error

echo [4/6] Danh dau migrations admin theo schema SQL da co san...
python manage.py migrate admin --fake --noinput
if errorlevel 1 goto :error

echo [5/6] Danh dau migrations sessions theo schema SQL da co san...
python manage.py migrate sessions --fake --noinput
if errorlevel 1 goto :error

echo [6/6] Dong bo va chay post_migrate (content types / permissions)...
python manage.py migrate --noinput
if errorlevel 1 goto :error

echo.
echo [OK] Migration state da khop voi database DEV tao tu bm04_dev_full.sql.
echo Kiem tra portal:
python manage.py showmigrations portal
pause
exit /b 0

:error
echo.
echo [LOI] Khong sua duoc migration state. KHONG drop database.
echo Gui lai phan loi cuoi cung de tiep tuc xu ly.
pause
exit /b 1
