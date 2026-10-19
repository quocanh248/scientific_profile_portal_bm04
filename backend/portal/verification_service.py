import hashlib
import json
from datetime import date
from django.db import transaction
from django.utils import timezone
from .models import (
    EvidenceDocument, VerificationRecord, ApprovalVerificationItem,
)

SECTION_LABELS = {
    EvidenceDocument.Section.EDUCATION: 'Quá trình đào tạo',
    EvidenceDocument.Section.EMPLOYMENT: 'Quá trình công tác',
    EvidenceDocument.Section.WORK: 'Công trình khoa học',
    EvidenceDocument.Section.IP: 'Văn bằng sở hữu trí tuệ',
    EvidenceDocument.Section.PRACTICAL: 'Áp dụng trong thực tiễn',
    EvidenceDocument.Section.TASK: 'Nhiệm vụ KH,CN&ĐMST',
    EvidenceDocument.Section.AWARD: 'Giải thưởng',
    EvidenceDocument.Section.ACHIEVEMENT: 'Thành tựu khác',
}


def stable_hash(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, default=str).encode()).hexdigest()


def evidence_hash(items):
    rows = [
        {
            'sha256': x.get('sha256') or '',
            'original_name': x.get('original_name') or '',
            'size': int(x.get('size') or 0),
            'validity_mode': x.get('validity_mode') or 'indefinite',
            'valid_from': x.get('valid_from') or '',
            'valid_until': x.get('valid_until') or '',
        }
        for x in items
    ]
    rows.sort(key=lambda x: (x['sha256'], x['original_name'], x['size'], x['validity_mode'], x['valid_from'], x['valid_until']))
    return stable_hash(rows)




def evidence_usable(items, as_of=None):
    """Minh chứng có thể dùng để xác minh tại thời điểm hiện tại hay không."""
    as_of = as_of or timezone.localdate()
    for ev in items or []:
        if (ev.get('validity_mode') or 'indefinite') != 'fixed':
            continue
        start = ev.get('valid_from')
        end = ev.get('valid_until')
        if start:
            try:
                if as_of < date.fromisoformat(start):
                    return False
            except (TypeError, ValueError):
                return False
        if not end:
            return False
        try:
            if as_of > date.fromisoformat(end):
                return False
        except (TypeError, ValueError):
            return False
    return True

def _label(section, item):
    if section == EvidenceDocument.Section.EDUCATION:
        return f"{item.get('level','')} - {item.get('institution','')} ({item.get('graduation_year','')})".strip(' -()')
    if section == EvidenceDocument.Section.EMPLOYMENT:
        return f"{item.get('start_year','')}-{item.get('end_year') or 'nay'} · {item.get('position','')} · {item.get('organization','')}"
    if section == EvidenceDocument.Section.WORK:
        return item.get('title') or 'Công trình khoa học'
    if section == EvidenceDocument.Section.IP:
        return item.get('title_content') or 'Văn bằng sở hữu trí tuệ'
    if section == EvidenceDocument.Section.PRACTICAL:
        return item.get('work_name') or 'Công trình áp dụng thực tiễn'
    if section == EvidenceDocument.Section.TASK:
        return item.get('name') or 'Nhiệm vụ KH,CN&ĐMST'
    if section == EvidenceDocument.Section.AWARD:
        return item.get('description') or 'Giải thưởng'
    if section == EvidenceDocument.Section.ACHIEVEMENT:
        return item.get('text') or 'Thành tựu hoạt động KH&CN khác'
    return SECTION_LABELS.get(section, section)


def _work_snapshot_evidence(snapshot, entity_id):
    """Đọc minh chứng công trình từ snapshot, kể cả snapshot V6.3 cũ.

    V6.3 lưu WorkEvidence ở key `attachments` nhưng checklist lại nhìn
    `verification_evidence`. Từ V6.4 hai khái niệm này được hợp nhất.
    """
    target = str(entity_id or '')
    for work in (snapshot or {}).get('works', []) if isinstance(snapshot, dict) else []:
        if isinstance(work, dict) and str(work.get('id') or '') == target:
            return work.get('verification_evidence') or work.get('attachments') or []
    return []


