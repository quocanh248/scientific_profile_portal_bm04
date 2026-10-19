# V6.3.2 DEV – Xác minh từng mục BM-04

- Bỏ hai nút `Yêu cầu bổ sung` và `Từ chối` ở từng mục checklist.
- Từng mục chỉ còn thao tác `Xác minh`.
- Nếu mục bắt buộc minh chứng nhưng snapshot không có minh chứng, nút Xác minh bị khóa và hiển thị hướng dẫn dùng `Trả sửa` ở cấp hồ sơ BM-04.
- Nếu minh chứng hết hiệu lực/chưa có hiệu lực, nút Xác minh bị khóa.
- Backend cũng chỉ chấp nhận action `verified` ở endpoint xác minh từng mục.
- Công trình khoa học vẫn yêu cầu minh chứng xác minh theo nghiệp vụ đã thống nhất; `Tài liệu đính kèm công trình` không thay thế `Minh chứng xác minh`.
