from rest_framework import permissions
from memberships.models import HackathonMember

def get_hackathon_id(request, view):
    # Try header first
    h_id = request.headers.get('X-Hackathon-Id')
    if h_id:
        return h_id
        
    # Try query parameters
    h_id = request.query_params.get('hackathon_id')
    if h_id:
        return h_id
        
    # Try view kwargs
    if view and hasattr(view, 'kwargs'):
        h_id = view.kwargs.get('hackathon_pk') or view.kwargs.get('hackathon_id') or view.kwargs.get('pk')
        if h_id:
            return h_id
            
    return None

class IsPlatformOwner(permissions.BasePermission):
    """
    Allows access only to Platform Owners (superuser).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser

class IsHackathonOrganizer(permissions.BasePermission):
    """
    Allows access to Platform Owners and Hackathon Organizers.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        if request.user.is_superuser:
            return True
            
        hackathon_id = get_hackathon_id(request, view)
        if not hackathon_id:
            return False
            
        return HackathonMember.objects.filter(
            hackathon_id=hackathon_id,
            user=request.user,
            role='Organizer',
            invitation_status='Accepted'
        ).exists()

class IsHackathonVolunteer(permissions.BasePermission):
    """
    Allows access to Platform Owners, Organizers, and Volunteers.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        if request.user.is_superuser:
            return True
            
        hackathon_id = get_hackathon_id(request, view)
        if not hackathon_id:
            return False
            
        return HackathonMember.objects.filter(
            hackathon_id=hackathon_id,
            user=request.user,
            role__in=['Organizer', 'Volunteer'],
            invitation_status='Accepted'
        ).exists()

class IsHackathonJudge(permissions.BasePermission):
    """
    Allows access to Judges of the hackathon.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        if request.user.is_superuser:
            return True
            
        hackathon_id = get_hackathon_id(request, view)
        if not hackathon_id:
            return False
            
        return HackathonMember.objects.filter(
            hackathon_id=hackathon_id,
            user=request.user,
            role='Judge',
            invitation_status='Accepted'
        ).exists()

class IsHackathonMentor(permissions.BasePermission):
    """
    Allows access to Mentors of the hackathon.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        if request.user.is_superuser:
            return True
            
        hackathon_id = get_hackathon_id(request, view)
        if not hackathon_id:
            return False
            
        return HackathonMember.objects.filter(
            hackathon_id=hackathon_id,
            user=request.user,
            role='Mentor',
            invitation_status='Accepted'
        ).exists()

class IsHackathonParticipant(permissions.BasePermission):
    """
    Allows access to Participants of the hackathon.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        if request.user.is_superuser:
            return True
            
        hackathon_id = get_hackathon_id(request, view)
        if not hackathon_id:
            return False
            
        return HackathonMember.objects.filter(
            hackathon_id=hackathon_id,
            user=request.user,
            role='Participant',
            invitation_status='Accepted'
        ).exists()
