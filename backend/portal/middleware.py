"""API-level security policies."""
from django.http import JsonResponse


class ViewerAdminReadOnlyMiddleware:
    """viewer_admin can navigate all read-only endpoints and download/view files, but cannot mutate business data."""
    SAFE_METHODS = {'GET', 'HEAD', 'OPTIONS'}
    ALLOWED_POST_PATHS = {
        '/api/logout/', '/api/password/', '/api/notifications/read/'
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, 'user', None)
        if (
            user and user.is_authenticated and getattr(user, 'role', '') == 'viewer_admin'
            and request.path.startswith('/api/')
            and request.method not in self.SAFE_METHODS
            and request.path not in self.ALLOWED_POST_PATHS
        ):
            return JsonResponse({'error': 'Tài khoản Admin xem chỉ có quyền xem và tải tệp.'}, status=403)
        return self.get_response(request)


class MustChangePasswordMiddleware:
    ALLOWED=('/api/me/','/api/password/','/api/logout/','/api/csrf/')
    def __init__(self,get_response):self.get_response=get_response
    def __call__(self,request):
        user=request.user
        if user.is_authenticated and user.must_change_password and request.path.startswith('/api/') and request.path not in self.ALLOWED:
            return JsonResponse({'error':'Bạn phải đổi mật khẩu khởi tạo trước khi tiếp tục.'},status=403)
        return self.get_response(request)
