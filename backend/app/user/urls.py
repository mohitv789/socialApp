from django.urls import path
from .views import (
    RegisterAPIView, UserAPIView, LogoutAPIView, 
    PublicUserAPIView,JWTCookieTokenObtainPairView,JWTCookieTokenRefreshView
)

urlpatterns = [
    path('register', RegisterAPIView.as_view()),
    path('user', UserAPIView.as_view()),
    path('user/<int:userId>', PublicUserAPIView.as_view()),
    path('logout', LogoutAPIView.as_view()),
    path('token', JWTCookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh', JWTCookieTokenRefreshView.as_view(), name='token_refresh')
]

