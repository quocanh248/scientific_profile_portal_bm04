"""V6 regression tests.

Run after installing backend dependencies:
    set TEST_SQLITE=1
    python manage.py test portal

The tests focus on the V6 evidence/snapshot rules and do not depend on Docker.
"""
from django.test import TestCase
from django.utils import timezone

from .models import (
    User, Department, Lecturer, ScienceProfile, EducationRecord, EmploymentRecord,
    WorkType, ResearchWork, WorkAuthor, WorkEvidence, EvidenceDocument,
    VerificationRecord, ProfileApproval, ApprovalVerificationItem,
)
from .services import snapshot_for, snapshot_hash
from .verification_service import create_approval_verification_items, review_item


class EvidenceWorkflowV6Tests(TestCase):
    def setUp(self):
        self.dep = Department.objects.create(code='KT01', name='Khoa kiểm thử 01')
        self.gv = User.objects.create_user(
            username='gv01', password='StrongPass123!@', role='lecturer', must_change_password=False,
        )
        self.reviewer = User.objects.create_user(
            username='nckh01', password='StrongPass123!@', role='reviewer', must_change_password=False,
        )
        self.lecturer = Lecturer.objects.create(
            user=self.gv, staff_code='GV001', full_name='Nguyễn Văn A', department=self.dep,
            personal_id='000000000001', gender='male', professional_title='Giảng viên',
        )
        ScienceProfile.objects.create(lecturer=self.lecturer)
        self.edu1 = EducationRecord.objects.create(
            lecturer=self.lecturer, level='Đại học', institution='Trường A',
            specialization='Chuyên ngành A', graduation_year=2015,
        )
        self.emp = EmploymentRecord.objects.create(
            lecturer=self.lecturer, start_year=2016, position='Giảng viên', organization='Khoa A',
        )
        self.work_type = WorkType.objects.create(code='journal_article', name='Bài báo khoa học')
        self.work = ResearchWork.objects.create(
            title='Bài báo kiểm thử', title_norm='bài báo kiểm thử', work_type=self.work_type,
            publication_year=2025, created_by=self.gv,
        )
        WorkAuthor.objects.create(
            work=self.work, lecturer=self.lecturer, name=self.lecturer.full_name,
            authorship_type='author', department_at_publication=self.dep,
        )
        # WorkEvidence = tài liệu phụ trợ công trình, không phải minh chứng xác minh BM-04.
        WorkEvidence.objects.create(
            work=self.work, private_path='work/mock.pdf', original_name='ban_bai_bao.pdf',
            mime_type='application/pdf', sha256='a'*64, size=100, uploaded_by=self.gv,
        )
        # EvidenceDocument = minh chứng xác minh cho dòng đào tạo.
        self.edu_evidence = EvidenceDocument.objects.create(
            lecturer=self.lecturer, section=EvidenceDocument.Section.EDUCATION,
            entity_id=str(self.edu1.pk), private_path='profile_evidence/bang.pdf',
            original_name='bang_dai_hoc.pdf', mime_type='application/pdf', sha256='b'*64,
            size=200, uploaded_by=self.gv,
        )

    def app_payload(self):
        return {
            'task_name': 'Nhiệm vụ kiểm thử', 'registered_role': 'lead',
            'registered_role_other': '', 'signing_place': 'TP.HCM',
            'signing_date': '2026-10-18', 'selected_work_ids': [str(self.work.pk)],
            'selected_ip_ids': [], 'selected_application_ids': [], 'selected_award_ids': [],
        }

    def approval_from_snapshot(self, snapshot, code):
        return ProfileApproval.objects.create(
            lecturer=self.lecturer, code=code, task_name=snapshot['task_name'],
            registered_role='lead', signing_date=timezone.localdate(), snapshot=snapshot,
            snapshot_sha256=snapshot_hash(snapshot), pdf_path='approvals/mock.pdf',
            pdf_sha256='c'*64,
        )

    def test_work_attachment_is_optional_and_separate_from_verification_evidence(self):
        snap = snapshot_for(self.lecturer, self.app_payload())
        work = snap['works'][0]
        self.assertEqual(work['attachments'][0]['original_name'], 'ban_bai_bao.pdf')
        self.assertEqual(work['verification_evidence'], [])

    def test_snapshot_freezes_old_education_and_evidence(self):
        old = snapshot_for(self.lecturer, self.app_payload())
        self.assertEqual(len(old['education']), 1)
        self.assertEqual(old['education'][0]['verification_evidence'][0]['original_name'], 'bang_dai_hoc.pdf')

        EducationRecord.objects.create(
            lecturer=self.lecturer, level='Thạc sĩ', institution='Trường B',
            specialization='Chuyên ngành B', graduation_year=2026,
        )
        newer = snapshot_for(self.lecturer, self.app_payload())
        self.assertEqual(len(newer['education']), 2)
        # Snapshot cũ là dict độc lập, không tự lấy dữ liệu hiện tại.
        self.assertEqual(len(old['education']), 1)

    def test_employment_evidence_is_optional_in_checklist(self):
        snap = snapshot_for(self.lecturer, self.app_payload())
        approval = self.approval_from_snapshot(snap, 'BM04-TEST-EMP')
        create_approval_verification_items(approval)
        item = approval.verification_items.get(section=EvidenceDocument.Section.EMPLOYMENT)
        self.assertFalse(item.evidence_required)
        review_item(item, self.reviewer, 'verified', '')
        self.assertEqual(item.status, ApprovalVerificationItem.Status.VERIFIED)

    def test_required_item_cannot_be_verified_without_verification_evidence(self):
        snap = snapshot_for(self.lecturer, self.app_payload())
        approval = self.approval_from_snapshot(snap, 'BM04-TEST-WORK')
        create_approval_verification_items(approval)
        item = approval.verification_items.get(section=EvidenceDocument.Section.WORK)
        self.assertTrue(item.evidence_required)
        with self.assertRaises(ValueError):
            review_item(item, self.reviewer, 'verified', '')

    def test_reuse_when_content_and_evidence_unchanged(self):
        snap1 = snapshot_for(self.lecturer, self.app_payload())
        a1 = self.approval_from_snapshot(snap1, 'BM04-TEST-V1')
        create_approval_verification_items(a1)
        item1 = a1.verification_items.get(section=EvidenceDocument.Section.EDUCATION)
        review_item(item1, self.reviewer, 'verified', 'Đã đối chiếu bằng cấp.')
        self.assertTrue(VerificationRecord.objects.filter(section='education').exists())

        snap2 = snapshot_for(self.lecturer, self.app_payload())
        a2 = self.approval_from_snapshot(snap2, 'BM04-TEST-V2')
        create_approval_verification_items(a2)
        item2 = a2.verification_items.get(section=EvidenceDocument.Section.EDUCATION)
        self.assertEqual(item2.status, ApprovalVerificationItem.Status.VERIFIED)
        self.assertIsNotNone(item2.reused_verification_id)

    def test_new_evidence_invalidates_reuse_for_new_bm04(self):
        snap1 = snapshot_for(self.lecturer, self.app_payload())
        a1 = self.approval_from_snapshot(snap1, 'BM04-TEST-EV1')
        create_approval_verification_items(a1)
        item1 = a1.verification_items.get(section=EvidenceDocument.Section.EDUCATION)
        review_item(item1, self.reviewer, 'verified', '')

        EvidenceDocument.objects.create(
            lecturer=self.lecturer, section=EvidenceDocument.Section.EDUCATION,
            entity_id=str(self.edu1.pk), private_path='profile_evidence/bang2.pdf',
            original_name='bang_dai_hoc_bo_sung.pdf', mime_type='application/pdf',
            sha256='d'*64, size=210, uploaded_by=self.gv,
        )
        snap2 = snapshot_for(self.lecturer, self.app_payload())
        a2 = self.approval_from_snapshot(snap2, 'BM04-TEST-EV2')
        create_approval_verification_items(a2)
        item2 = a2.verification_items.get(section=EvidenceDocument.Section.EDUCATION)
        self.assertEqual(item2.status, ApprovalVerificationItem.Status.PENDING)
        self.assertIsNone(item2.reused_verification_id)
