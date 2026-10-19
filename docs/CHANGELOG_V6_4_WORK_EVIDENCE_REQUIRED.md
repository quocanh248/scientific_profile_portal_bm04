# V6.4 DEV — Minh chứng công trình khoa học bắt buộc

## Quyết định nghiệp vụ

Từ V6.4, không còn hai khái niệm song song ở Mục 10:

- ~~Tài liệu đính kèm công trình (không bắt buộc)~~
- ~~Minh chứng xác minh công trình riêng~~

Thay bằng một nguồn duy nhất:

**Minh chứng công trình khoa học (bắt buộc).**

File đã tải trong `portal_workevidence` chính là file Phòng NCKH dùng để xác minh
công trình ở checklist BM-04.

## Thay đổi chính

1. `portal_workevidence` thêm `validity_mode`, `valid_from`, `valid_until`.
2. Công trình không có minh chứng không thể gửi kiểm tra/xác minh.
3. Minh chứng hết hiệu lực hoặc chưa có hiệu lực không thể dùng để xác minh mới.
4. Snapshot BM-04 lưu chính WorkEvidence vào `verification_evidence`.
5. Snapshot V6.3 cũ vẫn tương thích: `attachments` được đọc như minh chứng đã chốt.
6. Checklist BM-04 mở file công trình qua `/api/evidence/<id>/view/`.
7. Mục 10 trong Lý lịch chỉ hiển thị minh chứng của công trình; không tạo một bản
   EvidenceDocument thứ hai.
8. Quá trình công tác cho phép giảng viên tự cập nhật; minh chứng không bắt buộc.

## Nâng database hiện tại

Sao lưu DB trước, sau đó chạy:

```bat
dev\upgrade_v6_3_to_v6_4.bat
```

hoặc chạy SQL:

```text
database/bm04_v6_3_to_v6_4_work_evidence_required.sql
```

Dữ liệu `portal_workevidence` cũ không bị xóa; mặc định được chuyển thành
`Vô thời hạn`.
