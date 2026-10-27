# BM-04 V8.2 DEV — nhật ký tiếng Việt và tra cứu tính hợp lệ BM-04 từ scan

## 1. Tính năng đã thêm

- Nhật ký `AuditLog` cũ được diễn giải **tại thời điểm trả API**, không thay dữ liệu lịch sử: nhãn hành động, người thực hiện, giảng viên liên quan, mô tả ngắn, thay đổi dữ liệu (khi thông tin before/after có lưu). Dữ liệu nhạy cảm (mật khẩu, mã định danh cá nhân, địa chỉ riêng, khóa ký) không hiển thị trong phần diễn giải và không xuất JSON details raw qua API log.
- Tra cứu nhật ký tại `/activity`: tài khoản `signer`, `reviewer`, `admin`, `viewer_admin` có quyền xem; phân lọc theo giảng viên và ngày. API `GET /api/admin/audit/lecturers/` chỉ công khai mã và họ tên cho vai trò này.
- Mục Nhật ký trong trang `/admin` và phần Nhật ký tại modal chi tiết BM-04 hiện nhãn, mô tả và nội dung thay đổi bằng tiếng Việt.
- `/signature-check`: nhập PDF gốc, PDF scan, ảnh PNG/JPG. PDF gốc kiểm tra SHA-256 + RSA/X.509 nội bộ như phiên bản V8.1. Ảnh/PDF scan đọc **QR và mã xác thực SIG-U/SIG-P** từ chữ PDF hoặc OCR (best effort), kiểm tra bản ghi chữ ký trong hệ thống, và đối chiếu chữ ký bản PDF gốc đang lưu. Cho phép nhập mã xác thực thủ công.
- Khi sinh bản BM-04 ký mới, mẫu giấy in thêm QR dẫn chứng mã SIG-U/SIG-P ở phần chữ ký. Mẫu ký trước V8.2 vẫn tra cứu bằng chữ mã, OCR hoặc nhập mã thủ công.

## 2. Giới hạn xác thực cần lưu ý

- `valid_internal`: xác thực bằng mật mã **chỉ với tệp PDF gốc có bytes trùng hoàn toàn** với bản đã ký lưu trong hệ thống.
- `scan_record_found`: **tìm được mã và chứng thực được bản gốc đã hoàn tất**, KHÔNG chứng minh ảnh/PDF scan là bản sao trung thực, không bị sửa các dòng văn bản, chữ ký/dấu ảnh; `valid=null` và `cryptographic=false`.
- `scan_personal_signature_only`: chữ ký cá nhân có trong hệ thống, chưa có xác nhận lãnh đạo ký hoàn tất.
- `scan_source_invalid`: bản ghi tìm thấy nhưng xác minh nội dung/chữ ký của PDF gốc thất bại.
- `scan_code_not_found`: nhận diện mã nhưng không tồn tại hồ sơ phát hành tương ứng.
- `scan_unverifiable`: không đọc được mã. Nên sử dụng trường nhập mã hoặc tăng chất lượng scan.
- PDF chứa chữ ký PAdES/CMS bên ngoài vẫn chỉ phát hiện cấu trúc như V8.1; chưa công nhận là hợp lệ vì chưa xây dựng xác thực CA/timestamp/thu hồi.
- Mã QR **không phải** chữ ký điện tử hoặc dấu bảo đảm tính toàn vẹn của ảnh.

## 3. Bổ sung hệ thống

Cài dependencies backend mới:

```
cd backend
pip install -r requirements.txt
```

Máy chủ cần `Tesseract OCR` nếu muốn đọc chữ trong ảnh cũ không có QR; nếu không cài, tra cứu QR hoặc nhập mã vẫn hoạt động. Python packages `PyMuPDF`, `opencv-python-headless` để đọc ảnh/QR và các trang PDF scan. Máy chủ chỉ được chạy trên hạ tầng nội bộ theo thiết kế BM-04. Không lưu file người dùng tải lên để kiểm tra.

Khởi chạy backend và frontend theo quy trình `README.md` hiện có. Nếu môi trường đã có DB V8, **không cần migration**: không thêm bảng/cột mới. Đảm bảo bản sao lưu database và khóa INTERNAL_SIGNING_MASTER_KEY trước nâng cấp. Backend cần quyền đọc kho PDF ký số riêng, không public.

## 4. Kiểm thử tối thiểu sau triển khai

1. Admin và lãnh đạo đăng nhập: menu `Nhật ký giảng viên`; lọc một giảng viên có log đăng nhập/cập nhật.
2. Trên modal BM-04: thao tác log hiện tiếng Việt; kiểm tra không có mật khẩu/khóa riêng/định danh cá nhân.
3. PDF gốc BM-04 đã ký số: phải ra `valid_internal` với người ký và mã.
4. In BM-04 ký mới rồi scan thành JPG/PDF: hệ thống đọc QR, ra `scan_record_found`, thông báo rõ không xác thực toàn vẹn bản scan.
5. Che QR rồi nhập mã in trên hồ sơ: bản gốc vẫn được tra cứu (nếu mã đúng).
6. Tạo mã giả: `scan_code_not_found`; hồ sơ đã đổi nội dung scan nhưng giữ mã vẫn chỉ có thể `scan_record_found`, tuyệt đối không gọi là bản scan hợp lệ bằng mật mã.
7. PDF chữ ký số bên ngoài: chỉ phát hiện dấu hiệu nhúng, không kết luận hợp lệ.

## 5. Các file sửa

- `backend/portal/audit_explain.py` (mới)
- `backend/portal/bm04_scan_verifier.py` (mới)
- `backend/portal/views.py` và `urls.py`
- `backend/portal/pdf_service.py` (QR trên bản ký mới)
- `backend/requirements.txt`
- `frontend/src/router/activity/page.tsx` (mới)
- `frontend/src/router/signature-check/page.tsx`
- `frontend/src/router/admin/page.tsx` và `approvals/page.tsx`
- `frontend/src/app/routes.ts`, `router/index.tsx`, `layouts/AppLayout.tsx`, `api.ts`

## 6. Trạng thái kiểm tra tại thời điểm đóng gói

Đã kiểm tra cú pháp Python bằng `compileall`; đã tạo BM-04 có QR bằng ReportLab và nhận diện mã từ PDF gốc và bản JPG mô phỏng scan qua công cụ trích xuất. **Chưa kiểm thử end-to-end trên MySQL/Django và chưa chạy thành công build React trong môi trường đóng gói**; bắt buộc chạy thử ở máy DEV trước khi áp dụng trên production.
