import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


def uid():
    return uuid.uuid4()


class Department(models.Model):
    """Đơn vị công tác hiện tại; Admin quản lý."""
    name = models.CharField(max_length=180, unique=True)
    code = models.CharField(max_length=30, unique=True)
    address = models.CharField(max_length=500, blank=True)
    head_name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=40, blank=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        LECTURER = 'lecturer', 'Giảng viên'
        REVIEWER = 'reviewer', 'Cán bộ NCKH'
        SIGNER = 'signer', 'Lãnh đạo ký'
        ADMIN = 'admin', 'Quản trị'
        VIEWER_ADMIN = 'viewer_admin', 'Admin xem'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.LECTURER)
    must_change_password = models.BooleanField(default=True)


class Lecturer(models.Model):
    """Nhóm thông tin nhân sự của BM-04. Giảng viên chỉ đọc, Admin cập nhật."""
    class Gender(models.TextChoices):
        MALE = 'male', 'Nam'
        FEMALE = 'female', 'Nữ'
        OTHER = 'other', 'Khác'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Đang công tác'
        INACTIVE = 'inactive', 'Nghỉ công tác'

    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    user = models.OneToOneField(User, on_delete=models.PROTECT, related_name='lecturer')
    staff_code = models.CharField(max_length=45, unique=True)
    full_name = models.CharField(max_length=200)
    personal_id = models.CharField(max_length=30, blank=True, db_index=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    professional_title = models.CharField(max_length=220, blank=True)  # Chức danh nghề nghiệp
    position = models.CharField(max_length=220, blank=True)  # Chức vụ
    home_address = models.CharField(max_length=700, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='current_lecturers')
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name


class DepartmentHistory(models.Model):
    """Lịch sử đơn vị nội bộ phục vụ thống kê theo đơn vị qua thời gian."""
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='department_history')
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['start_date']


class EmploymentRecord(models.Model):
    """Mục 9 BM-04: quá trình công tác do giảng viên tự cập nhật; Admin có thể hỗ trợ quản lý."""
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='employment_records')
    start_year = models.PositiveSmallIntegerField()
    end_year = models.PositiveSmallIntegerField(null=True, blank=True)
    position = models.CharField(max_length=220, blank=True)
    organization = models.CharField(max_length=300)
    organization_address = models.CharField(max_length=500, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'start_year', 'id']


class ScienceProfile(models.Model):
    """Nhóm thông tin học thuật/khoa học giảng viên được phép cập nhật theo BM-04."""
    class TalentCategory(models.TextChoices):
        SCIENCE_TALENT = 'science_talent', 'Nhân tài về khoa học, công nghệ và đổi mới sáng tạo'
        YOUNG_TALENT = 'young_talent', 'Nhà khoa học trẻ tài năng, kỹ sư trẻ tài năng'
        NONE = 'none', 'Không thuộc hai trường hợp trên'

    lecturer = models.OneToOneField(Lecturer, on_delete=models.CASCADE, related_name='science')
    academic_rank = models.CharField(max_length=150, blank=True)
    academic_rank_year = models.PositiveSmallIntegerField(null=True, blank=True)
    academic_degree = models.CharField(max_length=150, blank=True)
    academic_degree_year = models.PositiveSmallIntegerField(null=True, blank=True)
    talent_category = models.CharField(max_length=30, choices=TalentCategory.choices, default=TalentCategory.NONE)
    other_achievements = models.TextField(blank=True)  # Mục 15
    updated_at = models.DateTimeField(auto_now=True)


class EducationRecord(models.Model):
    """Mục 8 BM-04: quá trình đào tạo."""
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='education_records')
    level = models.CharField(max_length=150)
    institution = models.CharField(max_length=300)
    specialization = models.CharField(max_length=250)
    graduation_year = models.PositiveSmallIntegerField()
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'graduation_year', 'id']


