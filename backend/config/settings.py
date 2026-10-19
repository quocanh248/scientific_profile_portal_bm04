"""Settings: MySQL in application; SQLite only for automated tests (TEST_SQLITE=1)."""
import os
from pathlib import Path
BASE_DIR=Path(__file__).resolve().parent.parent
SECRET_KEY=os.getenv('DJANGO_SECRET_KEY','')
if not SECRET_KEY:
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured('Thiếu DJANGO_SECRET_KEY. Cấu hình .env trước khi chạy.')
DEBUG=os.getenv('DJANGO_DEBUG','0')=='1'
ALLOWED_HOSTS=[h.strip() for h in os.getenv('DJANGO_ALLOWED_HOSTS','localhost,127.0.0.1,backend').split(',') if h.strip()]
CSRF_TRUSTED_ORIGINS=[u.strip() for u in os.getenv('DJANGO_CSRF_TRUSTED_ORIGINS','').split(',') if u.strip()]
INSTALLED_APPS=['django.contrib.admin','django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles','rest_framework','portal']
MIDDLEWARE=['django.middleware.security.SecurityMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','portal.middleware.ViewerAdminReadOnlyMiddleware','portal.middleware.MustChangePasswordMiddleware','django.contrib.messages.middleware.MessageMiddleware','django.middleware.clickjacking.XFrameOptionsMiddleware']
ROOT_URLCONF='config.urls'
TEMPLATES=[{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.debug','django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION='config.wsgi.application'
if os.getenv('TEST_SQLITE')=='1':
    DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':BASE_DIR/'test.sqlite3'}}
else:
    DATABASES={'default':{'ENGINE':'django.db.backends.mysql','NAME':os.getenv('MYSQL_DATABASE','research_profiles'),'USER':os.getenv('MYSQL_USER','research'),'PASSWORD':os.getenv('MYSQL_PASSWORD',''),'HOST':os.getenv('MYSQL_HOST','127.0.0.1'),'PORT':os.getenv('MYSQL_PORT','3306'),'OPTIONS':{'charset':'utf8mb4','init_command':"SET sql_mode='STRICT_TRANS_TABLES'"},'CONN_MAX_AGE':60}}
AUTH_USER_MODEL='portal.User'
AUTH_PASSWORD_VALIDATORS=[{'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},{'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator','OPTIONS':{'min_length':12}},{'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator'},{'NAME':'django.contrib.auth.password_validation.NumericPasswordValidator'}]
REST_FRAMEWORK={'DEFAULT_AUTHENTICATION_CLASSES':['rest_framework.authentication.SessionAuthentication'],'DEFAULT_PERMISSION_CLASSES':['rest_framework.permissions.IsAuthenticated'],'DEFAULT_RENDERER_CLASSES':['rest_framework.renderers.JSONRenderer']}
LANGUAGE_CODE='vi'
TIME_ZONE='Asia/Ho_Chi_Minh'
USE_I18N=True
USE_TZ=True
STATIC_URL='/static/'
STATIC_ROOT=BASE_DIR/'staticfiles'
PRIVATE_STORAGE_ROOT=Path(os.getenv('PRIVATE_STORAGE_ROOT',str(BASE_DIR/'private_storage')))
PROFILE_PDF_FONT=os.getenv('PROFILE_PDF_FONT','')
INTERNAL_SIGNING_MASTER_KEY=os.getenv('INTERNAL_SIGNING_MASTER_KEY','')
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE='Lax'
CSRF_COOKIE_SAMESITE='Lax'
SESSION_COOKIE_SECURE=os.getenv('COOKIE_SECURE','0')=='1'
CSRF_COOKIE_SECURE=os.getenv('COOKIE_SECURE','0')=='1'
SECURE_CONTENT_TYPE_NOSNIFF=True
X_FRAME_OPTIONS='DENY'
DATA_UPLOAD_MAX_MEMORY_SIZE=20*1024*1024
FILE_UPLOAD_MAX_MEMORY_SIZE=10*1024*1024
MAX_UPLOAD_BYTES=int(os.getenv('MAX_UPLOAD_BYTES',str(15*1024*1024)))
