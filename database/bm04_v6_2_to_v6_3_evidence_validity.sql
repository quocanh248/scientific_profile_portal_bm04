-- BM-04 V6.2 -> V6.3 DEV
-- Bổ sung thời hạn hiệu lực minh chứng và liên kết một minh chứng với nhiều thông tin.
-- Chạy MỘT LẦN trên database V6.2 sau khi sao lưu.

ALTER TABLE portal_evidencedocument
  ADD COLUMN validity_mode VARCHAR(16) NOT NULL DEFAULT 'indefinite' AFTER entity_id,
  ADD COLUMN valid_from DATE NULL AFTER validity_mode,
  ADD COLUMN valid_until DATE NULL AFTER valid_from,
  ADD KEY evidence_validity_mode_idx (validity_mode),
  ADD KEY evidence_valid_until_idx (valid_until);

CREATE TABLE portal_evidencelink (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  evidence_id BIGINT NOT NULL,
  section VARCHAR(30) NOT NULL,
  entity_id VARCHAR(100) NOT NULL DEFAULT '',
  created_by_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  UNIQUE KEY unique_evidence_entity_link (evidence_id, section, entity_id),
  KEY evidence_link_lookup_idx (section, entity_id),
  KEY evidencelink_created_by_idx (created_by_id),
  CONSTRAINT evidencelink_evidence_fk FOREIGN KEY (evidence_id) REFERENCES portal_evidencedocument(id) ON DELETE CASCADE,
  CONSTRAINT evidencelink_user_fk FOREIGN KEY (created_by_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chuyển liên kết V6 cũ sang bảng liên kết mới. File không bị nhân bản.
INSERT IGNORE INTO portal_evidencelink(evidence_id, section, entity_id, created_by_id, created_at)
SELECT id, section, entity_id, uploaded_by_id, created_at
FROM portal_evidencedocument
WHERE is_active = 1;

-- Dữ liệu cũ mặc định được coi là vô thời hạn cho tới khi người dùng cập nhật lại.
UPDATE portal_evidencedocument
SET validity_mode='indefinite', valid_from=NULL, valid_until=NULL
WHERE validity_mode IS NULL OR validity_mode='';
