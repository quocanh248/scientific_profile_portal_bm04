from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Department, Lecturer, DepartmentHistory, EmploymentRecord, ScienceProfile,
    EducationRecord, WorkType, ResearchWork, WorkAuthor, WorkEvidence, WorkReview,
    WorkLinkRequest, WorkCorrection, WorkVersion, IntellectualPropertyRecord,
    PracticalApplicationRecord, ResearchTaskRecord, AwardRecord, ProfileApproval,
    ApprovalEvent, AuditLog, Notification, SigningIdentity, DigitalSignature,
    EvidenceDocument, EvidenceLink, VerificationRecord, ApprovalVerificationItem,
)


@admin.register(User)
class PortalUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (('Nghiệp vụ', {'fields': ('role', 'must_change_password')}),)
    list_display = ('username', 'role', 'is_active', 'is_staff')


for model in [
    Department, Lecturer, DepartmentHistory, EmploymentRecord, ScienceProfile,
    EducationRecord, WorkType, ResearchWork, WorkAuthor, WorkEvidence, WorkReview,
    WorkLinkRequest, WorkCorrection, WorkVersion, IntellectualPropertyRecord,
    PracticalApplicationRecord, ResearchTaskRecord, AwardRecord, ProfileApproval,
    ApprovalEvent, AuditLog, Notification, SigningIdentity, DigitalSignature,
    EvidenceDocument, EvidenceLink, VerificationRecord, ApprovalVerificationItem,
]:
    admin.site.register(model)
