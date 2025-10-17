from django.db import models
from django.template.defaultfilters import slugify
from django.conf import settings
import uuid, os
from django.contrib.auth.models import AbstractUser,BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.shortcuts import get_object_or_404
from django.apps import apps
from .exceptions import AlreadyExistsError, AlreadyFriendsError
from .signals import (
    block_created,
    block_removed,
    followee_created,
    followee_removed,
    follower_created,
    follower_removed,
    following_created,
    following_removed,
    friendship_removed,
    friendship_request_accepted,
    friendship_request_canceled,
    friendship_request_created,
    friendship_request_rejected,
    friendship_request_viewed,
)
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        """Creates and saves a new user"""
        if not email:
            raise ValueError('Users must have an email address')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, first_name, last_name, password):
        """Creates and saves a new super user"""
        user = self.create_user(email, first_name, last_name,password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)

        return user
    
class UserToken(models.Model):
    user_id = models.IntegerField()
    token = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expired_at = models.DateTimeField()


class Reset(models.Model):
    email = models.CharField(max_length=255)
    token = models.CharField(max_length=255, unique=True)



def story_image_file_path(instance, filename):
    """Generate file path for new Story image"""
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{ext}'
    return os.path.join('uploads','story', filename)

def reel_image_file_path(instance, filename):
    """Generate file path for new Reel image"""
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{ext}'
    return os.path.join('uploads','reels', filename)

def profile_image_file_path(instance, filename):
    """Generate file path for new Reel image"""
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{ext}'
    return os.path.join('uploads','profiles', filename)

class Camera(models.Model):
    company_make = models.CharField(max_length=255,null=True,blank=True)
    model_name = models.CharField(max_length=255,null=True,blank=True)
    def __str__(self):
        return f"{self.company_make} {self.model_name}"
    
class ImageMetaData(TimeStampedModel):
    parent_options = (
        ('story', 'Story'),
        ('reel', 'Reel'),
    )
    camera = models.ForeignKey(Camera, on_delete=models.PROTECT,null=True,blank=True)
    orientation = models.IntegerField(null=True,blank=True)
    iso = models.IntegerField(null=True,blank=True)
    exposureTime = models.FloatField(null=True,blank=True)
    exposureValue = models.FloatField(null=True,blank=True)
    fnumber = models.FloatField(null=True,blank=True)
    focalLength = models.FloatField(null=True,blank=True)
    xResolution = models.FloatField(null=True,blank=True)
    yResolution = models.FloatField(null=True,blank=True)
    brightness = models.FloatField(null=True,blank=True)
    photo_parent = models.CharField(max_length=5, choices=parent_options)
    photo_parent_id = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.photo_parent} {self.photo_parent_id}"

