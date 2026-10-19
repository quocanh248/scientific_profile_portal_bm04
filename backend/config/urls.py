from django.urls import path,include
# Django admin is intentionally NOT exposed: backend approval permissions must not be bypassed.
urlpatterns=[path('api/',include('portal.urls'))]
