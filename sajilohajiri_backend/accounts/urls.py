from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, FaceEncodingUpdateAPIView

router = DefaultRouter()

router.register('users', UserViewSet, basename='user')

urlpatterns = [
    path('face-encoding/<str:pk>/', FaceEncodingUpdateAPIView.as_view(), name='face_encoding')
]

urlpatterns += router.urls
