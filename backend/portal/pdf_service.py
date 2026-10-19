"""Generate BM-04 scientific profile PDF from an immutable snapshot."""
import io
import os
from datetime import date
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image, HRFlowable,
)

REGULAR_CANDIDATES = [
    os.getenv('PROFILE_PDF_FONT', ''),
    '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    'C:/Windows/Fonts/times.ttf',
    'C:/Windows/Fonts/arial.ttf',
]
BOLD_CANDIDATES = [
    os.getenv('PROFILE_PDF_FONT_BOLD', ''),
    '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    'C:/Windows/Fonts/timesbd.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
]
regular_path = next((x for x in REGULAR_CANDIDATES if x and os.path.isfile(x)), None)
bold_path = next((x for x in BOLD_CANDIDATES if x and os.path.isfile(x)), None)
if regular_path:
    pdfmetrics.registerFont(TTFont('BM04', regular_path))
if bold_path:
    pdfmetrics.registerFont(TTFont('BM04B', bold_path))
FONT = 'BM04' if regular_path else 'Helvetica'
FONT_BOLD = 'BM04B' if bold_path else ('BM04' if regular_path else 'Helvetica-Bold')


def _safe(value, empty=''):
    return escape(str(value if value not in (None, '') else empty)).replace('\n', '<br/>')


def _p(value, style, empty=''):
    return Paragraph(_safe(value, empty), style)


def _date_vi(value):
    if not value:
        return ''
    try:
        d = date.fromisoformat(str(value)[:10])
        return f'{d.day:02d}/{d.month:02d}/{d.year}'
    except Exception:
        return str(value)


def _period(start, end):
    s, e = _date_vi(start), _date_vi(end)
    if s and e:
        return f'{s} - {e}'
    if s:
        return f'{s} - nay'
    return ''


def _checkbox(active):
    return '■' if active else '□'


