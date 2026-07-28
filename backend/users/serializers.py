from rest_framework import serializers
from users.models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone', 'avatar', 'can_create_hackathon', 'password',
            'is_active', 'is_staff', 'date_joined'
        )
        read_only_fields = ('id', 'can_create_hackathon', 'is_active', 'is_staff', 'date_joined')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class PlatformOwnerUserSerializer(serializers.ModelSerializer):
    """
    Platform Owner serializer that can change can_create_hackathon and suspension statuses.
    """
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone', 'avatar', 'can_create_hackathon', 'password',
            'is_active', 'is_staff', 'date_joined'
        )
        read_only_fields = ('id', 'date_joined')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
