"""Tra cứu nguồn gốc hồ sơ BM-04 từ PDF/ảnh scan.

Tra cứu QR/mã hiển thị KHÔNG chứng minh nội dung ảnh/scan không bị sửa.
Chỉ tệp PDF gốc trùng băm và kiểm tra RSA mới được gọi là xác thực mật mã.
"""
from __future__ import annotations

import re
from io import BytesIO
from .models import DigitalSignature
from .services import read_private
from .signing_service import sha256_bytes, verify_bytes

CODE_PATTERN = re.compile(r'(?i)SIG\s*[-–]\s*([PU])\s*[-–]\s*(\d{8})\s*[-–]\s*([0-9A-F]{12})')


def _codes_from_text(text):
    return ['SIG-'+m.group(1).upper()+'-'+m.group(2)+'-'+m.group(3).upper()
            for m in CODE_PATTERN.finditer(text or '')]


def _decode_qr_image(img):
    try:
        import cv2
        detector = cv2.QRCodeDetector()
        codes = []
        retval, decoded, _, _ = detector.detectAndDecodeMulti(img)
        if retval:
            for value in decoded:
                codes += _codes_from_text(value)
        if not codes:
            value, _, _ = detector.detectAndDecode(img)
            codes += _codes_from_text(value)
        return codes
    except (ImportError, ValueError, Exception):
        return []


def extract_scan_codes(filename, content):
    """Look for QR, PDF text and optional OCR; cap page count/resolution."""
    result = []
    if content.startswith(b'%PDF-'):
        try:
            import fitz
            import numpy as np
            import cv2
            with fitz.open(stream=content, filetype='pdf') as doc:
                pages = sorted(set([0, min(len(doc)-1, 1), max(0,len(doc)-1)]))[:3]
                for i in pages:
                    page = doc.load_page(i)
                    result += _codes_from_text(page.get_text())
                    pix = page.get_pixmap(matrix=fitz.Matrix(1.8, 1.8), alpha=False)
                    arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
                    bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
                    result += _decode_qr_image(bgr)
                    if not result:
                        result += _optional_ocr(bgr)
        except (ImportError, ValueError, RuntimeError):
            # Legacy deployments without scan dependencies still accept manual verification code.
            pass
    else:
        try:
            import cv2
            import numpy as np
            img=cv2.imdecode(np.frombuffer(content, dtype=np.uint8), cv2.IMREAD_COLOR)
            if img is not None:
                h,w=img.shape[:2]
                if max(h,w)>2800:
                    factor=2800/max(h,w)
                    img=cv2.resize(img,None,fx=factor,fy=factor)
                result += _decode_qr_image(img)
                if not result:
                    result += _optional_ocr(img)
        except (ImportError, ValueError):
            pass
    return list(dict.fromkeys(result))[:8]


def _optional_ocr(image):
    """OCR best effort. Vietnamese pack optional; code itself uses Latin letters/digits."""
    try:
        import pytesseract
        txt=pytesseract.image_to_string(image, config='--psm 11', timeout=6)
        return _codes_from_text(txt)
    except Exception:
        return []


def lookup_scan_codes(codes):
    """Verify matching records by reading original signed file, not the upload."""
    records=[]
    for code in list(dict.fromkeys(codes))[:8]:
        for ds in DigitalSignature.objects.filter(verification_code=code).select_related('approval','signer','identity'):
            try:
                path=read_private(ds.signed_file_path)
                original=path.read_bytes() if path.is_file() else b''
                content_ok=bool(original) and sha256_bytes(original)==ds.signed_pdf_sha256
                sign_ok=bool(content_ok and verify_bytes(ds.certificate_pem,original,ds.signature_b64))
            except (OSError,ValueError):
                content_ok=sign_ok=False
            is_unit=(ds.signature_role==DigitalSignature.SignatureRole.UNIT)
            records.append({
                'verification_code':code,
                'approval_code':ds.approval.code,
                'lecturer':ds.approval.lecturer.full_name,
                'signature_role_label':ds.get_signature_role_display(),
                'signer':ds.identity.display_name or ds.signer.username,
                'signed_at':ds.signed_at.isoformat(),
                'source_signature_valid':bool(sign_ok),
                'approval_completed': bool(is_unit and ds.approval.status=='completed'),
                'source_sha256':ds.signed_pdf_sha256,
            })
    return records


def scan_lookup_result(filename, content, manual_code=''):
    recognized=extract_scan_codes(filename,content)
    typed=_codes_from_text(manual_code)
    codes=list(dict.fromkeys(typed+recognized))
    matched=lookup_scan_codes(codes)
    source_valid=any(x['source_signature_valid'] and x['approval_completed'] for x in matched)
    source_invalid=any(not x['source_signature_valid'] for x in matched)
    if source_valid:
        status='scan_record_found'
        summary='Đã đối chiếu được mã xác thực với BM-04 đã được ký và hoàn tất trong hệ thống.'
    elif matched and not source_invalid:
        status='scan_personal_signature_only'
        summary='Đối chiếu được chữ ký cá nhân, nhưng chưa xác nhận đây là bản BM-04 đã được lãnh đạo ký hoàn tất.'
    elif matched:
        status='scan_source_invalid'
        summary='Phát hiện mã nhưng việc xác thực chữ ký của tài liệu gốc không thành công.'
    elif codes:
        status='scan_code_not_found'
        summary='Đã nhận diện mã xác thực nhưng không có hồ sơ tương ứng trong hệ thống.'
    else:
        status='scan_unverifiable'
        summary='Không đọc được mã xác thực trên bản scan. Cần nhập mã in trên BM-04 hoặc tải ảnh rõ nét hơn.'
    return {
        'verdict':status, 'valid':None, 'trusted':False, 'cryptographic':False,
        'summary':summary,
        'explanation':'Kết quả chỉ đối chiếu mã in trên ảnh/scan với hồ sơ gốc lưu trong hệ thống. Không xác nhận mọi chi tiết trên bản scan trùng bản gốc, không xác minh hình ảnh chữ ký bằng mật mã.',
        'recognized_codes':recognized, 'queried_codes':codes,
        'scan_records':matched, 'source_record_verified':source_valid,
    }
