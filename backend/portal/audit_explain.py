"""Diễn giải nhật ký hệ thống BM-04 sang ngôn ngữ nghiệp vụ cho lãnh đạo.

Không làm thay đổi dữ liệu AuditLog gốc; chỉ xây dựng lớp trình bày.
"""
from __future__ import annotations

ACTIONS = {
    'login': 'Đăng nhập vào hệ thống',
    'logout': 'Đăng xuất khỏi hệ thống',
    'password_changed': 'Thay đổi mật khẩu đăng nhập',
    'update_bm04_profile': 'Cập nhật thông tin lý lịch khoa học',
    'update_lecturer': 'Cập nhật thông tin nhân sự giảng viên',
    'create_work': 'Thêm công trình khoa học',
    'update_work': 'Chỉnh sửa thông tin công trình khoa học',
    'upload_evidence': 'Tải lên minh chứng công trình khoa học',
    'upload_work_evidence': 'Tải lên minh chứng công trình khoa học',
    'download_evidence': 'Tải xuống minh chứng công trình',
    'view_evidence': 'Xem minh chứng công trình',
    'submit_work': 'Gửi công trình đề nghị kiểm tra',
    'review_work': 'Thẩm định công trình khoa học',
    'create_link': 'Đề nghị liên kết tác giả với công trình',
    'review_link': 'Xử lý đề nghị liên kết tác giả',
    'create_correction': 'Đề nghị chỉnh sửa công trình',
    'review_correction': 'Xử lý đề nghị chỉnh sửa công trình',
    'upload_profile_evidence': 'Tải lên minh chứng hồ sơ khoa học',
    'link_profile_evidence': 'Liên kết minh chứng vào mục lý lịch',
    'deactivate_profile_evidence': 'Ngừng sử dụng minh chứng',
    'view_profile_evidence': 'Xem minh chứng hồ sơ',
    'download_profile_evidence': 'Tải xuống minh chứng hồ sơ',
    'submit_approval': 'Tạo và gửi hồ sơ BM-04 đề nghị phê duyệt',
    'personal_digital_sign_approval': 'Ký số cá nhân vào BM-04',
    'review_approval_item': 'Xác minh nội dung trong BM-04',
    'review_approval': 'Xử lý phê duyệt hồ sơ BM-04',
    'complete_approval': 'Lưu bản scan BM-04 ký tay',
    'digital_sign_approval': 'Ký số BM-04 với tư cách lãnh đạo đơn vị',
    'view_approval': 'Mở xem nội dung BM-04',
    'download_approval': 'Tải xuống hồ sơ BM-04',
    'verify_uploaded_signature_file': 'Kiểm tra chữ ký số của tài liệu tải lên',
    'verify_bm04_scan': 'Tra cứu BM-04 bằng ảnh hoặc PDF scan',
    'update_signing_identity': 'Cập nhật danh tính và mẫu chữ ký',
    'create_user': 'Tạo tài khoản sử dụng hệ thống',
    'update_user': 'Thay đổi tài khoản hoặc quyền truy cập',
    'reset_temporary_password': 'Cấp lại mật khẩu đăng nhập tạm thời',
    'import_users': 'Nhập danh sách giảng viên bằng Excel',
    'create_department': 'Thêm đơn vị công tác',
    'update_department': 'Cập nhật thông tin đơn vị',
    'import_departments': 'Nhập danh sách đơn vị bằng Excel',
}
ENTITIES = {
    'user': 'tài khoản', 'lecturer': 'giảng viên', 'work': 'công trình khoa học',
    'evidence': 'minh chứng công trình', 'evidence_document': 'minh chứng hồ sơ',
    'approval': 'hồ sơ BM-04', 'approval_verification_item': 'mục xác minh BM-04',
    'department': 'đơn vị công tác', 'file_sha256': 'tài liệu kiểm tra',
}
FIELDS = {
    'full_name': 'Họ và tên', 'academic_rank': 'Học hàm', 'academic_degree': 'Học vị',
    'department': 'Đơn vị công tác', 'department_id': 'Mã đơn vị', 'position': 'Chức vụ',
    'professional_title': 'Chức danh nghề nghiệp', 'email': 'Email', 'phone': 'Số điện thoại',
    'title': 'Tên công trình', 'publication_year': 'Năm công bố', 'venue': 'Nơi công bố',
    'doi': 'Mã DOI', 'organization': 'Cơ quan công tác', 'organization_address': 'Địa chỉ cơ quan',
    'start_year': 'Năm bắt đầu', 'end_year': 'Năm kết thúc', 'role': 'Vai trò tài khoản',
    'status': 'Trạng thái', 'academic_rank_year':'Năm công nhận học hàm',
    'academic_degree_year':'Năm công nhận học vị', 'talent_category':'Phân loại nhân tài',
    'other_achievements':'Thành tựu khác', 'registered_role': 'Vai trò đăng ký', 'task_name': 'Tên nhiệm vụ',
    'validity_mode': 'Thời hạn minh chứng', 'comment': 'Ý kiến xử lý',
}
PRIVATE_FIELDS = {'password','temporary_password','encrypted_private_key','private_key',
                  'certificate_pem','signature_b64','personal_id','home_address',
                  'date_of_birth','signature_image_path','token','secret'}


