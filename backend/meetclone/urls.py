"""
URL configuration for MeetClone project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({"status": "ok", "service": "meetclone-backend"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('health', health_check),
    path('api/', include('meetings.urls')),
    path('api/meetings/', include('meetings.urls')),
]
