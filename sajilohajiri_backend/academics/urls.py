from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ClassViewSet, SubjectViewSet

router = DefaultRouter()

router.register('classes', ClassViewSet, basename='class')
router.register('subjects', SubjectViewSet, basename='subject')

urlpatterns = [
    
]

urlpatterns += router.urls
