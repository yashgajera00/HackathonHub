import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useHackathon } from '../context/HackathonContext';
import api from '../services/api';
import { Bell, Check, X, Clock, Eye, Trash } from 'lucide-react';

export default function NotificationsList() {
  const { showToast } = useToast();
  const { selectHackathon } = useHackathon();

  const [notifications, setNotifications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts(false);
    fetchInvitations();

    const interval = setInterval(() => {
      fetchAlerts(true);
      fetchInvitations();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/notifications/');
      setNotifications(response.data.results || response.data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await api.get('/memberships/my_invitations/');
      setInvitations(response.data.results || response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark_all_as_read/');
      showToast('All notifications marked as read.', 'success');
      fetchAlerts();
    } catch (e) {
      showToast('Failed to mark read.', 'error');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_as_read/`);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptInvite = async (id) => {
    try {
      const response = await api.post(`/memberships/${id}/accept_invitation/`);
      showToast(`Accepted invitation to join ${response.data.hackathon_details.title}!`, 'success');
      fetchInvitations();
      // Select the hackathon automatically
      selectHackathon(response.data.hackathon);
    } catch (err) {
      console.error(err);
      showToast('Failed to accept invitation.', 'error');
    }
  };

  const handleRejectInvite = async (id) => {
    try {
      await api.post(`/memberships/${id}/reject_invitation/`);
      showToast('Invitation declined.', 'success');
      fetchInvitations();
    } catch (err) {
      console.error(err);
      showToast('Failed to decline invitation.', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 grid grid-cols-1 gap-8">
      {/* Hackathon Invitations Section */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Hackathon Invitations ({invitations.length})</h2>
          <div className="space-y-4">
            {invitations.map((invite) => (
              <div 
                key={invite.id} 
                className="bg-white border border-blue-100 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-slow"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl flex-shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">
                      Join <span className="text-blue-600">{invite.hackathon_details.title}</span> as {invite.role}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Invited by: {invite.invited_by_username}</p>
                  </div>
                </div>

                <div className="flex space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleAcceptInvite(invite.id)}
                    className="flex-grow sm:flex-grow-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    Accept Join
                  </button>
                  <button
                    onClick={() => handleRejectInvite(invite.id)}
                    className="flex-grow sm:flex-grow-0 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Alerts list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-gray-900">Notifications & History</h2>
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="h-32 bg-white border animate-pulse rounded-3xl"></div>
        ) : notifications.length > 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs divide-y divide-gray-50">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-5 flex items-start justify-between space-x-4 transition hover:bg-gray-50/20 ${!n.read ? 'bg-blue-50/20' : ''}`}
              >
                <div className="flex items-start space-x-3.5">
                  <span className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${!n.read ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                    <Bell size={16} />
                  </span>
                  <div>
                    <h4 className={`text-sm font-bold text-gray-800 ${!n.read ? 'text-gray-900 font-extrabold' : ''}`}>{n.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-2 inline-block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check size={14} className="stroke-[3]" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 text-xs">
            No notifications history.
          </div>
        )}
      </div>
    </div>
  );
}
