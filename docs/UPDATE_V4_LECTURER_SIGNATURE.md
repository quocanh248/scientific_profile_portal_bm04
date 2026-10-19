# V4 - Giảng viên ký số ngay khi gửi BM-04

## Luồng mới

1. Giảng viên cấu hình **Chữ ký số cá nhân**: tải ảnh PNG/JPG, hệ thống cấp chứng thư nội bộ và lưu khóa riêng ở dạng mã hóa.
2. Giảng viên lập BM-04.
3. Khi bấm **Ký số & gửi yêu cầu xác nhận**, hệ thống yêu cầu nhập lại mật khẩu.
4. Hệ thống:
   - đóng băng snapshot BM-04;
   - tạo mã xác thực `SIG-P-...`;
   - căn giữa ảnh chữ ký ở ô **CÁ NHÂN ĐĂNG KÝ THỰC HIỆN NHIỆM VỤ**;
   - ký mật mã PDF bằng certificate/key nội bộ của giảng viên;
   - lưu giao dịch `DigitalSignature(signature_role=personal)`;
   - chuyển hồ sơ sang `Chờ NCKH kiểm tra`.
5. Sau khi NCKH kiểm tra và lãnh đạo phê duyệt, lãnh đạo ký số. PDF cuối cùng giữ chữ ký cá nhân ở ô phải và chữ ký đại diện đơn vị ở ô trái.

## Database

`portal_digitalsignature` có thêm:

- `signature_role`: `personal` hoặc `unit`;
- `visible_signature`: JSON đóng băng tên, chức vụ, mã xác thực, thời gian ký và đường dẫn ảnh chữ ký tại thời điểm ký.

Lệnh `ensure_v3_schema` đã được mở rộng để tự bổ sung hai cột này cho database hiện hữu.

## Lưu ý bảo mật

- Admin không ký thay chữ ký cá nhân của giảng viên.
- Giảng viên phải đăng nhập đúng tài khoản và nhập lại mật khẩu tại thời điểm gửi.
- Ảnh chữ ký chỉ là phần hiển thị; giao dịch còn có chữ ký RSA-PSS-SHA256 nội bộ.
- Mỗi chữ ký được kiểm tra trên đúng PDF ở giai đoạn mà chữ ký đó được tạo. Lãnh đạo ký trên PDF cuối cùng có cả hai ảnh chữ ký.