def snapshot_items(snapshot):
    """Sinh checklist xác minh từ đúng dữ liệu đã đóng băng trong một BM-04."""
    groups = [
        (EvidenceDocument.Section.EDUCATION, snapshot.get('education', []), True),
        (EvidenceDocument.Section.EMPLOYMENT, snapshot.get('employment', []), False),
        (EvidenceDocument.Section.WORK, snapshot.get('works', []), True),
        (EvidenceDocument.Section.IP, snapshot.get('ip_records', []), True),
        (EvidenceDocument.Section.PRACTICAL, snapshot.get('practical_applications', []), True),
        (EvidenceDocument.Section.TASK, snapshot.get('research_tasks', []), True),
        (EvidenceDocument.Section.AWARD, snapshot.get('awards', []), True),
    ]
    rows = []
    for section, items, evidence_required in groups:
        for item in items:
            if not isinstance(item, dict):
                continue
            clean = {k: v for k, v in item.items() if k not in ('verification_evidence', 'attachments', 'content_hash', 'evidence_hash')}
            if section == EvidenceDocument.Section.WORK:
                evidence = item.get('verification_evidence') or item.get('attachments') or []
            else:
                evidence = item.get('verification_evidence') or []
            rows.append({
                'section': section,
                'entity_id': str(item.get('id', '')),
                'label': _label(section, clean)[:900],
                'content_hash': item.get('content_hash') or stable_hash(clean),
                'evidence_hash': item.get('evidence_hash') or evidence_hash(evidence),
                'evidence_required': evidence_required,
                'evidence_snapshot': evidence,
            })
    ach = snapshot.get('other_achievements_verification') or {}
    text = snapshot.get('other_achievements') or ''
    if text.strip():
        evidence = ach.get('verification_evidence') or []
        rows.append({
            'section': EvidenceDocument.Section.ACHIEVEMENT,
            'entity_id': 'science',
            'label': _label(EvidenceDocument.Section.ACHIEVEMENT, {'text': text})[:900],
            'content_hash': ach.get('content_hash') or stable_hash({'text': text}),
            'evidence_hash': ach.get('evidence_hash') or evidence_hash(evidence),
            'evidence_required': True,
            'evidence_snapshot': evidence,
        })
    return rows


def create_approval_verification_items(approval):
    """Tạo checklist; tự tái sử dụng xác minh cũ nếu dữ liệu + minh chứng không đổi."""
    created = []
    for row in snapshot_items(approval.snapshot or {}):
        reusable = None
        if evidence_usable(row['evidence_snapshot']):
            reusable = VerificationRecord.objects.filter(
                lecturer=approval.lecturer,
                section=row['section'],
                entity_id=row['entity_id'],
                content_hash=row['content_hash'],
                evidence_hash=row['evidence_hash'],
                status=VerificationRecord.Status.VERIFIED,
            ).order_by('-reviewed_at').first()
        item = ApprovalVerificationItem.objects.create(
            approval=approval,
            section=row['section'], entity_id=row['entity_id'], label=row['label'],
            content_hash=row['content_hash'], evidence_hash=row['evidence_hash'],
            evidence_required=row['evidence_required'], evidence_snapshot=row['evidence_snapshot'],
            status=ApprovalVerificationItem.Status.VERIFIED if reusable else ApprovalVerificationItem.Status.PENDING,
            reused_verification=reusable,
            reviewer=reusable.reviewer if reusable else None,
            reviewed_at=reusable.reviewed_at if reusable else None,
            comment='Tái sử dụng kết quả xác minh trước đó; dữ liệu và minh chứng không thay đổi.' if reusable else '',
        )
        created.append(item)
    return created


@transaction.atomic
def review_item(item, reviewer, action, comment=''):
    if action != 'verified':
        raise ValueError('Từng mục BM-04 chỉ hỗ trợ thao tác Xác minh. Nếu cần bổ sung/chỉnh sửa, hãy Trả sửa ở cấp hồ sơ BM-04.')

    # Tương thích BM-04 V6.3 đã chốt: WorkEvidence đã nằm trong snapshot ở key
    # `attachments`, chỉ là checklist cũ chưa copy sang evidence_snapshot.
    evidence = item.evidence_snapshot or []
    if item.section == EvidenceDocument.Section.WORK and not evidence:
        evidence = _work_snapshot_evidence(item.approval.snapshot or {}, item.entity_id)
        if evidence:
            item.evidence_snapshot = evidence
            item.evidence_hash = evidence_hash(evidence)

    if action == 'verified' and item.evidence_required and not evidence:
        raise ValueError('Mục này bắt buộc có ít nhất một minh chứng trước khi xác minh.')
    if action == 'verified' and evidence and not evidence_usable(evidence):
        raise ValueError('Có minh chứng đã hết hiệu lực hoặc chưa có hiệu lực. Không thể xác minh cho BM-04 mới; vui lòng yêu cầu giảng viên bổ sung minh chứng hợp lệ.')
    item.status = action
    item.reviewer = reviewer
    item.reviewed_at = timezone.now()
    item.comment = comment.strip()
    item.reused_verification = None
    if action == 'verified':
        record = VerificationRecord.objects.create(
            lecturer=item.approval.lecturer, section=item.section, entity_id=item.entity_id,
            content_hash=item.content_hash, evidence_hash=item.evidence_hash,
            status=VerificationRecord.Status.VERIFIED, reviewer=reviewer, comment=comment.strip(),
        )
        item.reused_verification = record
    item.save()
    return item


def all_items_verified(approval):
    return not approval.verification_items.exclude(status=ApprovalVerificationItem.Status.VERIFIED).exists()
