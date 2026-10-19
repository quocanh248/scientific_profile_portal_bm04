# BM-04 V6 DEV — Minh chứng theo từng dữ liệu và xác minh từ biểu mẫu

## 1. Điểm thay đổi nghiệp vụ

V6 tách rõ hai khái niệm:

- `WorkEvidence`: **tài liệu đính kèm công trình**, hoàn toàn tùy chọn. Không còn là điều kiện bắt buộc để gửi công trình.
- `EvidenceDocument`: **minh chứng xác minh dữ liệu BM-04**, gắn trực tiếp với từng dòng dữ liệu của giảng viên: đào tạo, quá trình công tác, công trình, SHTT, ứng dụng thực tiễn, nhiệm vụ, giải thưởng, thành tựu khác.

Phòng NCKH mở một BM-04 và xác minh theo checklist từng mục. Mục quá trình công tác không bắt buộc có minh chứng nhưng vẫn cho Admin đính kèm.

## 2. Tái sử dụng kết quả xác minh

Mỗi mục có hai dấu vân tay:

- `content_hash`: SHA-256 của nội dung dữ liệu;
- `evidence_hash`: SHA-256 của danh sách minh chứng và hash file.

Kết quả xác minh trước chỉ được tái sử dụng khi **cả hai hash không thay đổi**. Chỉ cần sửa dữ liệu hoặc thêm/bớt minh chứng, BM-04 sau sẽ chuyển mục đó về `Chờ xác minh`.

## 3. Snapshot bất biến

Khi gửi BM-04, hệ thống snapshot đồng thời:

- dữ liệu chữ;
- danh sách minh chứng tại thời điểm gửi;
- hash dữ liệu;
- hash minh chứng;
- PDF tại thời điểm gửi.

Do đó BM-04 năm cũ luôn giữ đúng dữ liệu thời điểm cũ. Việc bổ sung bằng cấp hoặc minh chứng trong tương lai không làm thay đổi BM-04 đã gửi/ký.

## 4. Trả sửa và version

Hồ sơ bị trả sửa không bị ghi đè. Giảng viên dùng `Tạo phiên bản mới & ký lại`:

- V1 vẫn giữ nguyên trong lịch sử;
- V2 tạo snapshot mới từ dữ liệu hiện tại;
- giảng viên nhập lại mật khẩu và ký lại;
- các mục không thay đổi được tái sử dụng xác minh;
- mục thay đổi phải xác minh lại.

## 5. Log

`portal_auditlog` bổ sung `lecturer_id`, cho phép lọc theo:

- giảng viên;
- người thao tác;
- loại hành động;
- từ ngày/đến ngày.

Các thao tác cập nhật lý lịch và minh chứng ghi lại dữ liệu trước/sau hoặc metadata file/hash cần thiết.

## 6. Modal

Frontend không còn dùng `window.alert`, `window.confirm`, `window.prompt`. Mọi thông báo/xác nhận/nhập lý do/nhập mật khẩu ký số sử dụng modal thống nhất. Modal mật khẩu dùng `input type=password`, có nút hiện/ẩn ký tự và mật khẩu không được ghi log.

## 7. Chạy DEV trên Windows

1. Cài MySQL 8.x, Python 3.12+, Node.js 20+.
2. Chạy `dev\init_db_dev.bat` để import `database\bm04_dev_full.sql`.
3. Copy `dev\dev_env.bat.example` thành `dev\dev_env.bat`, sửa mật khẩu DB và secret.
4. Tạo khóa ký nội bộ sau khi cài Python dependencies:
   `python backend\manage.py generate_signing_key`
   rồi đặt kết quả vào `INTERNAL_SIGNING_MASTER_KEY`.
5. Mở cửa sổ CMD 1: `dev\run_backend_dev.bat`.
6. Mở cửa sổ CMD 2: `dev\run_frontend_dev.bat`.
7. Truy cập `http://localhost:5173`.

## 8. Các file database

- `database/bm04_dev_schema.sql`: cấu trúc DB V6.
- `database/bm04_dev_seed.sql`: danh mục loại công trình và đơn vị mặc định.
- `database/bm04_dev_full.sql`: schema + seed để import một lần.
- `database/bm04_v5_to_v6_upgrade.sql`: script tham khảo nâng DB V5 hiện có; phải sao lưu trước khi dùng.

## 9. Phạm vi DEV

Bản này chủ đích chạy local DEV, chưa đóng gói Docker production. Docker sẽ được tạo sau khi kiểm thử nghiệp vụ và giao diện hoàn tất.

## V6.1 - Sửa lỗi `Dependency on app with no migrations: portal`

Bản V6 ban đầu có `portal/migrations/__init__.py` nhưng thiếu `0001_initial.py`. Vì `portal.User` là `AUTH_USER_MODEL`, Django Admin yêu cầu app `portal` phải có migration đầu tiên trước khi dựng migration graph.

V6.1 sửa `dev/run_backend_dev.bat` theo thứ tự:

1. Nạp biến môi trường DEV.
2. Nếu chưa có `portal/migrations/0001_initial.py`, chạy `python manage.py makemigrations portal --noinput`.
3. Chạy `python manage.py migrate --fake-initial --noinput`.
   - Nếu DB đã được tạo từ `bm04_dev_full.sql`, Django đánh dấu các migration initial tương ứng thay vì tạo lại bảng.
   - Nếu DB mới/rỗng, Django tạo bảng bình thường.
4. Chạy `bootstrap` sau migration.
5. Khởi động `runserver`.

Nếu đã gặp lỗi ở bản V6 cũ, không cần xóa database. Chạy:

```bat
dev\repair_migrations_v6.bat
```

sau đó chạy lại:

```bat
dev\run_backend_dev.bat
```

Không xóa database, không DROP TABLE và không chạy lại file SQL nếu dữ liệu DEV hiện tại cần giữ.
