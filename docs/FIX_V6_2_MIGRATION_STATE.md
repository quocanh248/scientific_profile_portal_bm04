# V6.2 DEV – sửa migration state cho database tạo sẵn bằng SQL

## Triệu chứng

Sau khi tạo `portal/migrations/0001_initial.py`, chạy:

```bat
python manage.py migrate --fake-initial --noinput
```

có thể lỗi:

```text
django.db.utils.OperationalError: (1054, "Unknown column 'name' in 'django_content_type'")
```

## Nguyên nhân

`bm04_dev_full.sql` đã tạo `django_content_type` theo schema Django hiện tại, tức là chỉ có `id`, `app_label`, `model`. Tuy nhiên bảng `django_migrations` ban đầu chưa ghi nhận lịch sử migration. Django vì vậy giả lập migration `contenttypes.0001`, rồi tiếp tục chạy thật `contenttypes.0002_remove_content_type_name`, dẫn đến việc cố xóa cột `name` vốn đã không tồn tại.

Đây là lỗi **migration state không khớp schema**, không phải mất/hỏng dữ liệu.

## Cách sửa không mất dữ liệu

Chạy:

```bat
dev\repair_prebuilt_db_migrations.bat
```

Script sẽ:

1. Tạo `portal/0001_initial.py` nếu chưa có.
2. Fake migration history cho `contenttypes`.
3. Fake migration history cho `auth`.
4. Fake `portal.0001_initial`.
5. Fake `admin` và `sessions`.
6. Chạy `migrate` bình thường để xử lý các migration mới trong tương lai và chạy post-migrate.

Không DROP database và không chạy lại file SQL.

## Kiểm tra

```bat
cd backend
.venv\Scripts\activate
call ..\dev\dev_env.bat
python manage.py showmigrations portal
python manage.py showmigrations contenttypes
python manage.py showmigrations auth
```

Các migration phải có dấu `[X]`.
