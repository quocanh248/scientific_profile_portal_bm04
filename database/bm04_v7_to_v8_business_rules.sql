-- V8: cập nhật danh mục nhiệm vụ khoa học, không xóa dữ liệu lịch sử.
USE research_profiles_dev;

UPDATE portal_worktype SET is_active = 0
WHERE code IN ('monograph','student_project','student_scientific_topic','initiative');

UPDATE portal_worktype
SET name = 'Bài kỷ yếu hội thảo khoa học (khi có ISO)', is_active = 1
WHERE code = 'conference_proceedings';

UPDATE portal_worktype SET is_active = 1
WHERE code IN (
  'textbook','reference_book','professional_casebook','national_project',
  'ministerial_project','provincial_project','institutional_project','journal_article'
);