def _clean(value):
    if value is None or value == '':
        return 'Chưa có'
    if isinstance(value, bool):
        return 'Có' if value else 'Không'
    if isinstance(value, (dict, list)):
        return 'Thông tin chi tiết được cập nhật'
    value = str(value)
    return value if len(value) <= 110 else value[:107]+'...'


def explain_log(entry):
    """Return Vietnamese presentation fields, excluding sensitive raw values."""
    action = entry.action
    label = ACTIONS.get(action, f'Thao tác nghiệp vụ: {action}')
    subject = entry.lecturer.full_name if entry.lecturer_id and entry.lecturer else ''
    actor = entry.actor.lecturer.full_name if entry.actor and hasattr(entry.actor, 'lecturer') else (entry.actor.get_full_name() or entry.actor.username if entry.actor else 'Hệ thống')
    entity = ENTITIES.get(entry.entity, 'dữ liệu hệ thống')
    detail = entry.details if isinstance(entry.details, dict) else {}
    changes = []
    before, after = detail.get('before'), detail.get('after')
    if isinstance(before, dict) and isinstance(after, dict):
        for key in sorted(set(before) | set(after)):
            if key in PRIVATE_FIELDS or key.endswith('_id') or key in ('employment','education','ip_records','research_tasks','awards','practical_applications','my_works','verified_works'):
                continue
            if before.get(key) != after.get(key):
                changes.append(f"{FIELDS.get(key, 'Trường '+key)}: {_clean(before.get(key))} → {_clean(after.get(key))}")
            if len(changes) >= 8:
                break
    # Diễn giải các nhóm dữ liệu BM-04 thay vì hiện JSON cấu trúc phức tạp.
    if isinstance(before, dict) and isinstance(after, dict):
        bscience = before.get('science') or {}
        ascience = after.get('science') or {}
        if isinstance(bscience, dict) and isinstance(ascience, dict):
            for key in ('academic_rank','academic_rank_year','academic_degree','academic_degree_year','talent_category','other_achievements'):
                if bscience.get(key) != ascience.get(key):
                    changes.append(f"{FIELDS.get(key,key)}: {_clean(bscience.get(key))} → {_clean(ascience.get(key))}")
        groups={'education':'Quá trình đào tạo','employment':'Quá trình công tác',
                'ip_records':'Tài sản trí tuệ','practical_applications':'Kết quả áp dụng thực tiễn',
                'research_tasks':'Nhiệm vụ khoa học','awards':'Giải thưởng/khen thưởng'}
        for key, caption in groups.items():
            bitems = before.get(key)
            aitems = after.get(key)
            if isinstance(bitems,list) and isinstance(aitems,list) and bitems != aitems:
                # Chỉ công bố số dòng; không lộ nội dung định danh cá nhân hoặc file riêng.
                old={str(x.get('id')):x for x in bitems if isinstance(x,dict) and x.get('id')}
                new={str(x.get('id')):x for x in aitems if isinstance(x,dict) and x.get('id')}
                added=max(0,len(aitems)-len(bitems))
                deleted=max(0,len(bitems)-len(aitems))
                changed=sum(1 for ident in old.keys() & new.keys() if old[ident]!=new[ident])
                summary=[]
                if added:summary.append(f'thêm {added}')
                if changed:summary.append(f'sửa {changed}')
                if deleted:summary.append(f'xóa {deleted}')
                if not summary:summary=['cập nhật dữ liệu']
                changes.append(caption+': '+', '.join(summary))
    if action=='update_bm04_profile' and not changes:
        changes.append('Lưu lý lịch; không phát hiện thay đổi ở các trường được theo dõi.')
    result = detail.get('result')
    if result is not None:
        result_labels = {'approved':'Đã duyệt','rejected':'Từ chối','changes':'Yêu cầu bổ sung',
                         'verified':'Đã xác minh','completed':'Hoàn tất', 'valid_internal':'PDF gốc hợp lệ',
                         'scan_record_found':'Tra cứu được mã phát hành',
                         'scan_code_not_found':'Không tìm thấy mã phát hành'}
        changes.append('Kết quả: '+result_labels.get(str(result), _clean(result)))
    section = detail.get('section')
    if section:
        changes.append('Mục BM-04: '+_clean(section))
    comment = detail.get('comment')
    if comment and not (isinstance(before,dict) and 'comment' in before):
        changes.append('Nhận xét: '+_clean(comment))
    context = f' của giảng viên {subject}' if subject else ''
    description = f'{actor} đã {label[:1].lower() + label[1:]}{context}.'
    return {
        'action_label': label, 'entity_label': entity,
        'description': description, 'changes': changes,
        'actor_display': actor, 'lecturer_display': subject,
    }
