from django.dispatch import Signal
from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.apps import apps
import logging
from django.db.models.signals import m2m_changed
from django.apps import apps
from django.contrib.contenttypes.models import ContentType
import logging
from django.dispatch import receiver
from django.db.models.signals import m2m_changed
from django.contrib.contenttypes.models import ContentType
from django.apps import apps
from django.db import transaction

from django.dispatch import Signal

logger = logging.getLogger(__name__)
friendship_request_created = Signal()
friendship_request_rejected = Signal()
friendship_request_canceled = Signal()
friendship_request_viewed = Signal()
friendship_request_accepted = Signal()
friendship_removed = Signal()
follower_created = Signal()
follower_removed = Signal()
followee_created = Signal()
followee_removed = Signal()
following_created = Signal()
following_removed = Signal()
block_created = Signal()
block_removed = Signal()

# core/signals.py



# Handler function(s) — do not import Activity/Reel/Story at module import time.
def reel_likes_changed(sender, instance, action, pk_set, reverse, model, **kwargs):
    """
    Handler for Reel.likes m2m changes. Uses apps.get_model() lazily to fetch Activity.
    """
    if pk_set is None:
        return
    if action not in ("post_add", "post_remove"):
        return

    try:
        Activity = apps.get_model("core", "Activity")
    except LookupError:
        logger.exception("Activity model not available")
        return

    # Use ContentType for target info
    ct = ContentType.objects.get_for_model(instance.__class__)

    activities = []
    for user_pk in pk_set:
        if action == "post_add":
            activities.append(Activity(
                actor_id=user_pk,
                verb='like',
                target_content_type=ct,
                target_object_id=str(instance.pk),
                data={'target_type': 'reel'}
            ))
        else:
            # Option: delete original like instead of adding 'unlike'
            # Activity.objects.filter(actor_id=user_pk, verb='like', target_content_type=ct, target_object_id=str(instance.pk)).delete()
            activities.append(Activity(
                actor_id=user_pk,
                verb='unlike',
                target_content_type=ct,
                target_object_id=str(instance.pk),
                data={'target_type': 'reel'}
            ))

    if activities:
        Activity.objects.bulk_create(activities)



def _log_m2m_activity(sender, instance, action, reverse, model, pk_set, using, *, target_type=None, verb_add=None, verb_remove=None, **kwargs):
    """
    Generic m2m_changed logger.

    Django calls m2m_changed receivers with signature:
        (sender, instance, action, reverse, model, pk_set, using, **kwargs)

    We accept that signature and use keyword-only params to pass
    target_type and verbs when connecting.
    """
    if not pk_set:
        return

    # Only handle post_add/post_remove events
    if action not in ("post_add", "post_remove"):
        return

    try:
        # Lazy-load Activity model to avoid circular imports
        Activity = apps.get_model("core", "Activity")
    except LookupError:
        logger.exception("Activity model not available")
        return

    # determine verb
    verb = verb_add if action == "post_add" else verb_remove

    try:
        ct = ContentType.objects.get_for_model(instance.__class__)
    except Exception:
        logger.exception("ContentType lookup failed for %s", instance.__class__)
        return

    objs = []
    for user_pk in pk_set:
        # Build Activity instance but don't save one-by-one
        objs.append(Activity(
            actor_id=user_pk,
            verb=verb,
            target_content_type=ct,
            target_object_id=str(instance.pk),
            data={"target_type": target_type} if target_type else {}
        ))

    # Bulk create; ignore conflicts if you expect unique constraints
    try:
        with transaction.atomic():
            Activity.objects.bulk_create(objs, ignore_conflicts=True)
    except TypeError:
        # fallback for older Django versions that don't support ignore_conflicts
        try:
            Activity.objects.bulk_create(objs)
        except Exception:
            logger.exception("bulk_create fallback failed for m2m activity logging")
    except Exception:
        logger.exception("Failed bulk_create Activities for m2m change")


def connect_signals():
    """
    Connect m2m_changed handlers for story/reel reactions.
    Call this from AppConfig.ready().
    """
    try:
        Reel = apps.get_model("core", "Reel")
        Story = apps.get_model("core", "Story")
    except LookupError:
        logger.exception("Could not find Reel/Story models to connect signals")
        return

    # connect like/unlike handlers
    m2m_changed.connect(
        lambda sender, instance, action, reverse, model, pk_set, using, **kw:
            _log_m2m_activity(sender, instance, action, reverse, model, pk_set, using,
                              target_type="reel", verb_add="like", verb_remove="unlike"),
        sender=Reel.likes.through,
        weak=False,
        dispatch_uid="core_reel_likes_activity"
    )

    m2m_changed.connect(
        lambda sender, instance, action, reverse, model, pk_set, using, **kw:
            _log_m2m_activity(sender, instance, action, reverse, model, pk_set, using,
                              target_type="story", verb_add="like", verb_remove="unlike"),
        sender=Story.likes.through,
        weak=False,
        dispatch_uid="core_story_likes_activity"
    )

    # connect love/unlove handlers
    m2m_changed.connect(
        lambda sender, instance, action, reverse, model, pk_set, using, **kw:
            _log_m2m_activity(sender, instance, action, reverse, model, pk_set, using,
                              target_type="reel", verb_add="love", verb_remove="unlove"),
        sender=Reel.loves.through,
        weak=False,
        dispatch_uid="core_reel_loves_activity"
    )

    m2m_changed.connect(
        lambda sender, instance, action, reverse, model, pk_set, using, **kw:
            _log_m2m_activity(sender, instance, action, reverse, model, pk_set, using,
                              target_type="story", verb_add="love", verb_remove="unlove"),
        sender=Story.loves.through,
        weak=False,
        dispatch_uid="core_story_loves_activity"
    )

    # connect celebrate/uncelebrate handlers
    m2m_changed.connect(
        lambda sender, instance, action, reverse, model, pk_set, using, **kw:
            _log_m2m_activity(sender, instance, action, reverse, model, pk_set, using,
                              target_type="reel", verb_add="celebrate", verb_remove="uncelebrate"),
        sender=Reel.celebrates.through,
        weak=False,
        dispatch_uid="core_reel_celebrates_activity"
    )

    m2m_changed.connect(
        lambda sender, instance, action, reverse, model, pk_set, using, **kw:
            _log_m2m_activity(sender, instance, action, reverse, model, pk_set, using,
                              target_type="story", verb_add="celebrate", verb_remove="uncelebrate"),
        sender=Story.celebrates.through,
        weak=False,
        dispatch_uid="core_story_celebrates_activity"
    )

# Optionally call connect_signals() here only if you are sure models are loaded,
# but prefer to call it from AppConfig.ready():
# connect_signals()
