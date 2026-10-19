# V5 — Liên kết BM-04 với công trình, tìm kiếm và phân trang

## 1. Cột Mã BM-04 là liên kết chi tiết

Tại trang **In, phê duyệt và ký số nội bộ**, cột **Mã** được hiển thị như liên kết. Khi bấm vào mã BM-04, hệ thống mở cửa sổ chi tiết ngay trên trang và hiển thị:

- mã BM-04, giảng viên, mã giảng viên, đơn vị, nhiệm vụ và trạng thái;
- toàn bộ công trình khoa học đã được chọn tại Mục 10 khi BM-04 được tạo;
- loại công trình, năm công bố, nơi công bố, DOI và danh sách tác giả;
- danh sách tệp minh chứng của từng công trình;
- nút **Xem** minh chứng trực tiếp trên trình duyệt và **Tải** tệp;
- nút **Xem BM-04** và **Tải BM-04**.

Danh sách công trình của hồ sơ được xác định từ snapshot BM-04 để giữ đúng quan hệ công trình đã chọn tại thời điểm gửi hồ sơ. Chi tiết/minh chứng được truy xuất qua quyền của hệ thống.

## 2. Bộ lọc BM-04

Trang có thêm các bộ lọc:

- **Từ khóa**: tìm theo mã BM-04 hoặc tên nhiệm vụ;
- **Giảng viên**: tìm theo họ tên hoặc mã giảng viên;
- **Trạng thái**: Chờ NCKH, Chờ lãnh đạo, Chờ ký số nội bộ, Hoàn tất, Cần bổ sung, Từ chối và trạng thái legacy;
- **Số dòng/trang**: 10, 20 hoặc 50.

Nút **Đặt lại** xóa toàn bộ điều kiện lọc.

## 3. Phân trang phía server

API `GET /api/approvals/` hỗ trợ các query parameter:

```text
page=1
page_size=10
q=BM04-...
status=review
lecturer=Nguyen Van A
```

Khi có `page`, API trả:

```json
{
  "results": [],
  "count": 0,
  "page": 1,
  "pages": 1,
  "page_size": 10
}
```

Nếu không truyền `page`, endpoint vẫn trả mảng như V4 để Dashboard cũ tiếp tục hoạt động.

## 4. Không thay đổi database

V5 không thêm bảng/cột MySQL nên nâng cấp từ V4 không cần migration schema mới.

Sau khi thay source:

```cmd
docker compose up -d --build
```

Sau đó nhấn `Ctrl + F5` trên trình duyệt.
