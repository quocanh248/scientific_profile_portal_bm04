"""Private storage, normalized identifiers and immutable BM-04 snapshot assembly."""
import hashlib
import json
import mimetypes
import re
import unicodedata
import uuid
from pathlib import Path
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db import models
from .models import (
    ResearchWork, WorkAuthor, WorkEvidence, IntellectualPropertyRecord,
    PracticalApplicationRecord, AwardRecord, EvidenceDocument, EvidenceLink, VerificationRecord,
)


def normalize_title(s):
    s = unicodedata.normalize('NFKC', str(s or '')).casefold()
    return re.sub(r'\s+', ' ', s).strip()[:700]


def normalize_doi(s):
    s = str(s or '').strip().casefold()
    return re.sub(r'^(?:https?://(?:dx\.)?doi\.org/|doi:\s*)', '', s).strip()


def find_duplicate(title, year, doi, exclude=None):
    qs = ResearchWork.objects.all()
    if exclude:
        qs = qs.exclude(pk=exclude)
    norm = normalize_doi(doi)
    if norm:
        hit = qs.filter(doi_norm=norm).first()
        if hit:
            return hit
    return qs.filter(title_norm=normalize_title(title), publication_year=year).first()


def store_private(fileobj, category, extensions=('.pdf', '.png', '.jpg', '.jpeg')):
    name = Path(fileobj.name).name[:260]
    ext = Path(name).suffix.casefold()
    if ext not in extensions:
        raise ValidationError('Định dạng tệp không được hỗ trợ.')
    max_bytes = settings.MAX_UPLOAD_BYTES
    if fileobj.size > max_bytes:
        raise ValidationError(f'Tệp vượt quá {max_bytes // 1024 // 1024} MB.')
    head = fileobj.read(12)
    fileobj.seek(0)
    if ext == '.pdf' and not head.startswith(b'%PDF-'):
        raise ValidationError('Tệp PDF không hợp lệ.')
    if ext == '.png' and not head.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValidationError('Tệp PNG không hợp lệ.')
    if ext in ('.jpg', '.jpeg') and not head.startswith(b'\xff\xd8\xff'):
        raise ValidationError('Tệp JPEG không hợp lệ.')
    rel = f'{category}/{timezone.localdate():%Y/%m}/{uuid.uuid4().hex}{ext}'
    dest = settings.PRIVATE_STORAGE_ROOT / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256()
    with dest.open('xb') as out:
        for chunk in fileobj.chunks():
            out.write(chunk)
            digest.update(chunk)
    return rel, name, digest.hexdigest(), fileobj.size, mimetypes.guess_type(name)[0] or 'application/octet-stream'


def store_bytes(data, category, extension='.pdf'):
    rel = f'{category}/{timezone.localdate():%Y/%m}/{uuid.uuid4().hex}{extension}'
    path = settings.PRIVATE_STORAGE_ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return rel, hashlib.sha256(data).hexdigest()


def read_private(rel):
    root = settings.PRIVATE_STORAGE_ROOT.resolve()
    path = (root / rel).resolve()
    if not path.is_relative_to(root):
        raise ValueError('Invalid private path')
    return path


def _date(value):
    return str(value) if value else ''


def _years(start, end):
    return {'start_year': start, 'end_year': end}


def stable_hash(value):
    """SHA-256 cho dữ liệu JSON ổn định, dùng để phát hiện thay đổi nội dung."""
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, default=str).encode()).hexdigest()


def evidence_payload(x, as_of=None):
    """Serialize minh chứng.

    V8 tạm khóa nghiệp vụ thời hạn: vẫn giữ lựa chọn `fixed`/`indefinite`
    để không phá cấu trúc dữ liệu, nhưng không đánh giá ngày hiệu lực, không
    cảnh báo và không chặn xác minh. Khi bật lại tính năng có thể phục hồi
    logic kiểm tra ngày mà không cần đổi schema.
    """
    status = 'fixed_disabled' if x.validity_mode == EvidenceDocument.ValidityMode.FIXED else 'indefinite'
    days_remaining = None
    return {
        'id': x.pk, 'original_name': x.original_name, 'mime_type': x.mime_type,
        'sha256': x.sha256, 'size': x.size, 'created_at': x.created_at.isoformat(),
        'validity_mode': x.validity_mode, 'validity_mode_label': x.get_validity_mode_display(),
        'valid_from': x.valid_from.isoformat() if x.valid_from else None,
        'valid_until': x.valid_until.isoformat() if x.valid_until else None,
        'validity_status': status, 'days_remaining': days_remaining,
    }


def evidence_for(lecturer, section, entity_id=''):
    """Trả minh chứng được liên kết với một mục dữ liệu khoa học.

    V6.3 hỗ trợ một minh chứng dùng cho nhiều thông tin thông qua EvidenceLink;
    đồng thời vẫn đọc được liên kết section/entity_id kiểu V6 cũ.
    """
    target = str(entity_id or '')
    qs = EvidenceDocument.objects.filter(lecturer=lecturer, is_active=True).filter(
        models.Q(links__section=section, links__entity_id=target) |
        models.Q(section=section, entity_id=target)
    ).distinct().order_by('created_at', 'id')
    return [evidence_payload(x) for x in qs]