class WorkType(models.Model):
    name = models.CharField(max_length=180, unique=True)
    code = models.CharField(max_length=60, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class ResearchWork(models.Model):
    """Mục 10 BM-04. Công trình dùng chung giữa nhiều giảng viên; chỉ xác minh trong checklist của hồ sơ BM-04 khi gửi phê duyệt."""
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Bản nháp'
        PENDING = 'pending', 'Chờ xác minh'
        CHANGES = 'changes', 'Yêu cầu bổ sung'
        VERIFIED = 'verified', 'Đã xác minh'
        REJECTED = 'rejected', 'Từ chối'

    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    title = models.CharField(max_length=900)
    title_norm = models.CharField(max_length=700, db_index=True)
    work_type = models.ForeignKey(WorkType, on_delete=models.PROTECT)
    publication_year = models.PositiveSmallIntegerField()
    doi = models.CharField(max_length=250, blank=True, db_index=True)
    doi_norm = models.CharField(max_length=250, blank=True, db_index=True)
    venue = models.CharField(max_length=500, blank=True)  # Nơi công bố/tạp chí
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='submitted_works')
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-publication_year', '-created_at']
        indexes = [models.Index(fields=['status', 'publication_year'], name='work_status_year_idx')]


class WorkAuthor(models.Model):
    class AuthorshipType(models.TextChoices):
        AUTHOR = 'author', 'Tác giả'
        COAUTHOR = 'coauthor', 'Đồng tác giả'

    work = models.ForeignKey(ResearchWork, on_delete=models.CASCADE, related_name='authors')
    lecturer = models.ForeignKey(Lecturer, on_delete=models.PROTECT, null=True, blank=True, related_name='authored_works')
    name = models.CharField(max_length=200)
    author_order = models.PositiveSmallIntegerField(default=1)
    authorship_type = models.CharField(max_length=20, choices=AuthorshipType.choices, default=AuthorshipType.COAUTHOR)
    role_note = models.CharField(max_length=150, blank=True)
    department_at_publication = models.ForeignKey(Department, null=True, blank=True, on_delete=models.PROTECT)

    class Meta:
        ordering = ['author_order', 'id']
        constraints = [models.UniqueConstraint(fields=['work', 'lecturer'], name='unique_internal_author_per_work')]


class WorkEvidence(models.Model):
    """Minh chứng bắt buộc của công trình khoa học.

    Từ V6.4, WorkEvidence không còn là "tài liệu đính kèm tùy chọn" mà là
    minh chứng dùng trực tiếp để Phòng NCKH xác minh công trình trong BM-04.
    """
    class ValidityMode(models.TextChoices):
        INDEFINITE = 'indefinite', 'Vô thời hạn'
        FIXED = 'fixed', 'Có thời hạn'

    work = models.ForeignKey(ResearchWork, on_delete=models.CASCADE, related_name='evidence')
    validity_mode = models.CharField(max_length=16, choices=ValidityMode.choices, default=ValidityMode.INDEFINITE, db_index=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True, db_index=True)
    private_path = models.CharField(max_length=500)
    original_name = models.CharField(max_length=260)
    mime_type = models.CharField(max_length=80)
    sha256 = models.CharField(max_length=64)
    size = models.PositiveIntegerField()
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)


class WorkReview(models.Model):
    work = models.ForeignKey(ResearchWork, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.PROTECT)
    action = models.CharField(max_length=30)
    comment = models.TextField(blank=True)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-at']


class WorkLinkRequest(models.Model):
    work = models.ForeignKey(ResearchWork, on_delete=models.CASCADE, related_name='link_requests')
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE)
    requested_authorship_type = models.CharField(max_length=20, choices=WorkAuthor.AuthorshipType.choices, default=WorkAuthor.AuthorshipType.COAUTHOR)
    department_at_publication = models.ForeignKey(Department, null=True, blank=True, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, default='pending')
    reviewer = models.ForeignKey(User, null=True, blank=True, on_delete=models.PROTECT, related_name='reviewed_links')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['work', 'lecturer'], name='unique_link_request')]


class WorkCorrection(models.Model):
    work = models.ForeignKey(ResearchWork, on_delete=models.CASCADE, related_name='corrections')
    proposer = models.ForeignKey(User, on_delete=models.PROTECT)
    proposed = models.JSONField()
    status = models.CharField(max_length=20, default='pending')
    comment = models.TextField(blank=True)
    reviewer = models.ForeignKey(User, null=True, blank=True, on_delete=models.PROTECT, related_name='reviewed_corrections')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)


