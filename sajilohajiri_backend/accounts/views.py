from django.shortcuts import render
from rest_framework import viewsets
from .models import User
from .serializers import UserSerializer
from django_filters.rest_framework import DjangoFilterBackend
from .filters import UserFilter
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny

# Create your views here.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    filterset_class = UserFilter
    
    # def get_permissions(self):
    #     if self.request.method not in ['POST', 'PUT', 'PATCH', 'DELETE']:
    #         permission_classes = [AllowAny]
    #     return super().get_permissions()