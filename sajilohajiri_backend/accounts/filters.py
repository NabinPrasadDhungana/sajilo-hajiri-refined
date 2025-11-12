import django_filters
from .models import User

# FilterSet classes below:
class UserFilter(django_filters.FilterSet):
    class Meta:
        model = User
        fields = {
            'email': ['icontains'],
            'name': ['icontains'],
            'role': ['exact'],
            'roll_number': ['contains'],
            'semester': ['exact'],
            'section': ['exact'],
            'department': ['exact'],
            'approval_status': ['exact'],    
        }