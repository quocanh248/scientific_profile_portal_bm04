# Ánh xạ trường giao diện với BM-04

Biểu mẫu được triển khai theo hai lớp:

- **Hồ sơ nền**: giảng viên/Admin cập nhật dữ liệu một lần và tái sử dụng.
- **Hồ sơ đăng ký nhiệm vụ**: khi cần in BM-04, giảng viên nhập tên nhiệm vụ, chọn chức danh đăng ký và chọn dữ liệu liên quan; hệ thống tạo snapshot bất biến.

| Mục | Giao diện V1 | Quy tắc |
|---|---|---|
| Tiêu đề nhiệm vụ | In & phê duyệt BM-04 | Bắt buộc mỗi hồ sơ |
| Chủ nhiệm / Thư ký / khác | In & phê duyệt BM-04 | Nếu “khác” phải nhập nội dung |
| 1–2 | Quản trị nhân sự | Giảng viên chỉ đọc |
| 3 | Lý lịch BM-04 | Giảng viên cập nhật |
| Chức danh nghề nghiệp/chức vụ | Quản trị nhân sự | Admin cập nhật |
| Nhóm nhân tài | Lý lịch BM-04 | Một trong ba lựa chọn |
| 5–7 | Quản trị nhân sự + đơn vị | Giảng viên chỉ đọc |
| 8 | Lý lịch BM-04 | Danh sách nhiều dòng |
| 9 | Quản trị nhân sự | Có lịch sử, không ghi đè lịch sử đơn vị |
| 10 | Công trình khoa học | Phải được NCKH xác minh; khi in chọn tối đa 05 |
| 11 | Lý lịch BM-04 | Khi in chọn các văn bằng liên quan nhiệm vụ |
| 12 | Lý lịch BM-04 | Khi in chọn các công trình liên quan nhiệm vụ |
| 13 | Lý lịch BM-04 | Đưa toàn bộ nhiệm vụ đã/đang chủ trì hoặc tham gia |
| 14 | Lý lịch BM-04 | Khi in chọn giải thưởng liên quan nhiệm vụ |
| 15 | Lý lịch BM-04 | Văn bản tự do |
| 16 | PDF BM-04 | Nội dung cam kết cố định; ký tay ở V1 |

**Lưu ý về số thứ tự:** giao diện/PDF giữ cách đánh số của bản BM-04 được cung cấp, kể cả cách đánh số trên mẫu gốc không liên tục ở phần đầu.
