"""Internal-only PKI helpers for BM-04.

The school runs its own CA; no external signing service is required. Private keys are
stored encrypted with INTERNAL_SIGNING_MASTER_KEY. A user's login password is still
required before a signing operation, but the password itself is never stored here.
"""
from __future__ import annotations

import base64
import hashlib
from datetime import datetime, timedelta, timezone as dt_timezone
from pathlib import Path

from cryptography import x509
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.x509.oid import NameOID
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from .models import SigningIdentity


def _fernet() -> Fernet:
    raw = getattr(settings, 'INTERNAL_SIGNING_MASTER_KEY', '')
    if not raw:
        raise ImproperlyConfigured('Thiếu INTERNAL_SIGNING_MASTER_KEY. Hãy cấu hình khóa Fernet trong .env.')
    try:
        return Fernet(raw.encode())
    except Exception as ex:
        raise ImproperlyConfigured('INTERNAL_SIGNING_MASTER_KEY không đúng định dạng Fernet.') from ex


def _ca_paths():
    root = settings.PRIVATE_STORAGE_ROOT / 'internal_ca'
    root.mkdir(parents=True, exist_ok=True)
    return root / 'ca_private_key.enc', root / 'ca_certificate.pem'


def ensure_internal_ca():
    """Create the internal CA once if it does not exist and return (key, cert)."""
    key_path, cert_path = _ca_paths()
    f = _fernet()
    if key_path.exists() and cert_path.exists():
        try:
            key_pem = f.decrypt(key_path.read_bytes())
        except InvalidToken as ex:
            raise ImproperlyConfigured('Không giải mã được khóa CA nội bộ. Kiểm tra INTERNAL_SIGNING_MASTER_KEY.') from ex
        key = serialization.load_pem_private_key(key_pem, password=None)
        cert = x509.load_pem_x509_certificate(cert_path.read_bytes())
        return key, cert

    key = rsa.generate_private_key(public_exponent=65537, key_size=3072)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, 'VN'),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, 'Truong Dai hoc Canh sat nhan dan'),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, 'PKI noi bo'),
        x509.NameAttribute(NameOID.COMMON_NAME, 'DHCSND Internal Root CA'),
    ])
    now = datetime.now(dt_timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(minutes=5))
        .not_valid_after(now + timedelta(days=3650))
        .add_extension(x509.BasicConstraints(ca=True, path_length=1), critical=True)
        .add_extension(x509.KeyUsage(
            digital_signature=True, content_commitment=False, key_encipherment=False,
            data_encipherment=False, key_agreement=False, key_cert_sign=True,
            crl_sign=True, encipher_only=False, decipher_only=False,
        ), critical=True)
        .sign(key, hashes.SHA256())
    )
    key_pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    key_path.write_bytes(f.encrypt(key_pem))
    cert_path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    return key, cert


def provision_identity(user) -> SigningIdentity:
    identity, _ = SigningIdentity.objects.get_or_create(user=user)
    if identity.encrypted_private_key and identity.certificate_pem:
        return identity
    ca_key, ca_cert = ensure_internal_ca()
    key = rsa.generate_private_key(public_exponent=65537, key_size=3072)
    now = datetime.now(dt_timezone.utc)
    display = getattr(getattr(user, 'lecturer', None), 'full_name', '') or user.get_full_name() or user.username
    subject = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, 'VN'),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, 'Truong Dai hoc Canh sat nhan dan'),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, 'Nguoi ky BM-04'),
        x509.NameAttribute(NameOID.COMMON_NAME, display[:64]),
    ])
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(ca_cert.subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(minutes=5))
        .not_valid_after(now + timedelta(days=1095))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(x509.KeyUsage(
            digital_signature=True, content_commitment=True, key_encipherment=False,
            data_encipherment=False, key_agreement=False, key_cert_sign=False,
            crl_sign=False, encipher_only=False, decipher_only=False,
        ), critical=True)
        .sign(ca_key, hashes.SHA256())
    )
    private_pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    identity.encrypted_private_key = _fernet().encrypt(private_pem).decode()
    identity.certificate_pem = cert.public_bytes(serialization.Encoding.PEM).decode()
    identity.certificate_serial = format(cert.serial_number, 'X')
    identity.is_active = True
    identity.save()
    return identity


def identity_public_payload(identity: SigningIdentity | None):
    if not identity:
        return {'provisioned': False, 'has_signature_image': False}
    cert = None
    valid_from = valid_to = ''
    if identity.certificate_pem:
        cert = x509.load_pem_x509_certificate(identity.certificate_pem.encode())
        valid_from = cert.not_valid_before_utc.isoformat()
        valid_to = cert.not_valid_after_utc.isoformat()
    return {
        'provisioned': bool(identity.certificate_pem and identity.encrypted_private_key),
        'display_name': identity.display_name, 'position': identity.position,
        'certificate_serial': identity.certificate_serial,
        'valid_from': valid_from,
        'valid_to': valid_to,
        'has_signature_image': bool(identity.signature_image_path),
        'is_active': identity.is_active,
    }


def sign_bytes(identity: SigningIdentity, data: bytes) -> str:
    if not identity.is_active:
        raise ValueError('Danh tính ký số đang bị khóa.')
    try:
        private_pem = _fernet().decrypt(identity.encrypted_private_key.encode())
    except InvalidToken as ex:
        raise ValueError('Không giải mã được khóa ký nội bộ.') from ex
    key = serialization.load_pem_private_key(private_pem, password=None)
    signature = key.sign(
        data,
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256(),
    )
    return base64.b64encode(signature).decode()


def verify_bytes(certificate_pem: str, data: bytes, signature_b64: str) -> bool:
    try:
        cert = x509.load_pem_x509_certificate(certificate_pem.encode())
        cert.public_key().verify(
            base64.b64decode(signature_b64), data,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )
        # Also ensure certificate is signed by the current internal CA.
        _, ca_cert = ensure_internal_ca()
        ca_cert.public_key().verify(
            cert.signature, cert.tbs_certificate_bytes,
            padding.PKCS1v15(), cert.signature_hash_algorithm,
        )
        now = datetime.now(dt_timezone.utc)
        return cert.not_valid_before_utc <= now <= cert.not_valid_after_utc
    except Exception:
        return False


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
