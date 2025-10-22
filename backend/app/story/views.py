# views.py (cleaned)
import binascii
import json
import logging
import base64
import io
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_aware
from django.db import transaction
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, mixins
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.core.paginator import Paginator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch

from user.authentication import JWTCookieAuthentication
from core.models import (
    Activity, StoryFeed, ReelFeed, Story, Reel,
    FriendStoryActivityFeed, FriendReelActivityFeed,
    StoryComment, ReelComment
)
from core.models import Activity, Follow, Block  
from PIL import Image

from core.models import (
    PromotedToWallModel, Reel, Story, StoryComment, ReelComment, StoryFeed,
    StoryReactionActivityFeed, ReelReactionActivityFeed, User, Friend,
    StoryCommentActivityFeed, ReelCommentActivityFeed, ReelFeed,
    FriendStoryActivityFeed, FriendReelActivityFeed, ImageModel
)
from .serializers import (
    ReelSerializer, StoryCommentSerializer, StorySerializer, ImageModelSerializer,
    ReelCommentSerializer, ReelImageSerializer, StoryImageSerializer, StoryFeedSerializer,
    StoryReactionActivitySerializer, ReelReactionActivitySerializer, StoryCommentActivitySerializer,
    ReelCommentActivitySerializer, ReelFeedSerializer, FriendStoryActivitySerializer,
    FriendReelActivitySerializer
)
from .permissions import IsOwnerOrReadOnly, IsReelOwnerOrReadOnly, IsCommentOwnerOrReadOnly
from user.authentication import JWTCookieAuthentication

logger = logging.getLogger(__name__)
def _get_following_ids(user):
    """Return list of user ids the given user follows."""
    return list(Follow.objects.filter(follower=user).values_list('followee', flat=True))

def _get_blocked_ids(user):
    """Return set of user ids that are blocked by user or that block the user."""
    blocked = set(Block.objects.filter(blocker=user).values_list('blocked', flat=True))
    blocking_me = set(Block.objects.filter(blocked=user).values_list('blocker', flat=True))
    return blocked.union(blocking_me)

def is_base64_image(input_data: str) -> bool:
    """
    Accepts either raw base64 string or data URL 'data:image/png;base64,...'
    Returns True if it decodes to a valid image.
    """
    try:
        if not isinstance(input_data, str):
            return False
        if input_data.startswith('data:'):
            _, b64 = input_data.split(';base64,', 1)
        else:
            b64 = input_data
        decoded = base64.b64decode(b64)
        img = Image.open(io.BytesIO(decoded))
        img.verify()  # will raise if not an image
        return True
    except (binascii.Error, ValueError, OSError) as e:
        logger.debug("is_base64_image failed: %s", e)
        return False


def _safe_get_image_url(serializer_instance):
    try:
        return serializer_instance.image.url
    except Exception:
        return None


def _create_or_update_image_model(linked_to: str, linked_id: str, owner: User, image_url: str):
    """
    Create or update an ImageModel for a story/reel. Explicitly handles DoesNotExist.
    """
    if not image_url:
        return None
    try:
        img_obj = ImageModel.objects.get(linked_to=linked_to, linked_id=linked_id)
        img_obj.image_data = image_url
        img_obj.owner = owner
        img_obj.save()
        return img_obj
    except ImageModel.DoesNotExist:
        return ImageModel.objects.create(linked_to=linked_to, linked_id=linked_id, owner=owner, image_data=image_url)
    except Exception:
        logger.exception("Failed to create/update ImageModel for %s %s", linked_to, linked_id)
        return None


