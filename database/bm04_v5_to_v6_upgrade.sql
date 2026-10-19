-- Nâng schema V5 lên V6. Sao lưu DB trước khi chạy.
USE research_profiles;
SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE portal_profileapproval
  ADD COLUMN IF NOT EXISTS parent_approval_id CHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS version INT UNSIGNED NOT NULL DEFAULT 1;

ALTER TABLE portal_auditlog
  ADD COLUMN IF NOT EXISTS lecturer_id CHAR(32) NULL;

CREATE TABLE IF NOT EXISTS portal_evidencedocument (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL,section VARCHAR(30) NOT NULL,entity_id VARCHAR(100) NOT NULL DEFAULT '',private_path VARCHAR(500) NOT NULL,original_name VARCHAR(260) NOT NULL,mime_type VARCHAR(80) NOT NULL,sha256 VARCHAR(64) NOT NULL,size INT UNSIGNED NOT NULL,uploaded_by_id BIGINT NOT NULL,is_active TINYINT(1) NOT NULL DEFAULT 1,created_at DATETIME(6) NOT NULL,
  KEY evidence_lookup_idx(lecturer_id,section,entity_id,is_active),
  CONSTRAINT ev6_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE,
  CONSTRAINT ev6_user_fk FOREIGN KEY(uploaded_by_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_verificationrecord (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL,section VARCHAR(30) NOT NULL,entity_id VARCHAR(100) NOT NULL DEFAULT '',content_hash VARCHAR(64) NOT NULL,evidence_hash VARCHAR(64) NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'verified',reviewer_id BIGINT NOT NULL,comment LONGTEXT NOT NULL,reviewed_at DATETIME(6) NOT NULL,
  KEY verification_lookup_idx(lecturer_id,section,entity_id,status),KEY vr6_content_hash_idx(content_hash),KEY vr6_evidence_hash_idx(evidence_hash),
  CONSTRAINT vr6_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE,
  CONSTRAINT vr6_reviewer_fk FOREIGN KEY(reviewer_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_approvalverificationitem (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,approval_id CHAR(32) NOT NULL,section VARCHAR(30) NOT NULL,entity_id VARCHAR(100) NOT NULL DEFAULT '',label VARCHAR(900) NOT NULL,content_hash VARCHAR(64) NOT NULL,evidence_hash VARCHAR(64) NOT NULL,evidence_required TINYINT(1) NOT NULL DEFAULT 1,evidence_snapshot JSON NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'pending',reused_verification_id BIGINT NULL,reviewer_id BIGINT NULL,comment LONGTEXT NOT NULL,reviewed_at DATETIME(6) NULL,
  UNIQUE KEY approval_verify_item_uniq(approval_id,section,entity_id),KEY avi6_status_idx(status),
  CONSTRAINT avi6_approval_fk FOREIGN KEY(approval_id) REFERENCES portal_profileapproval(id) ON DELETE CASCADE,
  CONSTRAINT avi6_reuse_fk FOREIGN KEY(reused_verification_id) REFERENCES portal_verificationrecord(id) ON DELETE SET NULL,
  CONSTRAINT avi6_reviewer_fk FOREIGN KEY(reviewer_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Foreign key/index bổ sung; nếu đã tồn tại hãy bỏ qua lỗi tên constraint khi chạy thủ công.
CREATE INDEX audit_lecturer_time_idx ON portal_auditlog(lecturer_id,at);
ALTER TABLE portal_auditlog ADD CONSTRAINT al6_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE SET NULL;
ALTER TABLE portal_profileapproval ADD CONSTRAINT pa6_parent_fk FOREIGN KEY(parent_approval_id) REFERENCES portal_profileapproval(id);

SET FOREIGN_KEY_CHECKS=1;
