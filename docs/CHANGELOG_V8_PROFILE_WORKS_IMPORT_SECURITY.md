# Changelog V8 DEV

## 1. Mục 10 Công trình khoa học
- Gỡ menu độc lập khỏi sidebar.
- `/works` redirect về `/profile`.
- Thêm/sửa công trình và tải minh chứng trực tiếp tại Mục 10 Lý lịch BM-04.
- Đổi label `Loại` thành `DM nhiệm vụ khoa học`.
- Không còn `Gửi kiểm tra công trình`, `Xác nhận công trình`, `Yêu cầu chỉnh sửa`, `Từ chối` ở workflow công trình riêng.
- Backend endpoint submit/review công trình legacy trả lỗi nghiệp vụ để ngăn client cũ sử dụng workflow đã bỏ.
- Minh chứng công trình vẫn bắt buộc khi snapshot BM-04.
- Xác minh công trình thực hiện tại checklist BM-04 sau khi hồ sơ được ký gửi.

## 2. Import giảng viên và mật khẩu tạm
- Dùng `User.must_change_password` để xác định trạng thái `Chưa kích hoạt/Chưa đổi mật khẩu`.
- `admin/users/` trả thêm `must_change_password`, `last_login`, `activation_status_label`.
- Import trả mật khẩu tạm một lần và file XLSX base64 tạo trong bộ nhớ.
- Admin có API `admin/users/<id>/reset-temporary-password/` dành cho tài khoản vẫn chưa đổi mật khẩu.
- Không lưu plaintext password.

## 3. Cơ quan/phòng ban
- `GET /api/admin/departments/template/`: tải template XLSX.
- `POST /api/admin/departments/import/`: dry-run/import.
- Khóa đối chiếu: `code`; mã có sẵn cập nhật, mã mới tạo.

## 4. Thời hạn minh chứng
- Giữ `indefinite` / `fixed`.
- Tạm khóa toàn bộ kiểm tra ngày của `fixed`.
- Không yêu cầu `valid_from`, `valid_until`; không cảnh báo hết hạn; không chặn xác minh.
- Schema và dữ liệu cũ được giữ để có thể bật lại sau.

## 5. Danh mục nhiệm vụ khoa học
Ẩn khỏi tạo mới nhưng không xóa dữ liệu lịch sử:
- `monograph` — Sách chuyên khảo
- `student_project` — Đề tài khoa học học viên
- `student_scientific_topic` — Chuyên đề khoa học học viên
- `initiative` — Sáng kiến

Đổi tên:
- `conference_proceedings` → `Bài kỷ yếu hội thảo khoa học (khi có ISO)`

## 6. Login
- `Hồ sơ khoa học` → `Lý lịch khoa học`.
