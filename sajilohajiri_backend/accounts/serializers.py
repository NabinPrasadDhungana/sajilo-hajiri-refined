from rest_framework import serializers
from .models import User

# serializers go down here
class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password', 'placeholder': 'Password'}
        )

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'password',
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

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

    def get_avatar_url(self, obj):
        request = self.context.get('request', None)
        url = obj.avatar_url
        if url and request is not None:
            return request.build_absolute_uri(url)
        return url