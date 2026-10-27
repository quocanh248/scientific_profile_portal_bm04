# CHANGELOG V8.1

- Thêm API `POST /api/signing/verify-upload/`.
- Thêm service `backend/portal/uploaded_signature_verifier.py`.
- Thêm route `/signature-check` cho mọi vai trò đã đăng nhập.
- Đối chiếu SHA-256 của file tải lên với `DigitalSignature.signed_pdf_sha256`.
- Xác minh chữ ký nội bộ bằng RSA-PSS/SHA-256 + chứng thư X.509 + Internal Root CA.
- Phân biệt rõ JPG/PNG/PDF scan với chữ ký số.
- Phát hiện marker chữ ký PDF nhúng bên ngoài nhưng không kết luận tin cậy khi chưa có trust store/OCSP/CRL/timestamp.
- File kiểm tra chỉ xử lý trong request, không lưu vào kho file.
- Không thay đổi schema database; không cần migration.
- Sửa lỗi type cũ trong `AppLayout.tsx`: bỏ icon key `works` sau khi route công trình đã chuyển về `/profile`.
- Gộp các sửa giao diện đã thống nhất gần đây: xác nhận trước khi đăng xuất; ô mật khẩu ký số không dùng `current-password` autofill; modal hệ thống có z-index cao hơn modal nghiệp vụ; sau đổi mật khẩu bắt buộc sẽ `refreshCatalog()` và chuyển về `/profile`.
