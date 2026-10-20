import os
from django.core.management.base import BaseCommand
from portal.models import User, WorkType, Department

WORK_TYPES = [
    ('textbook', 'Giáo trình'),
    ('reference_book', 'Sách tham khảo'),
    ('professional_casebook', 'Bài tập tình huống nghiệp vụ'),
    ('national_project', 'Đề tài khoa học cấp quốc gia'),
    ('ministerial_project', 'Đề tài khoa học cấp bộ'),
    ('provincial_project', 'Đề tài khoa học cấp tỉnh/thành phố'),
    ('institutional_project', 'Đề tài khoa học cấp cơ sở'),
    ('journal_article', 'Bài báo khoa học'),
    ('conference_proceedings', 'Bài kỷ yếu hội thảo khoa học (khi có ISO)'),
]


class Command(BaseCommand):
    help = 'Tạo/cập nhật danh mục BM-04 và tài khoản quản trị khởi tạo'

    def handle(self, *args, **kwargs):
        # Do not delete old rows because historical works may reference them.
        WorkType.objects.all().update(is_active=False)
        for code, name in WORK_TYPES:
            WorkType.objects.update_or_create(code=code, defaults={'name': name, 'is_active': True})

        Department.objects.get_or_create(code='CHUA_PB', defaults={'name': 'Chưa phân bộ môn'})
        username = os.getenv('BOOTSTRAP_ADMIN_USERNAME', '')
        password = os.getenv('BOOTSTRAP_ADMIN_PASSWORD', '')
        if username and password:
            if len(password) < 12:
                raise ValueError('BOOTSTRAP_ADMIN_PASSWORD phải có ít nhất 12 ký tự')
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'role': 'admin', 'is_staff': True, 'is_superuser': True, 'must_change_password': True},
            )
            if created:
                user.set_password(password)
                user.save()
            self.stdout.write('Admin created.' if created else 'Admin exists; password unchanged.')
        else:
            self.stdout.write('Set BOOTSTRAP_ADMIN_USERNAME/PASSWORD to create admin.')
