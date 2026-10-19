# BM-04 V6.1 DEV - Migration fix

## Triệu chứng

Django khởi động báo:

```text
ValueError: Dependency on app with no migrations: portal
```

## Nguyên nhân

`portal.User` là custom `AUTH_USER_MODEL`, nhưng source V6 DEV thiếu `portal/migrations/0001_initial.py`. Các migration hệ thống như `django.contrib.admin` tham chiếu tới user model này nên không thể dựng dependency graph.

## Cách sửa trên project V6 đang dùng

Không xóa database.

Từ thư mục project chạy:

```bat
dev\repair_migrations_v6.bat
```

Hoặc chạy thủ công:

```bat
cd backend
call .venv\Scripts\activate
call ..\dev\dev_env.bat
python manage.py makemigrations portal --noinput
python manage.py migrate --fake-initial --noinput
python manage.py showmigrations portal
python manage.py runserver 127.0.0.1:8000
```

Khi thành công, `showmigrations portal` phải hiển thị `0001_initial` với dấu `[X]`.
