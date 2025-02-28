from rest_framework import serializers
from core.models import Chatroom, Message,Conversation
from user.serializers import UserSerializer

class ChatroomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True,read_only=True)
    class Meta:
        model = Chatroom
        fields = "__all__"
        read_only_fields = ['id']


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField
    class Meta:
        model = Message
        fields = ["id","sender","content","timestamp"]
        read_only_fields = ['id']

class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = "__all__"
        read_only_fields = ['id']

