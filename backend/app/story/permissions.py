from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
   def has_object_permission(self,request,view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True    
        return obj.owner == request.user
   
class IsReelOwnerOrReadOnly(permissions.BasePermission):
   def has_object_permission(self,request,view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True    
        return obj.reel_owner == request.user
   
class IsCommentOwnerOrReadOnly(permissions.BasePermission):
   def has_object_permission(self,request,view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True    
        return obj.commented_by == request.user
   

