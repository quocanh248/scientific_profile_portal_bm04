# Scientific Profile Portal BM-04 — V7 DEV (Route-based Frontend)

**Mục tiêu của bản này:** kiểm thử nghiệp vụ trên môi trường DEV trước khi đóng Docker production.

Stack DEV: React + TypeScript / Django REST / MySQL 8 / private file storage.

## V7 DEV — Tổ chức frontend theo URL / thư mục

V7 **không thay đổi backend, database hay nghiệp vụ V6.4**. Phần frontend được tách từ một `App.tsx` lớn thành cấu trúc route gần giống Next.js:

- `/` → `frontend/src/router/page.tsx`
- `/profile` → `frontend/src/router/profile/page.tsx`
- `/works` → `frontend/src/router/works/page.tsx`
- `/approvals` → `frontend/src/router/approvals/page.tsx`
- `/signature` → `frontend/src/router/signature/page.tsx`
- `/reports` → `frontend/src/router/reports/page.tsx`
- `/admin` → `frontend/src/router/admin/page.tsx`
- `/password` → `frontend/src/router/password/page.tsx`
- `/login` → `frontend/src/router/login/page.tsx`

`page.tsx` là file mặc định của một route. File phụ trợ đặt tên theo chức năng, ví dụ `profile/EvidenceSection.tsx`, `approvals/RelatedCheck.tsx`. Vì đây là Vite chứ không phải Next.js, `frontend/src/router/index.tsx` giữ bảng ánh xạ route thực tế.

Trang **Quản lý chữ ký** đã được tách khỏi trang **In & phê duyệt BM-04**, nhưng vẫn dùng nguyên API ký số cũ.

Xem `docs/FRONTEND_ROUTER_STRUCTURE_V7.md`.

## Thay đổi trọng tâm

- Tách **tài liệu đính kèm công trình** (tùy chọn) khỏi **minh chứng xác minh BM-04**.
- Minh chứng xác minh gắn trực tiếp với từng dữ liệu: đào tạo, quá trình công tác (không bắt buộc), công trình, SHTT, ứng dụng thực tiễn, nhiệm vụ KH,CN&ĐMST, giải thưởng, thành tựu khác.
- Phòng NCKH mở BM-04 và xác minh theo checklist từng mục, xem minh chứng ngay tại chỗ.
- Kết quả xác minh cũ được tái sử dụng khi cả dữ liệu và minh chứng không thay đổi.
- Mỗi lần gửi tạo snapshot dữ liệu + minh chứng bất biến; BM-04 cũ không đổi khi hồ sơ hiện tại được cập nhật.
- Hồ sơ bị trả sửa tạo version mới và giảng viên ký lại.
- Log tra cứu theo giảng viên, người thao tác, loại hành động và khoảng thời gian.
- Thông báo/xác nhận/nhập lý do/mật khẩu ký số dùng modal, không dùng browser alert/confirm/prompt.

## Chạy DEV

Đọc `docs/README_DEV_V6.md`.

## Database DEV

- `database/bm04_dev_schema.sql`: schema V6.
- `database/bm04_dev_seed.sql`: dữ liệu danh mục ban đầu.
- `database/bm04_dev_full.sql`: schema + seed, import một lần.
- `database/bm04_v5_to_v6_upgrade.sql`: script nâng DB V5 hiện hữu, dùng một lần sau khi backup.

## Docker

**Không có Docker production trong gói V6 DEV.** Sau khi kiểm thử và chốt nghiệp vụ, mới tạo bản Docker riêng.

## V6.2 – lưu ý migration cho DEV SQL
Nếu database được khởi tạo bằng `database/bm04_dev_full.sql`, không dùng trực tiếp `migrate --fake-initial`. Bản V6.2 đã sửa `dev/run_backend_dev.bat` để đồng bộ migration state đúng thứ tự. Với database V6/V6.1 đã tạo, chạy một lần `dev\repair_prebuilt_db_migrations.bat` rồi chạy backend bình thường.

## V6.3 DEV — Minh chứng có thời hạn

V6.3 sửa lỗi upload minh chứng 500, bổ sung Vô thời hạn/Có thời hạn, cảnh báo trước 30 ngày, chặn xác minh minh chứng hết hạn, và cho phép một minh chứng liên kết với nhiều thông tin. Xem `docs/CHANGELOG_V6_3_EVIDENCE_VALIDITY.md`.

## V6.4 DEV — Minh chứng công trình khoa học

Từ V6.4, file tải ở mục **Công trình khoa học** là **minh chứng bắt buộc** và được
sử dụng trực tiếp trong checklist xác minh BM-04. Trước khi chạy source V6.4 trên
DB V6.3.x, chạy `dev\upgrade_v6_3_to_v6_4.bat` sau khi sao lưu database.
