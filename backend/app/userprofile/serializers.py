from rest_framework import serializers
from core.models import UserProfile, FriendshipRequest, UserProfile, PromotedToWallModel
from django.contrib.auth import get_user_model


class ProfileImageSerializer(serializers.ModelSerializer):
    """Serializer for uploading images to story"""
    avatar = serializers.ImageField()
    class Meta:
        model = UserProfile
        fields = ('id', 'avatar')
        read_only_fields = ('id',)


class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ('id', 'first_name','last_name', 'email','avatar')
class PromotedWallSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotedToWallModel
        fields= ("__all__")
class FollowSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(read_only=True, source='userprofile.avatar')
    class Meta:
        model = get_user_model()
        fields = ('id', 'first_name','last_name', 'email','avatar')

class BlockSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(read_only=True, source='userprofile.avatar')
    class Meta:
        model = get_user_model()
        fields = ('id', 'first_name','last_name', 'email','avatar')

class FriendshipRequestSerializer(serializers.ModelSerializer):
    to_user = serializers.CharField()
    from_user = serializers.StringRelatedField()

    class Meta:
        model = FriendshipRequest
        fields = ('id', 'from_user', 'to_user', 'message',
                  'created', 'rejected', 'viewed')
        extra_kwargs = {
            'from_user': {'read_only': True},
            'created': {'read_only': True},
            'rejected': {'read_only': True},
            'viewed': {'read_only': True},
        }

class FriendshipRequestResponseSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()

    class Meta:
        model = FriendshipRequest
        fields = ('id',)

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for uploading images to reel"""
    class Meta:
        model = UserProfile
        fields = "__all__"
        read_only_fields = ('id',)
