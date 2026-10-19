@echo off
setlocal
cd /d "%~dp0..\backend"

if not exist ".venv\Scripts\python.exe" (
  py -m venv .venv
)
call .venv\Scripts\activate

if not exist ".deps_installed" (
  python -m pip install --upgrade pip
  pip install -r requirements.txt
  if errorlevel 1 exit /b 1
  type nul > .deps_installed
)

if not exist "..\dev\dev_env.bat" (
  echo [LOI] Chua co dev\dev_env.bat
  echo Hay copy dev_env.bat.example thanh dev_env.bat va cau hinh mat khau/khoa ky.
  pause
  exit /b 1
)
call "..\dev\dev_env.bat"

REM Portal dung custom AUTH_USER_MODEL nen bat buoc phai co migration initial.
if not exist "portal\migrations\0001_initial.py" (
  echo [DEV] Chua co portal migration. Dang tao 0001_initial.py...
  python manage.py makemigrations portal --noinput
  if errorlevel 1 (
    echo [LOI] Khong tao duoc migration portal.
    pause
    exit /b 1
  )
)

REM Database cua goi DEV duoc tao truoc bang database\bm04_dev_full.sql.
REM File SQL da chua schema hien tai cua cac bang Django + portal, nen KHONG duoc
REM chay migrate --fake-initial truc tiep: contenttypes 0002 se co gang xoa cot
REM 'name' da khong con trong schema hien tai va gay loi 1054.
REM Ta dong bo migration STATE bang --fake theo dung thu tu phu thuoc.
echo [DEV] Dong bo migration state voi database SQL co san...
python manage.py migrate contenttypes --fake --noinput
if errorlevel 1 goto :migration_error
python manage.py migrate auth --fake --noinput
if errorlevel 1 goto :migration_error
python manage.py migrate portal --fake --noinput
if errorlevel 1 goto :migration_error
python manage.py migrate admin --fake --noinput
if errorlevel 1 goto :migration_error
python manage.py migrate sessions --fake --noinput
if errorlevel 1 goto :migration_error

REM Neu sau nay co migration 0002+ cua portal, lenh nay se AP DUNG that cac migration moi.
python manage.py migrate --noinput
if errorlevel 1 goto :migration_error

python manage.py bootstrap
if errorlevel 1 (
  echo [LOI] Bootstrap that bai.
  pause
  exit /b 1
)

echo [DEV] Khoi dong Django tai http://127.0.0.1:8000
python manage.py runserver 127.0.0.1:8000
exit /b 0

:migration_error
echo.
echo [LOI] Migration that bai. KHONG xoa database.
echo Neu database da tao bang bm04_dev_full.sql, hay chay:
echo   dev\repair_prebuilt_db_migrations.bat
pause
exit /b 1