def work_evidence_for(work):
    """Minh chứng bắt buộc của một công trình khoa học.

    WorkEvidence là nguồn minh chứng chính thức của Mục 10 từ V6.4. Các file
    đã tải ở phiên bản cũ được giữ nguyên và mặc định là vô thời hạn sau nâng DB.
    """
    return [evidence_payload(x) for x in work.evidence.all().order_by('created_at', 'id')]


def evidence_hash(evidence):
    """Dấu vân tay tập minh chứng theo nội dung file, không phụ thuộc PK DB hay thứ tự tải lên."""
    rows = [
        {
            'sha256': x.get('sha256') or '',
            'original_name': x.get('original_name') or '',
            'size': int(x.get('size') or 0),
            'validity_mode': x.get('validity_mode') or 'indefinite',
            'valid_from': x.get('valid_from') or '',
            'valid_until': x.get('valid_until') or '',
        }
        for x in evidence
    ]
    rows.sort(key=lambda x: (x['sha256'], x['original_name'], x['size'], x['validity_mode'], x['valid_from'], x['valid_until']))
    return stable_hash(rows)


def latest_reusable_verification(lecturer, section, entity_id, content, evidence):
    """Tái sử dụng xác minh cũ chỉ khi cả dữ liệu và minh chứng không thay đổi."""
    return VerificationRecord.objects.filter(
        lecturer=lecturer, section=section, entity_id=str(entity_id or ''),
        content_hash=stable_hash(content), evidence_hash=evidence_hash(evidence),
        status=VerificationRecord.Status.VERIFIED,
    ).order_by('-reviewed_at').first()


def attach_snapshot_evidence(lecturer, section, entity_id, payload):
    ev = evidence_for(lecturer, section, entity_id)
    # Dùng cho các mục hồ sơ ngoài công trình khoa học. Mục 10 dùng trực tiếp
    # WorkEvidence trong snapshot_for().
    content_for_hash = {k: v for k, v in payload.items() if k != 'attachments'}
    return {**payload, 'verification_evidence': ev, 'content_hash': stable_hash(content_for_hash), 'evidence_hash': evidence_hash(ev)}


