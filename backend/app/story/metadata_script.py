
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from app.settings import AUTH_USER_MODEL
from core.models import Story,Reel,Camera,ImageMetaData
from PIL import Image
from PIL.ExifTags import TAGS

def get_exif(fn):
    ret = {}
    i = Image.open(fn)
    info = i._getexif()
    for tag, value in info.items():
        decoded = TAGS.get(tag, tag)
        ret[decoded] = value
    return ret

def strip_exif_data(img):
    image = Image.open(img)
    data = list(image.getdata())
    image_without_exif = Image.new(image.mode, image.size)
    image_without_exif.putdata(data)
    image_without_exif.close()

    return image_without_exif

logger = logging.getLogger(__name__)

def save_story_image_metadata(image_data,story_id, **kwargs):
    print(image_data)
    try:
        exif_data = get_exif(image_data[0])

        camera = Camera.objects.create(
            company_make = exif_data["Make"],
            model_name = exif_data["Model"]
        ) 

        ImageMetaData.objects.create(
            camera = camera,
            orientation = exif_data["Orientation"],
            iso = exif_data["ISOSpeedRatings"],
            exposureTime = exif_data["ExposureTime"],
            exposureValue = exif_data["ExposureBiasValue"],
            fnumber = exif_data["FNumber"],
            focalLength = exif_data["FocalLength"],
            xResolution = exif_data["XResolution"],
            yResolution = exif_data["YResolution"],
            brightness = exif_data["BrightnessValue"],
            photo_parent = "story",
            photo_parent_id = story_id
        )    
        logger.info(f"Metadata for story {story_id} saved and image returned for viewset operations!!")
        
        
    except Exception as e:
        logger.error(f"Error processing image metadata for story {story_id}: {e}")