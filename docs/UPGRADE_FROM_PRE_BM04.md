# Nâng cấp từ bản V1 cũ sang schema BM-04

Bản BM-04 thay đổi schema đáng kể: thêm các trường nhân sự, lịch sử công tác, các mục 8/11/12/13/14/15, thay cấu trúc vai trò tác giả và bổ sung metadata cho hồ sơ phê duyệt.

## Nếu bản cũ mới chỉ là dữ liệu thử nghiệm

Khuyến nghị tạo database/volume mới để Django sinh schema BM-04 sạch. Không tái sử dụng MySQL volume cũ có migration `portal.0001_initial`, vì project MVP trước đây tạo migration động và tên migration có thể trùng trong khi nội dung schema đã đổi.

Ví dụ sau khi đã xác nhận không cần dữ liệu thử cũ:

```powershell
docker compose down -v
docker compose up --build -d
```

Lệnh `-v` xóa database và kho tệp của project; **không dùng nếu có dữ liệu thật cần giữ**.

## Nếu đã có dữ liệu thật

Không xóa volume. Trước tiên:

1. sao lưu MySQL đầy đủ;
2. sao lưu `private_files`;
3. xuất danh sách giảng viên, công trình, tác giả, minh chứng và hồ sơ đã ký;
4. tạo migration chuyển đổi riêng trên bản sao database;
5. kiểm tra số lượng bản ghi, liên kết tệp và hash trước/sau;
6. chỉ nâng cấp production sau khi phục hồi thử thành công.

Một số mapping cần xử lý khi viết data migration:

- `Lecturer.title` cũ → xác định tách thành `professional_title` và/hoặc `position`;
- `Department` cũ cần bổ sung `address`, `head_name`, `phone`;
- `ScienceProfile` cũ cần chuyển học hàm/học vị và bổ sung năm; các trường nghiên cứu cũ không có vị trí trực tiếp trên BM-04 nên không được tự ý nhét vào mục khác;
- `WorkAuthor.role` cũ → rà soát thành `authorship_type` (`author`/`coauthor`) + `role_note`;
- `ProfileApproval` cũ không có `task_name`, `registered_role`, `signing_place`, `signing_date`; hồ sơ cũ phải được giữ dưới dạng lịch sử và không nên giả định dữ liệu thiếu.

Vì các trường cũ không đủ để suy ra chính xác toàn bộ BM-04, gói này **không tự động bịa dữ liệu để lấp chỗ trống**. Nếu cần nâng cấp một database đã có dữ liệu thật, hãy dùng bản backup đó để xây migration riêng có kiểm tra.
