-- BM-04 DEV V6 - MySQL 8.x
-- Schema độc lập để khởi tạo môi trường DEV, chưa phải Docker production.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
CREATE DATABASE IF NOT EXISTS research_profiles_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE research_profiles_dev;

CREATE TABLE IF NOT EXISTS django_migrations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  app VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  applied DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS django_content_type (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  app_label VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  UNIQUE KEY django_content_type_app_model_uniq (app_label,model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS auth_permission (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content_type_id BIGINT NOT NULL,
  codename VARCHAR(100) NOT NULL,
  UNIQUE KEY auth_permission_ct_code_uniq (content_type_id,codename),
  CONSTRAINT auth_permission_ct_fk FOREIGN KEY (content_type_id) REFERENCES django_content_type(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS auth_group (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS auth_group_permissions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  UNIQUE KEY auth_group_permissions_uniq (group_id,permission_id),
  CONSTRAINT auth_gp_group_fk FOREIGN KEY (group_id) REFERENCES auth_group(id) ON DELETE CASCADE,
  CONSTRAINT auth_gp_perm_fk FOREIGN KEY (permission_id) REFERENCES auth_permission(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_department (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL UNIQUE,
  code VARCHAR(30) NOT NULL UNIQUE,
  address VARCHAR(500) NOT NULL DEFAULT '',
  head_name VARCHAR(200) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_user (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  password VARCHAR(128) NOT NULL,
  last_login DATETIME(6) NULL,
  is_superuser TINYINT(1) NOT NULL DEFAULT 0,
  username VARCHAR(150) NOT NULL UNIQUE,
  first_name VARCHAR(150) NOT NULL DEFAULT '',
  last_name VARCHAR(150) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL DEFAULT '',
  is_staff TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  date_joined DATETIME(6) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'lecturer',
  must_change_password TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_user_groups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,user_id BIGINT NOT NULL,group_id BIGINT NOT NULL,
  UNIQUE KEY portal_user_groups_uniq(user_id,group_id),
  CONSTRAINT pug_user_fk FOREIGN KEY(user_id) REFERENCES portal_user(id) ON DELETE CASCADE,
  CONSTRAINT pug_group_fk FOREIGN KEY(group_id) REFERENCES auth_group(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_user_user_permissions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,user_id BIGINT NOT NULL,permission_id BIGINT NOT NULL,
  UNIQUE KEY portal_user_perm_uniq(user_id,permission_id),
  CONSTRAINT pup_user_fk FOREIGN KEY(user_id) REFERENCES portal_user(id) ON DELETE CASCADE,
  CONSTRAINT pup_perm_fk FOREIGN KEY(permission_id) REFERENCES auth_permission(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_lecturer (
  id CHAR(32) PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  staff_code VARCHAR(45) NOT NULL UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  personal_id VARCHAR(30) NOT NULL DEFAULT '',
  date_of_birth DATE NULL,
  gender VARCHAR(10) NOT NULL DEFAULT '',
  professional_title VARCHAR(220) NOT NULL DEFAULT '',
  position VARCHAR(220) NOT NULL DEFAULT '',
  home_address VARCHAR(700) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL DEFAULT '',
  department_id BIGINT NOT NULL,
  status VARCHAR(25) NOT NULL DEFAULT 'active',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  KEY lecturer_personal_id_idx(personal_id),
  CONSTRAINT lecturer_user_fk FOREIGN KEY(user_id) REFERENCES portal_user(id),
  CONSTRAINT lecturer_department_fk FOREIGN KEY(department_id) REFERENCES portal_department(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_departmenthistory (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL,department_id BIGINT NOT NULL,start_date DATE NOT NULL,end_date DATE NULL,
  CONSTRAINT dh_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE,
  CONSTRAINT dh_department_fk FOREIGN KEY(department_id) REFERENCES portal_department(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_employmentrecord (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL,start_year SMALLINT UNSIGNED NOT NULL,end_year SMALLINT UNSIGNED NULL,position VARCHAR(220) NOT NULL DEFAULT '',organization VARCHAR(300) NOT NULL,organization_address VARCHAR(500) NOT NULL DEFAULT '',sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT emp_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_scienceprofile (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL UNIQUE,academic_rank VARCHAR(150) NOT NULL DEFAULT '',academic_rank_year SMALLINT UNSIGNED NULL,academic_degree VARCHAR(150) NOT NULL DEFAULT '',academic_degree_year SMALLINT UNSIGNED NULL,talent_category VARCHAR(30) NOT NULL DEFAULT 'none',other_achievements LONGTEXT NOT NULL,updated_at DATETIME(6) NOT NULL,
  CONSTRAINT science_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_educationrecord (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL,level VARCHAR(150) NOT NULL,institution VARCHAR(300) NOT NULL,specialization VARCHAR(250) NOT NULL,graduation_year SMALLINT UNSIGNED NOT NULL,sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT edu_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_intellectualpropertyrecord (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL,title_content VARCHAR(900) NOT NULL,grant_year SMALLINT UNSIGNED NOT NULL,sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT ip_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_practicalapplicationrecord (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL,work_name VARCHAR(900) NOT NULL,application_detail LONGTEXT NOT NULL,start_date DATE NULL,end_date DATE NULL,sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT practical_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_researchtaskrecord (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL,name VARCHAR(900) NOT NULL,participation_role VARCHAR(20) NOT NULL,start_date DATE NULL,end_date DATE NULL,program_name VARCHAR(500) NOT NULL DEFAULT '',status VARCHAR(20) NOT NULL,sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT task_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_awardrecord (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL,description VARCHAR(900) NOT NULL,award_year SMALLINT UNSIGNED NOT NULL,sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT award_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_worktype (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(180) NOT NULL UNIQUE,code VARCHAR(60) NOT NULL UNIQUE,is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_researchwork (
  id CHAR(32) PRIMARY KEY,title VARCHAR(900) NOT NULL,title_norm VARCHAR(700) NOT NULL,work_type_id BIGINT NOT NULL,publication_year SMALLINT UNSIGNED NOT NULL,doi VARCHAR(250) NOT NULL DEFAULT '',doi_norm VARCHAR(250) NOT NULL DEFAULT '',venue VARCHAR(500) NOT NULL DEFAULT '',status VARCHAR(20) NOT NULL DEFAULT 'draft',created_by_id BIGINT NOT NULL,verified_at DATETIME(6) NULL,created_at DATETIME(6) NOT NULL,updated_at DATETIME(6) NOT NULL,
  KEY work_title_norm_idx(title_norm),KEY work_doi_idx(doi),KEY work_doi_norm_idx(doi_norm),KEY work_status_year_idx(status,publication_year),
  CONSTRAINT work_type_fk FOREIGN KEY(work_type_id) REFERENCES portal_worktype(id),
  CONSTRAINT work_creator_fk FOREIGN KEY(created_by_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_workauthor (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,work_id CHAR(32) NOT NULL,lecturer_id CHAR(32) NULL,name VARCHAR(200) NOT NULL,author_order SMALLINT UNSIGNED NOT NULL DEFAULT 1,authorship_type VARCHAR(20) NOT NULL DEFAULT 'coauthor',role_note VARCHAR(150) NOT NULL DEFAULT '',department_at_publication_id BIGINT NULL,
  UNIQUE KEY work_author_internal_uniq(work_id,lecturer_id),
  CONSTRAINT wa_work_fk FOREIGN KEY(work_id) REFERENCES portal_researchwork(id) ON DELETE CASCADE,
  CONSTRAINT wa_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id),
  CONSTRAINT wa_department_fk FOREIGN KEY(department_at_publication_id) REFERENCES portal_department(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_workevidence (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,work_id CHAR(32) NOT NULL,
  validity_mode VARCHAR(16) NOT NULL DEFAULT 'indefinite',valid_from DATE NULL,valid_until DATE NULL,
  private_path VARCHAR(500) NOT NULL,original_name VARCHAR(260) NOT NULL,mime_type VARCHAR(80) NOT NULL,sha256 VARCHAR(64) NOT NULL,size INT UNSIGNED NOT NULL,uploaded_by_id BIGINT NOT NULL,created_at DATETIME(6) NOT NULL,
  KEY workevidence_validity_mode_idx(validity_mode),KEY workevidence_valid_until_idx(valid_until),
  CONSTRAINT we_work_fk FOREIGN KEY(work_id) REFERENCES portal_researchwork(id) ON DELETE CASCADE,
  CONSTRAINT we_user_fk FOREIGN KEY(uploaded_by_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_workreview (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,work_id CHAR(32) NOT NULL,reviewer_id BIGINT NOT NULL,action VARCHAR(30) NOT NULL,comment LONGTEXT NOT NULL,at DATETIME(6) NOT NULL,
  CONSTRAINT wr_work_fk FOREIGN KEY(work_id) REFERENCES portal_researchwork(id) ON DELETE CASCADE,
  CONSTRAINT wr_user_fk FOREIGN KEY(reviewer_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_worklinkrequest (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,work_id CHAR(32) NOT NULL,lecturer_id CHAR(32) NOT NULL,requested_authorship_type VARCHAR(20) NOT NULL DEFAULT 'coauthor',department_at_publication_id BIGINT NULL,status VARCHAR(20) NOT NULL DEFAULT 'pending',reviewer_id BIGINT NULL,reviewed_at DATETIME(6) NULL,created_at DATETIME(6) NOT NULL,
  UNIQUE KEY work_link_uniq(work_id,lecturer_id),
  CONSTRAINT wlr_work_fk FOREIGN KEY(work_id) REFERENCES portal_researchwork(id) ON DELETE CASCADE,
  CONSTRAINT wlr_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE,
  CONSTRAINT wlr_dep_fk FOREIGN KEY(department_at_publication_id) REFERENCES portal_department(id),
  CONSTRAINT wlr_reviewer_fk FOREIGN KEY(reviewer_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_workcorrection (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,work_id CHAR(32) NOT NULL,proposer_id BIGINT NOT NULL,proposed JSON NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'pending',comment LONGTEXT NOT NULL,reviewer_id BIGINT NULL,created_at DATETIME(6) NOT NULL,reviewed_at DATETIME(6) NULL,
  CONSTRAINT wc_work_fk FOREIGN KEY(work_id) REFERENCES portal_researchwork(id) ON DELETE CASCADE,
  CONSTRAINT wc_proposer_fk FOREIGN KEY(proposer_id) REFERENCES portal_user(id),
  CONSTRAINT wc_reviewer_fk FOREIGN KEY(reviewer_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_workversion (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,work_id CHAR(32) NOT NULL,previous JSON NOT NULL,recorded_at DATETIME(6) NOT NULL,
  CONSTRAINT wv_work_fk FOREIGN KEY(work_id) REFERENCES portal_researchwork(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_evidencedocument (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL,section VARCHAR(30) NOT NULL,entity_id VARCHAR(100) NOT NULL DEFAULT '',validity_mode VARCHAR(16) NOT NULL DEFAULT 'indefinite',valid_from DATE NULL,valid_until DATE NULL,private_path VARCHAR(500) NOT NULL,original_name VARCHAR(260) NOT NULL,mime_type VARCHAR(80) NOT NULL,sha256 VARCHAR(64) NOT NULL,size INT UNSIGNED NOT NULL,uploaded_by_id BIGINT NOT NULL,is_active TINYINT(1) NOT NULL DEFAULT 1,created_at DATETIME(6) NOT NULL,
  KEY evidence_lookup_idx(lecturer_id,section,entity_id,is_active),KEY evidence_validity_mode_idx(validity_mode),KEY evidence_valid_until_idx(valid_until),
  CONSTRAINT ev_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE,
  CONSTRAINT ev_user_fk FOREIGN KEY(uploaded_by_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_evidencelink (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,evidence_id BIGINT NOT NULL,section VARCHAR(30) NOT NULL,entity_id VARCHAR(100) NOT NULL DEFAULT '',created_by_id BIGINT NOT NULL,created_at DATETIME(6) NOT NULL,
  UNIQUE KEY unique_evidence_entity_link(evidence_id,section,entity_id),KEY evidence_link_lookup_idx(section,entity_id),KEY evidencelink_created_by_idx(created_by_id),
  CONSTRAINT evidencelink_evidence_fk FOREIGN KEY(evidence_id) REFERENCES portal_evidencedocument(id) ON DELETE CASCADE,
  CONSTRAINT evidencelink_user_fk FOREIGN KEY(created_by_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_verificationrecord (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,lecturer_id CHAR(32) NOT NULL,section VARCHAR(30) NOT NULL,entity_id VARCHAR(100) NOT NULL DEFAULT '',content_hash VARCHAR(64) NOT NULL,evidence_hash VARCHAR(64) NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'verified',reviewer_id BIGINT NOT NULL,comment LONGTEXT NOT NULL,reviewed_at DATETIME(6) NOT NULL,
  KEY verification_lookup_idx(lecturer_id,section,entity_id,status),KEY vr_content_hash_idx(content_hash),KEY vr_evidence_hash_idx(evidence_hash),
  CONSTRAINT vr_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE CASCADE,
  CONSTRAINT vr_reviewer_fk FOREIGN KEY(reviewer_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_profileapproval (
  id CHAR(32) PRIMARY KEY,parent_approval_id CHAR(32) NULL,version INT UNSIGNED NOT NULL DEFAULT 1,lecturer_id CHAR(32) NOT NULL,code VARCHAR(40) NOT NULL UNIQUE,form_code VARCHAR(20) NOT NULL DEFAULT 'BM-04',form_version VARCHAR(80) NOT NULL DEFAULT '22/2026/TT-BCA-2026-02-26',task_name VARCHAR(900) NOT NULL,registered_role VARCHAR(20) NOT NULL,registered_role_other VARCHAR(250) NOT NULL DEFAULT '',signing_place VARCHAR(180) NOT NULL DEFAULT '',signing_date DATE NOT NULL,snapshot JSON NOT NULL,snapshot_sha256 VARCHAR(64) NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'review',reviewer_id BIGINT NULL,signer_id BIGINT NULL,pdf_path VARCHAR(500) NOT NULL,pdf_sha256 VARCHAR(64) NOT NULL,scan_path VARCHAR(500) NOT NULL DEFAULT '',scan_sha256 VARCHAR(64) NOT NULL DEFAULT '',signed_pdf_path VARCHAR(500) NOT NULL DEFAULT '',signed_pdf_sha256 VARCHAR(64) NOT NULL DEFAULT '',comment LONGTEXT NOT NULL,submitted_at DATETIME(6) NOT NULL,reviewed_at DATETIME(6) NULL,approved_at DATETIME(6) NULL,completed_at DATETIME(6) NULL,
  KEY approval_status_time_idx(status,submitted_at),KEY approval_lect_status_idx(lecturer_id,status),
  CONSTRAINT pa_parent_fk FOREIGN KEY(parent_approval_id) REFERENCES portal_profileapproval(id),
  CONSTRAINT pa_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id),
  CONSTRAINT pa_reviewer_fk FOREIGN KEY(reviewer_id) REFERENCES portal_user(id),
  CONSTRAINT pa_signer_fk FOREIGN KEY(signer_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_approvalverificationitem (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,approval_id CHAR(32) NOT NULL,section VARCHAR(30) NOT NULL,entity_id VARCHAR(100) NOT NULL DEFAULT '',label VARCHAR(900) NOT NULL,content_hash VARCHAR(64) NOT NULL,evidence_hash VARCHAR(64) NOT NULL,evidence_required TINYINT(1) NOT NULL DEFAULT 1,evidence_snapshot JSON NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'pending',reused_verification_id BIGINT NULL,reviewer_id BIGINT NULL,comment LONGTEXT NOT NULL,reviewed_at DATETIME(6) NULL,
  UNIQUE KEY approval_verify_item_uniq(approval_id,section,entity_id),KEY avi_status_idx(status),
  CONSTRAINT avi_approval_fk FOREIGN KEY(approval_id) REFERENCES portal_profileapproval(id) ON DELETE CASCADE,
  CONSTRAINT avi_reuse_fk FOREIGN KEY(reused_verification_id) REFERENCES portal_verificationrecord(id) ON DELETE SET NULL,
  CONSTRAINT avi_reviewer_fk FOREIGN KEY(reviewer_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_signingidentity (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,user_id BIGINT NOT NULL UNIQUE,display_name VARCHAR(200) NOT NULL DEFAULT '',position VARCHAR(220) NOT NULL DEFAULT '',certificate_pem LONGTEXT NOT NULL,certificate_serial VARCHAR(80) NOT NULL DEFAULT '',encrypted_private_key LONGTEXT NOT NULL,signature_image_path VARCHAR(500) NOT NULL DEFAULT '',signature_image_sha256 VARCHAR(64) NOT NULL DEFAULT '',is_active TINYINT(1) NOT NULL DEFAULT 1,created_at DATETIME(6) NOT NULL,updated_at DATETIME(6) NOT NULL,
  KEY signing_serial_idx(certificate_serial),CONSTRAINT si_user_fk FOREIGN KEY(user_id) REFERENCES portal_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_digitalsignature (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,approval_id CHAR(32) NOT NULL,signer_id BIGINT NOT NULL,identity_id BIGINT NOT NULL,signature_role VARCHAR(20) NOT NULL DEFAULT 'unit',visible_signature JSON NOT NULL,signature_b64 LONGTEXT NOT NULL,certificate_pem LONGTEXT NOT NULL,algorithm VARCHAR(80) NOT NULL DEFAULT 'RSA-PSS-SHA256',source_pdf_sha256 VARCHAR(64) NOT NULL,signed_pdf_sha256 VARCHAR(64) NOT NULL,signed_file_path VARCHAR(500) NOT NULL,verification_code VARCHAR(64) NOT NULL UNIQUE,verification_status VARCHAR(20) NOT NULL DEFAULT 'valid',signed_at DATETIME(6) NOT NULL,
  KEY sig_approval_role_idx(approval_id,signature_role),
  CONSTRAINT ds_approval_fk FOREIGN KEY(approval_id) REFERENCES portal_profileapproval(id) ON DELETE CASCADE,
  CONSTRAINT ds_signer_fk FOREIGN KEY(signer_id) REFERENCES portal_user(id),
  CONSTRAINT ds_identity_fk FOREIGN KEY(identity_id) REFERENCES portal_signingidentity(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_approvalevent (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,approval_id CHAR(32) NOT NULL,actor_id BIGINT NOT NULL,action VARCHAR(50) NOT NULL,note LONGTEXT NOT NULL,at DATETIME(6) NOT NULL,
  CONSTRAINT ae_approval_fk FOREIGN KEY(approval_id) REFERENCES portal_profileapproval(id) ON DELETE CASCADE,
  CONSTRAINT ae_actor_fk FOREIGN KEY(actor_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_auditlog (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,actor_id BIGINT NULL,lecturer_id CHAR(32) NULL,action VARCHAR(100) NOT NULL,entity VARCHAR(80) NOT NULL,entity_id VARCHAR(100) NOT NULL DEFAULT '',details JSON NOT NULL,at DATETIME(6) NOT NULL,
  KEY audit_lecturer_time_idx(lecturer_id,at),KEY audit_action_idx(action),
  CONSTRAINT al_actor_fk FOREIGN KEY(actor_id) REFERENCES portal_user(id) ON DELETE SET NULL,
  CONSTRAINT al_lecturer_fk FOREIGN KEY(lecturer_id) REFERENCES portal_lecturer(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS portal_notification (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,recipient_id BIGINT NOT NULL,actor_id BIGINT NULL,title VARCHAR(170) NOT NULL,body VARCHAR(500) NOT NULL DEFAULT '',entity_id VARCHAR(100) NOT NULL DEFAULT '',read_at DATETIME(6) NULL,created_at DATETIME(6) NOT NULL,
  CONSTRAINT notif_recipient_fk FOREIGN KEY(recipient_id) REFERENCES portal_user(id) ON DELETE CASCADE,
  CONSTRAINT notif_actor_fk FOREIGN KEY(actor_id) REFERENCES portal_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS django_session (
  session_key VARCHAR(40) PRIMARY KEY,session_data LONGTEXT NOT NULL,expire_date DATETIME(6) NOT NULL,KEY django_session_expire_idx(expire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS django_admin_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,action_time DATETIME(6) NOT NULL,object_id LONGTEXT NULL,object_repr VARCHAR(200) NOT NULL,action_flag SMALLINT UNSIGNED NOT NULL,change_message LONGTEXT NOT NULL,content_type_id BIGINT NULL,user_id BIGINT NOT NULL,
  CONSTRAINT dal_ct_fk FOREIGN KEY(content_type_id) REFERENCES django_content_type(id) ON DELETE SET NULL,
  CONSTRAINT dal_user_fk FOREIGN KEY(user_id) REFERENCES portal_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
USE research_profiles_dev;
INSERT INTO portal_department(code,name,address,head_name,phone)
VALUES ('CHUA_PB','Chưa phân bộ môn','','','')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Đơn vị kiểm thử DEV (có thể xóa hoặc đổi tên sau khi kiểm thử)
INSERT INTO portal_department(code,name,address,head_name,phone) VALUES
('KT01','Khoa kiểm thử 01','','',''),
('KT02','Khoa kiểm thử 02','','',''),
('KT03','Khoa kiểm thử 03','','','')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO portal_worktype(code,name,is_active) VALUES
('textbook','Giáo trình',1),
('monograph','Sách chuyên khảo',1),
('reference_book','Sách tham khảo',1),
('professional_casebook','Bài tập tình huống nghiệp vụ',1),
('national_project','Đề tài khoa học cấp quốc gia',1),
('ministerial_project','Đề tài khoa học cấp bộ',1),
('provincial_project','Đề tài khoa học cấp tỉnh/thành phố',1),
('institutional_project','Đề tài khoa học cấp cơ sở',1),
('student_project','Đề tài khoa học học viên',1),
('student_scientific_topic','Chuyên đề khoa học học viên',1),
('journal_article','Bài báo khoa học',1),
('conference_proceedings','Bài kỷ yếu hội thảo khoa học',1),
('initiative','Sáng kiến',1)
ON DUPLICATE KEY UPDATE name=VALUES(name),is_active=1;
