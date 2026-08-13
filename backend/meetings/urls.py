"""URL patterns for the meetings & auth API.

All routes are prefixed with /api/ (set in meetclone/urls.py).
"""

from django.urls import path
from . import views

urlpatterns = [
    # Auth endpoints
    path('auth/signup', views.signup_view, name='auth-signup'),
    path('auth/login', views.login_view, name='auth-login'),
    path('auth/me', views.auth_me_view, name='auth-me'),

    # Meeting endpoints
    path('meetings/me', views.get_current_user, name='current-user'),
    path('meetings/instant', views.instant_meeting, name='instant-meeting'),
    path('meetings/scheduled', views.schedule_meeting, name='schedule-meeting'),
    path('meetings/upcoming', views.upcoming_meetings, name='upcoming-meetings'),
    path('meetings/recent', views.recent_meetings, name='recent-meetings'),
    path('meetings/<str:meeting_code>', views.meeting_details, name='meeting-details'),
    path('meetings/<str:meeting_code>/validate', views.validate_meeting, name='validate-meeting'),
    path('meetings/<str:meeting_code>/join', views.join_meeting, name='join-meeting'),
    path('meetings/<str:meeting_code>/leave', views.leave_meeting, name='leave-meeting'),
    path('meetings/<str:meeting_code>/lock', views.lock_meeting, name='lock-meeting'),
    path('meetings/<str:meeting_code>/cancel', views.cancel_meeting, name='cancel-meeting'),
]
