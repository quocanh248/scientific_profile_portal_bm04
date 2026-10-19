# Cập nhật quyền Admin, template import và logo

## 1. Admin toàn quyền nghiệp vụ
Admin được phép thao tác trên các workflow vốn dành cho Giảng viên, Cán bộ NCKH và Lãnh đạo ký. Quyền này không bỏ qua trạng thái nghiệp vụ: hồ sơ vẫn đi qua các bước để đảm bảo audit log.

### Công trình
- Chọn giảng viên khi thêm công trình.
- Tải minh chứng.
- Gửi xác minh.
- Xác minh / yêu cầu bổ sung / từ chối.
- Duyệt yêu cầu liên kết đồng tác giả.

### Lý lịch khoa học
- Chọn một giảng viên và cập nhật các mục khoa học BM-04.
- Thông tin nhân sự vẫn quản lý ở trang Quản trị nhân sự.

### BM-04
- Chọn giảng viên và tạo BM-04 thay cho họ.
- Chuyển lãnh đạo.
- Phê duyệt với quyền lãnh đạo.
- Xác nhận đã ký tay.
- Tải bản scan để hoàn tất.

## 2. Template Excel
Nút tải template nằm ở trang Quản trị nhân sự. File public chỉ là biểu mẫu nhập liệu, không chứa dữ liệu nhạy cảm.

## 3. Logo
`frontend/public/logo-dhcsnd.jpg` là logo được cung cấp trong cuộc trao đổi và được hiển thị ở sidebar + login.

## 4. Database
Không có thay đổi model/migration trong bản cập nhật này.
