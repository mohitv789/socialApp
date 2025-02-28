from core.models import UserProfile, Friend,FriendshipRequest, User, Follow, Block,PromotedToWallModel
from rest_framework import viewsets,authentication
from rest_framework import status, mixins
from rest_framework.response import Response
from .serializers import UserProfileSerializer,PromotedWallSerializer,FriendSerializer,FriendshipRequestSerializer,FriendshipRequestResponseSerializer, ProfileImageSerializer, FollowSerializer, BlockSerializer
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework import viewsets
from django.shortcuts import get_object_or_404
from user.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view,authentication_classes,permission_classes
from .permissions import IsOwnerOrReadOnly
from rest_framework.decorators import action
from core.exceptions import AlreadyExistsError, AlreadyFriendsError
import json
from user.authentication import JWTCookieAuthentication

class PromotedToWall(viewsets.ModelViewSet):
    serializer_class = PromotedWallSerializer
    queryset = PromotedToWallModel.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self,request):
        logged_in_id = self.request.user
        queryset = self.queryset.filter(for_user=logged_in_id).order_by('-updated_at')
        return Response(queryset, status=status.HTTP_200_OK)
    
class PrivateProfileViewSet(viewsets.ModelViewSet):
    """View for manage recipe APIs."""
    serializer_class = UserProfileSerializer
    queryset = UserProfile.objects.all()
    permission_classes = (IsAuthenticated,IsOwnerOrReadOnly)
    authentication_classes = [JWTCookieAuthentication,]
    def _params_to_ints(self, qs):
        """Convert a list of strings to integers."""
        return [int(str_id) for str_id in qs.split(',')]

    def get_queryset(self):
        queryset = self.queryset
        return queryset.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Return appropriate serializer class"""
        if self.action == 'retrieve':
            return UserProfileSerializer
        elif self.action == 'upload_avatar':
            return ProfileImageSerializer
        return self.serializer_class

    def get_obj(self, id):
        obj = get_object_or_404(UserProfile, pk=id)
        return obj

    # def perform_create(self, request):
    #     serialized = self.serializer_class(data=request.data)
    #     if serialized.is_valid():
    #         serialized.save()
    #         profile_id = serialized.instance.id
    #         return Response({'id': profile_id}, status=status.HTTP_201_CREATED)
    #     else:
    #         return Response(self.serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def perform_create(self, serializer):
        profile_instance = serializer.save()
        return profile_instance.id  # Return the id of the created reel

    def create(self, request, *args, **kwargs):
        data = request.data.copy()  # Create a mutable copy of request.data
        
        serialized_data = json.dumps(data)
        serializer = self.get_serializer(data=json.loads(serialized_data))
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        profile_id = serializer.instance.id
        headers = self.get_success_headers(serializer.data)
        return Response({'id': profile_id}, status=status.HTTP_201_CREATED, headers=headers)
        
    def update(self, request, *args, **kwargs):
        data = request.data.copy()
        data_dict = dict(data)
        data_object = {key: value[0] for key, value in data_dict.items()}
        serialized_data = json.dumps(data_object)

        print(serialized_data,flush=True)

        serializer = self.get_serializer(instance=self.get_object(), data=data_object)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        profile_id = kwargs.get('pk')
        headers = self.get_success_headers(serializer.data)
        return Response({'id': profile_id}, status=status.HTTP_200_OK, headers=headers)   
    
    @action(methods=['POST'], detail=True, url_path='upload-avatar', permission_classes=[IsAuthenticated])
    def upload_avatar(self, request, pk=None):
        """Upload an image to a recipe"""
        profile = self.get_object()
        serializer = self.get_serializer(
            profile,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class PublicProfileViewSet(viewsets.GenericViewSet):
    
    permission_classes = (IsAuthenticated,IsOwnerOrReadOnly)
    authentication_classes = (JWTCookieAuthentication,)
    def get_object(self,request,*args, **kwargs):
        userId = self.kwargs['userid']
        obj = get_object_or_404(UserProfile, user=userId)
        data = UserProfileSerializer(obj).data
        return Response(data, status=status.HTTP_200_OK)

class FriendViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Friend model
    """
    
    permission_classes = (IsAuthenticated,IsOwnerOrReadOnly)
    authentication_classes = (JWTCookieAuthentication,)
    lookup_field = 'pk'

    def list(self, request):
        friend_requests = Friend.objects.friends(user=request.user)
        self.queryset = friend_requests
        self.http_method_names = ['get', 'head', 'options', ]
        return Response(FriendSerializer(friend_requests, many=True).data)

    def retrieve(self, request, pk=None):
        self.queryset = Friend.objects.friends(user=request.user)
        requested_user = get_object_or_404(User, pk=pk)
        if Friend.objects.are_friends(request.user, requested_user):
            self.http_method_names = ['get', 'head', 'options', ]
            return Response(FriendSerializer(requested_user, many=False).data)
        else:
            return Response(
                {'message': "Friend relationship not found for user."},
                status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False)
    def requests(self, request):
        friend_requests = Friend.objects.unrejected_requests(user=request.user)
        self.queryset = friend_requests
        return Response(
            FriendshipRequestSerializer(friend_requests, many=True).data)

    @action(detail=False)
    def sent_requests(self, request):
        friend_requests = Friend.objects.sent_requests(user=request.user)
        self.queryset = friend_requests
        return Response(
            FriendshipRequestSerializer(friend_requests, many=True).data)

    @action(detail=False)
    def rejected_requests(self, request):
        friend_requests = Friend.objects.rejected_requests(user=request.user)
        self.queryset = friend_requests
        return Response(
            FriendshipRequestSerializer(friend_requests, many=True).data)

    @action(detail=False)
    def rejected_received_requests(self, request, *args, **kwargs):
        user = self.request.query_params.get('user')
        userObj = get_object_or_404(User, pk = user)
        friend_requests = Friend.objects.rejected_requests(user=userObj)
        self.queryset = friend_requests
        return Response(
            FriendshipRequestSerializer(friend_requests, many=True).data)
    
    @action(detail=False,
             serializer_class=FriendshipRequestSerializer,
             methods=['post'])
    def add_friend(self, request, id=None):
        """
        Add a new friend with POST data
        - to_user
        - message
        """
        # Creates a friend request from POST data:
        # - username
        # - message
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        to_user = get_object_or_404(
            User,
            id=serializer.validated_data.get('to_user')
        )
        is_blocked = Block.objects.filter(
            blocker__in=[request.user,to_user], blocked__in=[request.user,to_user]
        ).exists()
        if not is_blocked:
            try:
                friend_obj = Friend.objects.add_friend(
                    # The sender
                    request.user,
                    # The recipient
                    to_user,
                    # Message (...or empty str)
                    message=request.data.get('message', '')
                )
                return Response(
                    FriendshipRequestSerializer(friend_obj).data,
                    status.HTTP_201_CREATED
                )
            except (AlreadyExistsError, AlreadyFriendsError) as e:
                return Response(
                    {"message": str(e)},
                    status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"message": "You cannot send friend request as a block exists."},
                status.HTTP_400_BAD_REQUEST
            )
        


    @action(detail=False, serializer_class=FriendshipRequestSerializer, methods=['post'])
    def remove_friend(self, request):
        """
        Deletes a friend relationship.

        The username specified in the POST data will be
        removed from the current user's friends.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        to_user = get_object_or_404(
            User,
            id=serializer.validated_data.get('to_user')
        )

        if Friend.objects.remove_friend(request.user, to_user):
            if Follow.objects.follows(follower=request.user,followee=to_user):
                Follow.objects.remove_follower(follower=request.user, followee=to_user)
            message = 'Friend deleted.'
            status_code = status.HTTP_204_NO_CONTENT
        else:
            message = 'Friend not found.'
            status_code = status.HTTP_400_BAD_REQUEST

        return Response(
            {"message": message},
            status=status_code
        )

    @action(detail=False,
             serializer_class=FriendshipRequestResponseSerializer,
             methods=['post'])
    def accept_request(self, request, id=None):
        """
        Accepts a friend request

        The request id specified in the URL will be accepted
        """
        id = request.data.get('id', None)
        friendship_request = get_object_or_404(
            FriendshipRequest, pk=id)

        if not friendship_request.to_user == request.user:
            return Response(
                {"message": "Request for current user not found."},
                status.HTTP_400_BAD_REQUEST
            )

        friendship_request.accept()
        return Response(
            {"message": "Request accepted, user added to friends."},
            status.HTTP_201_CREATED
        )

    @action(detail=False,
             serializer_class=FriendshipRequestResponseSerializer,
             methods=['post'])
    def reject_request(self, request, id=None):
        """
        Rejects a friend request

        The request id specified in the URL will be rejected
        """
        id = request.data.get('id', None)
        friendship_request = get_object_or_404(
            FriendshipRequest, pk=id)
        if not friendship_request.to_user == request.user:
            return Response(
                {"message": "Request for current user not found."},
                status.HTTP_400_BAD_REQUEST
            )

        friendship_request.reject()

        return Response(
            {
                "message": "Request rejected, user NOT added to friends."
            },
            status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=["GET"])
    def is_friend(self, request):
        checked_user_id = request.query_params.get("checked_user_id")
        checked_user = get_object_or_404(User, pk=checked_user_id)
        is_friend = Friend.objects.are_friends(request.user, checked_user)
        return Response({"is_friend": is_friend})
    
class FollowViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Follow model
    """
    
    permission_classes = (IsAuthenticated,IsOwnerOrReadOnly)
    authentication_classes = (JWTCookieAuthentication,)
    lookup_field = 'pk'

    @action(detail=False)
    def list_followers(self, request):
        followers = Follow.objects.list_followers(user=request.user)
        self.queryset = followers
        self.http_method_names = ['get', 'head', 'options', ]
        return Response(FollowSerializer(followers, many=True).data)
    
    @action(detail=False)
    def list_followings(self, request):
        following = Follow.objects.list_following(user=request.user)
        self.queryset = following
        self.http_method_names = ['get', 'head', 'options', ]
        return Response(FollowSerializer(following, many=True).data)

    # To check if the user with pk is a follower of the current user
    @action(detail=False)
    def is_follower(self, request):
        requested_user_id = request.query_params.get("requested_user_id")
        requested_user = get_object_or_404(User, pk=requested_user_id)
        self.queryset = Follow.objects.follows(follower=requested_user,followee=request.user)
        if Follow.objects.follows(requested_user , request.user):
            self.http_method_names = ['get', 'head', 'options', ]
            return Response(FollowSerializer(requested_user, many=False).data)
        else:
            return Response(
                {'message': "Follow relationship not found for user."},
                status.HTTP_400_BAD_REQUEST
            )
    
    # To check if the current user is a follower of the user corresponding to PK
    @action(detail=False)
    def is_following(self, request):
        requested_user_id = request.query_params.get("requested_user_id")
        requested_user = get_object_or_404(User, pk=requested_user_id)
        self.queryset = Follow.objects.follows(follower=request.user,followee=requested_user)        
        if Follow.objects.follows(request.user,requested_user):
            self.http_method_names = ['get', 'head', 'options', ]
            return Response(FollowSerializer(requested_user, many=False).data)
        else:
            return Response(
                {'message': "Follow relationship not found for user."},
                status.HTTP_400_BAD_REQUEST
            )    
    
    @action(detail=False,methods=['post'])
    def follow_someone(self, request):
        """
        Add a new follower with POST data
        - followed_user
        """
        followee_id = request.data.get("followee_user",None)
        followee = get_object_or_404(User,pk=followee_id)
        if not Block.objects.blocked(followee , request.user) and not Block.objects.blocked(request.user,followee):            
            try:
                follow_obj = Follow.objects.add_follower(
                    # The sender
                    request.user,
                    # The recipient
                    followee
                )
                return Response(
                    follow_obj.id,
                    status.HTTP_201_CREATED
                )
            except (AlreadyExistsError,) as e:
                return Response(
                    {"message": str(e)},
                    status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"message": "You cannot follow as a block exists."},
                status.HTTP_400_BAD_REQUEST
            )


    @action(detail=False, methods=['post'])
    def unfollow_someone(self, request):
        """
        Deletes a follow relationship.

        The username specified in the POST data will be
        removed from the current user's list of followed users.
        """
        followee_id = request.data.get("followee_user",None)
        followee = get_object_or_404(User,pk=followee_id)

        if Follow.objects.remove_follower(request.user , followee):
            message = 'Follow Relation deleted.'
            status_code = status.HTTP_204_NO_CONTENT
        else:
            message = 'Follow Relation not found.'
            status_code = status.HTTP_400_BAD_REQUEST

        return Response(
            {"message": message},
            status=status_code
        )

class BlockViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Block model
    """
    
    permission_classes = (IsAuthenticated,IsOwnerOrReadOnly)
    authentication_classes = (JWTCookieAuthentication,)
    lookup_field = 'pk'

    @action(detail=False)
    def list_current_blocks(self, request):
        blocks = Block.objects.list_blocking(user=request.user)
        self.queryset = blocks
        self.http_method_names = ['get', 'head', 'options', ]
        return Response(BlockSerializer(blocks, many=True).data)

    @action(detail=False)
    def list_blocked(self, request):
        blocked = Block.objects.list_blocked(user=request.user)
        self.queryset = blocked
        self.http_method_names = ['get', 'head', 'options', ]
        return Response(BlockSerializer(blocked, many=True).data) 
    
    # To check if the user with pk is a blocked by the current user
    @action(detail=False)
    def is_blocked(self, request):
        requested_user_id = request.query_params.get("requested_user_id")
        requested_user = get_object_or_404(User,pk=requested_user_id)
              
        if Block.objects.blocked(request.user , requested_user):
            self.http_method_names = ['get', 'head', 'options', ]
            return Response(BlockSerializer(requested_user, many=False).data)
        else:
            return Response(
                {'message': "Block relationship not found for user."},
                status.HTTP_400_BAD_REQUEST
            )

        # To check if the user with pk is a blocked by the current user
    @action(detail=False)
    def is_blocking(self, request):
        requested_user_id = request.query_params.get("requested_user_id")
        requested_user = get_object_or_404(User,pk=requested_user_id)
              
        if Block.objects.blocked(requested_user , request.user):
            self.http_method_names = ['get', 'head', 'options', ]
            return Response(BlockSerializer(requested_user, many=False).data)
        else:
            return Response(
                {'message': "Block relationship not found for user."},
                status.HTTP_400_BAD_REQUEST
            )     
    
    @action(detail=False,methods=['post'])
    def block_someone(self, request):
        blocked_id = request.data.get("blocked_id",None)
        blocked = get_object_or_404(User,pk=blocked_id)
        
        try:
            block_obj = Block.objects.add_block(
                # The sender
                request.user,
                # The recipient
                blocked
            )
            try:                
                Follow.objects.remove_follower(follower=request.user, followee=blocked)
            except:
                print("You were not following blocked user!!")

            return Response(
                block_obj.id,
                status.HTTP_201_CREATED
            )
        except (AlreadyExistsError,) as e:
            return Response(
                {"message": str(e)},
                status.HTTP_400_BAD_REQUEST
                )


    @action(detail=False, methods=['post'])
    def unblock_someone(self, request):
        blocked_id = request.data.get("blocked_id",None)
        blocked = get_object_or_404(User,pk=blocked_id)

        if Block.objects.remove_block(request.user, blocked):
            message = 'Block Relation deleted.'
            status_code = status.HTTP_204_NO_CONTENT
        else:
            message = 'Block Relation not found.'
            status_code = status.HTTP_400_BAD_REQUEST

        return Response(
            {"message": message},
            status=status_code
        )