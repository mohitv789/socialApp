from django.urls import path, include
from rest_framework.routers import DefaultRouter
from webchat import views

router = DefaultRouter()
router.register('chat', views.ChatroomViewSet)
router.register(
    r"chatroom/(?P<chatroom_id>\d+)/membership", views.ChatroomMemebershipViewSet, basename="server-membership"
)
app_name = 'webchat'

urlpatterns = [
    path('', include(router.urls)),
    path('conversation/<int:conversation_id>/get_chatroom_status/', views.get_chatroom_status_view, name='get_chatroom_status'),
    path('messages/', views.MessageViewset.as_view({'get': 'list'}), name="chats"),
]
