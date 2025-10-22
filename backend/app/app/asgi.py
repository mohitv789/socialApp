import os
from channels.routing import ProtocolTypeRouter,URLRouter
from django.core.asgi import get_asgi_application
from django.urls import path
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "app.settings")

django_application = get_asgi_application()
async def health_scope(scope, receive, send):
    """Simple HTTP response to test Daphne service health."""
    if scope["type"] == "http":
        await send({
            "type": "http.response.start",
            "status": 200,
            "headers": [(b"content-type", b"application/json")],
        })
        await send({
            "type": "http.response.body",
            "body": b'{"status":"ok","service":"websocket"}',
        })
from . import urls #noqa isort:skip
from webchat.middleware import JWTAuthMiddleWare  # noqa isort:skip

# application = ProtocolTypeRouter({
#         "http": get_asgi_application(),
#         "websocket": JWTAuthMiddleWare(URLRouter(urls.websocket_urlpatterns))
#     })

websocket_patterns = urls.websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": URLRouter([
        path("ws-health/", health_scope),
        # optionally route other simple checks here
    ]),
    "websocket": JWTAuthMiddleWare(URLRouter(websocket_patterns))
})

