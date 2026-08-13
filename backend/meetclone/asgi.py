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

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": OriginValidator(
        URLRouter(websocket_urlpatterns),
        ["*"]
    ),
})