class Reel(TimeStampedModel):
    """Tag to be used for a recipe"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    caption = models.CharField(max_length=255)
    image = models.ImageField(null=True,upload_to=reel_image_file_path)
    # image = models.URLField(max_length=500)
    reel_owner = models.ForeignKey("User",on_delete=models.CASCADE)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="reel_likes",blank=True)
    loves = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="reel_loves",blank=True)
    celebrates = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="reel_celebrates",blank=True)
    reel_conversation = models.ManyToManyField("Conversation",related_name="reel_conversation",blank=True)
    def __str__(self):
        return self.caption[:25]
    
    
class Tag(TimeStampedModel):
    """Tag to be used for a story"""
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name
    
class Story(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=50)
    description = models.CharField(max_length=255)
    longDescription = models.TextField()
    image = models.ImageField(null=True,upload_to=story_image_file_path)
    # image = models.URLField(max_length=500)
    reels = models.ManyToManyField('Reel', related_name='reels')
    tags = models.ManyToManyField('Tag',blank=True)
    owner = models.ForeignKey("User",on_delete=models.CASCADE)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="story_likes",blank=True)
    loves = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="story_loves",blank=True)
    celebrates = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="story_celebrates",blank=True)
    story_conversation = models.ManyToManyField("Conversation",related_name="story_conversation",blank=True)
    def __str__(self):
        return self.title

class User(AbstractUser):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, unique=True)
    username = models.CharField(max_length=255,default=email)
    password = models.CharField(max_length=255)
    tfa_secret = models.CharField(max_length=255, default='')
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ["username","first_name","last_name"]

    def __str__(self):
        return self.first_name + " " + self.last_name

class ImageModel(TimeStampedModel):
    ACTION_CHOICES = (
        ('story', 'Story'),
        ('reels', 'Reel'),
    )
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    image_data = models.CharField(default="Not Available",max_length=1000)
    linked_to = models.CharField(max_length=5, choices=ACTION_CHOICES)
    linked_id = models.CharField(max_length=255)


class StoryComment(TimeStampedModel):   
    ACTION_CHOICES = (
        ('app', 'Approved'),
        ('rej', 'Rejected'),
    ) 
    storycomment = models.TextField()
    story = models.ForeignKey(
        Story, on_delete=models.CASCADE, related_name="comments"
    )
    commented_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    approval = models.CharField(max_length=3, choices=ACTION_CHOICES)

    def __str__(self):
        return self.storycomment  


class ReelComment(TimeStampedModel):
    ACTION_CHOICES = (
        ('app', 'Approved'),
        ('rej', 'Rejected'),
    ) 
    reelcomment = models.TextField()
    reel = models.ForeignKey(
        Reel, on_delete=models.CASCADE, related_name="reel_comments"
    )
    commented_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    approval = models.CharField(max_length=3, choices=ACTION_CHOICES)
    def __str__(self):
        return self.reelcomment  
    
    

    
class UserProfile(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_profile")
    avatar = models.ImageField(null=True,upload_to=profile_image_file_path)
    # avatar = models.URLField(max_length=500)
    status = models.TextField()
    bio = models.TextField()
    gender = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    url = models.TextField()
    def __str__(self):
        return self.user.first_name + " " + self.user.last_name 

class StoryFeed(TimeStampedModel):
    feedUser = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    feedLikedStory = models.ManyToManyField(Story, related_name="feed_Liked_Story",blank=True)
    feedLovedStory = models.ManyToManyField(Story, related_name="feed_Loved_Story",blank=True)
    feedCelebratedStory = models.ManyToManyField(Story, related_name="feed_Celebrated_Story",blank=True)
    feedVisitedStory = models.ManyToManyField(Story, related_name="feed_Visited_Story",blank=True)

class StoryReactionActivityFeed(TimeStampedModel):
    ACTION_CHOICES = (
        ('lik', 'Liked'),
        ('lov', 'Loved'),
        ('cel', 'Celebrated'),
        ('ulk', 'Unliked'),
        ('ulv', 'Unloved'),
        ('ucl', 'Uncelebrated'),
    )
    currentUser = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='story_current_user')
    doneByUser = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='story_action_user')
    story = models.ForeignKey(Story,on_delete=models.CASCADE)
    action = models.CharField(max_length=3, choices=ACTION_CHOICES)

    @property
    def fullname(self):
        donebyUser = self.doneByUser.id
        doneUserObj = get_object_or_404(User,pk=donebyUser)
        fullname = doneUserObj.first_name + " " + doneUserObj.last_name        
        return fullname
    
class StoryCommentActivityFeed(TimeStampedModel):
    ACTION_CHOICES = (
        ('comm', 'Posted Comment'),
        ('ecom', 'Edited Comment'),
    )
    commentedOnUser = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='scommented_on_user')
    commentByUser = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='scommented_by_user')
    story = models.ForeignKey(Story,on_delete=models.CASCADE)
    comment_id = models.IntegerField()
    action = models.CharField(max_length=4, choices=ACTION_CHOICES)
    
    @property
    def fullname(self):
        donebyUser = self.commentByUser.id
        doneUserObj = get_object_or_404(User,pk=donebyUser)
        fullname = doneUserObj.first_name + " " + doneUserObj.last_name        
        return fullname


class ReelFeed(TimeStampedModel):
    feedUser = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    feedLikedReel = models.ManyToManyField(Reel, related_name="feed_Liked_Reel",blank=True)
    feedLovedReel = models.ManyToManyField(Reel, related_name="feed_Loved_Reel",blank=True)
    feedCelebratedReel = models.ManyToManyField(Reel, related_name="feed_Celebrated_Reel",blank=True)
    feedVisitedReel = models.ManyToManyField(Reel, related_name="feed_Visited_Reel",blank=True)


class ReelReactionActivityFeed(TimeStampedModel):
    ACTION_CHOICES = (
        ('lik', 'Liked'),
        ('lov', 'Loved'),
        ('cel', 'Celebrated'),
        ('ulk', 'Unliked'),
        ('ulv', 'Unloved'),
        ('ucl', 'Uncelebrated'),
    )
    currentUser = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='reel_current_user')
    doneByUser = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='reel_action_user')
    reel = models.ForeignKey(Reel,on_delete=models.CASCADE)
    action = models.CharField(max_length=3, choices=ACTION_CHOICES)

    @property
    def fullname(self):
        donebyUser = self.doneByUser.id
        doneUserObj = get_object_or_404(User,pk=donebyUser)
        fullname = doneUserObj.first_name + " " + doneUserObj.last_name        
        return fullname
    
class ReelCommentActivityFeed(TimeStampedModel):
    ACTION_CHOICES = (
        ('comm', 'Posted Comment'),
        ('ecom', 'Edited Comment'),
    )
    commentedOnUser = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='rcommented_on_user')
    commentByUser = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='rcommented_by_user')
    reel = models.ForeignKey(Reel,on_delete=models.CASCADE)
    comment_id = models.IntegerField()
    action = models.CharField(max_length=4, choices=ACTION_CHOICES)

    @property
    def fullname(self):
        donebyUser = self.commentByUser.id
        doneUserObj = get_object_or_404(User,pk=donebyUser)
        fullname = doneUserObj.first_name + " " + doneUserObj.last_name        
        return fullname

class PromotedToWallModel(TimeStampedModel):
    ACTION_CHOICES = (
        ('story', 'Story'),
        ('reel', 'Reel'),
    )
    for_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='for_user')
    content_type = models.CharField(max_length=5, choices=ACTION_CHOICES)
    content_id = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    
    def __str__(self):
        return f"{self.get_content_details()}"


    def save(self, *args, **kwargs):
        """
        Override save method to set the content_id dynamically before saving.
        """
        if self.content_id and self.content_type:
            model_name = self.content_type.capitalize()  # Ensure it matches 'Story' or 'Reel'
            try:
                model_class = apps.get_model('core', model_name)  # Update 'core' with your actual app name
                
                # Retrieve content instance dynamically
                if self.content_type == 'story':
                    content_instance = model_class.objects.filter(id=self.content_id).first()
                elif self.content_type == 'reel':
                    content_instance = model_class.objects.filter(caption=self.content_id).first()
                else:
                    content_instance = None  # If attributes are missing, avoid querying

            except LookupError:
                pass  # Handle invalid model name safely

        # Save the instance
        super().save(*args, **kwargs)


    def get_content_details(self):
        """
        Get the title or caption based on the content_type ('story' or 'reel').
        """
        if self.content_type not in dict(self.ACTION_CHOICES):
            raise ValueError("Invalid content_type value.")
        
        # Get the model based on the content_type
        model_name = self.content_type.capitalize()  # 'story' -> 'Story', 'reel' -> 'Reel'
        model_class = apps.get_model('core', model_name)  # Replace 'yourappname' with your actual app name
        
        # Get the instance of the model using content_id
        content_instance = model_class.objects.get(id=self.content_id)
        
        # Return the appropriate field based on the content type
        if self.content_type == 'story':
            return content_instance.title  # Return the title from the Story model
        elif self.content_type == 'reel':
            return content_instance.caption 

    
AUTH_USER_MODEL = getattr(settings, "AUTH_USER_MODEL", "auth.User")

CACHE_TYPES = {
    "friends": "f-%s",
    "followers": "fo-%s",
    "following": "fl-%s",
    "blocks": "b-%s",
    "blocked": "bo-%s",
    "blocking": "bd-%s",
    "requests": "fr-%s",
    "sent_requests": "sfr-%s",
    "unread_requests": "fru-%s",
    "unread_request_count": "fruc-%s",
    "read_requests": "frr-%s",
    "rejected_requests": "frj-%s",
    "unrejected_requests": "frur-%s",
    "unrejected_request_count": "frurc-%s",
}

BUST_CACHES = {
    "friends": ["friends"],
    "followers": ["followers"],
    "blocks": ["blocks"],
    "blocked": ["blocked"],
    "following": ["following"],
    "blocking": ["blocking"],
    "requests": [
        "requests",
        "unread_requests",
        "unread_request_count",
        "read_requests",
        "rejected_requests",
        "unrejected_requests",
        "unrejected_request_count",
    ],
    "sent_requests": ["sent_requests"],
}


def cache_key(type, user_pk):
    """
    Build the cache key for a particular type of cached value
    """
    return CACHE_TYPES[type] % user_pk


def bust_cache(type, user_pk):
    """
    Bust our cache for a given type, can bust multiple caches
    """
    bust_keys = BUST_CACHES[type]
    keys = [CACHE_TYPES[k] % user_pk for k in bust_keys]
    cache.delete_many(keys)


class FriendshipRequest(models.Model):
    """Model to represent friendship requests"""

    from_user = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendship_requests_sent",
    )
    to_user = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friendship_requests_received",
    )

    message = models.TextField(_("Message"), blank=True)

    created = models.DateTimeField(default=timezone.now)
    rejected = models.DateTimeField(blank=True, null=True)
    viewed = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = _("Friendship Request")
        verbose_name_plural = _("Friendship Requests")
        unique_together = ("from_user", "to_user")

    def __str__(self):
        return f"User #{self.from_user_id} friendship requested #{self.to_user_id}"

    def accept(self):
        """Accept this friendship request"""
        Friend.objects.create(from_user=self.from_user, to_user=self.to_user)

        Friend.objects.create(from_user=self.to_user, to_user=self.from_user)

        friendship_request_accepted.send(
            sender=self, from_user=self.from_user, to_user=self.to_user
        )

        self.delete()

        # Delete any reverse requests
        FriendshipRequest.objects.filter(
            from_user=self.to_user, to_user=self.from_user
        ).delete()

        # Bust requests cache - request is deleted
        bust_cache("requests", self.to_user.pk)
        bust_cache("sent_requests", self.from_user.pk)
        # Bust reverse requests cache - reverse request might be deleted
        bust_cache("requests", self.from_user.pk)
        bust_cache("sent_requests", self.to_user.pk)
        # Bust friends cache - new friends added
        bust_cache("friends", self.to_user.pk)
        bust_cache("friends", self.from_user.pk)
        return True

    def reject(self):
        """reject this friendship request"""
        self.rejected = timezone.now()
        self.save()
        friendship_request_rejected.send(sender=self)
        bust_cache("requests", self.to_user.pk)
        bust_cache("sent_requests", self.from_user.pk)
        return True

    def cancel(self):
        """cancel this friendship request"""
        friendship_request_canceled.send(sender=self)
        self.delete()
        bust_cache("requests", self.to_user.pk)
        bust_cache("sent_requests", self.from_user.pk)
        return True

    def mark_viewed(self):
        self.viewed = timezone.now()
        friendship_request_viewed.send(sender=self)
        self.save()
        bust_cache("requests", self.to_user.pk)
        return True


class FriendshipManager(models.Manager):
    """Friendship manager"""

    def friends(self, user):
        """Return a list of all friends"""
        key = cache_key("friends", user.pk)
        friends = cache.get(key)

        if friends is None:
            qs = Friend.objects.select_related("from_user").filter(to_user=user)
            friends = [u.from_user for u in qs]
            cache.set(key, friends)

        return friends

    def requests(self, user):
        """Return a list of friendship requests"""
        key = cache_key("requests", user.pk)
        requests = cache.get(key)

        if requests is None:
            qs = FriendshipRequest.objects.filter(to_user=user)
            qs = self._friendship_request_select_related(qs, "from_user", "to_user")
            requests = list(qs)
            cache.set(key, requests)

        return requests

    def sent_requests(self, user):
        """Return a list of friendship requests from user"""
        key = cache_key("sent_requests", user.pk)
        requests = cache.get(key)

        if requests is None:
            qs = FriendshipRequest.objects.filter(from_user=user)
            qs = self._friendship_request_select_related(qs, "from_user", "to_user")
            requests = list(qs)
            cache.set(key, requests)

        return requests

    def unread_requests(self, user):
        """Return a list of unread friendship requests"""
        key = cache_key("unread_requests", user.pk)
        unread_requests = cache.get(key)

        if unread_requests is None:
            qs = FriendshipRequest.objects.filter(to_user=user, viewed__isnull=True)
            qs = self._friendship_request_select_related(qs, "from_user", "to_user")
            unread_requests = list(qs)
            cache.set(key, unread_requests)

        return unread_requests

    def unread_request_count(self, user):
        """Return a count of unread friendship requests"""
        key = cache_key("unread_request_count", user.pk)
        count = cache.get(key)

        if count is None:
            count = FriendshipRequest.objects.filter(
                to_user=user, viewed__isnull=True
            ).count()
            cache.set(key, count)

        return count

    def read_requests(self, user):
        """Return a list of read friendship requests"""
        key = cache_key("read_requests", user.pk)
        read_requests = cache.get(key)

        if read_requests is None:
            qs = FriendshipRequest.objects.filter(to_user=user, viewed__isnull=False)
            qs = self._friendship_request_select_related(qs, "from_user", "to_user")
            read_requests = list(qs)
            cache.set(key, read_requests)

        return read_requests

    def rejected_requests(self, user):
        """Return a list of rejected friendship requests"""
        key = cache_key("rejected_requests", user.pk)
        rejected_requests = cache.get(key)

        if rejected_requests is None:
            qs = FriendshipRequest.objects.filter(to_user=user, rejected__isnull=False)
            qs = self._friendship_request_select_related(qs, "from_user", "to_user")
            rejected_requests = list(qs)
            cache.set(key, rejected_requests)

        return rejected_requests

    def unrejected_requests(self, user):
        """All requests that haven't been rejected"""
        key = cache_key("unrejected_requests", user.pk)
        unrejected_requests = cache.get(key)

        if unrejected_requests is None:
            qs = FriendshipRequest.objects.filter(to_user=user, rejected__isnull=True)
            qs = self._friendship_request_select_related(qs, "from_user", "to_user")
            unrejected_requests = list(qs)
            cache.set(key, unrejected_requests)

        return unrejected_requests

    def unrejected_request_count(self, user):
        """Return a count of unrejected friendship requests"""
        key = cache_key("unrejected_request_count", user.pk)
        count = cache.get(key)

        if count is None:
            count = FriendshipRequest.objects.filter(
                to_user=user, rejected__isnull=True
            ).count()
            cache.set(key, count)

        return count

    def add_friend(self, from_user, to_user, message=None):
        """Create a friendship request"""
        if from_user == to_user:
            raise ValidationError("Users cannot be friends with themselves")

        if self.are_friends(from_user, to_user):
            raise AlreadyFriendsError("Users are already friends")

        if FriendshipRequest.objects.filter(
            from_user=from_user, to_user=to_user
        ).exists():
            raise AlreadyExistsError("You already requested friendship from this user.")

        if FriendshipRequest.objects.filter(
            from_user=to_user, to_user=from_user
        ).exists() and not FriendshipRequest.objects.get(
            from_user=to_user, to_user=from_user
        ).rejected:
            raise AlreadyExistsError("This user already requested friendship from you.")

        if message is None:
            message = ""

        request, created = FriendshipRequest.objects.get_or_create(
            from_user=from_user, to_user=to_user
        )

        if created is False:
            raise AlreadyExistsError("Friendship already requested")

        if message:
            request.message = message
            request.save()

        bust_cache("requests", to_user.pk)
        bust_cache("sent_requests", from_user.pk)
        friendship_request_created.send(sender=request)

        return request

    def remove_friend(self, from_user, to_user):
        """Destroy a friendship relationship"""
        try:
            qs = Friend.objects.filter(
                to_user__in=[to_user, from_user], from_user__in=[from_user, to_user]
            )

            if qs:
                friendship_removed.send(
                    sender=qs[0], from_user=from_user, to_user=to_user
                )
                qs.delete()
                bust_cache("friends", to_user.pk)
                bust_cache("friends", from_user.pk)
                return True
            else:
                return False
        except Friend.DoesNotExist:
            return False

    def are_friends(self, user1, user2):
        """Are these two users friends?"""
        friends1 = cache.get(cache_key("friends", user1.pk))
        friends2 = cache.get(cache_key("friends", user2.pk))
        if friends1 and user2 in friends1:
            return True
        elif friends2 and user1 in friends2:
            return True
        else:
            try:
                Friend.objects.get(to_user=user1, from_user=user2)
                return True
            except Friend.DoesNotExist:
                return False

    def _friendship_request_select_related(self, qs, *fields):
        strategy = getattr(
            settings,
            "FRIENDSHIP_MANAGER_FRIENDSHIP_REQUEST_SELECT_RELATED_STRATEGY",
            "select_related",
        )
        if strategy == "select_related":
            qs = qs.select_related(*fields)
        elif strategy == "prefetch_related":
            qs = qs.prefetch_related(*fields)
        return qs


