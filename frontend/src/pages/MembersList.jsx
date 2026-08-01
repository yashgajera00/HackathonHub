import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../services/api';
import { UserPlus, Trash2, CheckCircle, Clock, Trash, RefreshCw, X } from 'lucide-react';

export default function MembersList() {
  const { activeHackathon } = useHackathon();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'Volunteer'
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (activeHackathon) {
      fetchMembers();
    }
  }, [activeHackathon]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      // Fetch all memberships for this hackathon
      const response = await api.get('/memberships/', {
        params: { hackathon_id: activeHackathon.id }
      });
      setMembers(response.data.results || response.data);
    } catch (e) {
      console.error(e);
      showToast('Failed to load memberships.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteData.email) return;
    setInviting(true);
    try {
      await api.post('/memberships/', {
        hackathon: activeHackathon.id,
        email: inviteData.email,
        role: inviteData.role
      });
      showToast(`Invitation sent to ${inviteData.email} as ${inviteData.role}!`, 'success');
      setShowInviteForm(false);
      setInviteData({ email: '', role: 'Volunteer' });
      fetchMembers();
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        const firstErrKey = Object.keys(errors)[0];
        const firstErrVal = errors[firstErrKey];
        const msg = Array.isArray(firstErrVal) ? firstErrVal[0] : firstErrVal;
        showToast(msg, 'error');
      } else {
        showToast('Failed to send invitation.', 'error');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id, name) => {
    if (!(await confirm(`Are you sure you want to remove ${name} from this hackathon?`, 'Remove Member'))) return;
    try {
      await api.post(`/memberships/${id}/remove_member/`);
      showToast('Member removed successfully.', 'success');
      fetchMembers();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to remove member.', 'error');
    }
  };

  // Group members
  const acceptedMembers = members.filter(m => m.invitation_status === 'Accepted');
  const pendingInvites = members.filter(m => m.invitation_status === 'Pending');

  // Group by role
  const organizers = acceptedMembers.filter(m => m.role === 'Organizer');
  const volunteers = acceptedMembers.filter(m => m.role === 'Volunteer');
  const judges = acceptedMembers.filter(m => m.role === 'Judge');
  const mentors = acceptedMembers.filter(m => m.role === 'Mentor');
  const participants = acceptedMembers.filter(m => m.role === 'Participant');

  const renderRoleSection = (title, list) => {
    if (list.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title} ({list.length})</h3>
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {list.map((m) => {
                const u = m.user_details || {};
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                
                return (
                  <tr key={m.id} className="hover:bg-gray-50/40">
                    <td className="px-6 py-3 flex items-center space-x-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="h-7 w-7 rounded-full object-cover border" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-bold text-gray-900">{fullName}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{u.email}</td>
                    <td className="px-6 py-3 text-gray-500">{u.phone || 'N/A'}</td>
                    <td className="px-6 py-3 text-right">
                      {m.role !== 'Organizer' && (
                        <button
                          onClick={() => handleRemove(m.id, fullName)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded transition"
                          title="Remove member"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900">Event Staff & Roles</h2>
          <p className="text-xs text-gray-500 mt-1">Invite and manage organizers, volunteers, mentors, and judges.</p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <UserPlus size={14} />
          <span>Invite Member</span>
        </button>
      </div>

      {showInviteForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end text-xs font-medium">
            <div className="sm:col-span-1">
              <label className="block text-gray-400 uppercase font-bold tracking-wider mb-2">Email</label>
              <input
                type="email"
                required
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="member@example.com"
              />
            </div>
            <div>
              <label className="block text-gray-400 uppercase font-bold tracking-wider mb-2">Role Choice</label>
              <select
                value={inviteData.role}
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="Volunteer">Volunteer</option>
                <option value="Judge">Judge</option>
                <option value="Mentor">Mentor</option>
                <option value="Organizer">Organizer</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={inviting}
                className="flex-grow py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {inviting && <RefreshCw size={12} className="animate-spin" />}
                <span>Send Invite</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="p-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-500"
              >
                <X size={15} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Invitations ({pendingInvites.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {pendingInvites.map((invite) => {
              const u = invite.user_details || {};
              return (
                <div key={invite.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <Clock size={16} className="text-amber-500 flex-shrink-0" />
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-gray-800">{u.username}</span>
                      <span className="text-gray-400 mt-0.5">Role: {invite.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(invite.id, u.username)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded transition"
                    title="Cancel Invite"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List Accepted Members grouped by role */}
      {loading ? (
        <div className="h-32 bg-white border rounded-2xl animate-pulse"></div>
      ) : (
        <div className="space-y-6">
          {renderRoleSection('Organizers', organizers)}
          {renderRoleSection('Volunteers', volunteers)}
          {renderRoleSection('Judges', judges)}
          {renderRoleSection('Mentors', mentors)}
          {renderRoleSection('Participants', participants)}
        </div>
      )}
    </div>
  );
}
