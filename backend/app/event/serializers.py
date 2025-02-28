import json
from rest_framework import serializers
from core.models import Story, Reel, Tag, ImageModel, StoryComment, ReelComment, FriendStoryActivityFeed, FriendReelActivityFeed, StoryFeed,StoryReactionActivityFeed,ReelReactionActivityFeed, StoryCommentActivityFeed, ReelFeed, ReelCommentActivityFeed
from user.serializers import UserSerializer
from webchat.serializer import ConversationSerializer
from rest_framework import serializers    
from django.db import transaction

class ImageModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageModel
        fields = "__all__"
        read_only_fields = ('id',)

class ReelImageSerializer(serializers.ModelSerializer):
    """Serializer for uploading images to reel"""
    image = serializers.ImageField()
    class Meta:
        model = Reel
        fields = ('id', 'image')
        read_only_fields = ('id',)
        
