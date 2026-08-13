"""WebSocket URL routing for the meetings app."""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/meeting/(?P<instance_id>[^/]+)/?$', consumers.MeetingConsumer.as_asgi()),
]
