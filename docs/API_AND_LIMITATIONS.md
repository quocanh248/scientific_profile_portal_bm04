# API V1 theo BM-04 và giới hạn

Django dùng session + CSRF. Frontend React gọi cùng nguồn `/api/*` qua Nginx/Vite. Backend kiểm tra vai trò cho từng thao tác.

| Method | Endpoint | Mục đích / vai trò |
|---|---|---|
| GET | `/api/csrf/` | Lấy CSRF |
| POST | `/api/login/`, `/api/logout/`, `/api/password/` | Xác thực |
| GET | `/api/me/`, `/api/catalogs/` | Người đã đăng nhập |
| GET / PATCH | `/api/profile/` | Giảng viên xem hồ sơ nền; PATCH chỉ phần khoa học |
| POST | `/api/profile/draft-pdf/` | Giảng viên tạo bản nháp BM-04 cho một nhiệm vụ |
| GET / POST | `/api/works/` | Danh sách / khai báo công trình |
| GET / PATCH | `/api/works/{id}/` | Chi tiết / sửa bản nháp theo quyền |
| POST | `/api/works/{id}/evidence/` | Tải minh chứng vào kho private |
| POST | `/api/works/{id}/submit/` | Gửi xác minh |
| POST | `/api/works/{id}/review/` | Cán bộ NCKH xác minh/trả bổ sung/từ chối |
| GET / POST | `/api/link-requests/` | Liên kết giảng viên vào công trình chung |
| GET / POST | `/api/corrections/` | Yêu cầu sửa công trình đã xác minh |
| GET / POST | `/api/approvals/` | Danh sách / tạo hồ sơ BM-04 |
| POST | `/api/approvals/{id}/review/` | NCKH → lãnh đạo → chờ ký tay |
| POST | `/api/approvals/{id}/scan/` | NCKH tải bản scan ký tay |
| GET | `/api/approvals/{id}/pdf/`, `/api/approvals/{id}/scan/` | Tải tài liệu theo quyền |
| GET | `/api/reports/`, `/api/reports/export/` | Báo cáo NCKH/lãnh đạo/Admin |
| GET / POST | `/api/admin/users/` | Danh sách / tạo tài khoản nghiệp vụ |
| POST | `/api/admin/users/import/` | Nhập Excel tạo tài khoản + hồ sơ giảng viên |
| POST | `/api/admin/users/{id}/` | Khóa/mở, đổi vai trò |
| GET / POST | `/api/admin/departments/` | Quản lý đơn vị |
| PATCH | `/api/admin/departments/{id}/` | Cập nhật thông tin đơn vị phục vụ mục 7 |
| GET / PATCH | `/api/admin/lecturers/{id}/` | Admin quản lý thông tin nhân sự + mục 9 |

## Ràng buộc BM-04 đã triển khai

- Tên nhiệm vụ bắt buộc khi tạo/in hồ sơ.
- Chức danh đăng ký bắt buộc; “chức danh khác” phải ghi rõ.
- Mục 10 chỉ chọn tối đa 05 công trình đã xác minh và có liên kết với giảng viên.
- Mục 11, 12, 14 chỉ được chọn từ dữ liệu thuộc hồ sơ của chính giảng viên.
- Snapshot được chốt trước khi vào quy trình duyệt; thay đổi hồ sơ sau đó không làm thay bản đã gửi.
- Bản scan được lưu sau bước ký tay; V1 không giả lập chữ ký số.

## Chưa nằm trong V1

- Chữ ký số/PKI, xác thực chứng thư số.
- SSO/LDAP/AD của Nhà trường.
- ORCID/Crossref hoặc tự động lấy dữ liệu công bố từ Internet.
- Chấm điểm thi đua, quy đổi giờ NCKH, quản lý kinh phí đề tài.
- Antivirus/ICAP tích hợp sẵn (API lưu trữ đã giới hạn loại tệp/kích thước nhưng production nên bổ sung quét mã độc).
- Phân quyền cán bộ NCKH theo từng khoa/phạm vi phụ trách.

Trước nghiệm thu chính thức cần kiểm thử tích hợp bằng MySQL thật, HTTPS nội bộ, backup/restore đồng bộ DB + kho private, tải đồng thời và kiểm thử phân quyền.
