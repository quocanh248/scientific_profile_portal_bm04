# Scientific Profile Portal BM-04 — V8 DEV

Mục tiêu: kiểm thử nghiệp vụ trên môi trường DEV trước khi đóng gói production.

Stack: React + TypeScript / Django REST / MySQL 8 / private file storage.

## Cấu trúc route frontend

- `/` → `frontend/src/router/page.tsx`
- `/profile` → `frontend/src/router/profile/page.tsx`
- `/approvals` → `frontend/src/router/approvals/page.tsx`
- `/signature` → `frontend/src/router/signature/page.tsx`
- `/reports` → `frontend/src/router/reports/page.tsx`
- `/admin` → `frontend/src/router/admin/page.tsx`
- `/password` → `frontend/src/router/password/page.tsx`
- `/login` → `frontend/src/router/login/page.tsx`

Route `/works` được giữ như đường dẫn tương thích cũ nhưng tự chuyển về `/profile`.
Công trình khoa học hiện được quản lý trực tiếp tại Mục 10 của Lý lịch BM-04.

## V8 — thay đổi nghiệp vụ

1. Trường chọn loại công trình hiển thị nhãn **DM nhiệm vụ khoa học**.
2. Công trình khoa học được thêm/sửa và tải minh chứng ngay trong `/profile`.
3. Không còn bước gửi công trình riêng cho Phòng NCKH xác minh. NCKH chỉ xác minh công trình khi công trình nằm trong snapshot của một hồ sơ tạo từ **In & phê duyệt BM-04**.
4. Minh chứng công trình vẫn bắt buộc trước khi chọn công trình để tạo BM-04.
5. Lựa chọn thời hạn vẫn có `Vô thời hạn` và `Có thời hạn`, nhưng kiểm tra thời gian đang tạm khóa. `Có thời hạn` hiện không yêu cầu ngày, không cảnh báo và không chặn xác minh.
6. Import giảng viên sinh mật khẩu tạm. Mật khẩu chỉ trả về ngay sau import, có thể xuất Excel ngay, không lưu plaintext. Tài khoản còn `must_change_password=True` hiển thị **Chưa kích hoạt/Chưa đổi mật khẩu** và Admin có thể sinh lại mật khẩu tạm.
7. Quản trị cơ quan/phòng ban có template Excel + import Excel; mã đơn vị có sẵn được cập nhật, mã mới được tạo.
8. Màn hình đăng nhập đổi `Hồ sơ khoa học` thành `Lý lịch khoa học`.
9. Danh mục `portal_worktype` ngừng hiển thị khi tạo mới: `Sách chuyên khảo`, `Đề tài khoa học học viên`, `Chuyên đề khoa học học viên`, `Sáng kiến`. Dữ liệu cũ không bị xóa.
10. `Bài kỷ yếu hội thảo khoa học` đổi thành **Bài kỷ yếu hội thảo khoa học (khi có ISO)**.

## Nâng V7 → V8

Không có thay đổi schema database nên không cần Django migration mới.

Sau khi sao lưu database, chạy:

```bat
dev\upgrade_v7_to_v8.bat
```

Script chỉ cập nhật trạng thái/tên danh mục `portal_worktype`, không xóa công trình lịch sử.

## Khởi tạo database DEV mới

`dev\init_db_dev.bat` sử dụng `database\bm04_dev_full_v8.sql`.

## Bảo mật mật khẩu tạm

Django chỉ lưu password hash. Mật khẩu tạm không thể đọc ngược từ database. File Excel mật khẩu tạm được tạo trong bộ nhớ ngay sau import và gửi về trình duyệt; backend không lưu file/mật khẩu plaintext. Sau khi reload trang, mật khẩu tạm cũ không còn xem lại được; nếu tài khoản vẫn chưa đổi mật khẩu, Admin có thể dùng **Đặt lại mật khẩu tạm**.
