"""Verify uploaded files against BM-04 internal digital-signature records.

Important distinction:
- An original PDF produced by this system can be cryptographically verified by matching
  its SHA-256 to a DigitalSignature record and validating the stored RSA-PSS signature.
- A scanned PDF or JPG/PNG only contains pixels. It is not a digital signature, even if
  a handwritten/signature image is visible.
- PDFs signed by external providers may contain an embedded PDF signature. This module
  only *detects* that marker; it does not establish external CA trust in V8.1.

The uploaded bytes are inspected in memory and are not persisted.
"""
from __future__ import annotations

import re
from pathlib import Path

from .models import DigitalSignature
from .signing_service import sha256_bytes, verify_bytes

MAX_VERIFY_UPLOAD_BYTES = 20 * 1024 * 1024


def _kind_from_bytes(name: str, data: bytes) -> str:
    ext = Path(name or '').suffix.lower()
    if data.startswith(b'%PDF-') or ext == '.pdf':
        return 'pdf'
    if data.startswith(b'\x89PNG\r\n\x1a\n') or ext == '.png':
        return 'image'
    if data.startswith(b'\xff\xd8\xff') or ext in ('.jpg', '.jpeg'):
        return 'image'
    return 'other'


def _pdf_embedded_signature_markers(data: bytes) -> dict:
    """Conservatively detect common PDF embedded-signature structures.

    Detection is intentionally not called validation. Real PAdES/CMS validation requires
    a certificate trust context and revocation/timestamp processing. We only report that
    the uploaded PDF appears to contain one or more signature dictionaries.
    """
    byte_ranges = len(re.findall(rb'/ByteRange\s*\[', data))
    sig_types = len(re.findall(rb'/Type\s*/Sig\b', data))
    subfilters = re.findall(rb'/SubFilter\s*/([A-Za-z0-9.]+)', data)
    count = max(byte_ranges, sig_types, len(subfilters))
    return {
        'detected': count > 0,
        'count': count,
        'subfilters': sorted({x.decode('ascii', errors='ignore') for x in subfilters if x}),
    }


def verify_uploaded_file(name: str, data: bytes) -> dict:
    file_sha = sha256_bytes(data)
    kind = _kind_from_bytes(name, data)

    # 1) Strongest check for this application: exact bytes match a stored BM-04
    # DigitalSignature and the RSA-PSS signature verifies under the current internal CA.
    matches = list(
        DigitalSignature.objects
        .filter(signed_pdf_sha256=file_sha)
        .select_related('approval', 'signer', 'identity')
        .order_by('signed_at')
    )
    checked = []
    for ds in matches:
        crypto_ok = verify_bytes(ds.certificate_pem, data, ds.signature_b64)
        checked.append({
            'valid': bool(crypto_ok),
            'verification_code': ds.verification_code,
            'approval_code': ds.approval.code,
            'signature_role': ds.signature_role,
            'signature_role_label': ds.get_signature_role_display(),
            'signer': ds.identity.display_name or ds.signer.username,
            'position': ds.identity.position,
            'certificate_serial': ds.identity.certificate_serial,
            'algorithm': ds.algorithm,
            'signed_at': ds.signed_at.isoformat(),
        })

    valid_internal = [x for x in checked if x['valid']]
    if valid_internal:
        return {
            'file_name': name,
            'file_kind': kind,
            'size': len(data),
            'sha256': file_sha,
            'verdict': 'valid_internal',
            'valid': True,
            'trusted': True,
            'cryptographic': True,
            'summary': 'Tệp trùng khớp chính xác với tài liệu đã ký trong hệ thống và chữ ký mật mã xác minh hợp lệ bằng PKI nội bộ.',
            'explanation': 'SHA-256 của tệp khớp bản ghi DigitalSignature; RSA-PSS/SHA-256 được kiểm tra bằng chứng thư X.509 do Root CA nội bộ cấp.',
            'internal_signatures': valid_internal,
            'embedded_pdf_signature': None,
        }

    if matches:
        return {
            'file_name': name,
            'file_kind': kind,
            'size': len(data),
            'sha256': file_sha,
            'verdict': 'invalid_internal',
            'valid': False,
            'trusted': False,
            'cryptographic': True,
            'summary': 'Tệp có bản ghi chữ ký nội bộ tương ứng nhưng kiểm tra mật mã không hợp lệ.',
            'explanation': 'Có thể chứng thư không còn hợp lệ, Root CA không khớp hoặc dữ liệu chữ ký bị sai. Không nên coi đây là tài liệu ký số hợp lệ.',
            'internal_signatures': checked,
            'embedded_pdf_signature': None,
        }

    # 2) Pixel images cannot preserve a PDF digital signature.
    if kind == 'image':
        return {
            'file_name': name,
            'file_kind': kind,
            'size': len(data),
            'sha256': file_sha,
            'verdict': 'visual_scan_only',
            'valid': False,
            'trusted': False,
            'cryptographic': False,
            'summary': 'Đây là ảnh/scan, không phải chữ ký số có thể xác minh bằng mật mã.',
            'explanation': 'Ảnh PNG/JPG chỉ lưu điểm ảnh. Hình chữ ký hoặc con dấu nhìn thấy trên ảnh không chứa private key, certificate hay chữ ký RSA-PSS của tài liệu gốc.',
            'internal_signatures': [],
            'embedded_pdf_signature': None,
        }

    if kind == 'pdf':
        embedded = _pdf_embedded_signature_markers(data)
        if embedded['detected']:
            return {
                'file_name': name,
                'file_kind': kind,
                'size': len(data),
                'sha256': file_sha,
                'verdict': 'external_pdf_signature_detected',
                'valid': None,
                'trusted': False,
                'cryptographic': True,
                'summary': 'Phát hiện cấu trúc chữ ký số nhúng trong PDF, nhưng chưa thể kết luận chứng thư bên ngoài là tin cậy.',
                'explanation': 'Tệp không trùng bản ký nội bộ. Hệ thống V8.1 phát hiện ByteRange/Signature dictionary nhưng chưa thực hiện xác minh chuỗi CA, OCSP/CRL hoặc timestamp của nhà cung cấp chữ ký bên ngoài.',
                'internal_signatures': [],
                'embedded_pdf_signature': embedded,
            }
        return {
            'file_name': name,
            'file_kind': kind,
            'size': len(data),
            'sha256': file_sha,
            'verdict': 'no_digital_signature',
            'valid': False,
            'trusted': False,
            'cryptographic': False,
            'summary': 'Không tìm thấy chữ ký số có thể xác minh trong tệp PDF này.',
            'explanation': 'PDF có thể là bản scan hoặc PDF thông thường. Nếu tài liệu đã được in rồi scan lại, chữ ký số của tệp PDF gốc không còn tồn tại trong dữ liệu scan.',
            'internal_signatures': [],
            'embedded_pdf_signature': embedded,
        }

    return {
        'file_name': name,
        'file_kind': kind,
        'size': len(data),
        'sha256': file_sha,
        'verdict': 'unsupported',
        'valid': False,
        'trusted': False,
        'cryptographic': False,
        'summary': 'Định dạng tệp chưa được hỗ trợ để kiểm tra chữ ký số.',
        'explanation': 'Chỉ nhận PDF, PNG, JPG/JPEG. Đối với chữ ký số nội bộ, nên kiểm tra trực tiếp tệp PDF gốc được hệ thống tạo ra.',
        'internal_signatures': [],
        'embedded_pdf_signature': None,
    }
