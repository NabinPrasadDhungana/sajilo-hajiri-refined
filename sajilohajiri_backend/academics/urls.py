from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ClassViewSet, SubjectViewSet, ClassSubjectViewSet

router = DefaultRouter()

router.register('classes', ClassViewSet, basename='class')
router.register('subjects', SubjectViewSet, basename='subject')
router.register('class-subject', ClassSubjectViewSet, basename='class-subject')

urlpatterns = [
    
]

urlpatterns += router.urls