class WorkVersion(models.Model):
    work = models.ForeignKey(ResearchWork, on_delete=models.CASCADE, related_name='versions')
    previous = models.JSONField()
    recorded_at = models.DateTimeField(auto_now_add=True)


class IntellectualPropertyRecord(models.Model):
    """Mục 11 BM-04."""
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='ip_records')
    title_content = models.CharField(max_length=900)
    grant_year = models.PositiveSmallIntegerField()
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', '-grant_year', 'id']


class PracticalApplicationRecord(models.Model):
    """Mục 12 BM-04."""
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='practical_applications')
    work_name = models.CharField(max_length=900)
    application_detail = models.TextField()  # Hình thức, quy mô, địa chỉ áp dụng
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', '-start_date', 'id']


class ResearchTaskRecord(models.Model):
    """Mục 13 BM-04: nhiệm vụ KH,CN&ĐMST đã/đang chủ trì hoặc tham gia."""
    class ParticipationRole(models.TextChoices):
        LEAD = 'lead', 'Chủ trì'
        PARTICIPANT = 'participant', 'Tham gia'

    class TaskStatus(models.TextChoices):
        ACCEPTED = 'accepted', 'Đã nghiệm thu'
        ONGOING = 'ongoing', 'Chưa nghiệm thu'

    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='research_tasks')
    name = models.CharField(max_length=900)
    participation_role = models.CharField(max_length=20, choices=ParticipationRole.choices)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    program_name = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=TaskStatus.choices)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', '-start_date', 'id']


class AwardRecord(models.Model):
    """Mục 14 BM-04."""
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='awards')
    description = models.CharField(max_length=900)
    award_year = models.PositiveSmallIntegerField()
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', '-award_year', 'id']


class EvidenceDocument(models.Model):
    """Minh chứng xác minh gắn với từng dữ liệu khoa học của giảng viên.

    Với Mục 10 (Công trình khoa học), hệ thống dùng WorkEvidence làm minh chứng
    bắt buộc ở cấp công trình. EvidenceDocument dùng cho các mục dữ liệu khoa học còn lại.
    """
    class Section(models.TextChoices):
        EDUCATION = 'education', 'Quá trình đào tạo'
        EMPLOYMENT = 'employment', 'Quá trình công tác'
        WORK = 'work', 'Công trình khoa học'
        IP = 'ip', 'Văn bằng sở hữu trí tuệ'
        PRACTICAL = 'practical', 'Áp dụng trong thực tiễn'
        TASK = 'task', 'Nhiệm vụ KH,CN&ĐMST'
        AWARD = 'award', 'Giải thưởng'
        ACHIEVEMENT = 'achievement', 'Thành tựu khác'

    class ValidityMode(models.TextChoices):
        INDEFINITE = 'indefinite', 'Vô thời hạn'
        FIXED = 'fixed', 'Có thời hạn'

    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='evidence_documents')
    # section/entity_id được giữ để tương thích dữ liệu V6 cũ và biểu thị liên kết đầu tiên.
    # Từ V6.3, một minh chứng có thể dùng cho nhiều dữ liệu qua EvidenceLink.
    section = models.CharField(max_length=30, choices=Section.choices, db_index=True)
    entity_id = models.CharField(max_length=100, blank=True, db_index=True)
    validity_mode = models.CharField(max_length=16, choices=ValidityMode.choices, default=ValidityMode.INDEFINITE, db_index=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True, db_index=True)
    private_path = models.CharField(max_length=500)
    original_name = models.CharField(max_length=260)
    mime_type = models.CharField(max_length=80)
    sha256 = models.CharField(max_length=64)
    size = models.PositiveIntegerField()
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='uploaded_profile_evidence')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']
        indexes = [
            models.Index(fields=['lecturer', 'section', 'entity_id', 'is_active'], name='evidence_lookup_idx'),
        ]


class EvidenceLink(models.Model):
    """Liên kết N:M giữa một minh chứng và một hoặc nhiều thông tin khoa học."""
    evidence = models.ForeignKey(EvidenceDocument, on_delete=models.CASCADE, related_name='links')
    section = models.CharField(max_length=30, choices=EvidenceDocument.Section.choices, db_index=True)
    entity_id = models.CharField(max_length=100, blank=True, db_index=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_evidence_links')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']
        constraints = [models.UniqueConstraint(fields=['evidence', 'section', 'entity_id'], name='unique_evidence_entity_link')]
        indexes = [models.Index(fields=['section', 'entity_id'], name='evidence_link_lookup_idx')]


