from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import CustomUser
from authentication.serializers import (
    RegisterSerializer, 
    CustomTokenObtainPairSerializer, 
    ForgotPasswordSerializer, 
    ResetPasswordSerializer
)
from dashboard.models import log_activity

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            log_activity(user, "User registered")
            return Response({
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "can_create_hackathon": user.can_create_hackathon,
                    "is_superuser": user.is_superuser
                },
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            log_activity(request.user, "User logged out")
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception:
            # If blacklisting is disabled, we still log out client-side
            log_activity(request.user, "User logged out (session cleared)")
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)

class ForgotPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = CustomUser.objects.filter(email=email).first()
            if user:
                # Mock password reset workflow - return success and log it
                log_activity(user, "Requested password reset link")
                return Response({
                    "detail": "Password reset instructions have been sent (Mocked).",
                    "reset_link": f"/reset-password?email={email}&phone={user.phone}" # Helper for testing/dev
                }, status=status.HTTP_200_OK)
            return Response({"detail": "If this email is registered, we have sent instructions."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            phone = serializer.validated_data['phone']
            new_password = serializer.validated_data['new_password']
            
            user = CustomUser.objects.filter(email=email, phone=phone).first()
            if user:
                user.set_password(new_password)
                user.save()
                log_activity(user, "Password reset successful")
                return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)
            return Response({"detail": "Invalid details. Verification failed."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

