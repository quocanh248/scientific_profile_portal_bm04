from django.urls import path
from . import views as v

urlpatterns = [
    path('csrf/', v.csrf), path('login/', v.sign_in), path('logout/', v.sign_out), path('me/', v.me), path('password/', v.change_password),
    path('catalogs/', v.catalogs), path('notifications/', v.notifications), path('notifications/read/', v.read_notifications),
    path('profile/', v.profile), path('profile/draft-pdf/', v.draft_pdf),
    path('profile/evidence/', v.profile_evidence), path('profile/evidence/<int:pk>/', v.profile_evidence_detail),
    path('profile/evidence/<int:pk>/view/', v.view_profile_evidence), path('profile/evidence/<int:pk>/download/', v.download_profile_evidence),
    path('works/', v.works), path('works/<uuid:pk>/', v.work_detail), path('works/<uuid:pk>/evidence/', v.upload_evidence),
    path('evidence/<int:pk>/download/', v.download_evidence), path('evidence/<int:pk>/view/', v.view_evidence), path('works/<uuid:pk>/submit/', v.submit_work), path('works/<uuid:pk>/review/', v.review_work),
    path('link-requests/', v.link_requests), path('link-requests/<int:pk>/review/', v.review_link),
    path('corrections/', v.corrections), path('corrections/<int:pk>/review/', v.review_correction),
    path('approvals/', v.approvals), path('approvals/<uuid:pk>/', v.approval_detail), path('approvals/<uuid:pk>/review/', v.review_approval),
    path('approvals/<uuid:pk>/items/<int:item_pk>/review/', v.review_approval_item),
    path('approvals/<uuid:pk>/scan/', v.upload_scan), path('approvals/<uuid:pk>/sign/', v.sign_approval), path('approvals/<uuid:pk>/verify-signature/', v.verify_approval_signature), path('approvals/<uuid:pk>/<str:kind>/', v.approval_file),
    path('signing/identity/', v.signing_identity),
    path('reports/', v.reports), path('reports/export/', v.reports_export),
    path('admin/users/', v.admin_users), path('admin/users/import/', v.admin_import), path('admin/users/<int:pk>/', v.admin_update_user),
    path('admin/departments/', v.admin_departments), path('admin/departments/<int:pk>/', v.admin_department_detail),
    path('admin/lecturers/', v.admin_lecturers), path('admin/lecturers/<uuid:pk>/', v.admin_lecturer), path('admin/audit/', v.audit_logs),
]
