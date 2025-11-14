from django.shortcuts import render
from .models import Class, Subject, ClassSubject, StudentClassEnrollment
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from .serializers import ClassSerializer, SubjectSerializer, ClassSubjectSerializer, StudentClassEnrollmentSerializer
from .permissions import AdminRole
from .filters import ClassFilter, SubjectFilter, ClassSubjectFilter, StudentClassEnrollmentFilter

# Create your views here.
class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [AdminRole]
    filterset_class = ClassFilter

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [AdminRole]
    filterset_class = SubjectFilter

class ClassSubjectViewSet(viewsets.ModelViewSet):
    queryset = ClassSubject.objects.all()
    serializer_class = ClassSubjectSerializer
    permission_classes = [AdminRole]
    filterset_class = ClassSubjectFilter

class StudentClassEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = StudentClassEnrollment.objects.all()
    serializer_class = StudentClassEnrollmentSerializer
    permission_classes = [AdminRole]
    filterset_class = StudentClassEnrollmentFilter