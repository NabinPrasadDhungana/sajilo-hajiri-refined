from rest_framework.permissions import BasePermission

class AdminRole(BasePermission):

    def has_permission(self, request, view):
        return request.user.role=='admin' or request.user.is_staff
    
class OnlyAuthenticated(BasePermission):

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        else:
            if request.method in ['POST', 'PATCH', 'DELETE', 'PUT'] and not (request.user.role=='admin' or request.user.is_staff): 
                return False
            return True