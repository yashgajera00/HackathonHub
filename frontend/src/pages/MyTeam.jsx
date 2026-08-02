import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../services/api';
import { Users, Plus, ShieldCheck, Mail, LogOut, Check, X, RefreshCw, Trash, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function MyTeam() {
  const { activeHackathon } = useHackathon();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvites, setPendingInvites] = useState([]);

  // Create Team Form
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  // Invite user Form
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);

  // Edit Project Details Form
  const [projectForm, setProjectForm] = useState({
    project_title: '',
    project_description: '',
    project_submission_link: ''
  });
  const [savingProject, setSavingProject] = useState(false);
  const [submittingTeam, setSubmittingTeam] = useState(false);
  const [joinTeamName, setJoinTeamName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    if (activeHackathon) {
      fetchMyTeamState(false);
      
      const interval = setInterval(() => {
        fetchMyTeamState(true);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [activeHackathon?.id]);

  const fetchMyTeamState = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // Fetch teams user belongs to
      const response = await api.get('/teams/', {
        params: { my_only: true }
      });
      const userTeams = response.data.results || response.data;
      
      if (userTeams.length > 0) {
        const teamObj = userTeams[0];
        setTeam(teamObj);
        
        if (!silent) {
          setProjectForm({
            project_title: teamObj.project_title || '',
            project_description: teamObj.project_description || '',
            project_submission_link: teamObj.project_submission_link || ''
          });
        }

        if (teamObj.is_leader) {
          await fetchJoinRequests(silent);
        } else {
          setJoinRequests([]);
        }
      } else {
        setTeam(null);
        setJoinRequests([]);
        // If not in team, fetch pending team invitations sent to this user
        fetchPendingInvitations(silent);
        fetchSentRequests(silent);
      }
    } catch (e) {
      console.error(e);
      if (!silent) showToast('Failed to load team details.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchSentRequests = async (silent = false) => {
    try {
      const response = await api.get('/team-join-requests/', {
        params: { hackathon_id: activeHackathon.id }
      });
      const reqs = response.data.results || response.data;
      setSentRequests(reqs.filter(r => r.status === 'Pending'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await api.delete(`/team-join-requests/${requestId}/`);
      showToast('Join request cancelled.', 'success');
      setSentRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (e) {
      console.error(e);
      showToast('Failed to cancel join request.', 'error');
    }
  };

  const fetchPendingInvitations = async (silent = false) => {
    try {
      const response = await api.get('/team-invitations/my_invitations/');
      const newInvites = response.data.results || response.data;
      setPendingInvites(prev => {
        if (silent && newInvites.length > prev.length) {
          showToast(`You have received a new team invitation!`, 'info');
        }
        return newInvites;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJoinRequests = async (silent = false) => {
    try {
      const response = await api.get('/team-join-requests/', {
        params: { hackathon_id: activeHackathon.id }
      });
      const allReqs = (response.data.results || response.data).filter(r => r.status === 'Pending');
      setJoinRequests(prev => {
        if (silent && allReqs.length > prev.length) {
          const diffCount = allReqs.length - prev.length;
          showToast(`${diffCount} new team join request(s) received!`, 'info');
        }
        return allReqs;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestJoin = async (e) => {
    e.preventDefault();
    if (!joinTeamName) return;
    setJoining(true);
    try {
      await api.post('/team-invitations/request_join/', {
        team_name: joinTeamName,
        hackathon_id: activeHackathon.id
      });
      showToast(`Join request sent to the leader of team '${joinTeamName}'!`, 'success');
      setJoinTeamName('');
      fetchSentRequests();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to send join request.', 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleAcceptRequest = async (requestId, requesterName) => {
    try {
      await api.post(`/team-join-requests/${requestId}/accept/`);
      showToast(`Accepted ${requesterName} into the team!`, 'success');
      fetchMyTeamState();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to accept member.', 'error');
    }
  };

  const handleRejectRequest = async (requestId, requesterName) => {
    try {
      await api.post(`/team-join-requests/${requestId}/reject/`);
      showToast(`Declined ${requesterName}'s request.`, 'success');
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error(err);
      showToast('Failed to decline request.', 'error');
    }
  };

  const handleDeleteTeam = async () => {
    if (!(await confirm('Are you sure you want to delete this team? This action is permanent and will remove all members.', 'Delete Team'))) {
      return;
    }
    try {
      await api.delete(`/teams/${team.id}/`);
      showToast('Team deleted successfully.', 'success');
      setTeam(null);
      fetchMyTeamState();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to delete team.', 'error');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return;
    setCreating(true);
    try {
      await api.post('/teams/', {
        name: newTeamName,
        hackathon: activeHackathon.id
      });
      showToast('Team created successfully!', 'success');
      setNewTeamName('');
      fetchMyTeamState();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create team.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteUsername) return;
    setInviting(true);
    try {
      await api.post('/team-invitations/', {
        team: team.id,
        invitee_username: inviteUsername
      });
      showToast(`Invitation sent to ${inviteUsername}!`, 'success');
      setInviteUsername('');
      fetchMyTeamState(); // Refresh list to see invitations
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        const firstErrVal = Object.values(errors)[0];
        showToast(Array.isArray(firstErrVal) ? firstErrVal[0] : firstErrVal, 'error');
      } else {
        showToast('Failed to send invitation.', 'error');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (!team?.invite_code) return;
    const inviteLink = `${window.location.origin}/join-team/${team.invite_code}`;
    navigator.clipboard.writeText(inviteLink);
    showToast('Invite link copied to clipboard!', 'success');
  };

  const handleShareLink = async () => {
    if (!team?.invite_code) return;
    const inviteLink = `${window.location.origin}/join-team/${team.invite_code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join team ${team.name}`,
          text: `Join my team '${team.name}' in the hackathon!`,
          url: inviteLink,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(inviteLink);
      showToast('Invite link copied to clipboard!', 'success');
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      await api.post(`/team-invitations/${inviteId}/accept/`);
      showToast('Joined team successfully!', 'success');
      fetchMyTeamState();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to accept invitation.', 'error');
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      await api.post(`/team-invitations/${inviteId}/reject/`);
      showToast('Invitation declined.', 'success');
      fetchPendingInvitations();
    } catch (err) {
      console.error(err);
      showToast('Failed to decline invitation.', 'error');
    }
  };

  const handleSubmitTeam = async () => {
    if (!(await confirm('Are you sure you want to submit your team? You will not be able to modify the roster or deliverables until review is complete.', 'Submit Team'))) {
      return;
    }
    setSubmittingTeam(true);
    try {
      await api.post(`/teams/${team.id}/submit/`);
      showToast('Team submitted for approval!', 'success');
      fetchMyTeamState();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to submit team.', 'error');
    } finally {
      setSubmittingTeam(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!(await confirm('Are you sure you want to leave this team? If you are the only member, the team will be deleted.', 'Leave Team'))) {
      return;
    }
    try {
      await api.post(`/teams/${team.id}/leave/`);
      showToast('Left team.', 'success');
      fetchMyTeamState();
    } catch (err) {
      console.error(err);
      showToast('Failed to leave team.', 'error');
    }
  };

  const handleKick = async (memberUserId, memberName) => {
    if (!(await confirm(`Kick ${memberName} from the team?`, 'Remove Team Member'))) return;
    try {
      await api.post(`/teams/${team.id}/kick_member/`, { user_id: memberUserId });
      showToast('Member removed.', 'success');
      fetchMyTeamState();
    } catch (err) {
      console.error(err);
      showToast('Failed to kick member.', 'error');
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setSavingProject(true);
    try {
      await api.post(`/teams/${team.id}/submit_project/`, projectForm);
      showToast('Project details submitted!', 'success');
      fetchMyTeamState();
    } catch (err) {
      console.error(err);
      showToast('Failed to submit project details.', 'error');
    } finally {
      setSavingProject(false);
    }
  };

  if (!activeHackathon) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs text-gray-500 text-xs font-semibold">
          Please select a hackathon from the header menu to view your team details.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="h-60 bg-white border animate-pulse rounded-2xl"></div>;
  }

  // Not in a team
  if (!team) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Form */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold font-display text-gray-900">Form a Team</h2>
              <p className="text-xs text-gray-500 mt-1">To invite peers and participate, create a unique team.</p>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4 text-xs font-semibold text-gray-400">
              <div>
                <label className="block uppercase tracking-wider mb-2">Team Name</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition text-gray-800"
                  placeholder="Ex: CyberPunks"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {creating && <RefreshCw size={14} className="animate-spin" />}
                <span>Create Team</span>
              </button>
            </form>
          </div>

          {/* Join Form */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold font-display text-gray-900">Join a Team</h2>
              <p className="text-xs text-gray-500 mt-1">Enter a team name to send a join request to the leader.</p>
            </div>

            <form onSubmit={handleRequestJoin} className="space-y-4 text-xs font-semibold text-gray-400">
              <div>
                <label className="block uppercase tracking-wider mb-2">Team Name</label>
                <input
                  type="text"
                  required
                  value={joinTeamName}
                  onChange={(e) => setJoinTeamName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition text-gray-800"
                  placeholder="Ex: CyberPunks"
                />
              </div>
              <button
                type="submit"
                disabled={joining}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {joining && <RefreshCw size={14} className="animate-spin" />}
                <span>Request to Join</span>
              </button>
            </form>
          </div>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Incoming Team Invitations ({pendingInvites.length})</h3>
            <div className="grid grid-cols-1 gap-4">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Invite to join team: <span className="text-blue-600">{invite.team_name}</span></h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Sent on {new Date(invite.invited_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptInvite(invite.id)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-100 rounded-lg text-xs transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectInvite(invite.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-100 rounded-lg text-xs transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent Join Requests */}
        {sentRequests.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sent Join Requests ({sentRequests.length})</h3>
            <div className="grid grid-cols-1 gap-4">
              {sentRequests.map((req) => (
                <div key={req.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs flex items-center justify-between animate-fade-in">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Requested to join team: <span className="text-blue-600">{req.team_name}</span></h4>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[9px] bg-amber-50 text-amber-800 border border-amber-100 mt-1.5 inline-block">
                        Pending Approval
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelRequest(req.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-100 rounded-lg text-xs transition"
                  >
                    Cancel Request
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // User is in a team
  const isLeader = team.is_leader;
  
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-6">
      {/* Team Info Panel */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 truncate">{team.name}</h2>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Team</span>
          </div>
          {isLeader && (team.status === 'Pending' || team.status === 'Rejected') && (
            <button
              onClick={handleDeleteTeam}
              className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition"
              title="Delete Team"
            >
              <Trash size={16} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/80">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Team Status</span>
            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${
              team.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
              team.status === 'Submitted' ? 'bg-blue-50 text-blue-800 border-blue-100' :
              team.status === 'Rejected' ? 'bg-rose-50 text-rose-800 border-rose-100' :
              'bg-amber-50 text-amber-800 border-amber-100'
            }`}>
              {team.status || 'Pending'}
            </span>
          </div>

          <div className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/80">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Check-in Status</span>
            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border flex items-center space-x-1 ${
              team.all_members_checked_in
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {team.all_members_checked_in ? (
                <>
                  <CheckCircle2 size={10} className="text-emerald-600 shrink-0" />
                  <span>All Checked In ({team.checked_in_count || team.members.filter(m => m.checked_in).length}/{team.members.length})</span>
                </>
              ) : (
                <>
                  <Clock size={10} className="text-amber-600 shrink-0" />
                  <span>{team.checked_in_count || team.members.filter(m => m.checked_in).length}/{team.members.length} Checked In</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-100 my-2"></div>

        {/* Members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Team Roster</span>
            <span className="text-[10px] text-gray-400 font-medium">Check-in status</span>
          </div>
          <div className="space-y-2">
            {team.members.map((m) => {
              const u = m.user_details || {};
              const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
              const isCheckedIn = m.checked_in;
              
              return (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold p-2.5 bg-gray-50/60 rounded-xl border border-gray-100/70 hover:bg-gray-50 transition">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {u.username ? u.username.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <span className="text-gray-800 font-semibold truncate">{name}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-end">
                    {isCheckedIn && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60 flex items-center space-x-1">
                        <CheckCircle2 size={10} className="text-emerald-600 shrink-0" />
                        <span>Checked In</span>
                      </span>
                    )}

                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${m.role === 'Leader' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                      {m.role}
                    </span>
                    {isLeader && m.role !== 'Leader' && (team.status === 'Pending' || team.status === 'Rejected') && (
                      <button
                        onClick={() => handleKick(u.id, name)}
                        className="text-gray-400 hover:text-red-600 p-0.5 transition"
                        title="Kick Member"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Incoming Join Requests (Leader only) */}
      {isLeader && (team.status === 'Pending' || team.status === 'Rejected') && joinRequests.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Incoming Join Requests</h3>
          <div className="space-y-3">
            {joinRequests.map((req) => {
              const name = `${req.requester_details.first_name || ''} ${req.requester_details.last_name || ''}`.trim() || req.requester_details.username;
              return (
                <div key={req.id} className="flex items-center justify-between text-xs font-semibold p-2 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in">
                  <span className="text-gray-800 truncate max-w-[150px]">{name}</span>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => handleAcceptRequest(req.id, name)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                      title="Accept"
                    >
                      <Check size={14} className="stroke-[3]" />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id, name)}
                      className="p-1 text-red-650 hover:bg-red-50 rounded transition"
                      title="Decline"
                    >
                      <X size={14} className="stroke-[3]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Peer Form (Leader only) */}
      {isLeader && (team.status === 'Pending' || team.status === 'Rejected') && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Invite a Peer</h3>
          <form onSubmit={handleInviteUser} className="space-y-3 text-xs font-semibold text-gray-400">
            <div>
              <label className="block mb-1.5 uppercase tracking-wider">Username</label>
              <input
                type="text"
                required
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50/50 focus:bg-white transition text-gray-800"
                placeholder="Invite username"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={inviting}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {inviting && <RefreshCw size={12} className="animate-spin" />}
                <span>Send Team Invitation</span>
              </button>
              {team?.invite_code && (
                <button
                  type="button"
                  onClick={handleShareLink}
                  className="flex-1 py-2 border border-blue-200 hover:border-blue-300 text-blue-600 font-bold rounded-xl text-xs transition flex items-center justify-center bg-blue-50/20 hover:bg-blue-50/50"
                >
                  <span>Share Invite Link</span>
                </button>
              )}
            </div>
          </form>

          {team?.invite_code && (
            <>
              <div className="border-t border-gray-100 my-4"></div>
              
              <div className="space-y-2 text-xs font-semibold text-gray-400">
                <span className="block text-[10px] uppercase tracking-wider">Invite via Link</span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/join-team/${team.invite_code}`}
                    className="w-full min-w-0 flex-1 px-3 py-2 sm:py-1.5 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none text-gray-500 font-mono select-all truncate"
                  />
                  <div className="flex items-center space-x-2 shrink-0 justify-end">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 font-bold rounded-xl text-xs transition"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={handleShareLink}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 font-bold rounded-xl text-xs transition"
                    >
                      Share
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-normal leading-normal">
                  Share this link with other registered participants. Opening the link will immediately join them to your team.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Submit Team Panel (Leader only) */}
      {isLeader && (team.status === 'Pending' || team.status === 'Rejected') && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Submit Team</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Once submitted, your team will be reviewed by staff. Your roster and details will be locked.
          </p>
          
          {!team.all_members_checked_in && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-start space-x-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Team Check-In Required</div>
                <p className="text-[11px] text-amber-700 font-normal mt-0.5">
                  Not all team members have checked in ({team.checked_in_count || team.members.filter(m => m.checked_in).length}/{team.members.length} checked in). Every member must scan their event QR pass to check in.
                </p>
              </div>
            </div>
          )}

          {team.members.length < activeHackathon.min_team_size ? (
            <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-[10px] font-semibold leading-relaxed">
              Your team has {team.members.length} member(s). You need at least {activeHackathon.min_team_size} member(s) to submit (Max: {activeHackathon.max_team_size}).
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-[10px] font-semibold leading-relaxed">
              Team size is valid ({team.members.length} members). Ready to submit!
            </div>
          )}

          <button
            onClick={handleSubmitTeam}
            disabled={submittingTeam || team.members.length < activeHackathon.min_team_size}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1"
          >
            {submittingTeam && <RefreshCw size={12} className="animate-spin" />}
            <span>Submit Team</span>
          </button>
        </div>
      )}
    </div>
  );
}