class Friend(models.Model):
    """Model to represent Friendships"""

    to_user = models.ForeignKey(AUTH_USER_MODEL, models.CASCADE, related_name="friends")
    from_user = models.ForeignKey(
        AUTH_USER_MODEL, models.CASCADE, related_name="_unused_friend_relation"
    )
    created = models.DateTimeField(default=timezone.now)

    objects = FriendshipManager()

    class Meta:
        verbose_name = _("Friend")
        verbose_name_plural = _("Friends")
        unique_together = ("from_user", "to_user")

    def __str__(self):
        return f"User #{self.to_user_id} is friends with #{self.from_user_id}"

    def save(self, *args, **kwargs):
        # Ensure users can't be friends with themselves
        if self.to_user == self.from_user:
            raise ValidationError("Users cannot be friends with themselves.")
        super().save(*args, **kwargs)

class FriendStoryActivityFeed(TimeStampedModel):
    ACTION_CHOICES = (
        ('spub', 'Published Story'),
        ('sedt', 'Edited Story'),
        ('slik', 'Liked Story'),
        ('slov', 'Loved Story'),
        ('scel', 'Celebrated Story'),
        ('scom', 'Commented On Story'),
        ('secm', 'Edited Comment On Story'),
        ('sulk', 'Unliked Story'),
        ('sulo', 'Unloved Story'),
        ('sucl', 'Uncelebrated Story')
    ) 
    ownerUser = models.ForeignKey(AUTH_USER_MODEL, models.CASCADE, related_name="s_owner_user")
    forUser = models.ManyToManyField(AUTH_USER_MODEL)
    action = models.CharField(max_length=4, choices=ACTION_CHOICES)
    story = models.ForeignKey(Story, models.CASCADE, related_name="action_on_story",null=True)

