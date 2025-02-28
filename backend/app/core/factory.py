# factories.py
import random
import uuid
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from factory import DjangoModelFactory, Faker, LazyAttribute, SubFactory, post_generation
from io import BytesIO
from PIL import Image
from .models import Reel, Tag, Story

User = get_user_model()

def generate_image():
    """Generate a random image and return as ContentFile."""
    image = Image.new('RGB', (600, 800), color=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)))
    buffer = BytesIO()
    image.save(buffer, format='JPEG')
    return ContentFile(buffer.getvalue(), 'test_image.jpg')

class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    first_name = Faker('first_name')
    last_name = Faker('last_name')
    email = Faker('email')
    username = LazyAttribute(lambda obj: obj.email)
    password = Faker('password')

class ReelFactory(DjangoModelFactory):
    class Meta:
        model = Reel

    caption = Faker('sentence', nb_words=6)
    image = LazyAttribute(lambda _: generate_image())
    reel_owner = SubFactory(UserFactory)
    

class TagFactory(DjangoModelFactory):
    class Meta:
        model = Tag

    name = Faker('word')

class StoryFactory(DjangoModelFactory):
    class Meta:
        model = Story

    title = Faker('sentence', nb_words=4)
    description = Faker('sentence', nb_words=10)
    longDescription = Faker('paragraph', nb_sentences=3)
    image = LazyAttribute(lambda _: generate_image())
    owner = SubFactory(UserFactory)

    @post_generation
    def reels(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.reels.add(*extracted)
        else:
            # Create a random number of reels if none are provided
            reels = ReelFactory.create_batch(random.randint(1, 5))
            self.reels.add(*reels)

    @post_generation
    def tags(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.tags.add(*extracted)
        else:
            # Create a random number of tags if none are provided
            tags = TagFactory.create_batch(random.randint(1, 5))
            self.tags.add(*tags)
