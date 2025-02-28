from django.urls import path, include
from rest_framework.routers import DefaultRouter

from story import views


router = DefaultRouter()
router.register('reels', views.ReelViewSet)
router.register('stories', views.StoryViewSet)


app_name = 'story'

urlpatterns = [
    path('', include(router.urls)),
    path('storycomments/<uuid:story_id>/', views.StoryCommentViewSet.as_view({'get': 'list', 'post': 'create'}), name='storycomment-list'),
    path('storycomments/<uuid:story_id>/<str:pk>/', views.StoryCommentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),
    path('reelcomments/<uuid:reel_id>/', views.ReelCommentViewSet.as_view({'get': 'list', 'post': 'create'}), name='reelcomment-list'),
    path('reelcomments/<uuid:reel_id>/<str:pk>/', views.ReelCommentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})),
    path('storyreact/<str:storyId>/like/',views.StoryLikeAPIView.as_view(),name="story-like"),
    path('reelreact/<str:reelId>/like/',views.ReelLikeAPIView.as_view(),name="reel-like"),
    path('storyreact/<str:storyId>/love/',views.StoryLoveAPIView.as_view(),name="story-love"),
    path('reelreact/<str:reelId>/love/',views.ReelLoveAPIView.as_view(),name="reel-love"),
    path('storyreact/<str:storyId>/celebrate/',views.StoryCelebrateAPIView.as_view(),name="story-celebrate"),
    path('reelreact/<str:reelId>/celebrate/',views.ReelCelebrateAPIView.as_view(),name="reel-celebrate"),
    path('s_feed',views.UserStoryFeed.as_view(),name="s_feed"),
    path('s_feed/stories/<str:id>',views.GetStoryFeedDetailView.as_view({"get": "get_object"})),
    path('s_feed/reels/<str:id>',views.GetReelFeedDetailView.as_view({"get": "get_object"})),
    path('r_feed/',views.UserReelFeed.as_view(),name="r_feed"),
    path('s_notifications',views.reactionsOnUserStoryActivity.as_view(),name="s_notifications"),
    path('sc_notifications',views.commentsOnUserStoryActivity.as_view(),name="sc_notifications"),
    path('r_notifications',views.reactionsOnUserReelActivity.as_view(),name="r_notifications"),
    path('rc_notifications',views.commentsOnUserReelActivity.as_view(),name="rc_notifications"),
    path('fs_notifications',views.FriendStoryActivity.as_view(),name="fs_notifications"),
    path('fr_notifications',views.FriendReelActivity.as_view(),name="fr_notifications"),
    path('photos',views.ImageModelFeed.as_view(),name="photos"),    
]
