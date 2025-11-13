from rest_framework.permissions import BasePermission

class AdminRole(BasePermission):

    def has_permission(self, request, view):
        return request.user.role=='admin'