from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import CustomUser
from users.serializers import UserSerializer, PlatformOwnerUserSerializer
from common.permissions import IsPlatformOwner
from dashboard.models import log_activity

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('-date_joined')
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def get_permissions(self):
        if self.action in ['list', 'create', 'destroy', 'update', 'partial_update']:
            return [IsPlatformOwner()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.user.is_superuser:
            return PlatformOwnerUserSerializer
        return UserSerializer

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """
        GET or UPDATE current authenticated user's profile
        """
        user = request.user
        if request.method == 'GET':
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)
        
        serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            log_activity(user, "Updated profile", details=f"Profile updated by user {user.username}")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

