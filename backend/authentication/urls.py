from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from authentication.views import (
    RegisterView,
    CustomTokenObtainPairView,
    LogoutView,
    ForgotPasswordView,
    ResetPasswordView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
]
