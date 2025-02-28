import binascii
import json
import logging
from django.http import HttpResponse
from django.core.files.uploadedfile import InMemoryUploadedFile
from core.models import MapLocation
from rest_framework import viewsets
from rest_framework import status, mixins
from rest_framework.response import Response

from rest_framework import status
from rest_framework.response import Response
from rest_framework import viewsets
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
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

class EventViewset(viewsets.ModelViewSet):
    """View for manage recipe APIs."""
    queryset = MapLocation.objects.all()
    # permission_classes = [IsAuthenticated,IsReelOwnerOrReadOnly]
    # authentication_classes = (JWTCookieAuthentication,)
    # def _params_to_ints(self, qs):
    #     """Convert a list of strings to integers."""
    #     return [int(str_id) for str_id in qs.split(',')]
    

    # def get_queryset(self):
    #     queryset = self.queryset
    #     return queryset.filter(reel_owner=self.request.user).order_by('-updated_at').distinct()
    

    # def get_obj(self, id):
    #     obj = get_object_or_404(Reel, pk=id)
    #     return obj
    
    
    # def get_serializer_class(self):
    #     """Return appropriate serializer class"""
    #     if self.action == 'retrieve':
    #         return ReelSerializer
    #     elif self.action == 'upload_image':
    #         return ReelImageSerializer
    #     return self.serializer_class
    
    # def perform_create(self, serializer):
    #     reel_instance = serializer.save()
    #     logger.info(f"Reel {serializer.data.get('caption')} created by {self.request.user.first_name}!")
    #     return reel_instance.id  # Return the id of the created reel

    # def create(self, request, *args, **kwargs):
    #     serializer = self.get_serializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     reel_id = self.perform_create(serializer)
    #     headers = self.get_success_headers(serializer.data)
    #     return Response({'id': reel_id}, status=status.HTTP_201_CREATED, headers=headers)
    
    # def update(self, request, *args, **kwargs):
    #     serializer = self.get_serializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     self.perform_update(serializer)
    #     reel_id = serializer.instance.id
    #     headers = self.get_success_headers(serializer.data)
    #     return Response({'id': reel_id}, status=status.HTTP_202_ACCEPTED, headers=headers)
    

    
    # @action(methods=['POST'], detail=True, url_path='upload-image', permission_classes=[IsAuthenticated])
    # def upload_image(self, request, pk=None):
    #     """Upload an image to a recipe"""
    #     reel = self.get_object()
    #     serializer = self.get_serializer(
    #         reel,
    #         data=request.data
    #     )

    #     if serializer.is_valid():
    #         serializer.save()
    #         try:
    #             imgObj = get_object_or_404(ImageModel,linked_to="reels",linked_id=reel.id)
    #             imgObj.image_data = serializer.instance.image.url
    #             imgObj.save()
                
    #         except:
    #             imgObj = ImageModel.objects.create(linked_to="reels",linked_id=reel.id, owner=self.request.user,image_data=serializer.instance.image.url)
    #             imgObj.save()
    #         return Response(
    #             serializer.data,
    #             status=status.HTTP_200_OK
    #         )

    #     return Response(
    #         serializer.errors,
    #         status=status.HTTP_400_BAD_REQUEST
    #     )
    
    # @action(methods=['PUT'], detail=True, url_path='edit-image', permission_classes=[IsAuthenticated])
    # def edit_image(self, request, pk=None):
    #     image_data_url = request.data.get('image')
    #     data = request.data.copy()
    #     # Decode the data URL and save the image
        
    #     format, image_data = image_data_url.split(';base64,')  # Remove the data URL prefix
        
    #     binary_image = ContentFile(base64.b64decode(image_data))  
    #     # binary_image = base64.b64decode(image_data)
    #     image_file = InMemoryUploadedFile(
    #         binary_image,
    #         None,  # Field name (unused)
    #         'image.png',  # File name
    #         'image/png',  # Content type
    #         binary_image.size,
    #         None  # Content type extra headers (unused)
    #     )
    #     data['image'] = image_file
    #     reel = self.get_object()
    #     serializer = ReelImageSerializer(
    #         reel,
    #         data=data
    #     )

    #     if serializer.is_valid():
    #         serializer.save()
    #         try:
    #             imgObj = get_object_or_404(ImageModel,linked_to="reels",linked_id=reel.id)
    #             imgObj.image_data = serializer.instance.image.url
    #             imgObj.save()
                
    #         except:
    #             imgObj = ImageModel.objects.create(linked_to="reels",linked_id=reel.id, owner=self.request.user,image_data=serializer.instance.image.url)
    #             imgObj.save()
            
    #         return Response(
    #             serializer.data,
    #             status=status.HTTP_200_OK
    #         )
    #     return Response(
    #         serializer.errors,
    #         status=status.HTTP_400_BAD_REQUEST
    #     )
    


