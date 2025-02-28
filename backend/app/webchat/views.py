from rest_framework import viewsets, generics
from rest_framework.response import Response
from core.models import Story, Reel, Chatroom, User, Conversation
from .serializer import ChatroomSerializer, MessageSerializer
from rest_framework.permissions import IsAuthenticated
from user.authentication import JWTCookieAuthentication
from django.shortcuts import get_object_or_404
import json,uuid
from rest_framework import status
from rest_framework.decorators import action
import logging
from django.http import JsonResponse
logger = logging.getLogger(__name__)
# Create your views here.
class ChatroomMemebershipViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTCookieAuthentication,]

    def create(self, request, chatroom_id):
        chatroom = get_object_or_404(Chatroom, id=chatroom_id)
        conversation = Conversation.objects.get(chatroom_id=chatroom_id)
        user = request.user

        if chatroom.participants.filter(id=user.id).exists():
            return Response({"error": "User is already a member"}, status=status.HTTP_409_CONFLICT)

        chatroom.participants.add(user)
        conversation.chatroom_participants.add(user)
        return Response({"message": "User joined Chatroom successfully"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["DELETE"])
    def remove_member(self, request, chatroom_id):
        chatroom = get_object_or_404(Chatroom, id=chatroom_id)
        user = request.user
        conversation = Conversation.objects.get(chatroom_id=chatroom_id)
        if not chatroom.participants.filter(id=user.id).exists():
            return Response({"error": "User is not a member"}, status=status.HTTP_404_NOT_FOUND)

        if chatroom.owner == user:
            return Response({"error": "Owners cannot be removed as a member"}, status=status.HTTP_409_CONFLICT)
    
        if chatroom.story:
            if chatroom.story.owner == user:
                return Response({"error": "Chatroom Story Owner cannot be removed as a member"}, status=status.HTTP_409_CONFLICT)

        if chatroom.reel:
            if chatroom.reel.reel_owner == user:
                return Response({"error": "Chatroom Reel Owner cannot be removed as a member"}, status=status.HTTP_409_CONFLICT)    

        chatroom.participants.remove(user)
        conversation.chatroom_participants.remove(user)
        return Response({"message": "User removed from Chatroom..."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["GET"])
    def is_member(self, request, chatroom_id=None):
        chatroom = get_object_or_404(Chatroom, id=chatroom_id)
        user = request.user
        is_member = chatroom.participants.filter(id=user.id).exists()
        return Response({"is_member": is_member})
    
class ChatroomViewSet(viewsets.ModelViewSet):
    """View for manage recipe APIs."""
    serializer_class = ChatroomSerializer
    queryset = Chatroom.objects.all()
    permission_classes = [IsAuthenticated,]
    authentication_classes = (JWTCookieAuthentication,)

    def get_queryset(self):
        return self.queryset.order_by('-created_at').distinct()

    def get_obj(self, id):
        obj = get_object_or_404(Chatroom, id=id)
        return obj
    
    def perform_create(self, serializer):
        chatroom_instance = serializer.save()
        return chatroom_instance.id  # Return the id of the created reel

    def create(self, request, *args, **kwargs):
        data = request.data.copy()  # Create a mutable copy of request.data
        story_data = data.pop('story', [])
        reel_data = data.pop('reel', [])
        participant_data = data.pop('participants', [])
        data["owner"] = self.request.user.id
        serialized_data = json.dumps(data)
        serializer = self.get_serializer(data=json.loads(serialized_data))
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        chatroom_id = serializer.instance.id
        chatroom = Chatroom.objects.get(id=chatroom_id)
        participants_ids = []
        for participant_item in participant_data:
            participants_ids.append(participant_item)
        chatroom_participants = User.objects.filter(id__in=participants_ids)
        chatroom.participants.set(chatroom_participants)

        conversation = Conversation.objects.create(chatroom_id=chatroom_id)
        conversation.chatroom_owner_id = self.request.user.id
        conversation.chatroom_participants.set(chatroom_participants)
        

        story_id = uuid.UUID(story_data) if story_data else None
        if story_id:
            story = get_object_or_404(Story, id=story_id)
            chatroom.story = story
            story.story_conversation.add(conversation)
            conversation.chatroom_object_id = story_id
            story.save()
        reel_id = uuid.UUID(reel_data) if reel_data else None
        if reel_id:
            reel = get_object_or_404(Reel, id=reel_id)
            chatroom.reel = reel       
            reel.reel_conversation.add(conversation)
            conversation.chatroom_object_id = reel_id
            reel.save()

        conversation.save()
        chatroom.save()
        
        headers = self.get_success_headers(serializer.data)
        return Response({'id': chatroom_id}, status=status.HTTP_201_CREATED, headers=headers)
    
    
    def delete(self, request, chatroom_id):
        chatroom = get_object_or_404(Chatroom,id=chatroom_id)   
               
        if chatroom.owner == self.request.user:
            chatroom.delete()
            return Response({"message":"Chatroom Deleted!"},status=status.HTTP_202_ACCEPTED)
        else:
            return Response({"error": "Only Owners can delete chatrooms"}, status=status.HTTP_304_NOT_MODIFIED)
  
    
class MessageViewset(viewsets.ViewSet):
    permission_classes = [IsAuthenticated,]
    authentication_classes = (JWTCookieAuthentication,)

    def list(self,request,*args,**kwargs):
        chatroom_id = request.query_params.get("chatroom_id")
        try:
            conversation = Conversation.objects.get(chatroom_id=chatroom_id)              
            message = conversation.message.all().order_by("-timestamp")
            serializer = MessageSerializer(message,many=True)
            return Response(serializer.data)
        except Conversation.DoesNotExist:
            return Response([])
        

def get_chatroom_status_view(request,*args,**kwargs):
    # Assuming you have a URL parameter 'conversation_id' to identify the Conversation instance
    conversation_id = kwargs.get('conversation_id')
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        chatroom_status = conversation.get_chatroom_status()
        return JsonResponse({'chatroom_status': chatroom_status})
    except:
        return JsonResponse({'chatroom_status': False})
    

    # You can now use chatroom_status as needed, for example, return it as JSON
    