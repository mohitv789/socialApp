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
    def validate(self, attrs):
        try:
            data = super().validate(attrs)  # SimpleJWT does authentication here
        except Exception:
            raise InvalidToken("Invalid email or password")

        user = self.user
        token = self.get_token(user)

        data["user_id"] = user.id
        data['access_token_expiry'] = int(
            (datetime.now() + token.lifetime).timestamp()
        )
        return data

class JWTCookieRefreshSerializer(TokenRefreshSerializer):
    refresh = None

    def validate(self, attrs):
        refresh_token = self.context["request"].COOKIES.get(
            settings.SIMPLE_JWT["REFRESH_TOKEN_NAME"]
        )

        if not refresh_token:
            raise InvalidToken("Refresh token missing or expired")

        attrs["refresh"] = refresh_token
        return super().validate(attrs)