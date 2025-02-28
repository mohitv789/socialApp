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
        


class TagSerializer(serializers.ModelSerializer):
    """Serializer for tag objects"""

    class Meta:
        model = Tag
        fields = "__all__"
        read_only_fields = ('id',)


    
class StoryImageSerializer(serializers.ModelSerializer):
    """Serializer for uploading images to story"""
    image = serializers.ImageField()
    class Meta:
        model = Story
        fields = ('id', 'image')
        read_only_fields = ('id',)

class ReelSerializer(serializers.ModelSerializer):
    """Serializer for reel objects"""
    likes = UserSerializer(many=True, required=False)
    loves = UserSerializer(many=True, required=False)
    celebrates = UserSerializer(many=True, required=False)
    reel_conversation = ConversationSerializer(many=True,read_only=True, required=False)
    
    class Meta:
        model = Reel
        fields = "__all__"
        read_only_fields = ['id']
        
class StorySerializer(serializers.ModelSerializer):
    """Serialize a Story detail"""
    reels = ReelSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=False)
    likes = UserSerializer(many=True, required=False)
    loves = UserSerializer(many=True, required=False)
    celebrates = UserSerializer(many=True, required=False)
    story_conversation = ConversationSerializer(many=True,read_only=True, required=False)
    class Meta:
        model = Story
        fields = "__all__"
        read_only_fields = ['id']
    
    def get_user_has_liked_answer(self, instance):
        request = self.context.get("request")
        return instance.voters.filter(pk=request.user.id).exists()
    
    # def _get_or_create_reels(self, reels, story):
    #     reel_list = []
    #     for reel in reels:
    #         print(reel)
    #         reel_obj , created = Reel.objects.get_or_create(
    #             **reel
    #         )
    #         reel_list.append(reel_obj)
    #     story.reels.set(reel_list)
    
    def _get_or_create_tags(self, tags, story):
        tag_list = []
        for tag in tags:
            tag_obj, created = Tag.objects.get_or_create(name=tag['name'])
            tag_list.append(tag_obj)
        story.tags.set(tag_list)

    @transaction.atomic
    def create(self, validated_data):
        # reels = validated_data.pop('reels', [])
        tags = validated_data.pop('tags', [])
        story = Story.objects.create(**validated_data)
        # self._get_or_create_reels(reels, story)
        self._get_or_create_tags(tags, story)
        return story

    def update(self, instance, validated_data):
        # reels = validated_data.pop('reels', [])

        # if reels is not None:
        #     instance.reels.clear()
        #     self._get_or_create_reels(reels, instance)

        tags = validated_data.pop('tags', None)

        if tags is not None:
            instance.tags.clear()
            self._get_or_create_tags(tags, instance)


        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class StoryCommentSerializer(serializers.ModelSerializer):
    """Serializer for tag objects"""
    
    class Meta:
        model = StoryComment
        fields = "__all__"
        read_only_fields = ('id',)

class ReelCommentSerializer(serializers.ModelSerializer):
    """Serializer for tag objects"""

    class Meta:
        model = ReelComment
        fields = "__all__"
        read_only_fields = ('id',)

class StoryFeedSerializer(serializers.ModelSerializer):
    feedUser = serializers.PrimaryKeyRelatedField(read_only=True)
    feedLikedStory = StorySerializer(many=True, required=False)
    feedLovedStory = StorySerializer(many=True, required=False)
    feedCelebratedStory = StorySerializer(many=True, required=False)
    feedVisitedStory = StorySerializer(many=True, required=False)
    class Meta:
        model = StoryFeed
        fields = "__all__"
        read_only_fields = ('id',)

class ChoiceField(serializers.ChoiceField):

    def to_representation(self, obj):
        if obj == '' and self.allow_blank:
            return obj
        return self._choices[obj]

    def to_internal_value(self, data):
        # To support inserts with the value
        if data == '' and self.allow_blank:
            return ''

        for key, val in self._choices.items():
            if val == data:
                return key
        self.fail('invalid_choice', input=data)
        
class StoryReactionActivitySerializer(serializers.ModelSerializer):
    currentUser = serializers.PrimaryKeyRelatedField(read_only=True)
    donebyUser = serializers.PrimaryKeyRelatedField(read_only=True)
    story = StorySerializer(many=False, required=True)
    action = ChoiceField(choices=StoryReactionActivityFeed.ACTION_CHOICES)
    fullname = serializers.ReadOnlyField()
    class Meta:
        model = StoryReactionActivityFeed
        fields = "__all__"
        read_only_fields = ('id',)

class StoryCommentActivitySerializer(serializers.ModelSerializer):
    commentedOnUser = serializers.PrimaryKeyRelatedField(read_only=True)
    commentByUser = serializers.PrimaryKeyRelatedField(read_only=True)
    story = StorySerializer(many=False, required=True)
    action = ChoiceField(choices=StoryCommentActivityFeed.ACTION_CHOICES)
    fullname = serializers.ReadOnlyField()
    class Meta:
        model = StoryCommentActivityFeed
        fields = "__all__"
        read_only_fields = ('id',)


class ReelFeedSerializer(serializers.ModelSerializer):
    feedUser = serializers.PrimaryKeyRelatedField(read_only=True)
    feedLikedReel = ReelSerializer(many=True, required=False)
    feedLovedReel = ReelSerializer(many=True, required=False)
    feedCelebratedReel = ReelSerializer(many=True, required=False)
    feedVisitedReel = ReelSerializer(many=True, required=False)
    class Meta:
        model = ReelFeed
        fields = "__all__"
        read_only_fields = ('id',)


class ReelReactionActivitySerializer(serializers.ModelSerializer):
    currentUser = serializers.PrimaryKeyRelatedField(read_only=True)
    donebyUser = serializers.PrimaryKeyRelatedField(read_only=True)
    reel = ReelSerializer(many=False, required=True)
    action = ChoiceField(choices=ReelReactionActivityFeed.ACTION_CHOICES)
    fullname = serializers.ReadOnlyField()
    class Meta:
        model = ReelReactionActivityFeed
        fields = "__all__"
        read_only_fields = ('id',)

class ReelCommentActivitySerializer(serializers.ModelSerializer):
    commentedOnUser = serializers.PrimaryKeyRelatedField(read_only=True)
    commentByUser = serializers.PrimaryKeyRelatedField(read_only=True)
    reel = ReelSerializer(many=False, required=True)
    action = ChoiceField(choices=ReelCommentActivityFeed.ACTION_CHOICES)
    fullname = serializers.ReadOnlyField()
    class Meta:
        model = ReelCommentActivityFeed
        fields = "__all__"
        read_only_fields = ('id',)

class FriendStoryActivitySerializer(serializers.ModelSerializer):
    ownerUser = UserSerializer(many=False, read_only=True)
    forUser = UserSerializer(many=True, required=False)
    story = StorySerializer(many=False, required=True)
    action = ChoiceField(choices=FriendStoryActivityFeed.ACTION_CHOICES)
    # fullname = serializers.ReadOnlyField()

    class Meta:
        model = FriendStoryActivityFeed
        fields = "__all__"
        read_only_fields = ('id',)

class FriendReelActivitySerializer(serializers.ModelSerializer):
    ownerUser = UserSerializer(many=False, read_only=True)
    forUser = UserSerializer(many=True, required=False)
    reel = ReelSerializer(many=False, required=True)
    action = ChoiceField(choices=FriendReelActivityFeed.ACTION_CHOICES)
    # fullname = serializers.ReadOnlyField()

    class Meta:
        model = FriendReelActivityFeed
        fields = "__all__"
        read_only_fields = ('id',)