class VerificationRecord(models.Model):
    """Kết quả xác minh có thể tái sử dụng khi dữ liệu và tập minh chứng không đổi."""
    class Status(models.TextChoices):
        VERIFIED = 'verified', 'Đã xác minh'
        REJECTED = 'rejected', 'Từ chối'

    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='verification_records')
    section = models.CharField(max_length=30, choices=EvidenceDocument.Section.choices, db_index=True)
    entity_id = models.CharField(max_length=100, blank=True, db_index=True)
    content_hash = models.CharField(max_length=64, db_index=True)
    evidence_hash = models.CharField(max_length=64, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.VERIFIED)
    reviewer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='verification_records')
    comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-reviewed_at']
        indexes = [models.Index(fields=['lecturer', 'section', 'entity_id', 'status'], name='verification_lookup_idx')]


class ProfileApproval(models.Model):
    """Một lần tạo BM-04 cho một nhiệm vụ cụ thể; snapshot bất biến sau khi gửi."""
    class RegisteredRole(models.TextChoices):
        LEAD = 'lead', 'Chủ nhiệm nhiệm vụ'
        SECRETARY = 'secretary', 'Thư ký nhiệm vụ'
        OTHER = 'other', 'Chức danh khác trong Ban Chủ nhiệm nhiệm vụ'

    class Status(models.TextChoices):
        REVIEW = 'review', 'Chờ NCKH kiểm tra'
        SIGNER = 'signer', 'Chờ lãnh đạo phê duyệt'
        PRINT = 'print', 'Đã duyệt - chờ ký số nội bộ'
        SIGNED = 'signed', 'Đã ký tay - chờ lưu scan (legacy)'
        COMPLETED = 'completed', 'Hoàn tất'
        CHANGES = 'changes', 'Yêu cầu chỉnh sửa'
        REJECTED = 'rejected', 'Từ chối'

    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    parent_approval = models.ForeignKey('self', null=True, blank=True, on_delete=models.PROTECT, related_name='child_versions')
    version = models.PositiveIntegerField(default=1)
    lecturer = models.ForeignKey(Lecturer, on_delete=models.PROTECT, related_name='approvals')
    code = models.CharField(max_length=40, unique=True)
    form_code = models.CharField(max_length=20, default='BM-04')
    form_version = models.CharField(max_length=80, default='22/2026/TT-BCA-2026-02-26')
    task_name = models.CharField(max_length=900)
    registered_role = models.CharField(max_length=20, choices=RegisteredRole.choices)
    registered_role_other = models.CharField(max_length=250, blank=True)
    signing_place = models.CharField(max_length=180, blank=True)
    signing_date = models.DateField()
    snapshot = models.JSONField()
    snapshot_sha256 = models.CharField(max_length=64)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REVIEW)
    reviewer = models.ForeignKey(User, null=True, blank=True, on_delete=models.PROTECT, related_name='reviewed_approvals')
    signer = models.ForeignKey(User, null=True, blank=True, on_delete=models.PROTECT, related_name='signed_approvals')
    pdf_path = models.CharField(max_length=500)
    pdf_sha256 = models.CharField(max_length=64)
    scan_path = models.CharField(max_length=500, blank=True)
    scan_sha256 = models.CharField(max_length=64, blank=True)
    signed_pdf_path = models.CharField(max_length=500, blank=True)
    signed_pdf_sha256 = models.CharField(max_length=64, blank=True)
    comment = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['status', 'submitted_at'], name='approval_status_time_idx'),
            models.Index(fields=['lecturer', 'status'], name='approval_lect_status_idx'),
        ]


