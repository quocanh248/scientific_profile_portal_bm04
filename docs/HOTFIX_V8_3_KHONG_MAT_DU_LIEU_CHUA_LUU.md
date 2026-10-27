# HOTFIX V8.3 - Bảo vệ dữ liệu lý lịch BM-04 đang nhập chưa lưu

## Nguyên nhân đã xác định

Ở V8.2, trang `frontend/src/router/profile/page.tsx` truyền `onChanged={() => load(...)}` cho `WorksSection` và **toàn bộ** các `EvidenceSection`. Sau khi API lưu công trình/tải minh chứng hoàn tất, callback gọi `GET /api/profile/`, rồi `setData(...)` thay toàn bộ dữ liệu đang hiển thị. Các giá trị đang nhập trong các mục 3, 5, 8, 9, 11–15 chỉ nằm ở React state, chưa ghi vào MySQL nên bị khôi phục về giá trị cũ.

## Nội dung sửa

1. Tạo `draftProtection.ts` để cập nhật **chọn lọc** `my_works`, `verified_works` và danh sách `verification_evidence` theo ID; giữ nguyên dữ liệu đang nhập trong `science`, `education`, `employment`, `ip_records`, `practical_applications`, `research_tasks`, `awards`.
2. Thay callback của `WorksSection` và tám vị trí có `EvidenceSection` bằng `refreshRelated(lecturerId)`; không gọi `setData(remote)` sau khi lưu công trình/tải minh chứng.
3. Cảnh báo rõ khi có mục lý lịch chưa lưu, nút “Lưu thay đổi lý lịch” xuất hiện ở đầu trang. Việc lưu công trình/minh chứng vẫn là thao tác riêng, KHÔNG âm thầm lưu các mục cá nhân.
4. Sau khi lưu lý lịch thành công, cập nhật lại mốc dữ liệu đã lưu; nếu thất bại, bảo toàn các nội dung đang nhập để sửa và thử lại.
5. Tạm khóa trường nhập trong lúc PATCH lý lịch để tránh ghi đè dữ liệu nhập mới xảy ra trong khi chờ phản hồi.
6. Cảnh báo trước khi đóng/tải lại trang, chuyển mục từ sidebar, đổi giảng viên hoặc đăng xuất nếu còn dữ liệu chưa lưu. Cờ trạng thái chỉ lưu trong RAM của tab, không lưu thông tin nhạy cảm vào localStorage/sessionStorage.
7. Không thay đổi schema MySQL, API Django hay thuật toán ký số; giữ nguyên các cải tiến nhật ký tiếng Việt và tra cứu BM-04 V8.2.

## Kiểm thử

- Đã chạy kiểm tra cú pháp TypeScript/TSX các tệp sửa qua trình biên dịch TypeScript.
- Chạy: `node --experimental-strip-types frontend/tests/profile_draft_preservation.test.mjs` với Node 22+.
- Các ca: đang sửa học vị, đào tạo, công tác, SHTT, ứng dụng, nhiệm vụ, giải thưởng; thêm công trình; upload minh chứng; giữ dòng chưa có ID; không trộn dữ liệu giảng viên khác; cảnh báo đúng trạng thái.
- **Chưa chạy full `npm run build` hoặc giao diện trình duyệt trong môi trường thực tế** vì môi trường tạo gói chưa có đầy đủ các dependencies React/Vite trong npm cache. Cần kiểm thử tích hợp trên máy DEV trước khi đưa lên production.

## Cài đặt (Windows)

**Cách 1:** Sao lưu thư mục dự án đang chạy, giải nén và sử dụng bản V8.3 đi kèm (không ghi đè dữ liệu trong MySQL hay private file storage).

**Cách 2:** Chỉ cập nhật frontend từ gói `BM04_V8_3_Hotfix_chi_cac_file_sua.zip`: sao lưu các file cùng đường dẫn, chép đè đúng thư mục `frontend/src/...`, chạy lại `npm install` (nếu cần) và `npm run dev` trong `frontend`.

Không cần migration mới. Backend đang chạy theo V8.2 có thể giữ nguyên nếu chưa bị sửa độc lập.

## Quy trình xác minh tại giao diện

1. Truy cập “Lý lịch khoa học” dưới tài khoản giảng viên; nhập học vị mới và thêm một dòng quá trình đào tạo, **chưa** bấm “Lưu lý lịch BM-04”.
2. Chọn “Thêm công trình”, điền các trường và “Lưu công trình”.
3. Kiểm tra công trình mới xuất hiện; học vị và dòng đào tạo vừa nhập **vẫn giữ nguyên**, thông báo “Có thay đổi lý lịch chưa lưu” vẫn hiển thị.
4. Tải minh chứng cho một dòng đã được lưu từ trước; kiểm tra trạng thái minh chứng được cập nhật, các trường khác vẫn không mất.
5. Nhấn “Lưu thay đổi lý lịch”; tải lại trang và kiểm tra nội dung vừa nhập còn nguyên trong MySQL.
6. Sửa một trường nhưng không lưu rồi thử đổi giảng viên, chuyển menu, đăng xuất hoặc F5: ứng dụng phải cảnh báo có thông tin chưa lưu.

## Lưu ý

Bản vá ngăn **mất dữ liệu về sau**; các nội dung chưa từng được lưu và đã mất ở phiên trình duyệt cũ thường không thể khôi phục từ database. Nếu dự án của Nhà trường đang chạy một nhánh mã nguồn mới hơn V8.2, cần so sánh thay đổi trước khi chép đè.
