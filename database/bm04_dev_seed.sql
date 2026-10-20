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
('monograph','Sách chuyên khảo',0),
('reference_book','Sách tham khảo',1),
('professional_casebook','Bài tập tình huống nghiệp vụ',1),
('national_project','Đề tài khoa học cấp quốc gia',1),
('ministerial_project','Đề tài khoa học cấp bộ',1),
('provincial_project','Đề tài khoa học cấp tỉnh/thành phố',1),
('institutional_project','Đề tài khoa học cấp cơ sở',1),
('student_project','Đề tài khoa học học viên',0),
('student_scientific_topic','Chuyên đề khoa học học viên',0),
('journal_article','Bài báo khoa học',1),
('conference_proceedings','Bài kỷ yếu hội thảo khoa học (khi có ISO)',1),
('initiative','Sáng kiến',0)
ON DUPLICATE KEY UPDATE name=VALUES(name),is_active=1;