def snapshot_for(lecturer, application=None):
    """Build the exact data set printed in BM-04.

    application keys:
      task_name, registered_role, registered_role_other, signing_place, signing_date,
      selected_work_ids (max 5), selected_ip_ids, selected_application_ids, selected_award_ids.
    """
    application = application or {}
    s = getattr(lecturer, 'science', None)
    dep = lecturer.department

    selected_work_ids = {str(x) for x in application.get('selected_work_ids', [])}
    work_qs = WorkAuthor.objects.select_related('work__work_type').filter(
        lecturer=lecturer
    ).order_by('-work__publication_year', 'work__title')
    if selected_work_ids:
        work_qs = work_qs.filter(work_id__in=selected_work_ids)
    else:
        work_qs = work_qs.none()
    works = []
    for auth in work_qs[:5]:
        w = auth.work
        work_ev = work_evidence_for(w)
        if not work_ev:
            raise ValueError(f'Công trình “{w.title}” chưa có minh chứng bắt buộc. Hãy bổ sung minh chứng tại mục Công trình khoa học trước khi tạo BM-04.')
        base = {
            'id': str(w.pk), 'title': w.title, 'type': w.work_type.name,
            'year': w.publication_year, 'venue': w.venue, 'doi': w.doi,
            'authorship_type': auth.authorship_type,
            'authorship_label': auth.get_authorship_type_display(),
            'authors': [{'name': a.name, 'author_order': a.author_order, 'authorship_type': a.authorship_type} for a in w.authors.all()],
            # Giữ key `attachments` để đọc được snapshot cũ, nhưng từ V6.4 đây
            # chính là minh chứng công trình khoa học bắt buộc.
            'attachments': work_ev,
        }
        content_for_hash = {k: v for k, v in base.items() if k != 'attachments'}
        works.append({
            **base,
            'verification_evidence': work_ev,
            'content_hash': stable_hash(content_for_hash),
            'evidence_hash': evidence_hash(work_ev),
        })

    education = [attach_snapshot_evidence(lecturer, EvidenceDocument.Section.EDUCATION, x.pk, {
        'id': x.pk, 'level': x.level, 'institution': x.institution,
        'specialization': x.specialization, 'graduation_year': x.graduation_year,
    }) for x in lecturer.education_records.all()]

    employment = [attach_snapshot_evidence(lecturer, EvidenceDocument.Section.EMPLOYMENT, x.pk, {
        'id': x.pk, **_years(x.start_year, x.end_year), 'position': x.position,
        'organization': x.organization, 'organization_address': x.organization_address,
    }) for x in lecturer.employment_records.all()]

    def select_related_records(model, rel_name, ids):
        ids = {str(x) for x in ids or []}
        if not ids:
            return []
        qs = getattr(lecturer, rel_name).filter(pk__in=ids)
        return list(qs)

    ip_records = [attach_snapshot_evidence(lecturer, EvidenceDocument.Section.IP, x.pk, {
        'id': x.pk, 'title_content': x.title_content, 'grant_year': x.grant_year,
    }) for x in select_related_records(IntellectualPropertyRecord, 'ip_records', application.get('selected_ip_ids'))]

    practical = [attach_snapshot_evidence(lecturer, EvidenceDocument.Section.PRACTICAL, x.pk, {
        'id': x.pk, 'work_name': x.work_name, 'application_detail': x.application_detail,
        'start_date': _date(x.start_date), 'end_date': _date(x.end_date),
    }) for x in select_related_records(PracticalApplicationRecord, 'practical_applications', application.get('selected_application_ids'))]

    tasks = [attach_snapshot_evidence(lecturer, EvidenceDocument.Section.TASK, x.pk, {
        'id': x.pk, 'name': x.name, 'participation_role': x.participation_role,
        'participation_label': x.get_participation_role_display(),
        'start_date': _date(x.start_date), 'end_date': _date(x.end_date),
        'program_name': x.program_name, 'status': x.status, 'status_label': x.get_status_display(),
    }) for x in lecturer.research_tasks.all()]

    awards = [attach_snapshot_evidence(lecturer, EvidenceDocument.Section.AWARD, x.pk, {
        'id': x.pk, 'description': x.description, 'award_year': x.award_year,
    }) for x in select_related_records(AwardRecord, 'awards', application.get('selected_award_ids'))]

    return {
        'form_code': 'BM-04',
        'form_basis': 'Ban hành kèm theo Thông tư số 22/2026/TT-BCA ngày 26/02/2026 của Bộ trưởng Bộ Công an',
        'task_name': str(application.get('task_name') or '').strip(),
        'registered_role': str(application.get('registered_role') or ''),
        'registered_role_other': str(application.get('registered_role_other') or '').strip(),
        'signing_place': str(application.get('signing_place') or '').strip(),
        'signing_date': _date(application.get('signing_date')),
        'full_name': lecturer.full_name,
        'staff_code': lecturer.staff_code,
        'personal_id': lecturer.personal_id,
        'dob': _date(lecturer.date_of_birth),
        'gender': lecturer.get_gender_display() if lecturer.gender else '',
        'professional_title': lecturer.professional_title,
        'position': lecturer.position,
        'home_address': lecturer.home_address,
        'phone': lecturer.phone,
        'email': lecturer.email,
        'academic_rank': s.academic_rank if s else '',
        'academic_rank_year': s.academic_rank_year if s else None,
        'academic_degree': s.academic_degree if s else '',
        'academic_degree_year': s.academic_degree_year if s else None,
        'talent_category': s.talent_category if s else 'none',
        'talent_category_label': s.get_talent_category_display() if s else 'Không thuộc hai trường hợp trên',
        'other_achievements': s.other_achievements if s else '',
        'other_achievements_verification': attach_snapshot_evidence(
            lecturer, EvidenceDocument.Section.ACHIEVEMENT, 'science',
            {'text': s.other_achievements if s else ''}
        ),
        'organization': {
            'name': dep.name, 'address': dep.address,
            'head_name': dep.head_name, 'phone': dep.phone,
        },
        'education': education,
        'employment': employment,
        'works': works,
        'ip_records': ip_records,
        'practical_applications': practical,
        'research_tasks': tasks,
        'awards': awards,
        'snapshot_created_at': timezone.now().isoformat(),
    }


def snapshot_hash(snapshot):
    return hashlib.sha256(json.dumps(snapshot, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def audit(actor, action, entity, entity_id='', lecturer=None, **details):
    from .models import AuditLog, Notification, User
    entry = AuditLog.objects.create(actor=actor, lecturer=lecturer, action=action, entity=entity, entity_id=str(entity_id), details=details)
    work_events = {
        'create_work': 'Công trình mới', 'update_work': 'Chỉnh sửa công trình',
        'upload_evidence': 'Bổ sung minh chứng công trình', 'submit_work': 'Gửi kiểm tra công trình',
        'review_work': 'Kết quả kiểm tra công trình', 'review_link': 'Duyệt liên kết tác giả',
        'review_correction': 'Duyệt sửa công trình', 'create_correction': 'Yêu cầu sửa công trình',
        'create_link': 'Yêu cầu liên kết tác giả',
    }
    if action in work_events:
        recipients = User.objects.filter(role='admin', is_active=True).values_list('id', flat=True)
        Notification.objects.bulk_create([
            Notification(
                recipient_id=pk, actor=actor, title=work_events[action],
                body=f'{actor.username if actor else "Hệ thống"} · {entity}: {entity_id}',
                entity_id=str(entity_id),
            ) for pk in recipients
        ])
    return entry
