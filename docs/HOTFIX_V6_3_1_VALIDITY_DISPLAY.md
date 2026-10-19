# Hotfix V6.3.1 – Hiển thị thời hạn minh chứng

## Lỗi
Minh chứng được tải với `validity_mode=fixed` và lưu đúng trong MySQL, nhưng trang Lý lịch BM-04 lại hiển thị `∞ Vô thời hạn`.

## Nguyên nhân
`views.py::_profile_evidence()` rút gọn kết quả của `evidence_for()` và bỏ các trường:
- `validity_mode`
- `valid_from`
- `valid_until`
- `validity_status`
- `days_remaining`

Frontend `evidenceState()` khi không nhận được `validity_mode='fixed'` sẽ mặc định hiển thị vô thời hạn.

## Sửa
`_profile_evidence()` trả nguyên payload từ `evidence_for()`.

Không thay đổi schema database. Không cần chạy SQL migration.
