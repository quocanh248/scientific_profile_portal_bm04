# BM-04 V6.3 DEV — thời hạn hiệu lực minh chứng

## 1. Sửa lỗi HTTP 500 khi tải minh chứng

Nguyên nhân V6.2: hàm `audit(actor, action, entity, entity_id, ...)` nhận `entity_id` hai lần: một lần bằng tham số vị trí `e.pk`, lần nữa bằng keyword `entity_id=...`.

V6.3 đổi metadata log thành `target_entity_id`, vì vậy upload/xem/tải/xác minh minh chứng không còn lỗi `TypeError: audit() got multiple values for argument 'entity_id'`.

## 2. Thời hạn hiệu lực

Không bổ sung “loại tài liệu”. Mỗi minh chứng chỉ có:

- `validity_mode = indefinite`: Vô thời hạn.
- `validity_mode = fixed`: Có thời hạn.
- `valid_from`: ngày có hiệu lực, không bắt buộc.
- `valid_until`: ngày hết hiệu lực, bắt buộc nếu `fixed`.

Hệ thống cảnh báo trước 30 ngày:

- `∞ Vô thời hạn`
- `✓ Còn hiệu lực`
- `⚠ Sắp hết hiệu lực — còn ≤ 30 ngày`
- `✕ Hết hiệu lực`
- `Chưa có hiệu lực` nếu người dùng có nhập ngày bắt đầu trong tương lai.

Minh chứng hết hiệu lực/chưa có hiệu lực không được Phòng NCKH bấm “Xác minh” cho BM-04 mới. Backend chặn kể cả khi người dùng cố gọi API trực tiếp.

## 3. Tái sử dụng xác minh

Kết quả xác minh cũ chỉ được tái sử dụng khi:

1. dữ liệu không đổi;
2. tập minh chứng không đổi;
3. thông tin thời hạn của minh chứng không đổi;
4. tại thời điểm tạo BM-04 mới, tất cả minh chứng vẫn còn hiệu lực.

BM-04 lịch sử vẫn giữ snapshot minh chứng và ngày hiệu lực tại thời điểm gửi.

## 4. Một minh chứng cho nhiều thông tin

Thêm bảng `portal_evidencelink`. File thật chỉ lưu một lần trong `portal_evidencedocument`; nhiều thông tin khoa học có thể liên kết đến cùng file.

Giao diện có nút **Dùng minh chứng đã có** bên cạnh **Tải minh chứng**.

## 5. Nâng cấp DB V6.2

Sao lưu DB, sau đó chạy:

```bat
dev\upgrade_v6_2_to_v6_3.bat
```

Hoặc chạy trực tiếp SQL:

`database/bm04_v6_2_to_v6_3_evidence_validity.sql`

Không cần xóa dữ liệu V6.2. Các minh chứng cũ mặc định được coi là **Vô thời hạn** cho tới khi cập nhật lại.