class ReelViewSet(viewsets.ModelViewSet):
    serializer_class = ReelSerializer
    queryset = Reel.objects.all()
    permission_classes = [IsAuthenticated, IsReelOwnerOrReadOnly]
    authentication_classes = (JWTCookieAuthentication,)

    def get_queryset(self):
        return self.queryset.filter(reel_owner=self.request.user).order_by('-updated_at').distinct()

    def get_serializer_class(self):
        # Use the image serializer only for upload/edit-image actions
        if self.action in ('upload_image', 'edit_image'):
            return ReelImageSerializer
        return ReelSerializer

    # keep a normal DRF create that accepts JSON (default JSONParser included)
    # def perform_create(self, serializer):
    #     reel_instance = serializer.save()
    #     logger.info(f"Reel created (id={reel_instance.id}) by {self.request.user.username}")
    #     return reel_instance
    
    def perform_create(self, serializer):
        reel_instance = serializer.save()
        logger.info(f"Reel created (id={reel_instance.id}) by {self.request.user.username}")

        # create Activity for posting a reel
        try:
            ct = ContentType.objects.get_for_model(reel_instance.__class__)
            Activity.objects.get_or_create(
                actor=self.request.user,
                verb='post_reel',
                target_content_type=ct,
                target_object_id=str(reel_instance.id),
                defaults={'data': {'target_type': 'reel'}}
            )
        except Exception:
            logger.exception("Failed creating Activity for reel post")

        return reel_instance


    def create(self, request, *args, **kwargs):

        logger.debug("Create request.content_type: %s", request.content_type)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reel_instance = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        # return UUID string
        return Response({'id': str(reel_instance.id)}, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'id': str(serializer.instance.id)}, status=status.HTTP_202_ACCEPTED)

    # upload-image should accept multipart/form-data
    @action(
        methods=['POST'],
        detail=True,
        url_path='upload-image',
        permission_classes=[IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_image(self, request, pk=None):
        reel = self.get_object()
        serializer = self.get_serializer(reel, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # update/ensure ImageModel
            imgObj, created = ImageModel.objects.get_or_create(
                linked_to="reels", linked_id=str(reel.id),
                defaults={'owner': self.request.user, 'image_data': serializer.instance.image.url}
            )
            if not created:
                imgObj.image_data = serializer.instance.image.url
                imgObj.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # edit-image also accepts multipart
    @action(
        methods=['PUT'],
        detail=True,
        url_path='edit-image',
        permission_classes=[IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser],
    )
    def edit_image(self, request, pk=None):
        # same as upload_image but for PUT
        reel = self.get_object()
        serializer = self.get_serializer(reel, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            imgObj, created = ImageModel.objects.get_or_create(
                linked_to="reels", linked_id=str(reel.id),
                defaults={'owner': self.request.user, 'image_data': serializer.instance.image.url}
            )
            if not created:
                imgObj.image_data = serializer.instance.image.url
                imgObj.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StoryViewSet(viewsets.ModelViewSet):
    serializer_class = StorySerializer
    queryset = Story.objects.all()
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    authentication_classes = (JWTCookieAuthentication,)

    def get_queryset(self):
        return self.queryset.filter(owner=self.request.user).order_by('-updated_at').distinct()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StorySerializer
        if self.action in ('upload_image',):
            return StoryImageSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        instance = serializer.save()
        logger.info("Story created id=%s by user=%s", instance.id, self.request.user)
        return instance
    
    def _parse_tags_and_reels(self, data):
        """
        Normalizes 'tags' and 'reels' fields for StoryViewSet.

        Supports:
        - tags: list of dicts [{"name": "x"}]
        - tags: list of strings ["x", "y"]
        - tags: JSON string (either of the above)
        - reels: list of dicts [{"id": "..."}]
        - reels: JSON string (same structure)
        - reels: legacy form ['[{"id":"..."}]']

        Returns:
            cleaned_data: dict
            reel_ids_list: list[str]
        """
        data = data.copy()
        reel_ids = []

        # ---------- TAGS ----------
        tags_raw = data.get('tags', [])
        tags = []

        # Case 1: already a list (dicts or strings)
        if isinstance(tags_raw, (list, tuple)):
            for t in tags_raw:
                if isinstance(t, dict):
                    name = t.get('name') or t.get('title') or None
                    if name:
                        tags.append({'name': str(name).strip()})
                elif isinstance(t, str):
                    tags.append({'name': t.strip()})
        # Case 2: JSON string
        elif isinstance(tags_raw, str):
            try:
                parsed_tags = json.loads(tags_raw.replace("'", '"'))
                if isinstance(parsed_tags, list):
                    for t in parsed_tags:
                        if isinstance(t, dict):
                            name = t.get('name') or t.get('title') or None
                            if name:
                                tags.append({'name': str(name).strip()})
                        elif isinstance(t, str):
                            tags.append({'name': t.strip()})
            except json.JSONDecodeError:
                logger.debug("Failed to parse tags JSON: %s", tags_raw)
        else:
            logger.debug("Unknown tags format: %s", type(tags_raw))

        data['tags'] = tags

        # ---------- REELS ----------
        reels_raw = data.pop('reels', [])
        reels_json = []

        try:
            if isinstance(reels_raw, (list, tuple)):
                # legacy: ['[{"id": "..."}]'] or list of dicts
                if len(reels_raw) == 1 and isinstance(reels_raw[0], str) and reels_raw[0].startswith('['):
                    reels_json = json.loads(reels_raw[0])
                else:
                    reels_json = reels_raw
            elif isinstance(reels_raw, str):
                reels_json = json.loads(reels_raw.replace("'", '"'))
        except Exception as e:
            logger.debug("Failed to parse reels: %s", e)
            reels_json = []

        reel_ids = []
        for r in reels_json or []:
            if isinstance(r, dict) and 'id' in r:
                reel_ids.append(r['id'])
            elif isinstance(r, str):
                reel_ids.append(r)

        return data, reel_ids


    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data, reel_ids = self._parse_tags_and_reels(request.data)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        story_id = str(serializer.instance.id)
        if reel_ids:
            reels_qs = Reel.objects.filter(id__in=reel_ids)
            serializer.instance.reels.set(reels_qs)
        # friend feed
        friend_list = Friend.objects.friends(self.request.user)
        try:
            s_friendfeed = FriendStoryActivityFeed.objects.create(ownerUser=self.request.user, action="spub", story_id=story_id)
            for friend in friend_list:
                s_friendfeed.forUser.add(friend)

            s_friendfeed.save()
            try:
                ct = ContentType.objects.get_for_model(serializer.instance.__class__)
                Activity.objects.get_or_create(
                    actor=self.request.user,
                    verb='post_story',
                    target_content_type=ct,
                    target_object_id=str(serializer.instance.id),
                    defaults={'data': {'target_type': 'story'}}
                )
            except Exception:
                logger.exception("Failed creating Activity for story post")
        except Exception:
            logger.exception("Failed to create FriendStoryActivityFeed on story create")
        return Response({'id': story_id}, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        data, reel_ids = self._parse_tags_and_reels(request.data)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        story_id = str(instance.id)
        if reel_ids:
            reels_qs = Reel.objects.filter(id__in=reel_ids)
            instance.reels.set(reels_qs)

        friend_list = Friend.objects.friends(self.request.user)
        try:
            s_friendfeed, created = FriendStoryActivityFeed.objects.get_or_create(ownerUser=self.request.user, story_id=story_id)
            s_friendfeed.action = "sedt"
            for friend in friend_list:
                s_friendfeed.forUser.add(friend)
            s_friendfeed.save()
                    # create/update Activity for story edit (we keep singular 'post_story' for owner)
            try:
                ct = ContentType.objects.get_for_model(instance.__class__)
                # update timestamp by deleting and recreating to reflect latest updated_at,
                # or you can set another verb like 'edit_story' if you prefer history.
                Activity.objects.filter(
                    actor=self.request.user,
                    verb='post_story',
                    target_content_type=ct,
                    target_object_id=str(instance.id),
                ).delete()
                Activity.objects.create(
                    actor=self.request.user,
                    verb='post_story',
                    target_content_type=ct,
                    target_object_id=str(instance.id),
                    data={'target_type': 'story'}
                )
            except Exception:
                logger.exception("Failed updating Activity for story edit")

        except Exception:
            logger.exception("Failed to create/update FriendStoryActivityFeed on story update")

        return Response({'id': story_id}, status=status.HTTP_200_OK)

    @action(methods=['POST'], detail=True, url_path='upload-image', permission_classes=[IsAuthenticated], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        story = self.get_object()
        serializer = self.get_serializer(story, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        image_url = _safe_get_image_url(serializer.instance)
        _create_or_update_image_model(linked_to="story", linked_id=str(story.id), owner=self.request.user, image_url=image_url)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['GET'], detail=False, url_path='get-reel-story', permission_classes=[IsAuthenticated])
    def get_reel_story(self, request, *args, **kwargs):
        reel_param = request.query_params.get('reel_id')
        if not reel_param:
            return Response({'detail': 'missing reel_id'}, status=status.HTTP_400_BAD_REQUEST)
        reel_id = str(reel_param).split("/")[0]
        # Search stories that have the reel
        story = Story.objects.filter(reels__id=reel_id).values_list('id', flat=True).first()
        if story:
            return Response({'reels_story': str(story)}, status=status.HTTP_200_OK)
        return Response({'reels_story': "Not Found"}, status=status.HTTP_404_NOT_FOUND)


class StoryCommentViewSet(viewsets.ModelViewSet):
    serializer_class = StoryCommentSerializer
    queryset = StoryComment.objects.all()
    permission_classes = [IsAuthenticated, IsCommentOwnerOrReadOnly]
    authentication_classes = (JWTCookieAuthentication,)

    def get_queryset(self):
        story_id = self.kwargs['story_id']
        story = get_object_or_404(Story, pk=story_id)
        return self.queryset.filter(story=story).order_by('-id')

    def perform_create(self, serializer):
        return serializer.save()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        commented_by = request.data.get("commented_by")
        try:
            commented_by_user = get_object_or_404(User, pk=commented_by)
        except Exception:
            return Response({"detail": "commented_by user invalid"}, status=status.HTTP_400_BAD_REQUEST)

        story_id = self.kwargs['story_id']
        story = get_object_or_404(Story, pk=story_id)
        friendship = Friend.objects.are_friends(story.owner, commented_by_user)
        data = {**request.data, 'story': story_id, 'approval': ("app" if friendship else "rej")}
        serializer = self.serializer_class(data=data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        # activity feed
        try:
            comFeedObj = StoryCommentActivityFeed.objects.create(
                commentedOnUser=story.owner, commentByUser=commented_by_user, story_id=story_id, action="comm", comment_id=comment.id
            )
            friend_list = Friend.objects.friends(self.request.user)
            s_friendfeed = FriendStoryActivityFeed.objects.create(ownerUser=self.request.user, action="scom", story_id=story_id)
            for friend in friend_list:
                s_friendfeed.forUser.add(friend)
            comFeedObj.save()
            s_friendfeed.save()
        except Exception:
            logger.exception("Failed to create comment/activity feed for story comment")
                # Activity for new comment
        try:
            ct = ContentType.objects.get_for_model(story.__class__)
            Activity.objects.create(
                actor=commented_by_user,
                verb='comment',
                target_content_type=ct,
                target_object_id=str(story_id),
                data={'comment_id': comment.id, 'preview': (comment.storycomment[:120] if hasattr(comment, 'storycomment') else '')}
            )
        except Exception:
            logger.exception("Failed creating Activity for story comment")

        return Response({'id': comment.id}, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        comment_id = kwargs['pk']
        story_id = kwargs['story_id']
        story = get_object_or_404(Story, pk=story_id)
        instance = get_object_or_404(StoryComment, story=story, pk=comment_id)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        try:
            comFeedObj = StoryCommentActivityFeed.objects.filter(comment_id=comment_id).first()
            if comFeedObj:
                comFeedObj.action = "ecom"
                comFeedObj.save()
                        # Update Activity for comment edit: update data.comment_id or recreate
                try:
                    ct = ContentType.objects.get_for_model(story.__class__)
                    # remove previous comment activity and re-create to update timestamp
                    Activity.objects.filter(
                        actor=request.user, verb='comment',
                        target_content_type=ct, target_object_id=str(story_id),
                        data__comment_id=comment_id
                    ).delete()
                    Activity.objects.create(
                        actor=request.user,
                        verb='comment',
                        target_content_type=ct,
                        target_object_id=str(story_id),
                        data={'comment_id': comment_id, 'preview': (request.data.get('storycomment') or '')[:120]}
                    )
                except Exception:
                    logger.exception("Failed updating Activity for story comment edit")

        except Exception:
            logger.exception("Failed updating StoryCommentActivityFeed")
        friend_list = Friend.objects.friends(self.request.user)
        try:
            s_friendfeed, created = FriendStoryActivityFeed.objects.get_or_create(ownerUser=self.request.user, story_id=story_id)
            s_friendfeed.action = "secm"
            for friend in friend_list:
                s_friendfeed.forUser.add(friend)
            s_friendfeed.save()
        except Exception:
            logger.exception("Failed creating/updating FriendStoryActivityFeed on comment update")
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReelCommentViewSet(viewsets.ModelViewSet):
    serializer_class = ReelCommentSerializer
    queryset = ReelComment.objects.all()
    permission_classes = [IsAuthenticated, IsCommentOwnerOrReadOnly]
    authentication_classes = (JWTCookieAuthentication,)
    lookup_field = 'reel_id'

    def get_queryset(self):
        reel_id = self.kwargs['reel_id']
        return self.queryset.filter(reel=reel_id).order_by('-id')

    def perform_create(self, serializer):
        return serializer.save()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        commented_by = request.data.get("commented_by")
        try:
            commented_by_user = get_object_or_404(User, pk=commented_by)
        except Exception:
            return Response({"detail": "commented_by user invalid"}, status=status.HTTP_400_BAD_REQUEST)

        reel_id = self.kwargs['reel_id']
        reel = get_object_or_404(Reel, pk=reel_id)
        friendship = Friend.objects.are_friends(reel.reel_owner, commented_by_user)
        data = {**request.data, 'reel': reel_id, 'approval': ("app" if friendship else "rej")}
        serializer = self.serializer_class(data=data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        try:
            comFeedObj = ReelCommentActivityFeed.objects.create(
                commentedOnUser=reel.reel_owner, commentByUser=commented_by_user, reel_id=reel_id, action="comm", comment_id=comment.id
            )
            friend_list = Friend.objects.friends(self.request.user)
            r_friendfeed = FriendReelActivityFeed.objects.create(ownerUser=self.request.user, action="rcom", reel_id=reel_id)
            for friend in friend_list:
                r_friendfeed.forUser.add(friend)
            comFeedObj.save()
            r_friendfeed.save()
        except Exception:
            logger.exception("Failed to create comment/activity feed for reel comment")
        return Response({'id': comment.id}, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        comment_id = kwargs.get('pk')
        reel_id = kwargs.get('reel_id')
        instance = get_object_or_404(ReelComment, pk=comment_id)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        try:
            comFeedObj = ReelCommentActivityFeed.objects.filter(comment_id=comment_id).first()
            if comFeedObj:
                comFeedObj.action = "ecom"
                comFeedObj.save()
        except Exception:
            logger.exception("Failed updating ReelCommentActivityFeed")
        friend_list = Friend.objects.friends(self.request.user)
        try:
            r_friendfeed, created = FriendReelActivityFeed.objects.get_or_create(ownerUser=self.request.user, reel_id=reel_id)
            r_friendfeed.action = "recm"
            for friend in friend_list:
                r_friendfeed.forUser.add(friend)
            r_friendfeed.save()
        except Exception:
            logger.exception("Failed creating/updating FriendReelActivityFeed on comment update")
        return Response(serializer.data, status=status.HTTP_200_OK)


# --- Reaction / Like / Celebrate / Love endpoints ---
# These endpoints are mostly mechanical: add/remove user from related M2M and update feeds.
# I preserve your existing behavior but made the code explicit and logged exceptions.

def _remove_from_feed_m2m(feed_model, feed_user, field_name, instance_id):
    try:
        feed_obj = feed_model.objects.get(feedUser=feed_user)
        getattr(feed_obj, field_name).remove(instance_id)
        feed_obj.save()
    except feed_model.DoesNotExist:
        pass
    except Exception:
        logger.exception("Error removing from feed m2m %s for user %s", field_name, feed_user)


def _add_to_feed_m2m_or_create(feed_model, feed_user, field_name, instance):
    try:
        feed_obj, _ = feed_model.objects.get_or_create(feedUser=feed_user)
        existing = list(getattr(feed_obj, field_name).all())
        if instance not in existing:
            getattr(feed_obj, field_name).add(instance)
            feed_obj.save()
    except Exception:
        logger.exception("Error adding to feed m2m %s for user %s", field_name, feed_user)


class StoryReactionBaseAPIView(APIView):
    """Base helper for Story reaction endpoints."""
    serializer_class = StorySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def _get_story_and_user(self, storyId, request):
        story = get_object_or_404(Story, id=storyId)
        user = request.user
        return story, user


class ReelReactionBaseAPIView(APIView):
    serializer_class = ReelSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)


# For brevity I keep the explicit endpoints but cleaned up exceptions and DRYed some code.
class StoryLikeAPIView(StoryReactionBaseAPIView):
    # def delete(self, request, storyId):
    #     story, user = self._get_story_and_user(storyId, request)
    #     story.likes.remove(user)
    #     try:
    #         ct = ContentType.objects.get_for_model(story.__class__)
    #         Activity.objects.filter(
    #             actor=user, verb='like',
    #             target_content_type=ct, target_object_id=str(story.id)
    #         ).delete()
    #     except Exception:
    #         logger.exception("Failed deleting Activity for story unlike")

    #     story.save()

    #     _remove_from_feed_m2m(StoryFeed, user, 'feedLikedStory', story)
    #     try:
    #         activity = StoryReactionActivityFeed.objects.filter(doneByUser=user, story=story, currentUser=story.owner, action="lik").first()
    #         if activity:
    #             activity.action = "ulk"
    #             activity.save()
    #     except Exception:
    #         logger.exception("Failed updating StoryReactionActivityFeed on unlike")

    #     try:
    #         s_friendfeed = FriendStoryActivityFeed.objects.filter(ownerUser=request.user, story_id=storyId).first()
    #         if s_friendfeed:
    #             s_friendfeed.action = "sulk"
    #             for friend in Friend.objects.friends(request.user):
    #                 s_friendfeed.forUser.add(friend)
    #             s_friendfeed.save()
    #     except Exception:
    #         logger.exception("Failed updating FriendStoryActivityFeed on unlike")

    #     return Response(self.serializer_class(story, context={"request": request}).data, status=status.HTTP_200_OK)

    # def post(self, request, storyId):
    #     story, user = self._get_story_and_user(storyId, request)
    #     story.likes.add(user)
    #     # create Activity row (single canonical history)
    #     try:
    #         ct = ContentType.objects.get_for_model(story.__class__)
    #         Activity.objects.create(
    #             actor=user,
    #             verb='like',
    #             target_content_type=ct,
    #             target_object_id=str(story.id),
    #             data={'target_type': 'story'}
    #         )
    #     except Exception:
    #         logger.exception("Failed creating Activity for story like")

    #     story.save()

    #     _add_to_feed_m2m_or_create(StoryFeed, user, 'feedLikedStory', story)

    #     try:
    #         activity, created = StoryReactionActivityFeed.objects.get_or_create(currentUser=story.owner, doneByUser=user, story=story, action="lik")
    #         if created:
    #             activity.save()
    #     except Exception:
    #         logger.exception("Failed creating StoryReactionActivityFeed on like")

    #     try:
    #         s_friendfeed, created = FriendStoryActivityFeed.objects.get_or_create(ownerUser=request.user, story_id=storyId, action="slik")
    #         for friend in Friend.objects.friends(request.user):
    #             s_friendfeed.forUser.add(friend)
    #         s_friendfeed.save()
    #     except Exception:
    #         logger.exception("Failed creating FriendStoryActivityFeed on like")

    #     return Response(self.serializer_class(story, context={"request": request}).data, status=status.HTTP_200_OK)

    def delete(self, request, storyId):
        story, user = self._get_story_and_user(storyId, request)
        story.likes.remove(user)

        # remove canonical Activity for like
        try:
            ct = ContentType.objects.get_for_model(story.__class__)
            Activity.objects.filter(
                actor=user, verb='like',
                target_content_type=ct, target_object_id=str(story.id)
            ).delete()
        except Exception:
            logger.exception("Failed deleting Activity for story unlike")

        story.save()

        _remove_from_feed_m2m(StoryFeed, user, 'feedLikedStory', story)
        try:
            activity = StoryReactionActivityFeed.objects.filter(doneByUser=user, story=story, currentUser=story.owner, action="lik").first()
            if activity:
                activity.action = "ulk"
                activity.save()
        except Exception:
            logger.exception("Failed updating StoryReactionActivityFeed on unlike")

        try:
            s_friendfeed = FriendStoryActivityFeed.objects.filter(ownerUser=request.user, story_id=storyId).first()
            if s_friendfeed:
                s_friendfeed.action = "sulk"
                for friend in Friend.objects.friends(request.user):
                    s_friendfeed.forUser.add(friend)
                s_friendfeed.save()
        except Exception:
            logger.exception("Failed updating FriendStoryActivityFeed on unlike")

        return Response(self.serializer_class(story, context={"request": request}).data, status=status.HTTP_200_OK)

    def post(self, request, storyId):
        story, user = self._get_story_and_user(storyId, request)
        story.likes.add(user)

        # create Activity row (single canonical history)
        try:
            ct = ContentType.objects.get_for_model(story.__class__)
            Activity.objects.get_or_create(
                actor=user,
                verb='like',
                target_content_type=ct,
                target_object_id=str(story.id),
                defaults={'data': {'target_type': 'story'}}
            )
        except Exception:
            logger.exception("Failed creating Activity for story like")

        story.save()

        _add_to_feed_m2m_or_create(StoryFeed, user, 'feedLikedStory', story)

        try:
            activity, created = StoryReactionActivityFeed.objects.get_or_create(currentUser=story.owner, doneByUser=user, story=story, action="lik")
            if created:
                activity.save()
        except Exception:
            logger.exception("Failed creating StoryReactionActivityFeed on like")

        try:
            s_friendfeed, created = FriendStoryActivityFeed.objects.get_or_create(ownerUser=request.user, story_id=storyId, action="slik")
            for friend in Friend.objects.friends(request.user):
                s_friendfeed.forUser.add(friend)
            s_friendfeed.save()
        except Exception:
            logger.exception("Failed creating FriendStoryActivityFeed on like")

        return Response(self.serializer_class(story, context={"request": request}).data, status=status.HTTP_200_OK)


class ReelLikeAPIView(ReelReactionBaseAPIView):
    # def delete(self, request, reelId):
    #     reel = get_object_or_404(Reel, id=reelId)
    #     user = request.user
    #     reel.likes.remove(user)
    #     reel.save()

    #     _remove_from_feed_m2m(ReelFeed, user, 'feedLikedReel', reel)

    #     try:
    #         activity = ReelReactionActivityFeed.objects.filter(doneByUser=user, reel=reel, currentUser=reel.reel_owner, action="lik").first()
    #         if activity:
    #             activity.action = "ulk"
    #             activity.save()
    #     except Exception:
    #         logger.exception("Failed updating ReelReactionActivityFeed on unlike")

    #     try:
    #         r_friendfeed = FriendReelActivityFeed.objects.filter(ownerUser=request.user, reel_id=reelId).first()
    #         if r_friendfeed:
    #             r_friendfeed.action = "rulk"
    #             for friend in Friend.objects.friends(request.user):
    #                 r_friendfeed.forUser.add(friend)
    #             r_friendfeed.save()
    #     except Exception:
    #         logger.exception("Failed updating FriendReelActivityFeed on unlike")

    #     return Response(self.serializer_class(reel, context={"request": request}).data, status=status.HTTP_200_OK)

    # def post(self, request, reelId):
    #     reel = get_object_or_404(Reel, id=reelId)
    #     user = request.user
    #     reel.likes.add(user)
    #     reel.save()

    #     _add_to_feed_m2m_or_create(ReelFeed, user, 'feedLikedReel', reel)

    #     try:
    #         activity, created = ReelReactionActivityFeed.objects.get_or_create(currentUser=reel.reel_owner, doneByUser=user, reel=reel, action="lik")
    #         if created:
    #             activity.save()
    #     except Exception:
    #         logger.exception("Failed creating ReelReactionActivityFeed on like")

    #     try:
    #         r_friendfeed, created = FriendReelActivityFeed.objects.get_or_create(ownerUser=request.user, reel_id=reelId, action="rlik")
    #         for friend in Friend.objects.friends(request.user):
    #             r_friendfeed.forUser.add(friend)
    #         r_friendfeed.save()
    #     except Exception:
    #         logger.exception("Failed creating FriendReelActivityFeed on like")

    #     return Response(self.serializer_class(reel, context={"request": request}).data, status=status.HTTP_200_OK)

    def delete(self, request, reelId):
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user
        reel.likes.remove(user)

        # delete Activity like for reel
        try:
            ct = ContentType.objects.get_for_model(reel.__class__)
            Activity.objects.filter(
                actor=user, verb='like',
                target_content_type=ct, target_object_id=str(reel.id)
            ).delete()
        except Exception:
            logger.exception("Failed deleting Activity for reel unlike")

        reel.save()

        _remove_from_feed_m2m(ReelFeed, user, 'feedLikedReel', reel)

        try:
            activity = ReelReactionActivityFeed.objects.filter(doneByUser=user, reel=reel, currentUser=reel.reel_owner, action="lik").first()
            if activity:
                activity.action = "ulk"
                activity.save()
        except Exception:
            logger.exception("Failed updating ReelReactionActivityFeed on unlike")

        try:
            r_friendfeed = FriendReelActivityFeed.objects.filter(ownerUser=request.user, reel_id=reelId).first()
            if r_friendfeed:
                r_friendfeed.action = "rulk"
                for friend in Friend.objects.friends(request.user):
                    r_friendfeed.forUser.add(friend)
                r_friendfeed.save()
        except Exception:
            logger.exception("Failed updating FriendReelActivityFeed on unlike")

        return Response(self.serializer_class(reel, context={"request": request}).data, status=status.HTTP_200_OK)

    def post(self, request, reelId):
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user
        reel.likes.add(user)

        # create Activity for reel like
        try:
            ct = ContentType.objects.get_for_model(reel.__class__)
            Activity.objects.get_or_create(
                actor=user,
                verb='like',
                target_content_type=ct,
                target_object_id=str(reel.id),
                defaults={'data': {'target_type': 'reel'}}
            )
        except Exception:
            logger.exception("Failed creating Activity for reel like")

        reel.save()

        _add_to_feed_m2m_or_create(ReelFeed, user, 'feedLikedReel', reel)

        try:
            activity, created = ReelReactionActivityFeed.objects.get_or_create(currentUser=reel.reel_owner, doneByUser=user, reel=reel, action="lik")
            if created:
                activity.save()
        except Exception:
            logger.exception("Failed creating ReelReactionActivityFeed on like")

        try:
            r_friendfeed, created = FriendReelActivityFeed.objects.get_or_create(ownerUser=request.user, reel_id=reelId, action="rlik")
            for friend in Friend.objects.friends(request.user):
                r_friendfeed.forUser.add(friend)
            r_friendfeed.save()
        except Exception:
            logger.exception("Failed creating FriendReelActivityFeed on like")

        return Response(self.serializer_class(reel, context={"request": request}).data, status=status.HTTP_200_OK)


# Implementations for Celebrate / Love follow the same pattern as Like.
# For brevity include one example (StoryCelebrateAPIView). You can copy/paste for others.

class StoryCelebrateAPIView(StoryReactionBaseAPIView):
    def delete(self, request, storyId):
        story, user = self._get_story_and_user(storyId, request)
        story.celebrates.remove(user)
        story.save()
        _remove_from_feed_m2m(StoryFeed, user, 'feedCelebratedStory', story)
        try:
            activity = StoryReactionActivityFeed.objects.filter(doneByUser=user, story=story, currentUser=story.owner, action="cel").first()
            if activity:
                activity.action = "ucl"
                activity.save()
        except Exception:
            logger.exception("Failed updating StoryReactionActivityFeed on uncelebrate")
        try:
            s_friendfeed = FriendStoryActivityFeed.objects.filter(ownerUser=request.user, story_id=storyId).first()
            if s_friendfeed:
                s_friendfeed.action = "sucl"
                for friend in Friend.objects.friends(request.user):
                    s_friendfeed.forUser.add(friend)
                s_friendfeed.save()
        except Exception:
            logger.exception("Failed updating FriendStoryActivityFeed on uncelebrate")
        return Response(self.serializer_class(story, context={"request": request}).data, status=status.HTTP_200_OK)

    def post(self, request, storyId):
        story, user = self._get_story_and_user(storyId, request)
        story.celebrates.add(user)
            # in StoryCelebrateAPIView.post (after story.celebrates.add(user))
        try:
            ct = ContentType.objects.get_for_model(story.__class__)
            Activity.objects.get_or_create(
                actor=user,
                verb='celebrate',
                target_content_type=ct,
                target_object_id=str(story.id),
                defaults={'data': {'target_type': 'story'}}
            )
        except Exception:
            logger.exception("Failed creating Activity for story celebrate")

        # in StoryCelebrateAPIView.delete (after story.celebrates.remove(user))
        try:
            ct = ContentType.objects.get_for_model(story.__class__)
            Activity.objects.filter(
                actor=user, verb='celebrate',
                target_content_type=ct, target_object_id=str(story.id)
            ).delete()
        except Exception:
            logger.exception("Failed deleting Activity for story uncelebrate")

        story.save()
        _add_to_feed_m2m_or_create(StoryFeed, user, 'feedCelebratedStory', story)
        try:
            activity, created = StoryReactionActivityFeed.objects.get_or_create(currentUser=story.owner, doneByUser=user, story=story, action="cel")
            if created:
                activity.save()
        except Exception:
            logger.exception("Failed creating StoryReactionActivityFeed on celebrate")
        try:
            s_friendfeed, created = FriendStoryActivityFeed.objects.get_or_create(ownerUser=request.user, story_id=storyId, action="scel")
            for friend in Friend.objects.friends(request.user):
                s_friendfeed.forUser.add(friend)
            s_friendfeed.save()
        except Exception:
            logger.exception("Failed creating FriendStoryActivityFeed on celebrate")
        return Response(self.serializer_class(story, context={"request": request}).data, status=status.HTTP_200_OK)

# --- Missing reaction view classes -- paste below existing classes in views.py ---

class StoryLoveAPIView(StoryReactionBaseAPIView):
    """
    Add/remove 'love' reaction on a Story.
    POST -> add love
    DELETE -> remove love
    """
    def delete(self, request, storyId):
        story = get_object_or_404(Story, id=storyId)
        user = request.user
        story.loves.remove(user)
        story.save()

        # remove from user's StoryFeed
        _remove_from_feed_m2m(StoryFeed, user, 'feedLovedStory', story)

        # update activity feed if exists (mark as un-loved)
        try:
            activity = StoryReactionActivityFeed.objects.filter(doneByUser=user, story=story, currentUser=story.owner, action="lov").first()
            if activity:
                activity.action = "sulo"  # follow your existing code's 'unlove' marker
                activity.save()
        except Exception:
            logger.exception("Failed updating StoryReactionActivityFeed on unlove")

        # friend activity
        try:
            s_friendfeed = FriendStoryActivityFeed.objects.filter(ownerUser=request.user, story_id=storyId).first()
            if s_friendfeed:
                s_friendfeed.action = "sulo"
                for friend in Friend.objects.friends(request.user):
                    s_friendfeed.forUser.add(friend)
                s_friendfeed.save()
        except Exception:
            logger.exception("Failed updating FriendStoryActivityFeed on unlove")

        return Response(StorySerializer(story, context={"request": request}).data, status=status.HTTP_200_OK)

    def post(self, request, storyId):
        story = get_object_or_404(Story, id=storyId)
        user = request.user
        story.loves.add(user)
        story.save()

        # add to user's feed or create
        _add_to_feed_m2m_or_create(StoryFeed, user, 'feedLovedStory', story)

        # ensure activity row
        try:
            activity, created = StoryReactionActivityFeed.objects.get_or_create(
                currentUser=story.owner, doneByUser=user, story=story, action="lov"
            )
            if created:
                activity.save()
        except Exception:
            logger.exception("Failed creating StoryReactionActivityFeed on love")

        # friend feed
        try:
            s_friendfeed, created = FriendStoryActivityFeed.objects.get_or_create(ownerUser=request.user, story_id=storyId, action="slov")
            for friend in Friend.objects.friends(request.user):
                s_friendfeed.forUser.add(friend)
            s_friendfeed.save()
        except Exception:
            logger.exception("Failed creating FriendStoryActivityFeed on love")

        return Response(StorySerializer(story, context={"request": request}).data, status=status.HTTP_200_OK)


class ReelCelebrateAPIView(ReelReactionBaseAPIView):
    """
    Add/remove 'celebrate' reaction on a Reel.
    POST -> add celebrate
    DELETE -> remove celebrate
    """
    def delete(self, request, reelId):
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user
        reel.celebrates.remove(user)
        reel.save()

        # remove from ReelFeed
        _remove_from_feed_m2m(ReelFeed, user, 'feedCelebratedReel', reel)

        # update activity feed if exists (mark as un-celebrated)
        try:
            activity = ReelReactionActivityFeed.objects.filter(doneByUser=user, reel=reel, currentUser=reel.reel_owner, action="cel").first()
            if activity:
                activity.action = "ucl"
                activity.save()
        except Exception:
            logger.exception("Failed updating ReelReactionActivityFeed on uncelebrate")

        # friend feed
        try:
            r_friendfeed = FriendReelActivityFeed.objects.filter(ownerUser=request.user, reel_id=reelId).first()
            if r_friendfeed:
                r_friendfeed.action = "rucl"
                for friend in Friend.objects.friends(request.user):
                    r_friendfeed.forUser.add(friend)
                r_friendfeed.save()
        except Exception:
            logger.exception("Failed updating FriendReelActivityFeed on uncelebrate")

        return Response(ReelSerializer(reel, context={"request": request}).data, status=status.HTTP_200_OK)

    def post(self, request, reelId):
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user
        reel.celebrates.add(user)
        reel.save()

        # add to user's feed or create
        _add_to_feed_m2m_or_create(ReelFeed, user, 'feedCelebratedReel', reel)

        # activity row
        try:
            activity, created = ReelReactionActivityFeed.objects.get_or_create(
                currentUser=reel.reel_owner, doneByUser=user, reel=reel, action="cel"
            )
            if created:
                activity.save()
        except Exception:
            logger.exception("Failed creating ReelReactionActivityFeed on celebrate")

        # friend feed
        try:
            r_friendfeed, created = FriendReelActivityFeed.objects.get_or_create(ownerUser=request.user, reel_id=reelId, action="rcel")
            for friend in Friend.objects.friends(request.user):
                r_friendfeed.forUser.add(friend)
            r_friendfeed.save()
        except Exception:
            logger.exception("Failed creating FriendReelActivityFeed on celebrate")

        return Response(ReelSerializer(reel, context={"request": request}).data, status=status.HTTP_200_OK)


class ReelLoveAPIView(ReelReactionBaseAPIView):
    """
    Add/remove 'love' reaction on a Reel.
    POST -> add love
    DELETE -> remove love
    """
    def delete(self, request, reelId):
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user
        reel.loves.remove(user)
        reel.save()

        _remove_from_feed_m2m(ReelFeed, user, 'feedLovedReel', reel)

        try:
            activity = ReelReactionActivityFeed.objects.filter(doneByUser=user, reel=reel, currentUser=reel.reel_owner, action="lov").first()
            if activity:
                activity.action = "ulv"
                activity.save()
        except Exception:
            logger.exception("Failed updating ReelReactionActivityFeed on unlove")

        try:
            r_friendfeed = FriendReelActivityFeed.objects.filter(ownerUser=request.user, reel_id=reelId).first()
            if r_friendfeed:
                r_friendfeed.action = "rulo"
                for friend in Friend.objects.friends(request.user):
                    r_friendfeed.forUser.add(friend)
                r_friendfeed.save()
        except Exception:
            logger.exception("Failed updating FriendReelActivityFeed on unlove")

        return Response(ReelSerializer(reel, context={"request": request}).data, status=status.HTTP_200_OK)

    def post(self, request, reelId):
        reel = get_object_or_404(Reel, id=reelId)
        user = request.user
        reel.loves.add(user)
        reel.save()

        _add_to_feed_m2m_or_create(ReelFeed, user, 'feedLovedReel', reel)

        try:
            activity, created = ReelReactionActivityFeed.objects.get_or_create(
                currentUser=reel.reel_owner, doneByUser=user, reel=reel, action="lov"
            )
            if created:
                activity.save()
        except Exception:
            logger.exception("Failed creating ReelReactionActivityFeed on love")

        try:
            r_friendfeed, created = FriendReelActivityFeed.objects.get_or_create(ownerUser=request.user, reel_id=reelId, action="rlov")
            for friend in Friend.objects.friends(request.user):
                r_friendfeed.forUser.add(friend)
            r_friendfeed.save()
        except Exception:
            logger.exception("Failed creating FriendReelActivityFeed on love")

        return Response(ReelSerializer(reel, context={"request": request}).data, status=status.HTTP_200_OK)


class UserStoryFeed(APIView):
    serializer_class = StoryFeedSerializer
    queryset = StoryFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def _collect_feed_ids(self, feed_qs, request_user):
        liked, loved, celebrated, visited = [], [], [], []
        for item in feed_qs:
            liked += [s.id for s in item.feedLikedStory.all()]
            loved += [s.id for s in item.feedLovedStory.all()]
            celebrated += [s.id for s in item.feedCelebratedStory.all()]
            for v in item.feedVisitedStory.all():
                visited.append(v.id)
                try:
                    user_wall = PromotedToWallModel.objects.filter(content_id=v.id, for_user=request_user).first()
                    if user_wall:
                        user_wall.content_type = "story"
                        user_wall.title = getattr(v, "title", "")
                        user_wall.save()
                    else:
                        PromotedToWallModel.objects.create(for_user=request_user, content_id=v.id, content_type="story", title=getattr(v, "title", ""))
                except Exception:
                    logger.exception("Failed handling PromotedToWallModel for story %s", v.id)
            # if nothing in item, delete it to cleanup
            if item.feedLikedStory.count() + item.feedLovedStory.count() + item.feedCelebratedStory.count() + item.feedVisitedStory.count() == 0:
                item.delete()
        return list(dict.fromkeys(liked + loved + celebrated + visited))  # unique-preserve order

    def get(self, request):
        feed_qs = self.queryset.filter(feedUser=request.user)
        if not feed_qs.exists():
            feed_stories = Story.objects.exclude(owner=request.user).order_by('-updated_at').distinct()
        else:
            feed_ids = self._collect_feed_ids(feed_qs, request.user)
            if feed_ids:
                feed_stories = Story.objects.filter(id__in=feed_ids).order_by('-updated_at').distinct()
            else:
                feed_stories = Story.objects.exclude(owner=request.user).order_by('-updated_at').distinct()
        serializer_data = StorySerializer(feed_stories, many=True).data
        comment_data = []
        for item in feed_stories:
            comment_data.append({"story_id": str(item.id), "num_comments": item.comments.count()})
        return Response({"feed_stories": serializer_data, "feed_stories_comments": comment_data}, status=status.HTTP_200_OK)


class UserReelFeed(APIView):
    serializer_class = ReelFeedSerializer
    queryset = ReelFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def _collect_reel_ids(self, feed_qs, request_user):
        liked, loved, celebrated, visited = [], [], [], []
        for item in feed_qs:
            liked += [r.id for r in item.feedLikedReel.all()]
            loved += [r.id for r in item.feedLovedReel.all()]
            celebrated += [r.id for r in item.feedCelebratedReel.all()]
            for v in item.feedVisitedReel.all():
                visited.append(v.id)
                try:
                    user_wall = PromotedToWallModel.objects.filter(content_id=v.id, for_user=request_user).first()
                    if user_wall:
                        user_wall.content_type = "reel"
                        user_wall.title = getattr(v, "caption", "")
                        user_wall.save()
                    else:
                        PromotedToWallModel.objects.create(for_user=request_user, content_id=v.id, content_type="reel", title=getattr(v, "caption", ""))
                except Exception:
                    logger.exception("Failed handling PromotedToWallModel for reel %s", v.id)
            if item.feedLikedReel.count() + item.feedLovedReel.count() + item.feedCelebratedReel.count() + item.feedVisitedReel.count() == 0:
                item.delete()
        return list(dict.fromkeys(liked + loved + celebrated + visited))

    def get(self, request):
        feed_qs = self.queryset.filter(feedUser=request.user)
        if not feed_qs.exists():
            feed_reels = Reel.objects.exclude(reel_owner=request.user)
            # assemble stories referenced by reels
            story_ids = []
            for r in feed_reels:
                story_ids += [s.id for s in r.reels.all()]
            stories = Story.objects.filter(id__in=story_ids).order_by('-updated_at').distinct()
        else:
            feed_ids = self._collect_reel_ids(feed_qs, request.user)
            if feed_ids:
                feed_reels = Reel.objects.filter(id__in=feed_ids)
                # assemble stories referenced by these reels
                story_ids = []
                for r in feed_reels:
                    story_ids += [s.id for s in r.reels.all()]
                stories = Story.objects.filter(id__in=story_ids).order_by('-updated_at').distinct()
            else:
                feed_reels = Reel.objects.exclude(reel_owner=request.user)
                story_ids = []
                for r in feed_reels:
                    story_ids += [s.id for s in r.reels.all()]
                stories = Story.objects.filter(id__in=story_ids).order_by('-updated_at').distinct()

        serializer_data = StorySerializer(stories, many=True).data
        comment_data = [{"story_id": str(s.id), "num_comments": s.comments.count()} for s in stories]
        return Response({"feed_stories": serializer_data, "feed_stories_comments": comment_data}, status=status.HTTP_200_OK)


class GetStoryFeedDetailView(mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get_object(self, request, id):
        story_obj = get_object_or_404(Story, pk=id)
        try:
            feed_obj, created = StoryFeed.objects.get_or_create(feedUser=request.user)
            if not feed_obj.feedVisitedStory.filter(pk=story_obj.pk).exists():
                feed_obj.feedVisitedStory.add(story_obj)
                feed_obj.save()
        except Exception:
            logger.exception("Failed updating StoryFeed visited list")
        return Response(StorySerializer(story_obj).data, status=status.HTTP_200_OK)


class GetReelFeedDetailView(mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get_object(self, request, id):
        reel_obj = get_object_or_404(Reel, pk=id)
        try:
            feed_obj, created = ReelFeed.objects.get_or_create(feedUser=request.user)
            if not feed_obj.feedVisitedReel.filter(pk=reel_obj.pk).exists():
                feed_obj.feedVisitedReel.add(reel_obj)
                feed_obj.save()
        except Exception:
            logger.exception("Failed updating ReelFeed visited list")
        return Response(ReelSerializer(reel_obj).data, status=status.HTTP_200_OK)


class reactionsOnUserStoryActivity(APIView):
    serializer_class = StoryReactionActivitySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self, request):
        try:
            queryset = StoryReactionActivityFeed.objects.filter(currentUser=request.user).order_by('-updated_at')
            if not queryset.exists():
                # seed from existing story reactions
                feeddata = []
                stories = Story.objects.filter(owner=request.user)
                for story in stories:
                    for liker in story.likes.all():
                        feeddata.append(StoryReactionActivityFeed(currentUser=request.user, doneByUser=liker, story=story, action="lik"))
                    for lover in story.loves.all():
                        feeddata.append(StoryReactionActivityFeed(currentUser=request.user, doneByUser=lover, story=story, action="lov"))
                    for celebrator in story.celebrates.all():
                        feeddata.append(StoryReactionActivityFeed(currentUser=request.user, doneByUser=celebrator, story=story, action="cel"))
                if not feeddata:
                    return Response({}, status=status.HTTP_204_NO_CONTENT)
                # since these are unsaved instances created above, return serialized minimal structure
                serializer = StoryReactionActivitySerializer(feeddata, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                data = StoryReactionActivitySerializer(queryset, many=True).data
                return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Error in reactionsOnUserStoryActivity: %s", e)
            return Response({"detail": "Internal error"}, status=status.HTTP_400_BAD_REQUEST)


class commentsOnUserStoryActivity(APIView):
    serializer_class = StoryCommentActivitySerializer
    queryset = StoryCommentActivityFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self, request):
        queryset = self.queryset.filter(commentedOnUser=request.user).order_by('-updated_at')
        data = StoryCommentActivitySerializer(queryset, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class reactionsOnUserReelActivity(APIView):
    serializer_class = ReelReactionActivitySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self, request):
        try:
            queryset = ReelReactionActivityFeed.objects.filter(currentUser=request.user).order_by('-updated_at')
            if not queryset.exists():
                feeddata = []
                reels = Reel.objects.filter(reel_owner=request.user)
                for reel in reels:
                    for liker in reel.likes.all():
                        feeddata.append(ReelReactionActivityFeed(currentUser=request.user, doneByUser=liker, reel=reel, action="lik"))
                    for lover in reel.loves.all():
                        feeddata.append(ReelReactionActivityFeed(currentUser=request.user, doneByUser=lover, reel=reel, action="lov"))
                    for celebrator in reel.celebrates.all():
                        feeddata.append(ReelReactionActivityFeed(currentUser=request.user, doneByUser=celebrator, reel=reel, action="cel"))
                if not feeddata:
                    return Response({}, status=status.HTTP_204_NO_CONTENT)
                serializer = ReelReactionActivitySerializer(feeddata, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                data = ReelReactionActivitySerializer(queryset, many=True).data
                return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Error in reactionsOnUserReelActivity: %s", e)
            return Response({"detail": "Internal error"}, status=status.HTTP_400_BAD_REQUEST)


class commentsOnUserReelActivity(APIView):
    serializer_class = ReelCommentActivitySerializer
    queryset = ReelCommentActivityFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self, request):
        queryset = self.queryset.filter(commentedOnUser=request.user).order_by('-updated_at')
        data = ReelCommentActivitySerializer(queryset, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class FriendStoryActivity(APIView):
    serializer_class = FriendStoryActivitySerializer
    queryset = FriendStoryActivityFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self, request):
        friend_id = request.query_params.get("friend_id")
        queryset = self.queryset.filter(ownerUser=friend_id).order_by('-updated_at')
        data = FriendStoryActivitySerializer(queryset, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class FriendReelActivity(APIView):
    serializer_class = FriendReelActivitySerializer
    queryset = FriendReelActivityFeed.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self, request):
        friend_id = request.query_params.get("friend_id")
        queryset = self.queryset.filter(ownerUser=friend_id).order_by('-updated_at')
        data = FriendReelActivitySerializer(queryset, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class ImageModelFeed(APIView):
    serializer_class = ImageModelSerializer
    queryset = ImageModel.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self, request):
        owner = request.user
        qs = self.queryset.filter(owner=owner).order_by('-updated_at')
        feeddata = ImageModelSerializer(qs, many=True).data
        story_photos, reel_photos = [], []
        for item in feeddata:
            linked_to = item.get("linked_to")
            linked_id = item.get("linked_id")
            image_path = item.get("image_data")
            if linked_to == "story":
                try:
                    story_item = Story.objects.get(pk=linked_id)
                    story_photos.append({
                        "story_id": linked_id,
                        "story_title": story_item.title,
                        "story_image": request.build_absolute_uri(image_path) if image_path else None,
                        "story_likes": story_item.likes.count(),
                        "story_loves": story_item.loves.count(),
                        "story_celebrates": story_item.celebrates.count(),
                        "story_comments": story_item.comments.count(),
                    })
                except Story.DoesNotExist:
                    logger.debug("Story no longer exists for ImageModel %s", item.get("id"))
                except Exception:
                    logger.exception("Error building story photo entry for ImageModel %s", item.get("id"))
            elif linked_to == "reels":
                try:
                    reel_item = Reel.objects.get(pk=linked_id)
                    reel_photos.append({
                        "reel_id": linked_id,
                        "reel_caption": reel_item.caption,
                        "reel_image": request.build_absolute_uri(image_path) if image_path else None,
                        "reel_likes": reel_item.likes.count(),
                        "reel_loves": reel_item.loves.count(),
                        "reel_celebrates": reel_item.celebrates.count(),
                        "reel_comments": ReelComment.objects.filter(reel=reel_item).count()
                    })
                except Reel.DoesNotExist:
                    logger.debug("Reel no longer exists for ImageModel %s", item.get("id"))
                except Exception:
                    logger.exception("Error building reel photo entry for ImageModel %s", item.get("id"))
        return Response({"storyphotos": story_photos, "reelphotos": reel_photos}, status=status.HTTP_200_OK)



class FeedView(APIView):
    permission_classes = [IsAuthenticated]

    def _serialize_activity(self, activity, request):
        """
        Minimal serializer for Activity rows. We avoid heavy fetching here; instead
        return actor info and target identity. If you want full target objects,
        implement batched prefetch after grouping by content_type.
        """
        actor = activity.actor
        actor_data = {"id": actor.pk, "name": f"{actor.first_name} {actor.last_name}"}

        # Basic target representation (type + id). You can expand this later.
        target_type = activity.target_content_type.model if activity.target_content_type else None
        target_id = activity.target_object_id

        return {
            "id": activity.pk,
            "actor": actor_data,
            "verb": activity.verb,
            "target_type": target_type,
            "target_id": target_id,
            "data": activity.data or {},
            "created_at": activity.created_at.isoformat(),
        }

    def get(self, request):
        user = request.user

        # query params
        page = int(request.query_params.get("page", 1))
        per_page = int(request.query_params.get("per_page", 20))
        created_before = request.query_params.get("created_before")  # ISO datetime string for cursoring

        following_ids = _get_following_ids(user)
        exclude_user_ids = _get_blocked_ids(user)

        # Base queryset:
        # - Activities by users the current user follows
        # - OR system/global post events (you can add verbs that should be visible even if not followed)
        base_q = Q(actor__in=following_ids) | Q(verb__in=['post_story', 'post_reel'])
        qs = Activity.objects.filter(base_q).exclude(actor__in=exclude_user_ids).select_related('actor', 'target_content_type')

        # cursor: created_before filters for infinite scroll
        if created_before:
            dt = parse_datetime(created_before)
            if dt is not None:
                # make timezone aware if naive (DRF client should send ISO with timezone; otherwise adapt)
                try:
                    if dt.tzinfo is None:
                        dt = make_aware(dt)
                except Exception:
                    pass
                qs = qs.filter(created_at__lt=dt)

        qs = qs.order_by('-created_at')

        # simple pagination
        p = Paginator(qs, per_page)
        page_obj = p.get_page(page)

        activities = [self._serialize_activity(a, request) for a in page_obj.object_list]

        return Response({
            "results": activities,
            "page": page,
            "has_next": page_obj.has_next(),
        })

def _serialize_story(story, request=None):
    return {
        "id": str(story.id),
        "title": getattr(story, "title", ""),
        "description": getattr(story, "description", "")[:200],
        "image": request.build_absolute_uri(story.image.url) if getattr(story, "image", None) and request else None,
        "owner_id": story.owner_id,
        "likes": story.likes.count(),
        "loves": story.loves.count(),
        "celebrates": story.celebrates.count(),
        "num_comments": story.comments.count(),
        "updated_at": story.updated_at.isoformat() if getattr(story, "updated_at", None) else None,
    }

def _serialize_reel(reel, request=None):
    return {
        "id": str(reel.id),
        "caption": getattr(reel, "caption", ""),
        "image": request.build_absolute_uri(reel.image.url) if getattr(reel, "image", None) and request else None,
        "owner_id": reel.reel_owner_id,
        "likes": reel.likes.count(),
        "loves": reel.loves.count(),
        "celebrates": reel.celebrates.count(),
        "num_comments": ReelComment.objects.filter(reel=reel).count(),
        "updated_at": reel.updated_at.isoformat() if getattr(reel, "updated_at", None) else None,
    }

def _serialize_activity(act, request=None):
    actor = act.actor
    actor_data = {"id": actor.pk, "name": f"{actor.first_name} {actor.last_name}"}
    target_type = act.target_content_type.model if act.target_content_type else None
    target_id = act.target_object_id
    # try to add basic target payload
    target = None
    try:
        if target_type == "story":
            story = Story.objects.filter(id=target_id).first()
            if story:
                target = _serialize_story(story, request=request)
        elif target_type == "reel":
            reel = Reel.objects.filter(id=target_id).first()
            if reel:
                target = _serialize_reel(reel, request=request)
    except Exception:
        target = None

    return {
        "id": act.pk,
        "actor": actor_data,
        "verb": act.verb,
        "target_type": target_type,
        "target_id": target_id,
        "target": target,
        "data": act.data or {},
        "created_at": act.created_at.isoformat() if getattr(act, "created_at", None) else None,
    }


class CombinedFeedView(APIView):
    """
    Returns a combined feed JSON containing:
      - activities (paged)
      - story feed entries (stories for the user's StoryFeed)
      - reel feed entries (reels for the user's ReelFeed)
      - friend activities (recent FriendStoryActivityFeed & FriendReelActivityFeed)
    Query params:
      - page (int) default 1 -> controls the Activity pagination page
      - per_page (int) default 20 -> page size for activities
      - include_stories (bool) default true
      - include_reels (bool) default true
      - include_friend_activities (bool) default true
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTCookieAuthentication,)

    def get(self, request):
        user = request.user

        page = int(request.query_params.get("page", 1))
        per_page = int(request.query_params.get("per_page", 20))
        include_stories = request.query_params.get("include_stories", "true").lower() != "false"
        include_reels = request.query_params.get("include_reels", "true").lower() != "false"
        include_friend_activities = request.query_params.get("include_friend_activities", "true").lower() != "false"

        # Activities: by users the current user follows OR global post events; exclude blocks already handled upstream if needed
        following_ids = list(user.following.values_list("followee", flat=True)) if hasattr(user, "following") else []
        base_q = (Q(actor__in=following_ids) if following_ids else Q()) | Q(verb__in=['post_story', 'post_reel'])
        activities_qs = Activity.objects.filter(base_q).select_related("actor", "target_content_type").order_by("-created_at")
        paginator = Paginator(activities_qs, per_page)
        page_obj = paginator.get_page(page)
        activities = [_serialize_activity(a, request=request) for a in page_obj.object_list]

        # Story feed: derive from StoryFeed for this user; fallback to recent stories excluding user's own
        story_list = []
        if include_stories:
            feed_qs = StoryFeed.objects.filter(feedUser=user)
            if feed_qs.exists():
                feed_items = feed_qs.prefetch_related(Prefetch("feedLikedStory"), Prefetch("feedLovedStory"), Prefetch("feedCelebratedStory"), Prefetch("feedVisitedStory"))
                # collect story ids from the M2M fields
                ids = []
                for fi in feed_items:
                    ids += [s.id for s in fi.feedLikedStory.all()]
                    ids += [s.id for s in fi.feedLovedStory.all()]
                    ids += [s.id for s in fi.feedCelebratedStory.all()]
                    ids += [s.id for s in fi.feedVisitedStory.all()]
                ids = list(dict.fromkeys(ids))
                if ids:
                    qs = Story.objects.filter(id__in=ids).order_by("-updated_at")
                else:
                    qs = Story.objects.exclude(owner=user).order_by("-updated_at")[:20]
            else:
                qs = Story.objects.exclude(owner=user).order_by("-updated_at")[:20]
            for s in qs:
                story_list.append(_serialize_story(s, request=request))

        # Reel feed: derive similarly from ReelFeed
        reel_list = []
        if include_reels:
            feed_qs = ReelFeed.objects.filter(feedUser=user)
            if feed_qs.exists():
                feed_items = feed_qs.prefetch_related(Prefetch("feedLikedReel"), Prefetch("feedLovedReel"), Prefetch("feedCelebratedReel"), Prefetch("feedVisitedReel"))
                ids = []
                for fi in feed_items:
                    ids += [r.id for r in fi.feedLikedReel.all()]
                    ids += [r.id for r in fi.feedLovedReel.all()]
                    ids += [r.id for r in fi.feedCelebratedReel.all()]
                    ids += [r.id for r in fi.feedVisitedReel.all()]
                ids = list(dict.fromkeys(ids))
                if ids:
                    qs = Reel.objects.filter(id__in=ids).order_by("-updated_at")
                else:
                    qs = Reel.objects.exclude(reel_owner=user).order_by("-updated_at")[:20]
            else:
                qs = Reel.objects.exclude(reel_owner=user).order_by("-updated_at")[:20]
            for r in qs:
                reel_list.append(_serialize_reel(r, request=request))

        # Friend activities (recent)
        friend_activities = []
        if include_friend_activities:
            fsa_qs = FriendStoryActivityFeed.objects.filter(ownerUser__in=following_ids).order_by("-updated_at")[:30]
            fra_qs = FriendReelActivityFeed.objects.filter(ownerUser__in=following_ids).order_by("-updated_at")[:30]
            # Merge and serialize minimally
            for f in fsa_qs:
                friend_activities.append({
                    "id": f.pk,
                    "type": "friend_story",
                    "ownerUser": f.ownerUser_id,
                    "action": f.action,
                    "story_id": getattr(f, "story_id", None),
                    "updated_at": f.updated_at.isoformat() if getattr(f, "updated_at", None) else None,
                })
            for f in fra_qs:
                friend_activities.append({
                    "id": f.pk,
                    "type": "friend_reel",
                    "ownerUser": f.ownerUser_id,
                    "action": f.action,
                    "reel_id": getattr(f, "reel_id", None),
                    "updated_at": f.updated_at.isoformat() if getattr(f, "updated_at", None) else None,
                })

        return Response({
            "activities": activities,
            "activities_page": page,
            "activities_has_next": page_obj.has_next(),
            "stories": story_list,
            "reels": reel_list,
            "friend_activities": sorted(friend_activities, key=lambda x: x.get("updated_at") or "", reverse=True),
        })