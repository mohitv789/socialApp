import datetime
from django.conf import settings
import random
import string
from rest_framework.decorators import api_view,authentication_classes,permission_classes
import pyotp
from django.core.mail import send_mail
from rest_framework import exceptions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.authentication import get_authorization_header
from core.models import User, UserToken, Reset
from .serializers import UserSerializer,CustomTokenObtainPairSerializer,JWTCookieRefreshSerializer
import jwt
from google.oauth2 import id_token
from google.auth.transport.requests import Request as GoogleRequest
from rest_framework import status
from .authentication import JWTCookieAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from rest_framework.permissions import AllowAny
class RegisterAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        data = request.data

        if data['password'] != data['password_confirm']:
            raise exceptions.APIException('Passwords do not match!')

        serializer = UserSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserAPIView(APIView):
    authentication_classes = [JWTCookieAuthentication]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

class PublicUserAPIView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    def get(self, request,*args, **kwargs):
        userId = self.kwargs['userId']
        obj = get_object_or_404(User, pk=userId)
        serializer = UserSerializer(obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

        

class LogoutAPIView(APIView):
    def post(self, request, format=None):
        response = Response("Logged out successfully")

        response.set_cookie("refresh_token", "", expires=0)
        response.set_cookie("access_token", "", expires=0)

        return response  
    
class JWTSetCookieMixin:
    def finalize_response(self,request,response,*args,**kwargs):
        if response.data.get("refresh"):
            response.set_cookie(
                settings.SIMPLE_JWT["REFRESH_TOKEN_NAME"],
                response.data["refresh"],
                max_age= settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
                httponly=True,
                samesite=settings.SIMPLE_JWT["JWT_COOKIE_SAMESITE"],
                secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"]
            )
        
        if response.data.get("access"):
            response.set_cookie(
                settings.SIMPLE_JWT["ACCESS_TOKEN_NAME"],
                response.data["access"],
                max_age= settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
                httponly=True,
                samesite=settings.SIMPLE_JWT["JWT_COOKIE_SAMESITE"],
                secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"]
            )      
        

            del response.data["access"]
        return super().finalize_response(request,response,*args,**kwargs)

class JWTCookieTokenObtainPairView(JWTSetCookieMixin,TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class JWTCookieTokenRefreshView(JWTSetCookieMixin,TokenRefreshView):
    serializer_class = JWTCookieRefreshSerializer