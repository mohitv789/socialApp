import binascii
import json
import logging
from django.http import HttpResponse
from django.core.files.uploadedfile import InMemoryUploadedFile
from core.models import PromotedToWallModel,Reel, Story, StoryComment, ReelComment, StoryFeed,StoryReactionActivityFeed,ReelReactionActivityFeed, User, Friend, StoryCommentActivityFeed, ReelCommentActivityFeed, ReelFeed, FriendStoryActivityFeed, FriendReelActivityFeed, ImageModel
from rest_framework import viewsets
from rest_framework import status, mixins
from rest_framework.response import Response
from .serializers import ReelSerializer, StoryCommentSerializer, StorySerializer, ImageModelSerializer,ReelCommentSerializer, ReelImageSerializer, StoryImageSerializer, StoryFeedSerializer,StoryReactionActivitySerializer,ReelReactionActivitySerializer, StoryCommentActivitySerializer, ReelCommentActivitySerializer, ReelFeedSerializer, FriendStoryActivitySerializer, FriendReelActivitySerializer
from rest_framework import status
from rest_framework.response import Response
from rest_framework import viewsets
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from .permissions import IsOwnerOrReadOnly,IsReelOwnerOrReadOnly, IsCommentOwnerOrReadOnly
from rest_framework.views import APIView
from rest_framework.decorators import action
import json
import base64
from django.core.files.base import ContentFile
import base64
from PIL import Image
import io
from user.authentication import JWTCookieAuthentication


logger = logging.getLogger(__name__)


def is_base64_image(input_data):
    try:
        decoded_data = base64.b64decode(input_data)
        image = Image.open(io.BytesIO(decoded_data))
        # Perform additional checks or custom logic here
        # For example, check image dimensions, format, etc.
        return True
    except (binascii.Error, IOError) as e:
        # Handle the exception and run custom logic
        print("Error:", e)
        # Perform custom error handling or actions here
        return False

