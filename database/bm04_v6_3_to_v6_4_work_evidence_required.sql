-- BM-04 V6.3.x -> V6.4 DEV
-- Hợp nhất 'tài liệu đính kèm công trình' thành MINH CHỨNG CÔNG TRÌNH KHOA HỌC BẮT BUỘC.
-- Các file WorkEvidence cũ được giữ nguyên và mặc định là vô thời hạn.
-- Chạy sau khi SAO LƯU database.

ALTER TABLE portal_workevidence
  ADD COLUMN validity_mode VARCHAR(16) NOT NULL DEFAULT 'indefinite' AFTER work_id,
  ADD COLUMN valid_from DATE NULL AFTER validity_mode,
  ADD COLUMN valid_until DATE NULL AFTER valid_from,
  ADD KEY workevidence_validity_mode_idx (validity_mode),
  ADD KEY workevidence_valid_until_idx (valid_until);

UPDATE portal_workevidence
SET validity_mode='indefinite', valid_from=NULL, valid_until=NULL
WHERE validity_mode IS NULL OR validity_mode='';

-- Không cần copy file sang portal_evidencedocument.
-- Từ V6.4, portal_workevidence chính là nguồn minh chứng Mục 10 và được snapshot
-- trực tiếp vào BM-04. Snapshot V6.3 cũ vẫn đọc key `attachments` làm minh chứng.
