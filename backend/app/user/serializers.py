from rest_framework.serializers import ModelSerializer
from core.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import InvalidToken
from datetime import datetime
from django.conf import settings

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

    

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def get_token(cls,user):
        token = super().get_token(user)
        
        return token

    def validate(self,attrs):
        data = super().validate(attrs)
        user = self.user
        data["user_id"] = user.id
        token = self.get_token(user)
        data['access_token_expiry'] = int(round((datetime.now() + token.lifetime).timestamp()))
        return data

class JWTCookieRefreshSerializer(TokenRefreshSerializer):
    refresh = None

    def validate(self, attrs):
        attrs["refresh"] = self.context["request"].COOKIES.get(settings.SIMPLE_JWT["REFRESH_TOKEN_NAME"])

        if attrs["refresh"]:
            return super().validate(attrs)
        else:
            raise InvalidToken("No valid refresh token found")