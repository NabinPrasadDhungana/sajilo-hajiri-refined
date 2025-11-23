from django.shortcuts import render
from rest_framework import viewsets
from .models import User
from .serializers import UserSerializer
from django_filters.rest_framework import DjangoFilterBackend
from .filters import UserFilter
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from academics.permissions import AdminRole
from rest_framework import views
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from face.models import FaceEncoding
import face_recognition
import json

# Create your views here.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    filterset_class = UserFilter
    search_fields = ['name', 'email', 'roll_number']
    ordering_fields = ['name', 'email', 'roll_number']
    ordering = ['roll_number']
    
    def perform_create(self, serializer):
        if serializer.validated_data['role'] != 'student':
           serializer.save(roll_number=None, semester=None, section=None, department=None)
        else:
            serializer.save()

    # def get_permissions(self):
    #     if self.request.method not in ['POST', 'PUT', 'PATCH', 'DELETE']:
    #         permission_classes = [AllowAny]
    #     return super().get_permissions()

class FaceEncodingUpdateAPIView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    http_method_names = ['patch']

    def update(self, request, *args, **kwargs):
        print(request.user.role)
        partial = kwargs.pop('partial', True)
        try:
            instance = self.get_object()
        except User.DoesNotExist:
            raise Response(status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'admin' and request.data.get('approval_status') == 'approved':
            if not (instance.role == 'student' and 
            instance.approval_status == 'approved' and 
            instance.avatar and 
            not FaceEncoding.objects.filter(student=instance).exists()):
                return Response({'detail': 'Face encoding not required or already exists'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                # Use context manager for safe file handling
                with instance.avatar.open(mode='rb') as image_file:
                    image = face_recognition.load_image_file(image_file)
                    encodings = face_recognition.face_encodings(image)
                
                if encodings:
                    encoding_data = json.dumps(encodings[0].tolist())
                    FaceEncoding.objects.create(student=instance, encoding_data=encoding_data)
                    serializer = self.get_serializer(instance, data=request.data, partial=partial)
                    serializer.is_valid(raise_Exception=True)
                    self.perform_update(serializer)
                    print(f"Face encoding saved for {instance.email}")
                    return Response(serializer.data)
                    
                else:
                    print(f"No face found for {instance.email}")
                    return Response({'detail': 'No face found!'}, status=status.HTTP_400_BAD_REQUEST)
                    
            except FileNotFoundError:
                print(f"Avatar file missing for {instance.email}")
                return Response({'detail': 'Avatar file missing!'}, status=status.HTTP_400_BAD_REQUEST)
            
            except Exception as e:
                print(f"Error processing face for {instance.email}: {str(e)}")
                return Response({'detail': f"Error processing face for {instance.email}: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        else:
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
            