"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# Import ViewSets
from users.views import CustomUserViewSet
from hackathons.views import HackathonViewSet
from memberships.views import HackathonMemberViewSet
from registrations.views import RegistrationViewSet
from teams.views import TeamViewSet, TeamInvitationViewSet
from announcements.views import AnnouncementViewSet, RuleViewSet, ScheduleItemViewSet
from leaderboard.views import ScoreViewSet, LeaderboardViewSet
from notifications.views import NotificationViewSet
from dashboard.views import ActivityLogViewSet, DashboardAnalyticsViewSet

router = DefaultRouter()
router.register(r'users', CustomUserViewSet, basename='user')
router.register(r'hackathons', HackathonViewSet, basename='hackathon')
router.register(r'memberships', HackathonMemberViewSet, basename='membership')
router.register(r'registrations', RegistrationViewSet, basename='registration')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'team-invitations', TeamInvitationViewSet, basename='teaminvitation')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'rules', RuleViewSet, basename='rule')
router.register(r'schedules', ScheduleItemViewSet, basename='schedule')
router.register(r'scores', ScoreViewSet, basename='score')
router.register(r'leaderboard', LeaderboardViewSet, basename='leaderboard')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'activity-logs', ActivityLogViewSet, basename='activitylog')
router.register(r'dashboard-analytics', DashboardAnalyticsViewSet, basename='dashboardanalytics')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

