# V8.1 - Kiểm tra tệp có chữ ký số

## Mục tiêu

Thêm trang `/signature-check` để người dùng nội bộ tải lên PDF/PNG/JPG và phân biệt:

1. **PDF gốc đã ký trong hệ thống và chữ ký hợp lệ**.
2. **PDF có dấu hiệu chữ ký nhúng bên ngoài**, nhưng chưa xác lập chuỗi tin cậy ngoài hệ thống.
3. **PDF scan/PDF thông thường không có chữ ký số**.
4. **PNG/JPG chỉ là ảnh/scan**, không được coi là chữ ký số.
5. **Bản ghi chữ ký nội bộ tồn tại nhưng kiểm tra mật mã thất bại**.

## Nguyên tắc kiểm tra chữ ký nội bộ

Tệp tải lên không được lưu. Backend đọc bytes trong request và tính SHA-256.

- SHA-256 được đối chiếu với `portal_digitalsignature.signed_pdf_sha256`.
- Nếu khớp, hệ thống dùng `certificate_pem`, `signature_b64` và `verify_bytes()` hiện có để kiểm tra RSA-PSS + SHA-256.
- `verify_bytes()` đồng thời kiểm tra chứng thư X.509 có do Root CA nội bộ hiện tại cấp và còn trong thời hạn hiệu lực.

Do đó một PDF bị sửa dù chỉ một byte sẽ có SHA-256 khác và không thể được kết luận là bản ký số nội bộ hợp lệ.

## Ảnh/scan

PNG/JPG chỉ chứa điểm ảnh. Dù nhìn thấy chữ ký tay, ảnh chữ ký hay con dấu thì chúng không chứa chữ ký RSA-PSS của tệp PDF gốc. Kết quả luôn được diễn đạt là **ảnh/scan trực quan, không phải chữ ký số có thể xác minh bằng mật mã**.

PDF scan cũng tương tự: nếu việc scan tạo ra một PDF mới thì bytes của PDF gốc đã ký không còn, nên chữ ký số của file gốc không được bảo toàn.

## PDF ký bởi nhà cung cấp bên ngoài

V8.1 có thể phát hiện các marker thường gặp của PDF signature như `/ByteRange`, `/Type /Sig`, `/SubFilter` để cảnh báo rằng PDF có cấu trúc chữ ký nhúng. Tuy nhiên **V8.1 không tuyên bố chữ ký bên ngoài là hợp lệ** vì chưa cấu hình trust store của các CA ngoài, OCSP/CRL và timestamp.

Đây là chủ ý an toàn: phát hiện cấu trúc không đồng nghĩa xác minh giá trị mật mã/pháp lý.

## API

`POST /api/signing/verify-upload/`

Multipart form-data:

- `file`: PDF, PNG, JPG/JPEG.
- Giới hạn nghiệp vụ: 20 MB.
- Không lưu tệp vào `private_storage`.

Các vai trò được gọi: lecturer, reviewer, signer, admin, viewer_admin.

## Giao diện

Route mới:

`/signature-check`

Source:

`frontend/src/router/signature-check/page.tsx`

## Không thay đổi database

Không có model/migration mới.
