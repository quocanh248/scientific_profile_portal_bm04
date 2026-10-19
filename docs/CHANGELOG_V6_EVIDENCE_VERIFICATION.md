# V6 DEV — Tái thiết kế minh chứng và xác minh BM-04

## Quyết định nghiệp vụ đã áp dụng

1. **Tài liệu đính kèm công trình** (`WorkEvidence`) chỉ là tài liệu phụ trợ của bản ghi công trình, có thể có hoặc không.
2. **Minh chứng xác minh** (`EvidenceDocument`) gắn với từng dữ liệu khoa học của giảng viên và được Phòng NCKH đối chiếu từ chính BM-04.
3. Xác minh **theo từng mục** trong BM-04.
4. Kết quả xác minh cũ chỉ tái sử dụng khi **nội dung dữ liệu và tập minh chứng không đổi**.
5. Quá trình công tác do Admin quản lý, **không bắt buộc minh chứng**, nhưng Admin có thể đính kèm quyết định/tài liệu.
6. Khi NCKH trả sửa, hồ sơ cũ không bị ghi đè. Giảng viên tạo **phiên bản mới**, snapshot lại và **ký lại**.
7. BM-04 đã gửi luôn đọc dữ liệu/minh chứng từ **snapshot bất biến**; cập nhật hồ sơ ở tương lai không làm thay đổi hồ sơ cũ.
8. Nhật ký cập nhật dữ liệu và minh chứng có thể lọc theo giảng viên/thời gian/người thao tác.
9. Frontend bỏ `alert()/confirm()/prompt()`; sử dụng modal thống nhất. Modal ký số dùng trường mật khẩu ẩn ký tự, có nút hiện/ẩn.

## Mô hình minh chứng

- `portal_workevidence`: tài liệu đính kèm công trình, tùy chọn.
- `portal_evidencedocument`: minh chứng dùng để xác minh BM-04.
- `portal_verificationrecord`: kết quả xác minh tái sử dụng được.
- `portal_approvalverificationitem`: checklist xác minh từng mục của một phiên bản BM-04.

## Snapshot

Khi gửi BM-04, snapshot lưu:

- dữ liệu được in;
- danh sách minh chứng tại thời điểm gửi;
- SHA-256 nội dung dữ liệu;
- SHA-256 tập minh chứng;
- tài liệu đính kèm công trình tại thời điểm gửi (chỉ để tham khảo);
- PDF và chữ ký cá nhân theo luồng ký số nội bộ hiện tại.

Ví dụ: BM-04 năm 2015 có 2 bằng đại học thì khi mở lại ở năm 2026 vẫn chỉ có đúng 2 bằng và đúng các minh chứng đã snapshot năm 2015, dù hồ sơ hiện tại đã bổ sung bằng Thạc sĩ.

## Tái sử dụng xác minh

Dấu vân tay minh chứng dựa trên **SHA-256 nội dung file + tên file + dung lượng**, không phụ thuộc ID của bản ghi DB và không phụ thuộc thứ tự upload. Tài liệu đính kèm công trình không tham gia vào dấu vân tay xác minh vì nó không phải minh chứng xác minh.

## DEV only

Bản V6 này không kèm Docker production. Hãy kiểm thử nghiệp vụ bằng MySQL/Python/Node local theo `README_DEV_V6.md`. Docker sẽ được đóng gói sau khi nghiệm thu DEV.
