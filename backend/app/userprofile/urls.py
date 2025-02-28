from django.urls import path, include
from rest_framework.routers import DefaultRouter

from userprofile import views


router = DefaultRouter()
router.register('private', views.PrivateProfileViewSet)
router.register('friends', views.FriendViewSet, 'friend')
router.register('profile', views.FollowViewSet, 'follow')
router.register('block', views.BlockViewSet, 'block')
router.register('wall', views.PromotedToWall, 'wall')


app_name = 'profile'

urlpatterns = [
    path('', include(router.urls)),
    path('<int:userid>',views.PublicProfileViewSet.as_view({"get": "get_object"}))
]
