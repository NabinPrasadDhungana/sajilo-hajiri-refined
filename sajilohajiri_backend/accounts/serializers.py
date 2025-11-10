from rest_framework import serializers
from .models import User

# serializers go down here
class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'name',
            'avatar',
            'avatar_url',
            'role',
            'roll_number',
            'semester',
            'section',
            'department',
            'approval_status',
            'feedback',
        ]

    def get_avatar_url(self, obj):
        request = self.context.get('request', None)
        url = obj.avatar_url
        if url and request is not None:
            return request.build_absolute_uri(url)
        return url