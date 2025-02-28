from django.http import HttpResponseForbidden

class AuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if the request is for a static file
        if request.path.startswith('/static/'):
            # Check if the user is authenticated
            if not request.user.is_authenticated:
                return HttpResponseForbidden('Authentication required for static file access.')

        return self.get_response(request)
