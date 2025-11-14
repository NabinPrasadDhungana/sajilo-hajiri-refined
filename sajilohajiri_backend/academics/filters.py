import django_filters
from .models import Class, Subject, ClassSubject, StudentClassEnrollment

# Filters go down hare:
class ClassFilter(django_filters.FilterSet):
    created_at = django_filters.DateFilter(field_name='created_at__date')
    updated_at = django_filters.DateFilter(field_name='updated_at__date')

    class Meta:
        model = Class
        fields = {
            'name': ['icontains'],
            'year': ['contains'],
            'semester': ['exact'],
            'department': ['exact'],
            'created_at': ['lt', 'gt', 'exact'],
            'updated_at': ['lt', 'gt', 'exact'],
        }

class SubjectFilter(django_filters.FilterSet):
    created_at = django_filters.DateFilter(field_name='created_at__date')
    updated_at = django_filters.DateFilter(field_name='updated_at__date')

    class Meta:
        model = Subject
        fields = {
            'name': ['icontains'],
            'code': ['icontains'],
            'created_at': ['lt', 'gt', 'exact'],
            'updated_at': ['lt', 'gt', 'exact'],
        }

class ClassSubjectFilter(django_filters.FilterSet):
    created_at = django_filters.DateFilter(field_name='created_at__date')
    updated_at = django_filters.DateFilter(field_name='updated_at__date')

    class Meta:
        model = ClassSubject
        fields = {
            'class_instance': ['exact'],
            'subject': ['exact'],
            'teacher': ['exact'],
            'created_at': ['lt', 'gt', 'exact'],
            'updated_at': ['lt', 'gt', 'exact'],
        }

class StudentClassEnrollmentFilter(django_filters.FilterSet):

    class Meta:
        model = StudentClassEnrollment
        fields = {
            'student': ['exact'],
            'enrolled_class': ['exact'],
        }
