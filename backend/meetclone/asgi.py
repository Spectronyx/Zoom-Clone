"""
ASGI config for MeetClone project.

Routes HTTP requests to Django and WebSocket connections to Channels consumers.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'meetclone.settings')

# Initialize Django ASGI application early to ensure AppRegistry is populated
django_asgi_app = get_asgi_application()

# Import after Django setup
from meetings.routing import websocket_urlpatterns

# Build allowed WebSocket origins from environment
_frontend_url = os.environ.get('FRONTEND_URL', '')
if _frontend_url:
    _ws_origins = [origin.strip() for origin in _frontend_url.split(',')]
else:
    # Development fallback — allow all origins
    _ws_origins = ["*"]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": OriginValidator(
        URLRouter(websocket_urlpatterns),
        _ws_origins,
    ),
})