class ReelViewSet(viewsets.ModelViewSet):
    """View for manage recipe APIs."""
    serializer_class = ReelSerializer
    queryset = Reel.objects.all()
    permission_classes = [IsAuthenticated,IsReelOwnerOrReadOnly]
    authentication_classes = (JWTCookieAuthentication,)
    def _params_to_ints(self, qs):
        """Convert a list of strings to integers."""
        return [int(str_id) for str_id in qs.split(',')]
    

    def get_queryset(self):
        queryset = self.queryset
        return queryset.filter(reel_owner=self.request.user).order_by('-updated_at').distinct()
    

    def get_obj(self, id):
        obj = get_object_or_404(Reel, pk=id)
        return obj
    
    
    def get_serializer_class(self):
        """Return appropriate serializer class"""
        if self.action == 'retrieve':
            return ReelSerializer
        elif self.action == 'upload_image':
            return ReelImageSerializer
        return self.serializer_class
    
    # def perform_create(self, request):
    #     print(request.data, flush=True)
    #     serialized = self.serializer_class(data=request.data)
    #     if serialized.is_valid():
    #         reel_instance = serialized.save()
    #         return Response({'id': reel_instance.id},status=status.HTTP_201_CREATED)
    #     else:
    #         return Response(self.serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def perform_create(self, serializer):
        reel_instance = serializer.save()
        logger.info(f"Reel {serializer.data.get('caption')} created by {self.request.user.first_name}!")
        return reel_instance.id  # Return the id of the created reel

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reel_id = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({'id': reel_id}, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        reel_id = serializer.instance.id
        headers = self.get_success_headers(serializer.data)
        return Response({'id': reel_id}, status=status.HTTP_202_ACCEPTED, headers=headers)
    
    # @action(detail=True, methods=['GET'], name='Get Base64 Encoded Image')
    # def get_base64_encoded_image(self, request, pk=None):
    #     try:
    #         instance = Reel.objects.get(pk=pk)
    #     except Reel.DoesNotExist:
    #         return Response({'error': 'Instance not found.'}, status=404)

    #     with open(instance.image_field.path, 'rb') as image_file:
    #         # Read binary image data
    #         binary_data = image_file.read()

    #     # Encode binary data to base64
    #     base64_encoded = base64.b64encode(binary_data).decode('utf-8')

    #     # Return the base64 encoded string in the API response
    #     return Response({'base64_encoded_image': base64_encoded})
    
    @action(methods=['POST'], detail=True, url_path='upload-image', permission_classes=[IsAuthenticated])
    def upload_image(self, request, pk=None):
        """Upload an image to a recipe"""
        reel = self.get_object()
        serializer = self.get_serializer(
            reel,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            try:
                imgObj = get_object_or_404(ImageModel,linked_to="reels",linked_id=reel.id)
                imgObj.image_data = serializer.instance.image.url
                imgObj.save()
                
            except:
                imgObj = ImageModel.objects.create(linked_to="reels",linked_id=reel.id, owner=self.request.user,image_data=serializer.instance.image.url)
                imgObj.save()
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(methods=['PUT'], detail=True, url_path='edit-image', permission_classes=[IsAuthenticated])
    def edit_image(self, request, pk=None):
        image_data_url = request.data.get('image')
        data = request.data.copy()
        # Decode the data URL and save the image
        
        format, image_data = image_data_url.split(';base64,')  # Remove the data URL prefix
        
        binary_image = ContentFile(base64.b64decode(image_data))  
        # binary_image = base64.b64decode(image_data)
        image_file = InMemoryUploadedFile(
            binary_image,
            None,  # Field name (unused)
            'image.png',  # File name
            'image/png',  # Content type
            binary_image.size,
            None  # Content type extra headers (unused)
        )
        data['image'] = image_file
        reel = self.get_object()
        serializer = ReelImageSerializer(
            reel,
            data=data
        )

        if serializer.is_valid():
            serializer.save()
            try:
                imgObj = get_object_or_404(ImageModel,linked_to="reels",linked_id=reel.id)
                imgObj.image_data = serializer.instance.image.url
                imgObj.save()
                
            except:
                imgObj = ImageModel.objects.create(linked_to="reels",linked_id=reel.id, owner=self.request.user,image_data=serializer.instance.image.url)
                imgObj.save()
            
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    

class StoryViewSet(viewsets.ModelViewSet):
    """View for manage recipe APIs."""
    serializer_class = StorySerializer
    queryset = Story.objects.all()
    permission_classes = [IsAuthenticated,IsOwnerOrReadOnly]
    authentication_classes = (JWTCookieAuthentication,)

    def _params_to_ints(self, qs):
        """Convert a list of strings to integers."""
        return [int(str_id) for str_id in qs.split(',')]

    def get_queryset(self):
        queryset = self.queryset
        return queryset.filter(owner=self.request.user).order_by('-updated_at').distinct()

    def get_obj(self, id):
        obj = get_object_or_404(Story, id=id)
        return obj
    
    @action(methods=['GET'], detail=False, url_path='get-reel-story', permission_classes=[IsAuthenticated])
    def get_reel_story(self, request,pk=None, reel_id=None,*args,**kwargs):
        stories = self.queryset
        reel_id = self.request.query_params.get('reel_id').split("/")[0]
        for story in stories:
            for reel in story.reels.all():
                print(reel.id)
                print("param")
                print(reel_id)
                if str(reel.id) == str(reel_id):
                    print("Found")
                    return Response({'reels_story': story.id}, status=status.HTTP_200_OK)
        return Response({'reels_story': "Not Found"}, status=status.HTTP_404_NOT_FOUND)

    def perform_create(self, serializer):
        story_instance = serializer.save()
        logger.info(f"Story {serializer.data.get('title')} created by {self.request.user.first_name}!")
        return story_instance.id  # Return the id of the created reel

    def create(self, request, *args, **kwargs):
        data = request.data.copy()  # Create a mutable copy of request.data
        reels_data = data.pop('reels', [])
        tags_str = data['tags']
        # Remove unwanted characters from the 'tags' string
        tags_str = tags_str.replace("'", '"')  # Replace single quotes with double quotes

        # Attempt to deserialize the 'tags' string
        try:
            tags = json.loads(tags_str)
        except json.JSONDecodeError as e:
            print(f"Error decoding 'tags' field: {e}")
            tags = []

        # Update the data dictionary with the deserialized 'tags' field
        data['tags'] = tags
        serialized_data = json.dumps(data)
        serializer = self.get_serializer(data=json.loads(serialized_data))
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        story_id = serializer.instance.id
        reel_ids = []
        for reel_item in json.loads(reels_data[0]):
            reel_ids.append(reel_item["id"])
        reels = Reel.objects.filter(id__in=reel_ids)
        story = Story.objects.get(id=story_id)
        story.reels.set(reels)
        headers = self.get_success_headers(serializer.data)
        friend_list = Friend.objects.friends(self.request.user)
        s_friendfeed = FriendStoryActivityFeed.objects.create(ownerUser = self.request.user,action = "spub",story_id=story_id)
        for friend in friend_list:
            s_friendfeed.forUser.add(friend)
        s_friendfeed.save()      


        return Response({'id': story_id}, status=status.HTTP_201_CREATED, headers=headers)


        
    
    def update(self, request, *args, **kwargs):
        data = request.data.copy()  # Create a mutable copy of request.data
        reels_data = data.pop('reels', [])

        tags_str = data.pop('tags', '[]')
        print(reels_data,flush=True)
        # Remove unwanted characters from the 'tags' string
        tags_str = tags_str[0].replace("'", '"')  # Replace single quotes with double quotes

        # Attempt to deserialize the 'tags' string
        try:
            tags = json.loads(tags_str)
        except json.JSONDecodeError as e:
            print(f"Error decoding 'tags' field: {e}")
            tags = []

        # Update the data dictionary with the deserialized 'tags' field
        data['tags'] = tags
        serialized_data = json.dumps(data)
        # print(reels_data)
        serializer = self.get_serializer(instance=self.get_object(), data=json.loads(serialized_data))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        story_id = kwargs.get('pk')
        reel_ids = []
        for reel_item in json.loads(reels_data[0]):
            reel_ids.append(reel_item["id"])
        reels = Reel.objects.filter(id__in=reel_ids)
        story = Story.objects.get(id=story_id)
        story.reels.set(reels)
        headers = self.get_success_headers(serializer.data)
        friend_list = Friend.objects.friends(self.request.user)
        try:
            s_friendfeed = FriendStoryActivityFeed.objects.get(ownerUser = self.request.user, story_id=story_id)
            s_friendfeed.action = "sedt"

        except:
            s_friendfeed = FriendStoryActivityFeed.objects.create(ownerUser = self.request.user,action = "sedt",story_id=story_id)

        for friend in friend_list:
            s_friendfeed.forUser.add(friend)
        s_friendfeed.save()      
        return Response({'id': story_id}, status=status.HTTP_201_CREATED, headers=headers)
    
    def get_serializer_class(self):
        """Return appropriate serializer class"""
        if self.action == 'retrieve':
            return StorySerializer
        elif self.action == 'upload_image':
            return StoryImageSerializer
        return self.serializer_class
    
    @action(methods=['POST'], detail=True, url_path='upload-image', permission_classes=[IsAuthenticated])
    def upload_image(self, request, pk=None):
        """Upload an image to a recipe"""
        story = self.get_object()

        serializer = self.get_serializer(
            story,
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            try:
                imgObj = get_object_or_404(ImageModel,linked_to="story",linked_id=story.id)
                imgObj.image_data = serializer.instance.image.url
                imgObj.save()
            except:
                imgObj = ImageModel.objects.create(linked_to="story",linked_id=story.id, owner=self.request.user,image_data=serializer.instance.image.url)
                imgObj.save()
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class StoryCommentViewSet(viewsets.ModelViewSet):
    """View for manage recipe APIs."""
    serializer_class = StoryCommentSerializer
    queryset = StoryComment.objects.all()
    permission_classes = [IsAuthenticated,IsCommentOwnerOrReadOnly]
    authentication_classes = (JWTCookieAuthentication,)
    
    
    def _params_to_ints(self, qs):
        """Convert a list of strings to integers."""
        return [int(str_id) for str_id in qs.split(',')]

    def get_queryset(self):
        queryset = self.queryset
        storyId = self.kwargs['story_id']
        story = get_object_or_404(Story, pk = storyId)
        return queryset.filter(story=story).order_by('-id')
    
    def perform_create(self, serializer):
        comment_instance = serializer.save()
        return comment_instance.id 
    
    def create(self, request,*args, **kwargs):
        commented_by = request.data.get("commented_by")
        commented_by_user = get_object_or_404(User,pk=commented_by)
        story_id = self.kwargs['story_id']
        story_owner = get_object_or_404(User, pk = get_object_or_404(Story,pk=story_id).owner.id)
        friendship = Friend.objects.are_friends(story_owner,commented_by_user)
        if friendship:
            serialized = self.serializer_class(data={**request.data,'story': story_id, 'approval': "app"})
        else:
            serialized = self.serializer_class(data={**request.data,'story': story_id, 'approval': "rej"})
        if serialized.is_valid():
            obj_id = self.perform_create(serialized)
            comFeedObj = StoryCommentActivityFeed.objects.create(commentedOnUser=story_owner,commentByUser=commented_by_user,story_id = story_id,action="comm",comment_id = obj_id)
            friend_list = Friend.objects.friends(self.request.user)
            s_friendfeed = FriendStoryActivityFeed.objects.create(ownerUser = self.request.user,action = "scom",story_id=story_id)
            for friend in friend_list:
                s_friendfeed.forUser.add(friend)
            comFeedObj.save()
            s_friendfeed.save()   
            serialized.save()
            return Response(status=status.HTTP_202_ACCEPTED)
        else:
            return Response(serialized.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        comment_id = self.kwargs['pk']
        story_id = self.kwargs['story_id']
        story = get_object_or_404(Story, pk = story_id)
        instance = get_object_or_404(StoryComment,story=story, pk = comment_id)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            comFeedObj = StoryCommentActivityFeed.objects.get(comment_id=comment_id)
            comFeedObj.action = "ecom"
            comFeedObj.save()
        except:
            print("Failed")

        self.perform_update(serializer)
        friend_list = Friend.objects.friends(self.request.user)
        try:
            s_friendfeed = FriendStoryActivityFeed.objects.get(ownerUser = self.request.user, story_id=story_id)
            s_friendfeed.action = "secm"

        except:
            s_friendfeed = FriendStoryActivityFeed.objects.create(ownerUser = self.request.user,action = "sedt",story_id=story_id)

        for friend in friend_list:
            s_friendfeed.forUser.add(friend)
        s_friendfeed.save()  

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ReelCommentViewSet(viewsets.ModelViewSet):
    """View for manage recipe APIs."""
    serializer_class = ReelCommentSerializer
    queryset = ReelComment.objects.all()
    permission_classes = [IsAuthenticated,IsCommentOwnerOrReadOnly]
    authentication_classes = (JWTCookieAuthentication,)   
    lookup_field = 'reel_id'
    def _params_to_ints(self, qs):
        """Convert a list of strings to integers."""
        return [int(str_id) for str_id in qs.split(',')]

    def get_queryset(self):
        queryset = self.queryset
        reelId = self.kwargs['reel_id']
        return queryset.filter(reel=reelId).order_by('-id')
    
    def perform_create(self, serializer):
        comment_instance = serializer.save()
        return comment_instance.id 
    
    def create(self, request,*args, **kwargs):
        commented_by = request.data.get("commented_by")
        commented_by_user = get_object_or_404(User,pk=commented_by)
        reel_id = self.kwargs['reel_id']
        reel_owner = get_object_or_404(User, pk = get_object_or_404(Reel,pk=reel_id).reel_owner.id)
        friendship = Friend.objects.are_friends(reel_owner,commented_by_user)
        if friendship:
            serialized = self.serializer_class(data={**request.data,'reel': reel_id, 'approval': "app"})
        else:
            serialized = self.serializer_class(data={**request.data,'reel': reel_id, 'approval': "rej"})
        if serialized.is_valid():

            obj_id = self.perform_create(serialized)
            comFeedObj = ReelCommentActivityFeed.objects.create(commentedOnUser=reel_owner,commentByUser=commented_by_user,reel_id = reel_id,action="comm",comment_id = obj_id)
            friend_list = Friend.objects.friends(self.request.user)
            r_friendfeed = FriendReelActivityFeed.objects.create(ownerUser = self.request.user,action = "rcom",reel_id=reel_id)
            for friend in friend_list:
                r_friendfeed.forUser.add(friend)
            r_friendfeed.save()  
            comFeedObj.save()
            serialized.save()
            return Response(status=status.HTTP_202_ACCEPTED)
        else:
            return Response(self.serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        comment_id = kwargs.get('pk')
        reel_id = kwargs.get('reel_id')
        instance = get_object_or_404(ReelComment,pk = comment_id)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            comFeedObj = ReelCommentActivityFeed.objects.get(comment_id=comment_id)
            comFeedObj.action = "ecom"
            comFeedObj.save()
        except:
            print("Failed")

        self.perform_update(serializer)
        friend_list = Friend.objects.friends(self.request.user)
        try:
            r_friendfeed = FriendReelActivityFeed.objects.get(ownerUser = self.request.user, reel_id=reel_id)
            r_friendfeed.action = "recm"

        except:
            r_friendfeed = FriendReelActivityFeed.objects.create(ownerUser = self.request.user,action = "sedt",reel_id=reel_id)

        for friend in friend_list:
            r_friendfeed.forUser.add(friend)
        r_friendfeed.save()  

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}
        return Response(serializer.data, status=status.HTTP_200_OK)

class StoryLikeAPIView(APIView):
    """Allow users to add/remove a like to/from an answer instance."""

    serializer_class = StorySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    def delete(self, request, storyId):
        """Remove request.user from the voters queryset of an answer instance."""
        story = get_object_or_404(Story, id=storyId)
        user = request.user
        story.likes.remove(user)
        story.save()

        try:
            feedObj = get_object_or_404(StoryFeed, feedUser=user)
            for feedobject_sliked in feedObj.feedLikedStory.all():
                if str(feedobject_sliked.id) == str(story.id):
                    feedObj.feedLikedStory.remove(storyId)
                    feedObj.save()
                else:
                    pass
            
        except:
            pass

        try:
            activityObj = get_object_or_404(StoryReactionActivityFeed,doneByUser = user,story=story,currentUser=story.owner,action="lik")
            activityObj.action = "ulk"
            activityObj.save()
                
        except:
            pass

        try:
            s_friendfeed = get_object_or_404(FriendStoryActivityFeed,ownerUser = self.request.user,story_id=storyId)
            s_friendfeed.action = "sulk"
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                s_friendfeed.forUser.add(friend)
            s_friendfeed.save()  
                
        except:
            pass

        serializer_context = {"request": request}
        serializer = self.serializer_class(story, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, storyId):
        """Add request.user to the voters queryset of an answer instance."""
        story = get_object_or_404(Story, id=storyId)
        user = request.user
        story.likes.add(user)
        story.save()
        try:
            feedObj = get_object_or_404(StoryFeed, feedUser=user)
            if len(feedObj.feedLikedStory.all()) > 0:
                for feedobj_sliked in feedObj.feedLikedStory.all():
                    if str(feedobj_sliked.id) == str(story.id):
                        pass
                    else:
                        feedObj.feedLikedStory.add(story)
                        feedObj.save()
            else:
                feedObj.feedLikedStory.add(story)
                feedObj.save()   

        except:
            feedObj = StoryFeed.objects.create(feedUser = user)
            feedObj.feedLikedStory.add(story)
            feedObj.save()
        
        try:
            activityObj = get_object_or_404(StoryReactionActivityFeed,doneByUser = user,story=story,currentUser=story.owner,action="lik")                
        except:
            activityObj = StoryReactionActivityFeed.objects.create(currentUser = story.owner, doneByUser = self.request.user, story=story, action = "lik")
            activityObj.save()
        
        try:
            s_friendfeed = get_object_or_404(FriendStoryActivityFeed,ownerUser = self.request.user,story_id=storyId,action="slik")                
        except:
            s_friendfeed = FriendStoryActivityFeed.objects.create(ownerUser = self.request.user,story_id=storyId,action="slik")
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                s_friendfeed.forUser.add(friend)
            s_friendfeed.save()


        serializer_context = {"request": request}
        serializer = self.serializer_class(story, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ReelLikeAPIView(APIView):
    """Allow users to add/remove a like to/from an answer instance."""

    serializer_class = ReelSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    def delete(self, request, reelId):
        """Remove request.user from the voters queryset of an answer instance."""
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user

        reel.likes.remove(user)
        reel.save()

        try:
            feedObj = get_object_or_404(ReelFeed, feedUser=user)
            for feedobject_rliked in feedObj.feedLikedReel.all():
                if str(feedobject_rliked.id) == str(reel.id):
                    feedObj.feedLikedReel.remove(reelId)
                    feedObj.save()
                else:
                    pass
            
        except:
            pass

        try:
            activityObj = get_object_or_404(ReelReactionActivityFeed,doneByUser = user,reel=reel,currentUser=reel.reel_owner,action="lik")
            activityObj.action = "ulk"
            activityObj.save()
                
        except:
            pass
        
        try:
            r_friendfeed = get_object_or_404(FriendReelActivityFeed,ownerUser = self.request.user,reel_id=reelId)
            r_friendfeed.action = "rulk"
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                r_friendfeed.forUser.add(friend)
            r_friendfeed.save()  
                
        except:
            pass
    
        serializer_context = {"request": request}
        serializer = self.serializer_class(reel, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, reelId):
        """Add request.user to the voters queryset of an answer instance."""
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user

        reel.likes.add(user)
        reel.save()
        try:
            feedObj = get_object_or_404(ReelFeed, feedUser=user)
            
            if len(feedObj.feedLikedReel.all()) > 0:
                for feedobj_rliked in feedObj.feedLikedReel.all():
                    if str(feedobj_rliked.id) == str(reel.id):
                        pass
                    else:
                        feedObj.feedLikedReel.add(reel)
                        feedObj.save()
            else:
                feedObj.feedLikedReel.add(reel)
                feedObj.save()  

        except:
            feedObj = ReelFeed.objects.create(feedUser = user)            
            feedObj.feedLikedReel.add(reel)
            feedObj.save()

        
        try:
            activityObj = get_object_or_404(ReelReactionActivityFeed,doneByUser = user,reel=reel,currentUser=reel.reel_owner,action="lik")                
        except:
            activityObj = ReelReactionActivityFeed.objects.create(currentUser = reel.reel_owner, doneByUser = self.request.user, reel=reel, action = "lik")
            activityObj.save()
        
        try:
            r_friendfeed = get_object_or_404(FriendReelActivityFeed,ownerUser = self.request.user,reel_id=reelId,action="rlik")                
        except:
            r_friendfeed = FriendReelActivityFeed.objects.create(ownerUser = self.request.user,reel_id=reelId,action="rlik")
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                r_friendfeed.forUser.add(friend)
            r_friendfeed.save()
        serializer_context = {"request": request}
        serializer = self.serializer_class(reel, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)


class StoryCelebrateAPIView(APIView):
    """Allow users to add/remove a like to/from an answer instance."""

    serializer_class = StorySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    def delete(self, request, storyId):
        """Remove request.user from the voters queryset of an answer instance."""
        story = get_object_or_404(Story, id=storyId)
        user = request.user

        story.celebrates.remove(user)
        story.save()

        try:
            feedObj = get_object_or_404(StoryFeed, feedUser=user)
            for feedobject_scelebrate in feedObj.feedCelebratedStory.all():
                if str(feedobject_scelebrate.id) == str(story.id):
                    feedObj.feedCelebratedStory.remove(storyId)
                    feedObj.save()
                else:
                    pass
            
        except:
            pass

        try:
            activityObj = get_object_or_404(StoryReactionActivityFeed,doneByUser = user,story=story,currentUser=story.owner,action="cel")
            activityObj.action = "ucl"
            activityObj.save()
                
        except:
            pass

        try:
            s_friendfeed = get_object_or_404(FriendStoryActivityFeed,ownerUser = self.request.user,story_id=storyId)
            s_friendfeed.action = "sucl"
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                s_friendfeed.forUser.add(friend)
            s_friendfeed.save()  
                
        except:
            pass
        serializer_context = {"request": request}
        serializer = self.serializer_class(story, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, storyId):
        """Add request.user to the voters queryset of an answer instance."""
        story = get_object_or_404(Story, id=storyId)
        user = request.user

        story.celebrates.add(user)
        story.save()
        
        try:
            feedObj = get_object_or_404(StoryFeed, feedUser=user)
            
            if len(feedObj.feedCelebratedStory.all()) > 0:
                for feedobj_scelebrate in feedObj.feedCelebratedStory.all():
                    if str(feedobj_scelebrate.id) == str(story.id):
                        pass
                    else:
                        feedObj.feedCelebratedStory.add(story)
                        feedObj.save()
            else:
                feedObj.feedCelebratedStory.add(story)
                feedObj.save()

        except:
            feedObj = StoryFeed.objects.create(feedUser = user)            
            feedObj.feedCelebratedStory.add(story)
            feedObj.save()
        
        try:
            activityObj = get_object_or_404(StoryReactionActivityFeed,doneByUser = user,story=story,currentUser=story.owner,action="cel")                
        except:
            activityObj = StoryReactionActivityFeed.objects.create(currentUser = story.owner, doneByUser = self.request.user, story=story, action = "cel")
            activityObj.save()
        
        try:
            s_friendfeed = get_object_or_404(FriendStoryActivity,ownerUser = self.request.user,story_id=storyId,action="scel")                
        except:
            s_friendfeed = FriendStoryActivityFeed.objects.create(ownerUser = self.request.user,story_id=storyId,action="scel")
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                s_friendfeed.forUser.add(friend)
            s_friendfeed.save()

        serializer_context = {"request": request}
        serializer = self.serializer_class(story, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ReelCelebrateAPIView(APIView):
    """Allow users to add/remove a like to/from an answer instance."""

    serializer_class = ReelSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    def delete(self, request, reelId):
        """Remove request.user from the voters queryset of an answer instance."""
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user

        reel.celebrates.remove(user)
        reel.save()
        try:
            feedObj = get_object_or_404(ReelFeed, feedUser=user)
            for feedobject_rcelebrate in feedObj.feedCelebratedReel.all():
                if str(feedobject_rcelebrate.id) == str(reel.id):
                    feedObj.feedCelebratedReel.remove(reelId)
                    feedObj.save()
                else:
                    pass
           
        except:
            pass

        try:
            activityObj = get_object_or_404(ReelReactionActivityFeed,doneByUser = user,reel=reel,currentUser=reel.reel_owner,action="cel")
            activityObj.action = "ucl"
            activityObj.save()
                
        except:
            pass

        try:
            r_friendfeed = get_object_or_404(FriendReelActivityFeed,ownerUser = self.request.user,reel_id=reelId)
            r_friendfeed.action = "rucl"
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                r_friendfeed.forUser.add(friend)
            r_friendfeed.save()  
                
        except:
            pass
        serializer_context = {"request": request}
        serializer = self.serializer_class(reel, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, reelId):
        """Add request.user to the voters queryset of an answer instance."""
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user

        reel.celebrates.add(user)
        reel.save()
        
        try:
            feedObj = get_object_or_404(ReelFeed, feedUser=user)
            
            if len(feedObj.feedCelebratedReel.all()) > 0:
                for feedobj_rcelebrate in feedObj.feedCelebratedReel.all():
                    if str(feedobj_rcelebrate.id) == str(reel.id):
                        pass
                    else:
                        feedObj.feedCelebratedReel.add(reel)
                        feedObj.save()
            else:
                feedObj.feedCelebratedReel.add(reel)
                feedObj.save()

        except:
            feedObj = ReelFeed.objects.create(feedUser = user)            
            feedObj.feedCelebratedReel.add(reel)
            feedObj.save()
        
        try:
            activityObj = get_object_or_404(ReelReactionActivityFeed,doneByUser = user,reel=reel,currentUser=reel.reel_owner,action="cel")                
        except:
            activityObj = ReelReactionActivityFeed.objects.create(currentUser = reel.reel_owner, doneByUser = self.request.user, reel=reel, action = "cel")
            activityObj.save()
        
        try:
            r_friendfeed = get_object_or_404(FriendReelActivityFeed,ownerUser = self.request.user,reel_id=reelId,action="rcel")                
        except:
            r_friendfeed = FriendReelActivityFeed.objects.create(ownerUser = self.request.user,reel_id=reelId,action="rcel")
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                r_friendfeed.forUser.add(friend)
            r_friendfeed.save()
        serializer_context = {"request": request}
        serializer = self.serializer_class(reel, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)

class StoryLoveAPIView(APIView):
    """Allow users to add/remove a like to/from an answer instance."""

    serializer_class = StorySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    def delete(self, request, storyId):
        """Remove request.user from the voters queryset of an answer instance."""
        story = get_object_or_404(Story, id=storyId)
        user = request.user

        story.loves.remove(user)
        story.save()
        try:
            feedObj = get_object_or_404(StoryFeed, feedUser=user)
            for feedobject_slove in feedObj.feedLovedStory.all():
                if str(feedobject_slove.id) == str(story.id):
                    feedObj.feedLovedStory.remove(storyId)
                    feedObj.save()
                else:
                    pass
            
        except:
            pass
        try:
            activityObj = get_object_or_404(StoryReactionActivityFeed,doneByUser = user,story=story,currentUser=story.owner,action="lov")
            activityObj.action = "sulo"
            activityObj.save()
                
        except:
            pass
    
        try:
            s_friendfeed = get_object_or_404(FriendStoryActivityFeed,ownerUser = self.request.user,story_id=storyId)
            s_friendfeed.action = "sulo"
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                s_friendfeed.forUser.add(friend)
            s_friendfeed.save()  
                
        except:
            pass
        serializer_context = {"request": request}
        serializer = self.serializer_class(story, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, storyId):
        """Add request.user to the voters queryset of an answer instance."""
        story = get_object_or_404(Story, id=storyId)
        user = request.user

        story.loves.add(user)
        story.save()
        try:
            feedObj = get_object_or_404(StoryFeed, feedUser=user)
            
            if len(feedObj.feedLovedStory.all()) > 0:
                for feedobj_slove in feedObj.feedLovedStory.all():
                    if str(feedobj_slove.id) == str(story.id):
                        pass
                    else:
                        feedObj.feedLovedStory.add(story)
                        feedObj.save()
            else:
                feedObj.feedLovedStory.add(story)
                feedObj.save()

        except:
            feedObj = StoryFeed.objects.create(feedUser = user)            
            feedObj.feedLovedStory.add(story)
            feedObj.save()

        try:
            activityObj = get_object_or_404(StoryReactionActivityFeed,doneByUser = user,story=story,currentUser=story.owner,action="lov")                
        except:
            activityObj = StoryReactionActivityFeed.objects.create(currentUser = story.owner, doneByUser = self.request.user, story=story, action = "lov")
            activityObj.save()
        
        try:
            s_friendfeed = get_object_or_404(FriendStoryActivity,ownerUser = self.request.user,story_id=storyId,action="slov")                
        except:
            s_friendfeed = FriendStoryActivityFeed.objects.create(ownerUser = self.request.user,story_id=storyId,action="slov")
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                s_friendfeed.forUser.add(friend)
            s_friendfeed.save()
        serializer_context = {"request": request}
        serializer = self.serializer_class(story, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ReelLoveAPIView(APIView):
    """Allow users to add/remove a like to/from an answer instance."""

    serializer_class = ReelSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    def delete(self, request, reelId):
        """Remove request.user from the voters queryset of an answer instance."""
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user

        reel.loves.remove(user)
        reel.save()
        try:
            feedObj = get_object_or_404(ReelFeed, feedUser=user)
            for feedobject_rlove in feedObj.feedLovedReel.all():
                if str(feedobject_rlove.id) == str(reel.id):
                    feedObj.feedLovedReel.remove(reelId)
                    feedObj.save()
                else:
                    pass            
        except:
            pass
        try:
            activityObj = get_object_or_404(StoryReactionActivityFeed,doneByUser = user,reel=reel,currentUser=reel.reel_owner,action="lov")
            activityObj.action = "ulv"
            activityObj.save()
                
        except:
            pass
    
        try:
            r_friendfeed = get_object_or_404(FriendReelActivityFeed,ownerUser = self.request.user,reel_id=reelId)
            r_friendfeed.action = "rulo"
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                r_friendfeed.forUser.add(friend)
            r_friendfeed.save()  
                
        except:
            pass
        serializer_context = {"request": request}
        serializer = self.serializer_class(reel, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, reelId):
        """Add request.user to the voters queryset of an answer instance."""
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user

        reel.loves.add(user)
        reel.save()
        try:
            feedObj = get_object_or_404(ReelFeed, feedUser=user)
            
            if len(feedObj.feedLovedReel.all()) > 0:
                for feedobj_rlove in feedObj.feedLovedReel.all():
                    if feedobj_rlove.id == reel.id:
                        pass
                    else:
                        feedObj.feedLovedReel.add(reel)
                        feedObj.save()
            else:
                feedObj.feedLovedReel.add(reel)
                feedObj.save()

        except:
            feedObj = ReelFeed.objects.create(feedUser = user)
            feedObj.feedLovedReel.add(reel)
            feedObj.save()
        try:
            activityObj = get_object_or_404(ReelReactionActivityFeed,doneByUser = user,reel=reel,currentUser=reel.reel_owner,action="lov")                
        except:
            activityObj = ReelReactionActivityFeed.objects.create(currentUser = reel.reel_owner, doneByUser = self.request.user, reel=reel, action = "lov")
            activityObj.save()
        
        try:
            r_friendfeed = get_object_or_404(FriendReelActivityFeed,ownerUser = self.request.user,reel_id=reelId,action="rlov")                
        except:
            r_friendfeed = FriendReelActivityFeed.objects.create(ownerUser = self.request.user,reel_id=reelId,action="rlov")
            friend_list = Friend.objects.friends(self.request.user)
            for friend in friend_list:
                r_friendfeed.forUser.add(friend)
            r_friendfeed.save()
        serializer_context = {"request": request}
        serializer = self.serializer_class(reel, context=serializer_context)

        return Response(serializer.data, status=status.HTTP_200_OK)
    

class UserStoryFeed(APIView):
    serializer_class = StoryFeedSerializer
    queryset = StoryFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self,request):
        queryset = self.queryset.filter(feedUser=request.user)
        
        
        liked_stories = []
        loved_stories = []
        celebrated_stories = []
        visited_stories = []
        if queryset.count() != 0 and queryset.count() < 10:
            feed = queryset
            # print((feed[0].feedLikedStory.all())[0].id)
            for item in feed:
                for data1 in item.feedLikedStory.all():
                    liked_stories.append(data1.id)
                for data2 in item.feedLovedStory.all():
                    loved_stories.append(data2.id)
                for data3 in item.feedCelebratedStory.all():
                    celebrated_stories.append(data3.id)
                for data4 in item.feedVisitedStory.all():
                    user_wall = PromotedToWallModel.objects.filter(content_id=data4.id,for_user=request.user).first()
                    if user_wall:
                        
                        user_wall.content_type == "story"
                        user_wall.title = data4.title
                        user_wall.save()
                    else:
                        PromotedToWallModel.objects.create(
                            for_user=request.user,  # Assuming the primary key should match the user ID
                            content_id=data4.id,
                            content_type="story"
                        )
                    visited_stories.append(data4.id)
                if len(liked_stories+loved_stories+celebrated_stories+visited_stories) == 0:
                    item.delete()
            feed_ids = liked_stories + loved_stories + celebrated_stories + visited_stories
            feed_stories = Story.objects.filter(id__in = feed_ids)
            feed_stories = feed_stories.union(Story.objects.exclude(owner=request.user)).order_by('-updated_at')
            story_data = StorySerializer(feed_stories,many=True).data
            comment_data = []
            for story_feed_item in story_data:            
                for key, value in story_feed_item.items():
                    if key == "id":
                        story_item = get_object_or_404(Story,pk=value)
                        story_comment_num = story_item.comments.all().count()
                        comment_object = {
                            "story_id": value,
                            "num_comments": story_comment_num
                        }

                        comment_data.append(comment_object)
            
            response_data = {
                "feed_stories":story_data,
                "feed_stories_comments":comment_data
            }
             
            return Response(response_data, status=status.HTTP_200_OK)
        elif queryset.count() > 10:
            feed = queryset
            # print((feed[0].feedLikedStory.all())[0].id)
            for item in feed:
                for data1 in item.feedLikedStory.all():
                    liked_stories.append(data1.id)
                for data2 in item.feedLovedStory.all():
                    loved_stories.append(data2.id)
                for data3 in item.feedCelebratedStory.all():
                    celebrated_stories.append(data3.id)
                for data4 in item.feedVisitedStory.all():
                    user_wall = PromotedToWallModel.objects.filter(content_id=data4.id,for_user=request.user).first()
                    if user_wall:
                        user_wall.content_type == "story"

                        user_wall.title = data4.title
                        user_wall.save()
                    else:
                        PromotedToWallModel.objects.create(
                            for_user=request.user,  # Assuming the primary key should match the user ID
                            content_id=data4.id,
                            content_type="story"
                        )
                    visited_stories.append(data4.id)
                if len(liked_stories+loved_stories+celebrated_stories+visited_stories) == 0:
                    item.delete()
            feed_ids = liked_stories + loved_stories + celebrated_stories + visited_stories
            feed_stories = Story.objects.filter(id__in = feed_ids).order_by('-updated_at').distinct()
            story_data = StorySerializer(feed_stories,many=True).data
            comment_data = []
            for story_feed_item in story_data:            
                for key, value in story_feed_item.items():
                    if key == "id":
                        story_item = get_object_or_404(Story,pk=value)
                        story_comment_num = story_item.comments.all().count()
                        comment_object = {
                            "story_id": value,
                            "num_comments": story_comment_num
                        }
                        comment_data.append(comment_object)
            
            response_data = {
                "feed_stories":story_data,
                "feed_stories_comments":comment_data
            }
             
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            feed_stories = Story.objects.exclude(owner=request.user).order_by('-updated_at').distinct()
            story_data = StorySerializer(feed_stories,many=True).data
            comment_data = []
            for story_feed_item in story_data:            
                for key, value in story_feed_item.items():
                    if key == "id":
                        story_item = get_object_or_404(Story,pk=value)
                        story_comment_num = story_item.comments.all().count()
                        comment_object = {
                            "story_id": value,
                            "num_comments": story_comment_num
                        }
                        comment_data.append(comment_object)
            
            response_data = {
                "feed_stories":story_data,
                "feed_stories_comments":comment_data
            }
             
            return Response(response_data, status=status.HTTP_200_OK)

class UserReelFeed(APIView):
    serializer_class = ReelFeedSerializer
    queryset = ReelFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self,request):
        queryset = self.queryset.filter(feedUser=request.user)

        liked_reels = []
        loved_reels = []
        celebrated_reels = []
        visited_reels = []
        if queryset.count() != 0 and queryset.count() < 10:
            feed = queryset
            # print((feed[0].feedLikedStory.all())[0].id)
            for item in feed:
                for data1 in item.feedLikedReel.all():
                    liked_reels.append(data1.id)
                for data2 in item.feedLovedReel.all():
                    loved_reels.append(data2.id)
                for data3 in item.feedCelebratedReel.all():
                    celebrated_reels.append(data3.id)
                for data4 in item.feedVisitedReel.all():
                    print(data4)
                    user_wall = PromotedToWallModel.objects.filter(content_id=data4.id,for_user=request.user).first()
                    if user_wall:
                        user_wall.content_type == "reel"
                        user_wall.title = data4.caption
                        user_wall.save()
                    else:
                        PromotedToWallModel.objects.create(
                            for_user=request.user,  # Assuming the primary key should match the user ID
                            content_id=data4.id,
                            content_type="reel"
                        )
                    visited_reels.append(data4.id)
                if len(liked_reels+loved_reels+celebrated_reels+visited_reels) == 0:
                    item.delete()
            feed_ids = liked_reels+loved_reels+celebrated_reels+visited_reels
            feed_reels = Reel.objects.filter(id__in = feed_ids)
            feed_reels = feed_reels.union(Reel.objects.exclude(reel_owner=request.user))
            story_ids = []
            for feed in feed_reels:
                for story in feed.reels.all():
                    story_ids.append(story.id)
            stories = Story.objects.filter(id__in = story_ids).order_by('-updated_at').distinct()
            
            story_data = StorySerializer(stories,many=True).data
            comment_data = []
            for story_feed_item in story_data:            
                for key, value in story_feed_item.items():
                    if key == "id":
                        story_item = get_object_or_404(Story,pk=value)
                        story_comment_num = story_item.comments.all().count()
                        comment_object = {
                            "story_id": value,
                            "num_comments": story_comment_num
                        }
                        comment_data.append(comment_object)
            
            response_data = {
                "feed_stories":story_data,
                "feed_stories_comments":comment_data
            }
             
            return Response(response_data, status=status.HTTP_200_OK)
        elif queryset.count() > 10:
            feed = queryset
            # print((feed[0].feedLikedStory.all())[0].id)
            for item in feed:
                for data1 in item.feedLikedReel.all():
                    liked_reels.append(data1.id)
                for data2 in item.feedLovedReel.all():
                    loved_reels.append(data2.id)
                for data3 in item.feedCelebratedReel.all():
                    celebrated_reels.append(data3.id)
                for data4 in item.feedVisitedReel.all():
                    user_wall = PromotedToWallModel.objects.filter(content_id=data4.id,for_user=request.user).first()
                    if user_wall:
                        user_wall.content_type == "reel"

                        user_wall.title = data4.caption
                        user_wall.save()
                    else:
                        PromotedToWallModel.objects.create(
                            for_user=request.user,  # Assuming the primary key should match the user ID
                            content_id=data4.id,
                            content_type="reel"
                        )
                    visited_reels.append(data4.id)

                if len(liked_reels+loved_reels+celebrated_reels+visited_reels) == 0:
                    item.delete()
            feed_ids = liked_reels+loved_reels+celebrated_reels+visited_reels
            feed_reels = Reel.objects.filter(id__in = feed_ids)
            story_ids = []
            for feed in feed_reels:
                for story in feed.reels.all():
                    story_ids.append(story.id)
            stories = Story.objects.filter(id__in = story_ids).order_by('-updated_at').distinct()
            story_data = StorySerializer(stories,many=True).data
            comment_data = []
            for story_feed_item in story_data:            
                for key, value in story_feed_item.items():
                    if key == "id":
                        story_item = get_object_or_404(Story,pk=value)
                        story_comment_num = story_item.comments.all().count()
                        comment_object = {
                            "story_id": value,
                            "num_comments": story_comment_num
                        }
                        comment_data.append(comment_object)
            
            response_data = {
                "feed_stories":story_data,
                "feed_stories_comments":comment_data
            }
             
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            feed_reels = Reel.objects.exclude(reel_owner=request.user)
            story_ids = []
            for feed in feed_reels:
                for story in feed.reels.all():
                    story_ids.append(story.id)
            stories = Story.objects.filter(id__in = story_ids).order_by('-updated_at').distinct()
            story_data = StorySerializer(stories,many=True).data
            comment_data = []
            for story_feed_item in story_data:            
                for key, value in story_feed_item.items():
                    if key == "id":
                        story_item = get_object_or_404(Story,pk=value)
                        story_comment_num = story_item.comments.all().count()
                        comment_object = {
                            "story_id": value,
                            "num_comments": story_comment_num
                        }
                        user_wall = PromotedToWallModel.objects.filter(content_id=value,pk=request.user.id)
                        comment_data.append(comment_object)
            
            response_data = {
                "feed_stories":story_data,
                "feed_stories_comments":comment_data
            }
             
            return Response(response_data, status=status.HTTP_200_OK)
        

class GetStoryFeedDetailView(mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    def get_object(self,request,id):
        story_obj = get_object_or_404(Story, pk=id)
        print(request.user)
        try:
            feedObj = get_object_or_404(StoryFeed,feedUser=request.user)
            
            if len(feedObj.feedVisitedStory.all()) > 0:
                for storyvisitfeed in feedObj.feedVisitedStory.all():
                    if str(storyvisitfeed.id) == str(story_obj.id):

                        pass
                    else:
                        feedObj.feedVisitedStory.add(story_obj)

                        feedObj.save()
                else:
                    pass                

        except:
            feedObj = StoryFeed.objects.create(feedUser = request.user)
            feedObj.feedVisitedStory.add(story_obj)
            feedObj.save()

        data = StorySerializer(story_obj).data
        return Response(data, status=status.HTTP_200_OK)

class GetReelFeedDetailView(mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    def get_object(self,request,id):
        reel_obj = get_object_or_404(Reel, pk=id)
        try:
            feedObj = get_object_or_404(ReelFeed,feedUser=request.user)
            if len(feedObj.feedVisitedReel.all()) > 0:
                for reelvisitfeed in feedObj.feedVisitedReel.all():
                    if str(reelvisitfeed.id) == str(reel_obj.id):

                        pass
                    else:
                        feedObj.feedVisitedReel.add(reel_obj)

                        feedObj.save()
            else:
                pass                

        except:
            feedObj = ReelFeed.objects.create(feedUser = request.user)
            feedObj.feedVisitedReel.add(reel_obj)
            feedObj.save()
        data = ReelSerializer(reel_obj).data
        return Response(data, status=status.HTTP_200_OK)
    
class reactionsOnUserStoryActivity(APIView):
    serializer_class = StoryReactionActivitySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    
    def get(self,request):
        try:
            queryset = StoryReactionActivityFeed.objects.filter(currentUser=self.request.user).order_by('-updated_at')
            stories = Story.objects.filter(owner=self.request.user)   
            if queryset.count() == 0:
                feeddata = []
                for story in stories:
                    if story.likes.count() + story.celebrates.count() + story.loves.count() > 0:
                        if story.likes.count() > 0 :
                            for like in story.likes.all():
                                saf = StoryReactionActivityFeed.objects.create(currentUser = self.request.user, doneByUser = get_object_or_404(User,pk=like.id), story=story, action = "lik")
                                feeddata.append(saf)
                        else:
                            pass

                        if story.loves.count() > 0 :
                            for love in story.loves.all():
                                saf = StoryReactionActivityFeed.objects.create(currentUser = self.request.user, doneByUser = get_object_or_404(User,pk=love.id), story=story, action = "lov")
                                feeddata.append(saf)
                        else:
                            pass
                        
                        if story.celebrates.count() > 0 :
                            for celebrate in story.celebrates.all() :
                                saf = StoryReactionActivityFeed.objects.create(currentUser = self.request.user, doneByUser = get_object_or_404(User,pk=celebrate.id), story=story, action = "cel")
                                feeddata.append(saf)
                        else:
                            pass
                        
                        serializer = StoryReactionActivitySerializer(feeddata,many=True)
                        if serializer.is_valid():
                            return Response(serializer.data, status=status.HTTP_200_OK)
                        else:
                            print(serializer.errors)
                    else:
                        print("Returning Empty")
                        return HttpResponse({},status=status.HTTP_204_NO_CONTENT)
                if feeddata:
                    serializer = StoryReactionActivitySerializer(feeddata, many=True)
                    if serializer.is_valid():
                        return Response(serializer.data, status=status.HTTP_200_OK)
                    else:
                        return Response("Bad request - Invalid serializer data", status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({}, status=status.HTTP_204_NO_CONTENT)
            else:
                data = StoryReactionActivitySerializer(queryset,many=True).data
                return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(f"Bad request - General exception occurred: {e}", status=status.HTTP_400_BAD_REQUEST)
            

class commentsOnUserStoryActivity(APIView):
    serializer_class = StoryCommentActivitySerializer
    queryset = StoryCommentActivityFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    
    def get(self,request):

        queryset = self.queryset.filter(commentedOnUser=self.request.user).order_by('-updated_at')
        data = StoryCommentActivitySerializer(queryset,many=True).data
        return Response(data, status=status.HTTP_200_OK)
           
class reactionsOnUserReelActivity(APIView):
    serializer_class = ReelReactionActivitySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    
    def get(self,request):
        try: 
            queryset = ReelReactionActivityFeed.objects.filter(currentUser=self.request.user).order_by('-updated_at')
            print("Passed 1")         
            reels = Reel.objects.filter(reel_owner=self.request.user)
            print("Passed 2")         
            if queryset.count() == 0:
                feeddata = []
                for reel in reels:
                    if reel.likes.count() + reel.celebrates.count() + reel.loves.count() > 0:
                        if reel.likes.count() > 0 :
                            for like in reel.likes.all():
                                raf = ReelReactionActivityFeed.objects.create(currentUser = self.request.user, doneByUser = get_object_or_404(User,pk=like.id), reel=reel, action = "lik")
                                feeddata.append(raf)
                        else:
                            pass
                        if reel.loves.count() > 0 :
                            for love in reel.loves.all():
                                raf = ReelReactionActivityFeed.objects.create(currentUser = self.request.user, doneByUser = get_object_or_404(User,pk=love.id), reel=reel, action = "lov")
                                feeddata.append(raf)
                        else:
                            pass
                        if reel.celebrates.count() > 0 :
                            for celebrate in reel.celebrates.all() :
                                raf = ReelReactionActivityFeed.objects.create(currentUser = self.request.user, doneByUser = get_object_or_404(User,pk=celebrate.id), reel=reel, action = "cel")
                                feeddata.append(raf)
                        else:
                            pass
                        


                    else:
                        return HttpResponse({},status=status.HTTP_204_NO_CONTENT)
                if feeddata:
                    serializer = ReelReactionActivitySerializer(feeddata, many=True)
                    if serializer.is_valid():
                        return Response(serializer.data, status=status.HTTP_200_OK)
                    else:
                        return Response("Bad request - Invalid serializer data", status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({}, status=status.HTTP_204_NO_CONTENT)
            else:
                print("From Queryset Feed")
                data = ReelReactionActivitySerializer(queryset,many=True).data
                return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(f"Bad request - General exception occurred: {e}", status=status.HTTP_400_BAD_REQUEST)
    
class commentsOnUserReelActivity(APIView):
    serializer_class = ReelCommentActivitySerializer
    queryset = ReelCommentActivityFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    
    def get(self,request):

        queryset = self.queryset.filter(commentedOnUser=self.request.user).order_by('-updated_at')
        data = ReelCommentActivitySerializer(queryset,many=True).data
        return Response(data, status=status.HTTP_200_OK)
        
class FriendStoryActivity(APIView):
    serializer_class = FriendStoryActivitySerializer
    queryset = FriendStoryActivityFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    
    def get(self,request):
        friend_id = self.request.query_params.get("friend_id")
        queryset = self.queryset.filter(ownerUser=friend_id).order_by('-updated_at')
        data = FriendStoryActivitySerializer(queryset,many=True).data
        return Response(data, status=status.HTTP_200_OK)

class FriendReelActivity(APIView):
    serializer_class = FriendReelActivitySerializer
    queryset = FriendReelActivityFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)
    
    def get(self,request):
        friend_id = self.request.query_params.get("friend_id")
        queryset = self.queryset.filter(ownerUser=friend_id).order_by('-updated_at')
        data = FriendReelActivitySerializer(queryset,many=True).data
        return Response(data, status=status.HTTP_200_OK)
    

class ImageModelFeed(APIView):
    serializer_class = ImageModelSerializer
    queryset = ImageModel.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self,request):
        owner_id = self.request.user
        queryset = self.queryset.filter(owner=owner_id).order_by('-updated_at')
        feeddata = ImageModelSerializer(queryset,many=True).data
        returnObj = {}
        storyObj = []
        reelObj = []

        for i in range(len(feeddata)):
            print(feeddata[i]["linked_id"])
            if feeddata[i]["linked_to"] == "story":
                storyreturnObj = {}
                try: 
                    story_item = get_object_or_404(Story,pk=feeddata[i]["linked_id"])
                    comment_items = StoryComment.objects.filter(story=story_item)
                    storyreturnObj["story_id"] = feeddata[i]["linked_id"]
                    storyreturnObj["story_title"] = story_item.title
                    storyreturnObj["story_image"] = 'http://localhost:8000' + feeddata[i]["image_data"]
                    storyreturnObj["story_likes"] = story_item.likes.all().count()
                    storyreturnObj["story_loves"] = story_item.loves.all().count()
                    storyreturnObj["story_celebrates"] = story_item.celebrates.all().count()
                    storyreturnObj["story_comments"] = comment_items.all().count()
                    storyObj.append(storyreturnObj)
                except:
                    pass

            elif feeddata[i]["linked_to"] == "reels":
                reelreturnObj = {}
                try:
                    reel_item = get_object_or_404(Reel,pk=feeddata[i]["linked_id"])
                    comment_items = ReelComment.objects.filter(reel=reel_item)
                    reelreturnObj["reel_id"] = feeddata[i]["linked_id"]
                    reelreturnObj["reel_caption"] = reel_item.caption
                    reelreturnObj["reel_image"] = 'http://localhost:8000' + feeddata[i]["image_data"]
                    reelreturnObj["reel_likes"] = reel_item.likes.all().count()
                    reelreturnObj["reel_loves"] = reel_item.loves.all().count()
                    reelreturnObj["reel_celebrates"] = reel_item.celebrates.all().count()
                    reelreturnObj["reel_comments"] = comment_items.all().count()
                    reelObj.append(reelreturnObj)
                except:
                    pass
            else:
                pass

        returnObj["storyphotos"] = storyObj
        returnObj["reelphotos"] = reelObj
        print(reelObj)
        return Response(returnObj, status=status.HTTP_200_OK)
