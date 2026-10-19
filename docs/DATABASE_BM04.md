# Mô hình dữ liệu V1 theo BM-04

Mục tiêu: dữ liệu được chuẩn hóa để **một nguồn dữ liệu có thể tái sử dụng cho nhiều hồ sơ BM-04**, đồng thời mỗi lần xin xác nhận đều tạo một snapshot bất biến theo đúng nhiệm vụ đang đăng ký.

## 1. Ánh xạ BM-04 → bảng dữ liệu

| Phần BM-04 | Bảng/quan hệ chính | Người cập nhật |
|---|---|---|
| Tên nhiệm vụ + chức danh đăng ký | `ProfileApproval` | Giảng viên khi tạo hồ sơ |
| 1–2. Họ tên, định danh, ngày sinh, giới tính | `Lecturer` | Admin |
| 3. Học hàm/học vị + năm | `ScienceProfile` | Giảng viên |
| Chức danh nghề nghiệp, chức vụ | `Lecturer` | Admin |
| Nhóm nhân tài | `ScienceProfile.talent_category` | Giảng viên |
| 5–6. Địa chỉ, điện thoại, email | `Lecturer` | Admin |
| 7. Đơn vị công tác | `Department`, `DepartmentHistory` | Admin |
| 8. Quá trình đào tạo | `EducationRecord` | Giảng viên |
| 9. Quá trình công tác | `EmploymentRecord` | Admin |
| 10. Tối đa 05 công trình tiêu biểu | `ResearchWork`, `WorkAuthor`, `WorkEvidence`, `WorkReview` | Giảng viên khai báo, NCKH xác minh |
| 11. Văn bằng SHTT | `IntellectualPropertyRecord` | Giảng viên |
| 12. Công trình áp dụng thực tiễn | `PracticalApplicationRecord` | Giảng viên |
| 13. Nhiệm vụ KH,CN&ĐMST | `ResearchTaskRecord` | Giảng viên |
| 14. Giải thưởng | `AwardRecord` | Giảng viên |
| 15. Thành tựu khác | `ScienceProfile.other_achievements` | Giảng viên |
| 16. Cam kết + xác nhận | Nội dung cố định + `ProfileApproval` | Hệ thống / quy trình phê duyệt |

## 2. Nhóm bảng lõi

```text
User 1 ── 0..1 Lecturer ── 1 ScienceProfile
                    ├── * EducationRecord
                    ├── * EmploymentRecord
                    ├── * DepartmentHistory ── 1 Department
                    ├── * IntellectualPropertyRecord
                    ├── * PracticalApplicationRecord
                    ├── * ResearchTaskRecord
                    ├── * AwardRecord
                    ├── * WorkAuthor ── 1 ResearchWork ── * WorkEvidence
                    │                          ├── * WorkReview
                    │                          ├── * WorkVersion
                    │                          └── * WorkCorrection
                    └── * ProfileApproval ── * ApprovalEvent
```

`ResearchWork` là dữ liệu dùng chung. Một công trình có nhiều `WorkAuthor`; vì vậy hai giảng viên cùng một bài báo không tạo hai công trình độc lập.

## 3. Hồ sơ BM-04 theo nhiệm vụ

Mỗi `ProfileApproval` lưu:

- `form_code`, `form_version`: khóa phiên bản biểu mẫu pháp lý đã dùng;
- `task_name`: tên nhiệm vụ KH,CN&ĐMST;
- `registered_role`: Chủ nhiệm / Thư ký / chức danh khác;
- `registered_role_other`: nội dung chức danh khác nếu chọn;
- `signing_place`, `signing_date`;
- `snapshot`: toàn bộ dữ liệu BM-04 đã chốt tại thời điểm gửi;
- `snapshot_sha256`: kiểm tra toàn vẹn snapshot;
- `pdf_path`, `pdf_sha256`: bản PDF đã sinh;
- `scan_path`, `scan_sha256`: bản scan ký tay;
- trạng thái phê duyệt và các mốc thời gian.

Các mục 11, 12 và 14 được lưu trong hồ sơ cá nhân nhưng **khi tạo BM-04 phải chọn các mục liên quan đến nhiệm vụ đang đăng ký**. Mục 10 chỉ cho phép chọn tối đa 05 công trình đã được NCKH xác minh.

## 4. Quy tắc toàn vẹn quan trọng

1. `Lecturer.staff_code`, `User.username`, `Department.code` là duy nhất.
2. Thông tin nhân sự của `Lecturer` chỉ được API Admin sửa.
3. Không xóa lịch sử khoa khi chuyển đơn vị; tạo `DepartmentHistory` mới và đóng giai đoạn trước.
4. `WorkAuthor` cấm một giảng viên nội bộ xuất hiện hai lần trong cùng công trình.
5. Công trình đã xác minh không bị ghi đè trực tiếp; chỉnh sửa đi qua `WorkCorrection`/`WorkVersion`.
6. Snapshot của hồ sơ đã gửi không được tái sinh tự động khi hồ sơ cá nhân thay đổi.
7. Tệp minh chứng/PDF/scan chỉ lưu đường dẫn riêng + SHA-256 trong DB; byte tệp nằm ngoài web root.
8. Báo cáo “công trình duy nhất” đếm `ResearchWork`; báo cáo theo khoa dựa vào `department_at_publication` của tác giả nội bộ.

## 5. MySQL

Ứng dụng dùng MySQL 8.4, `utf8mb4`, strict mode. Django models là nguồn định nghĩa schema. Bản MVP vẫn tạo migration lần đầu bằng `makemigrations`; trước production cần commit migration đã duyệt và chỉ chạy `migrate` khi container khởi động.
