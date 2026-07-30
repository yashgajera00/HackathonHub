import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Users, Plus, ShieldCheck, Mail, LogOut, Check, X, RefreshCw, Trash } from 'lucide-react';

export default function MyTeam() {
  const { activeHackathon } = useHackathon();
  const { showToast } = useToast();

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

  useEffect(() => {
    if (activeHackathon) {
      fetchMyTeamState();
    }
  }, [activeHackathon]);

  const fetchMyTeamState = async () => {
    try {
      setLoading(true);
      // Fetch teams user belongs to
      const response = await api.get('/teams/');
      const userTeams = response.data.results || response.data;
      
      if (userTeams.length > 0) {
        const teamObj = userTeams[0];
        setTeam(teamObj);
        setProjectForm({
          project_title: teamObj.project_title || '',
          project_description: teamObj.project_description || '',
          project_submission_link: teamObj.project_submission_link || ''
        });
      } else {
        setTeam(null);
        // If not in team, fetch pending team invitations sent to this user
        fetchPendingInvitations();
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load team details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      const response = await api.get('/team-invitations/my_invitations/');
      setPendingInvites(response.data.results || response.data);
    } catch (e) {
      console.error(e);
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
    if (!window.confirm('Are you sure you want to submit your team? You will not be able to modify the roster or deliverables until review is complete.')) {
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
    if (!window.confirm('Are you sure you want to leave this team? If you are the only member, the team will be deleted.')) {
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
    if (!window.confirm(`Kick ${memberName} from the team?`)) return;
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

  if (loading) {
    return <div className="h-60 bg-white border animate-pulse rounded-2xl"></div>;
  }

  // Not in a team
  if (!team) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
        {/* Create Form */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-2xl font-bold font-display text-gray-900">Form a Team</h2>
            <p className="text-sm text-gray-500 mt-1">To submit a project or invite peers, create a unique team register.</p>
          </div>

          <form onSubmit={handleCreateTeam} className="flex space-x-3 items-end text-xs font-semibold text-gray-400">
            <div className="flex-grow">
              <label className="block uppercase tracking-wider mb-2">Team Name</label>
              <input
                type="text"
                required
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="Ex: CyberPunks"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              {creating && <RefreshCw size={14} className="animate-spin" />}
              <span>Create Team</span>
            </button>
          </form>
        </div>

        {/* Pending Invites */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Incoming Team Invitations ({pendingInvites.length})</h3>
          {pendingInvites.length > 0 ? (
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
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-xs">
              No team invitations are currently pending.
            </div>
          )}
        </div>
      </div>
    );
  }

  // User is in a team
  const isLeader = team.is_leader;
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Team Info Panel */}
      <div className="space-y-6 md:col-span-1">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 truncate">{team.name}</h2>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Team</span>
            </div>
          </div>

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

          <div className="border-t border-gray-100 my-2"></div>

          {/* Members */}
          <div className="space-y-3">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Team Roster</span>
            <div className="space-y-2">
              {team.members.map((m) => {
                const u = m.user_details || {};
                const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                
                return (
                  <div key={m.id} className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-gray-800 truncate max-w-[120px]">{name}</span>
                    </div>

                    <div className="flex items-center space-x-2">
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
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50/50 focus:bg-white transition"
                  placeholder="Invite username"
                />
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {inviting && <RefreshCw size={12} className="animate-spin" />}
                <span>Send Team Invitation</span>
              </button>
            </form>
          </div>
        )}

        {/* Submit Team Panel (Leader only) */}
        {isLeader && (team.status === 'Pending' || team.status === 'Rejected') && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Submit Team</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Once submitted, your team will be reviewed by staff. Your roster and project details will be locked.
            </p>
            
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

      {/* Project Submission Form Panel */}
      <div className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900">Project Deliverables</h2>
          <p className="text-sm text-gray-500 mt-1">Submit your workspace and project details to judges.</p>
        </div>

        {isLeader && (team.status === 'Pending' || team.status === 'Rejected') ? (
          <form onSubmit={handleProjectSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Project Title</label>
              <input
                type="text"
                required
                value={projectForm.project_title}
                onChange={(e) => setProjectForm({ ...projectForm, project_title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="Ex: Decentralized Medical Ledgers"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Project Description</label>
              <textarea
                required
                rows={5}
                value={projectForm.project_description}
                onChange={(e) => setProjectForm({ ...projectForm, project_description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="Give a detailed overview of what problem you are solving, tech stacks used, and implementation milestones..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Project Repository Link (e.g. GitHub URL)</label>
              <input
                type="url"
                required
                value={projectForm.project_submission_link}
                onChange={(e) => setProjectForm({ ...projectForm, project_submission_link: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="https://github.com/myusername/myrepository"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProject}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-sm transition disabled:opacity-50 flex items-center space-x-1.5"
              >
                {savingProject && <RefreshCw size={14} className="animate-spin" />}
                <span>Save Deliverables</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Title</h4>
                <p className="text-sm font-semibold text-gray-800 mt-1">{team.project_title || 'No submission title.'}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-line">{team.project_description || 'No description provided.'}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Repository Link</h4>
                {team.project_submission_link ? (
                  <a 
                    href={team.project_submission_link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-block text-xs font-bold text-blue-600 hover:underline mt-1"
                  >
                    {team.project_submission_link}
                  </a>
                ) : (
                  <p className="text-xs text-gray-400 mt-1 italic">No repo submitted.</p>
                )}
              </div>
            </div>
            
            {team.status === 'Submitted' ? (
              <div className="p-4 bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl flex items-start space-x-3 text-xs">
                <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" />
                <p>This team is currently <strong>Submitted (Awaiting Approval)</strong>. Roster and project deliverables are locked for review.</p>
              </div>
            ) : team.status === 'Approved' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-start space-x-3 text-xs">
                <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>Congratulations! Your team has been <strong>Approved & Selected</strong>. All details are finalized.</p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl flex items-start space-x-3 text-xs">
                <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p>Only the Team Leader (<span className="font-semibold">{team.created_by_username}</span>) has rights to update project submissions.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