def profile_pdf(snapshot: dict, code: str, draft: bool = False, personal_signature: dict | None = None, unit_signature: dict | None = None) -> bytes:
    out = io.BytesIO()
    doc = SimpleDocTemplate(
        out, pagesize=A4, leftMargin=13*mm, rightMargin=13*mm,
        topMargin=17*mm, bottomMargin=13*mm,
        title=f'BM-04 - Lý lịch khoa học - {code}',
        author='Hệ thống quản lý lý lịch khoa học',
    )
    body = ParagraphStyle('body', fontName=FONT, fontSize=8.4, leading=10.6, spaceAfter=1.2)
    body_b = ParagraphStyle('body_b', parent=body, fontName=FONT_BOLD)
    tiny = ParagraphStyle('tiny', parent=body, fontSize=6.9, leading=8.5)
    tiny_i = ParagraphStyle('tiny_i', parent=tiny, fontName=FONT)
    center = ParagraphStyle('center', parent=body, alignment=TA_CENTER)
    center_b = ParagraphStyle('center_b', parent=center, fontName=FONT_BOLD)
    title = ParagraphStyle('title', parent=center_b, fontSize=12.4, leading=15.5, spaceBefore=5, spaceAfter=2)
    subtitle = ParagraphStyle('subtitle', parent=center_b, fontSize=9.5, leading=11.5)
    section = ParagraphStyle('section', parent=body_b, fontSize=8.6, leading=10.8, spaceBefore=2, spaceAfter=2)
    right = ParagraphStyle('right', parent=body, alignment=TA_RIGHT)

    thin = colors.HexColor('#222222')
    table_style = [
        ('GRID', (0, 0), (-1, -1), 0.45, thin),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2.5), ('RIGHTPADDING', (0, 0), (-1, -1), 2.5),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2),
    ]

    story = []
    story += [
        _p('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', center_b),
        _p('Độc lập - Tự do - Hạnh phúc', center_b),
        HRFlowable(width='20%', thickness=0.8, color=colors.HexColor('#000000'), spaceBefore=1*mm, spaceAfter=3*mm, hAlign='CENTER'),
        _p('LÝ LỊCH KHOA HỌC', title),
        _p('Cá nhân đăng ký thực hiện nhiệm vụ khoa học, công nghệ và đổi mới sáng tạo', subtitle),
        _p(f'“{snapshot.get("task_name") or "..........................................................."}” (1)', center_b),
        Spacer(1, 2*mm),
    ]
    if draft:
        story += [_p('BẢN NHÁP - KHÔNG CÓ GIÁ TRỊ XÁC NHẬN', ParagraphStyle('draft', parent=center_b, textColor=colors.red)), Spacer(1, 1.5*mm)]

    rr = snapshot.get('registered_role', '')
    role_rows = [
        [_p('Đăng ký chức danh Chủ nhiệm nhiệm vụ', body), _p(_checkbox(rr == 'lead'), center)],
        [_p('Đăng ký chức danh Thư ký nhiệm vụ', body), _p(_checkbox(rr == 'secretary'), center)],
        [_p('Đăng ký chức danh khác trong Ban Chủ nhiệm nhiệm vụ' + (f': {snapshot.get("registered_role_other")}' if rr == 'other' and snapshot.get('registered_role_other') else ''), body), _p(_checkbox(rr == 'other'), center)],
    ]
    t = Table(role_rows, colWidths=[132*mm, 11*mm], hAlign='CENTER')
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),2),('RIGHTPADDING',(0,0),(-1,-1),2),('TOPPADDING',(0,0),(-1,-1),1.5),('BOTTOMPADDING',(0,0),(-1,-1),1.5)]))
    story += [t, Spacer(1, 2*mm)]

    info_rows = [
        [_p('1. Họ và tên:', body_b), _p(snapshot.get('full_name'), body), _p('Số định danh cá nhân:', body_b), _p(snapshot.get('personal_id'), body)],
        [_p('2. Ngày/tháng/năm sinh:', body_b), _p(_date_vi(snapshot.get('dob')), body), _p('Giới tính:', body_b), _p(snapshot.get('gender'), body)],
        [_p('3. Học hàm (nếu có):', body_b), _p(snapshot.get('academic_rank'), body), _p('Năm được bổ nhiệm học hàm:', body_b), _p(snapshot.get('academic_rank_year'), body)],
        [_p('   Học vị (nếu có):', body_b), _p(snapshot.get('academic_degree'), body), _p('Năm được công nhận học vị:', body_b), _p(snapshot.get('academic_degree_year'), body)],
        [_p('5. Chức danh nghề nghiệp¹ (nếu có):', body_b), _p(snapshot.get('professional_title'), body), _p('Chức vụ (nếu có):', body_b), _p(snapshot.get('position'), body)],
    ]
    info = Table(info_rows, colWidths=[47*mm, 42*mm, 54*mm, 40*mm])
    info.setStyle(TableStyle(table_style + [('SPAN',(0,0),(0,0))]))
    story.append(info)

    talent = snapshot.get('talent_category', 'none')
    talent_rows = [
        [_p('- Nhân tài về khoa học, công nghệ và đổi mới sáng tạo²', body), _p(_checkbox(talent == 'science_talent'), center)],
        [_p('- Nhà khoa học trẻ tài năng, kỹ sư trẻ tài năng³', body), _p(_checkbox(talent == 'young_talent'), center)],
        [_p('- Không thuộc hai trường hợp trên', body), _p(_checkbox(talent == 'none'), center)],
    ]
    tal = Table(talent_rows, colWidths=[171*mm, 12*mm])
    tal.setStyle(TableStyle(table_style))
    story.append(tal)

    contact = Table([
        [_p('5. Địa chỉ nhà riêng:', body_b), _p(snapshot.get('home_address'), body)],
        [_p('6. Điện thoại liên hệ:', body_b), _p(snapshot.get('phone'), body), _p('E-mail:', body_b), _p(snapshot.get('email'), body)],
    ], colWidths=[40*mm, 72*mm, 18*mm, 53*mm])
    contact.setStyle(TableStyle(table_style + [('SPAN',(1,0),(3,0))]))
    story.append(contact)

    org = snapshot.get('organization') or {}
    org_rows = [
        [_p('7. Đơn vị công tác (nếu có):', body_b), _p('', body)],
        [_p('Tên đơn vị:', body_b), _p(org.get('name'), body)],
        [_p('Địa chỉ đơn vị:', body_b), _p(org.get('address'), body)],
        [_p('Thủ trưởng đơn vị:', body_b), _p(org.get('head_name'), body), _p('Điện thoại liên hệ:', body_b), _p(org.get('phone'), body)],
    ]
    org_table = Table(org_rows, colWidths=[38*mm, 76*mm, 28*mm, 41*mm])
    org_table.setStyle(TableStyle(table_style + [('SPAN',(1,0),(3,0)),('SPAN',(1,1),(3,1)),('SPAN',(1,2),(3,2))]))
    story.append(org_table)

    story.append(_p('8. Quá trình đào tạo', section))
    edu = snapshot.get('education', [])
    edu_rows = [[_p('Bậc đào tạo', center_b), _p('Nơi đào tạo', center_b), _p('Chuyên môn', center_b), _p('Năm cấp bằng tốt nghiệp', center_b)]]
    edu_rows += [[_p(x.get('level'), body), _p(x.get('institution'), body), _p(x.get('specialization'), body), _p(x.get('graduation_year'), center)] for x in edu] or [[_p('',body),_p('',body),_p('',body),_p('',body)]]
    edu_t = Table(edu_rows, colWidths=[36*mm, 54*mm, 55*mm, 38*mm], repeatRows=1)
    edu_t.setStyle(TableStyle(table_style))
    story.append(edu_t)

    story.append(_p('9. Quá trình công tác', section))
    emp = snapshot.get('employment', [])
    emp_rows = [[_p('Thời gian\n(Từ năm ... đến năm ...)', center_b), _p('Vị trí công tác', center_b), _p('Đơn vị công tác', center_b), _p('Địa chỉ đơn vị', center_b)]]
    for x in emp:
        period = f'{x.get("start_year") or ""} - {x.get("end_year") or "nay"}'
        emp_rows.append([_p(period, center), _p(x.get('position'), body), _p(x.get('organization'), body), _p(x.get('organization_address'), body)])
    if len(emp_rows) == 1:
        emp_rows.append([_p('',body),_p('',body),_p('',body),_p('',body)])
    emp_t = Table(emp_rows, colWidths=[37*mm, 49*mm, 53*mm, 44*mm], repeatRows=1)
    emp_t.setStyle(TableStyle(table_style))
    story.append(emp_t)

    story.append(_p('10. Các công trình khoa học đã công bố chủ yếu (liệt kê tối đa 05 công trình tiêu biểu - nếu có)', section))
    work_rows = [[_p('TT', center_b), _p('Tên công trình\n(bài báo, công trình...)', center_b), _p('Là tác giả hoặc\nlà đồng tác giả công trình', center_b), _p('Nơi công bố\n(tên tạp chí đã đăng công trình)', center_b), _p('Năm công bố', center_b)]]
    for i, x in enumerate(snapshot.get('works', [])[:5], 1):
        work_rows.append([_p(i, center), _p(x.get('title'), body), _p(x.get('authorship_label'), center), _p(x.get('venue'), body), _p(x.get('year'), center)])
    if len(work_rows) == 1:
        work_rows.append([_p('',body),_p('',body),_p('',body),_p('',body),_p('',body)])
    work_t = Table(work_rows, colWidths=[9*mm, 68*mm, 37*mm, 49*mm, 20*mm], repeatRows=1)
    work_t.setStyle(TableStyle(table_style))
    story.append(work_t)
    story += [Spacer(1, 1.5*mm), _p('¹ Ví dụ: chức danh nghiên cứu khoa học (nghiên cứu viên, nghiên cứu viên chính, nghiên cứu viên cao cấp), chức danh công nghệ hoặc tương đương.', tiny),
              _p('² Theo quy định tại Điều 54 Luật Khoa học, công nghệ và đổi mới sáng tạo năm 2025.', tiny),
              _p('³ Quy định tại Điều 55 Luật KH,CN&ĐMST năm 2025; Điều 39 và Điều 40 Nghị định số 263/2025/NĐ-CP ngày 14/10/2025.', tiny),
              _p('Ghi chú:', body_b), _p('(1) Ghi tên nhiệm vụ', tiny)]

    story.append(PageBreak())
    story.append(_p('11. Các văn bằng bảo hộ quyền sở hữu trí tuệ (liên quan đến nhiệm vụ KH, CN&ĐMST - nếu có):', section))
    ip_rows = [[_p('TT', center_b), _p('Tên và nội dung văn bằng', center_b), _p('Năm cấp văn bằng', center_b)]]
    for i, x in enumerate(snapshot.get('ip_records', []), 1):
        ip_rows.append([_p(i, center), _p(x.get('title_content'), body), _p(x.get('grant_year'), center)])
    if len(ip_rows) == 1: ip_rows.append([_p('',body),_p('',body),_p('',body)])
    ip_t = Table(ip_rows, colWidths=[10*mm, 142*mm, 31*mm], repeatRows=1); ip_t.setStyle(TableStyle(table_style)); story.append(ip_t)

    story.append(_p('12. Số công trình được áp dụng trong thực tiễn (liên quan đến nhiệm vụ KH,CN&ĐMST đăng ký - nếu có)', section))
    app_rows = [[_p('TT', center_b), _p('Tên công trình', center_b), _p('Hình thức, quy mô,\nđịa chỉ áp dụng', center_b), _p('Thời gian\n(bắt đầu - kết thúc)', center_b)]]
    for i, x in enumerate(snapshot.get('practical_applications', []), 1):
        app_rows.append([_p(i, center), _p(x.get('work_name'), body), _p(x.get('application_detail'), body), _p(_period(x.get('start_date'), x.get('end_date')), center)])
    if len(app_rows) == 1: app_rows.append([_p('',body),_p('',body),_p('',body),_p('',body)])
    app_t = Table(app_rows, colWidths=[9*mm, 54*mm, 76*mm, 44*mm], repeatRows=1); app_t.setStyle(TableStyle(table_style)); story.append(app_t)

    story.append(_p('13. Các nhiệm vụ KH, CN&ĐMST đã và đang chủ trì hoặc tham gia:', section))
    task_rows = [[_p('Tên nhiệm vụ\n(Chủ trì/tham gia)', center_b), _p('Thời gian\n(bắt đầu - kết thúc)', center_b), _p('Thuộc Chương trình\n(nếu có)', center_b), _p('Tình trạng nhiệm vụ\n(đã nghiệm thu, chưa nghiệm thu)', center_b)]]
    for x in snapshot.get('research_tasks', []):
        task_rows.append([_p(f'{x.get("name")}\n({x.get("participation_label")})', body), _p(_period(x.get('start_date'), x.get('end_date')), center), _p(x.get('program_name'), body), _p(x.get('status_label'), center)])
    if len(task_rows) == 1: task_rows.append([_p('',body),_p('',body),_p('',body),_p('',body)])
    task_t = Table(task_rows, colWidths=[66*mm, 39*mm, 43*mm, 35*mm], repeatRows=1); task_t.setStyle(TableStyle(table_style)); story.append(task_t)

    story.append(_p('14. Giải thưởng (về KH,CN&ĐMST, chất lượng sản phẩm,... liên quan đến nhiệm vụ KH, CN&ĐMST - nếu có)', section))
    award_rows = [[_p('TT', center_b), _p('Hình thức và nội dung giải thưởng', center_b), _p('Năm tặng thưởng', center_b)]]
    for i, x in enumerate(snapshot.get('awards', []), 1):
        award_rows.append([_p(i, center), _p(x.get('description'), body), _p(x.get('award_year'), center)])
    if len(award_rows) == 1: award_rows.append([_p('',body),_p('',body),_p('',body)])
    award_t = Table(award_rows, colWidths=[10*mm, 142*mm, 31*mm], repeatRows=1); award_t.setStyle(TableStyle(table_style)); story.append(award_t)

    story += [
        _p('15. Thành tựu hoạt động khoa học và công nghệ và sản xuất kinh doanh khác (nếu có):', section),
        _p(snapshot.get('other_achievements'), body, empty=''),
        _p('16. Cam kết', section),
        _p('Tôi cam kết:', body),
        _p('- Các thông tin trên là trung thực, chính xác;', body),
        _p('- Có đủ thời gian, năng lực và điều kiện để chủ trì, điều hành/tham gia thực hiện nhiệm vụ;', body),
        _p('- Thực hiện nhiệm vụ đúng quy định của pháp luật, chịu trách nhiệm về kết quả và sử dụng kinh phí theo hợp đồng được ký với cơ quan quản lý nhiệm vụ.', body),
        Spacer(1, 4*mm),
    ]

    signing_date = snapshot.get('signing_date')
    if signing_date:
        try:
            d = date.fromisoformat(str(signing_date)[:10])
            when = f'{snapshot.get("signing_place") or "............."}, ngày {d.day:02d} tháng {d.month:02d} năm {d.year}'
        except Exception:
            when = f'{snapshot.get("signing_place") or "............."}, ngày ..... tháng ..... năm .....'
    else:
        when = f'{snapshot.get("signing_place") or "............."}, ngày ..... tháng ..... năm .....'
    story.append(_p(when, right))

    sig_ok_style = ParagraphStyle('sig_ok', parent=center_b, fontSize=7.2, textColor=colors.HexColor('#174A2C'))

    def centered_signature_image(image_path):
        """Đặt ảnh chữ ký đúng tâm ô ký, độc lập với kích thước/padding ô ngoài."""
        if not image_path or not os.path.isfile(image_path):
            return None
        img = Image(image_path)
        # Giữ nguyên tỷ lệ ảnh chữ ký, chỉ co để vừa khung 36 x 16 mm.
        max_w, max_h = 36*mm, 16*mm
        scale = min(max_w / img.imageWidth, max_h / img.imageHeight)
        img.drawWidth = img.imageWidth * scale
        img.drawHeight = img.imageHeight * scale
        img.hAlign = 'CENTER'
        wrapper = Table([[img]], colWidths=[40*mm], hAlign='CENTER')
        wrapper.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        return wrapper

    def signature_block(meta, fallback_text, include_stamp=False):
        rows = []
        if meta:
            image_flowable = centered_signature_image(meta.get('image_path'))
            if image_flowable:
                rows.append(image_flowable)
            rows += [
                _p(meta.get('signer_name', ''), center_b),
                _p(meta.get('signer_position', ''), center),
                _p('ĐÃ KÝ SỐ NỘI BỘ', sig_ok_style),
                _p(f"Mã xác thực: {meta.get('verification_code','')}", tiny),
                _p(f"Thời gian ký: {meta.get('signed_at','')}", tiny),
            ]
        else:
            rows.append(_p(fallback_text, center))
        return rows

    sign_left = [
        _p('ĐẠI DIỆN', center_b),
        _p('ĐƠN VỊ CÔNG TÁC XÁC NHẬN', center_b),
        _p(f'Đơn vị đồng ý và bố trí thời gian cần thiết để {snapshot.get("full_name") or "........................"} thực hiện nhiệm vụ khoa học, công nghệ và đổi mới sáng tạo', center),
        *signature_block(unit_signature, '(Ký, ghi rõ họ tên; đóng dấu)', include_stamp=True),
    ]
    sign_right = [
        _p('CÁ NHÂN', center_b),
        _p('ĐĂNG KÝ THỰC HIỆN NHIỆM VỤ', center_b),
        *signature_block(personal_signature, '(Ký, ghi rõ họ tên)'),
    ]
    sig_table = Table([[sign_left, sign_right]], colWidths=[91.5*mm, 91.5*mm], hAlign='CENTER')
    sig_table.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('ALIGN',(0,0),(-1,-1),'CENTER'),
        ('LEFTPADDING',(0,0),(-1,-1),4),
        ('RIGHTPADDING',(0,0),(-1,-1),4),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 20*mm))
    story.append(_p(f'Mã hồ sơ hệ thống: {code}', tiny))
    story.append(Spacer(1, 4*mm))
    story.append(_p('Ghi chú:', body_b))
    story.append(_p('(1) Ghi tên nhiệm vụ', tiny))

    def page_header(canvas, _doc):
        canvas.saveState()
        canvas.setFont(FONT_BOLD, 7.6)
        canvas.drawRightString(A4[0] - 13*mm, A4[1] - 8.5*mm, 'BM-04')
        canvas.setFont(FONT, 6.8)
        canvas.drawString(13*mm, A4[1] - 8.5*mm, 'Ban hành kèm theo Thông tư số 22/2026/TT-BCA ngày 26/02/2026 của Bộ trưởng Bộ Công an')
        canvas.restoreState()

    doc.build(story, onFirstPage=page_header, onLaterPages=page_header)
    return out.getvalue()
