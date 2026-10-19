from django.core.management.base import BaseCommand
from cryptography.fernet import Fernet


class Command(BaseCommand):
    help = 'Sinh INTERNAL_SIGNING_MASTER_KEY cho .env (chỉ chạy một lần và lưu khóa an toàn)'

    def handle(self, *args, **kwargs):
        self.stdout.write(Fernet.generate_key().decode())