class ApprovalVerificationItem(models.Model):
    """Checklist xác minh từng dữ liệu/minh chứng trong một phiên bản BM-04."""
    class Status(models.TextChoices):
        PENDING = 'pending', 'Chờ xác minh'
        VERIFIED = 'verified', 'Đã xác minh'
        CHANGES = 'changes', 'Cần bổ sung'
        REJECTED = 'rejected', 'Từ chối'

    approval = models.ForeignKey(ProfileApproval, on_delete=models.CASCADE, related_name='verification_items')
    section = models.CharField(max_length=30, choices=EvidenceDocument.Section.choices, db_index=True)
    entity_id = models.CharField(max_length=100, blank=True)
    label = models.CharField(max_length=900)
    content_hash = models.CharField(max_length=64)
    evidence_hash = models.CharField(max_length=64)
    evidence_required = models.BooleanField(default=True)
    evidence_snapshot = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    reused_verification = models.ForeignKey(VerificationRecord, null=True, blank=True, on_delete=models.SET_NULL)
    reviewer = models.ForeignKey(User, null=True, blank=True, on_delete=models.PROTECT, related_name='approval_verification_items')
    comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['section', 'id']
        constraints = [models.UniqueConstraint(fields=['approval', 'section', 'entity_id'], name='unique_approval_verify_item')]


class SigningIdentity(models.Model):
    """Danh tính ký số nội bộ. Khóa riêng được mã hóa ở server; ảnh chữ ký chỉ dùng để hiển thị trên BM-04."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='signing_identity')
    display_name = models.CharField(max_length=200, blank=True)
    position = models.CharField(max_length=220, blank=True)
    certificate_pem = models.TextField(blank=True)
    certificate_serial = models.CharField(max_length=80, blank=True, db_index=True)
    encrypted_private_key = models.TextField(blank=True)
    signature_image_path = models.CharField(max_length=500, blank=True)
    signature_image_sha256 = models.CharField(max_length=64, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class DigitalSignature(models.Model):
    """Một giao dịch ký số nội bộ cho BM-04.

    PERSONAL: giảng viên ký ngay khi gửi yêu cầu xác minh lý lịch.
    UNIT: đại diện đơn vị/lãnh đạo ký sau khi hồ sơ được phê duyệt.
    """
    class SignatureRole(models.TextChoices):
        PERSONAL = 'personal', 'Cá nhân đăng ký thực hiện nhiệm vụ'
        UNIT = 'unit', 'Đại diện đơn vị công tác xác nhận'

    approval = models.ForeignKey(ProfileApproval, on_delete=models.CASCADE, related_name='digital_signatures')
    signer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='digital_signatures')
    identity = models.ForeignKey(SigningIdentity, on_delete=models.PROTECT)
    signature_role = models.CharField(max_length=20, choices=SignatureRole.choices, default=SignatureRole.UNIT, db_index=True)
    # Metadata hiển thị được đóng băng tại thời điểm ký để việc thay ảnh chữ ký sau này
    # không làm thay đổi các BM-04 đã ký trước đó.
    visible_signature = models.JSONField(default=dict)
    signature_b64 = models.TextField()
    certificate_pem = models.TextField()
    algorithm = models.CharField(max_length=80, default='RSA-PSS-SHA256')
    source_pdf_sha256 = models.CharField(max_length=64)
    signed_pdf_sha256 = models.CharField(max_length=64)
    signed_file_path = models.CharField(max_length=500)
    verification_code = models.CharField(max_length=64, unique=True)
    verification_status = models.CharField(max_length=20, default='valid')
    signed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['signed_at']
        indexes = [models.Index(fields=['approval', 'signature_role'], name='sig_approval_role_idx')]


class ApprovalEvent(models.Model):
    approval = models.ForeignKey(ProfileApproval, on_delete=models.CASCADE, related_name='events')
    actor = models.ForeignKey(User, on_delete=models.PROTECT)
    action = models.CharField(max_length=50)
    note = models.TextField(blank=True)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['at']


class AuditLog(models.Model):
    actor = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    lecturer = models.ForeignKey(Lecturer, null=True, blank=True, on_delete=models.SET_NULL, related_name='audit_logs')
    action = models.CharField(max_length=100)
    entity = models.CharField(max_length=80)
    entity_id = models.CharField(max_length=100, blank=True)
    details = models.JSONField(default=dict)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-at']


class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='sent_notifications')
    title = models.CharField(max_length=170)
    body = models.CharField(max_length=500, blank=True)
    entity_id = models.CharField(max_length=100, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
