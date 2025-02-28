from channels.generic.websocket import WebsocketConsumer
import json
from asgiref.sync import async_to_sync
from core.models import Conversation,Chatroom,Message,Story,Reel
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class WebChatConsumer(WebsocketConsumer):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.chatroom_id = None
        self.user = None

    def connect(self):
        self.user = self.scope["user"]
        self.accept()

        if not self.user.is_authenticated:
            self.close(code=4001)
        
        self.chatroom_id = self.scope["url_route"]["kwargs"]["chatroom_id"]
        self.room_group_name = "chat_%s" % self.chatroom_id

        self.user = User.objects.get(id=self.user.id)
        try:
            chatroom = Chatroom.objects.get(id=self.chatroom_id)
            self.is_member = chatroom.participants.filter(id=self.user.id).exists()
            async_to_sync(self.channel_layer.group_add)(self.room_group_name, self.channel_name)
        except:
            self.is_member = False
            self.disconnect(close_code="4001")

        

    def receive(self, text_data):
        if not self.is_member:
            return
        chatroom_id = self.chatroom_id
        
        sender = self.user
        message = text_data
        conversation = Conversation.objects.get(chatroom_id=chatroom_id)
        logger.info(f"Conversation Object for {chatroom_id} returned by {self.user.first_name}!")

        new_message = Message.objects.create(conversation=conversation,sender=sender,content=message)
        data = {
            'type':'chat.message',
            'new_message': {
                "content": json.loads(text_data)["content"],
                "id": new_message.id,
                "sender": new_message.sender.id,
                "content": new_message.content,
                "timestamp": new_message.timestamp.isoformat()
            }
        }
        print("data: ",data)
        async_to_sync(self.channel_layer.group_send)(self.room_group_name,data)

    def chat_message(self,event):
        message = json.dumps(event)
        self.send(message)

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(self.room_group_name,self.channel_name)
        super().disconnect(close_code)