class FriendReelActivityFeed(TimeStampedModel):
    ACTION_CHOICES = (
        ('rlik', 'Liked Reel'),
        ('rlov', 'Loved Reel'),
        ('rcel', 'Celebrated Reel'),
        ('rulk', 'Unliked Reel'),
        ('rulo', 'Unloved Reel'),
        ('rucl', 'Uncelebrated Reel'),
        ('rcom', 'Commented On Reel'),
        ('recm', 'Edited Comment On Reel'),
    ) 
    ownerUser = models.ForeignKey(AUTH_USER_MODEL, models.CASCADE, related_name="r_owner_user")
    forUser = models.ManyToManyField(AUTH_USER_MODEL)
    action = models.CharField(max_length=4, choices=ACTION_CHOICES)
    reel = models.ForeignKey(Reel, models.CASCADE, related_name="action_on_reel",null=True)


class FollowingManager(models.Manager):
    """Following manager"""

    def list_followers(self, user):
        """Return a list of all followers"""
        key = cache_key("followers", user.pk)
        followers = cache.get(key)

        if followers is None:
            qs = Follow.objects.filter(followee=user).select_related("follower")
            followers = [u.follower for u in qs]
            cache.set(key, followers)

        return followers

    def list_following(self, user):
        """Return a list of all users the given user follows"""
        key = cache_key("following", user.pk)
        following = cache.get(key)

        if following is None:
            qs = Follow.objects.filter(follower=user).select_related("followee")
            following = [u.followee for u in qs]
            cache.set(key, following)

        return following

    def add_follower(self, follower, followee):
        """Create 'follower' follows 'followee' relationship"""
        if follower == followee:
            raise ValidationError("Users cannot follow themselves")

        relation, created = Follow.objects.get_or_create(
            follower=follower, followee=followee
        )

        if created is False:
            raise AlreadyExistsError(f"User '{follower}' already follows '{followee}'")

        follower_created.send(sender=self, follower=follower)
        followee_created.send(sender=self, followee=followee)
        following_created.send(sender=self, following=relation)

        bust_cache("followers", followee.pk)
        bust_cache("following", follower.pk)

        return relation

    def remove_follower(self, follower, followee):
        """Remove 'follower' follows 'followee' relationship"""
        try:
            rel = Follow.objects.get(follower=follower, followee=followee)
            follower_removed.send(sender=rel, follower=rel.follower)
            followee_removed.send(sender=rel, followee=rel.followee)
            following_removed.send(sender=rel, following=rel)
            rel.delete()
            bust_cache("followers", followee.pk)
            bust_cache("following", follower.pk)
            return True
        except Follow.DoesNotExist:
            return False

    def follows(self, follower, followee):
        return Follow.objects.filter(follower=follower, followee=followee).exists()


