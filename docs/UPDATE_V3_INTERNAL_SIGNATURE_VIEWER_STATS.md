# Cập nhật V3: ký số nội bộ, Admin xem, thống kê và xem file inline

## Quyết định nghiệp vụ đã chốt

- `admin`: toàn quyền.
- `viewer_admin`: xem/tải mọi khu vực được phép truy cập, không được thay đổi dữ liệu.
- Đề tài cấp tỉnh/thành phố là **một loại chung**.
- Ký số theo phương án A: khóa ký cá nhân nằm trên server, được mã hóa; hệ thống chỉ sử dụng khóa sau khi người ký nhập lại mật khẩu.
- Ảnh chữ ký được tải lên và dán vào vùng xác nhận của BM-04, nhưng ảnh chỉ có tác dụng hiển thị.

## Luồng ký số nội bộ

```text
Giảng viên tạo BM-04
  → Cán bộ NCKH kiểm tra
  → Lãnh đạo/Admin phê duyệt
  → Chờ ký số nội bộ
  → Người ký nhập lại mật khẩu
  → Backend giải mã khóa riêng trong bộ nhớ
  → Sinh PDF có ảnh chữ ký
  → Ký bytes PDF bằng RSA-PSS-SHA256
  → Lưu PDF ký + SHA-256 + certificate + mã xác thực
  → Hoàn tất
```

Không lưu PIN/mật khẩu người dùng. Khóa riêng được mã hóa bằng Fernet master key từ biến môi trường `INTERNAL_SIGNING_MASTER_KEY`.

## Thành phần database mới

### `portal_signingidentity`
Một bản ghi cho mỗi tài khoản được cấp danh tính ký nội bộ. Chứa certificate, serial, khóa riêng đã mã hóa, đường dẫn ảnh chữ ký, hash ảnh và trạng thái.

### `portal_digitalsignature`
Nhật ký chữ ký của từng BM-04: người ký, chứng thư, thuật toán, chữ ký base64, hash PDF, mã xác thực, thời điểm và trạng thái kiểm tra.

### `portal_profileapproval`
Bổ sung `signed_pdf_path`, `signed_pdf_sha256` để tham chiếu bản PDF ký số cuối cùng.

## Danh mục công trình

Các WorkType mới được bootstrap với `is_active=true`; loại cũ được chuyển `is_active=false`, không xóa dữ liệu lịch sử.

## Xem tệp

- `/api/evidence/<id>/view/`: trả PDF/JPG/PNG `Content-Disposition: inline` sau khi kiểm tra quyền.
- `/api/approvals/<id>/pdf/?inline=1`: BM-04 gốc.
- `/api/approvals/<id>/signed/?inline=1`: BM-04 đã ký nội bộ.
- Các endpoint download cũ vẫn giữ.

## Viewer Admin

`viewer_admin` được phép GET tại hồ sơ, công trình, minh chứng, BM-04, thống kê, nhân sự và audit. Middleware chặn phương thức thay đổi dữ liệu. Các nút mutation cũng được ẩn trên frontend.

## Cảnh báo vận hành

1. Sao lưu `INTERNAL_SIGNING_MASTER_KEY` riêng khỏi database.
2. Không cho người không có thẩm quyền tải ảnh chữ ký gốc hoặc khóa riêng.
3. Backup MySQL và `private_files` phải đồng bộ.
4. Khi người ký nghỉ/chuyển chức vụ cần khóa `SigningIdentity` và cấp chứng thư mới nếu cần.
5. Chữ ký nội bộ này phục vụ hệ thống nội bộ; cần đánh giá pháp lý riêng nếu dùng thay chữ ký số được công nhận bên ngoài Nhà trường.
