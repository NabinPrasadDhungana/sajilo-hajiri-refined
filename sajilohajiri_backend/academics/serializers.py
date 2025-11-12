from rest_framework import serializers
from .models import Class, Subject, ClassSubject, StudentClassEnrollment

# Serializers go down here
class ClassSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    name = serializers.CharField(required=True)
    year = serializers.IntegerField(required=True)
    semester = serializers.IntegerField(required=True)
    department = serializers.CharField(required=True)

    class Meta:
        model = Class
        fields = '__all__'

class SubjectSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    name = serializers.CharField(required=True)
    code = serializers.CharField(required=True)

    class Meta:
        model = Subject
        fields = '__all__'