class Follow(models.Model):
    """Model to represent Following relationships"""

    follower = models.ForeignKey(
        AUTH_USER_MODEL, models.CASCADE, related_name="following"
    )
    followee = models.ForeignKey(
        AUTH_USER_MODEL, models.CASCADE, related_name="followers"
    )
    created = models.DateTimeField(default=timezone.now)

    objects = FollowingManager()

    class Meta:
        verbose_name = _("Following Relationship")
        verbose_name_plural = _("Following Relationships")
        unique_together = ("follower", "followee")

    def __str__(self):
        return f"User #{self.follower_id} follows #{self.followee_id}"

    def save(self, *args, **kwargs):
        # Ensure users can't be friends with themselves
        if self.follower == self.followee:
            raise ValidationError("Users cannot follow themselves.")
        super().save(*args, **kwargs)


class BlockManager(models.Manager):
    """Following manager"""

    def list_blocked(self, user):
        """Return a list of all blocks for current user"""
        key = cache_key("blocked", user.pk)
        blocked = cache.get(key)

        if blocked is None:
            qs = Block.objects.filter(blocked=user).select_related("blocker")
            blocked = [u.blocker for u in qs]
            cache.set(key, blocked)

        return blocked

    def list_blocking(self, user):
        """Return a list of all users the given user blocks"""
        key = cache_key("blocking", user.pk)
        blocking = cache.get(key)

        if blocking is None:
            qs = Block.objects.filter(blocker=user).select_related("blocked")
            blocking = [u.blocked for u in qs]
            cache.set(key, blocking)

        return blocking

    def add_block(self, blocker, blocked):
        """Create 'blocker' blocks 'blocked' relationship"""
        if blocker == blocked:
            raise ValidationError("Users cannot block themselves")

        relation, created = Block.objects.get_or_create(
            blocker=blocker, blocked=blocked
        )

        if created is False:
            raise AlreadyExistsError(f"User '{blocker}' already blocks '{blocked}'")

        block_created.send(sender=self, blocker=blocker)
        block_created.send(sender=self, blocked=blocked)
        block_created.send(sender=self, blocking=relation)

        bust_cache("blocked", blocked.pk)
        bust_cache("blocking", blocker.pk)

        return relation

    def remove_block(self, blocker, blocked):
        """Remove 'blocker' blocks 'blocked' relationship"""
        try:
            rel = Block.objects.get(blocker=blocker, blocked=blocked)
            block_removed.send(sender=rel, blocker=rel.blocker)
            block_removed.send(sender=rel, blocked=rel.blocked)
            block_removed.send(sender=rel, blocking=rel)
            rel.delete()
            bust_cache("blocked", blocked.pk)
            bust_cache("blocking", blocker.pk)
            return True
        except Block.DoesNotExist:
            return False

    def blocked(self, blocker, blocked):
        return Block.objects.filter(
            blocker=blocker, blocked=blocked
        ).exists()


