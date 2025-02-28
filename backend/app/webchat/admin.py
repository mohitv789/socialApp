from django.contrib import admin
from core.models import Chatroom,Conversation,Message
# Register your models here.

admin.site.register(Chatroom)
admin.site.register(Conversation)
admin.site.register(Message)