class Block(models.Model):
    """Model to represent Following relationships"""

    blocker = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocking"
    )
    blocked = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blockees"
    )
    created = models.DateTimeField(default=timezone.now)

    objects = BlockManager()

    class Meta:
        verbose_name = _("Blocked Relationship")
        verbose_name_plural = _("Blocked Relationships")
        unique_together = ("blocker", "blocked")

    def __str__(self):
        return f"User #{self.blocker_id} blocks #{self.blocked_id}"

    def save(self, *args, **kwargs):
        # Ensure users can't be friends with themselves
        if self.blocker == self.blocked:
            raise ValidationError("Users cannot block themselves.")
        super().save(*args, **kwargs)

class Chatroom(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="participants")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="chatroom_owner")
    story = models.ForeignKey(Story, on_delete=models.CASCADE, null=True, blank=True)
    reel = models.ForeignKey(Reel, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Conversation(models.Model):
    chatroom_id = models.CharField(max_length=255)
    chatroom_object_id = models.CharField(max_length=255, null=True, blank=True)
    chatroom_owner_id = models.CharField(max_length=255, null=True, blank=True)
    chatroom_participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="list_participants")
    created_at = models.DateTimeField(auto_now_add=True)

    def get_chatroom_status(self):
        try:
            chatroom = get_object_or_404(Chatroom,id = self.chatroom_id)
            return True
        except Chatroom.DoesNotExist:
            return False
        

class Message(models.Model):
    conversation = models.ForeignKey(Conversation,on_delete=models.CASCADE,related_name="message")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)



class MapLocation(models.Model):
    place_id = models.CharField(max_length=255, unique=True)  # Google Maps Place ID
    name = models.CharField(max_length=255)  # Location name
    address = models.TextField()  # Full address
    latitude = models.FloatField()  # Latitude
    longitude = models.FloatField()  # Longitude
    viewport_northeast_lat = models.FloatField(null=True, blank=True)  # Viewport boundary
    viewport_northeast_lng = models.FloatField(null=True, blank=True)
    viewport_southwest_lat = models.FloatField(null=True, blank=True)
    viewport_southwest_lng = models.FloatField(null=True, blank=True)
    types = models.JSONField(null=True, blank=True)  # List of place types (e.g., ['restaurant', 'store'])
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp

    def __str__(self):
        return f"{self.name} ({self.latitude}, {self.longitude})"

