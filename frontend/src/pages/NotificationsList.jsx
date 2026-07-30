import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { useHackathon } from '../context/HackathonContext';
import api from '../services/api';
import { Bell, Check, Clock } from 'lucide-react';

export default function NotificationsList() {
  const { showToast } = useToast();
  const { selectHackathon } = useHackathon();

  const [notifications, setNotifications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/notifications/');
      const newData = response.data.results || response.data;
      
      setNotifications(prev => {
        if (prev.length !== newData.length) return newData;
        
        const hasChanged = prev.some(item => {
          const newItem = newData.find(n => n.id === item.id);
          return !newItem || item.read !== newItem.read;
        });
        
        return hasChanged ? newData : prev;
      });
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await api.get('/memberships/my_invitations/');
      const newData = response.data.results || response.data;
      
      setInvitations(prev => {
        if (prev.length !== newData.length) return newData;
        
        const hasChanged = prev.some(item => {
          const newItem = newData.find(n => n.id === item.id);
          return !newItem || item.role !== newItem.role;
        });
        
        return hasChanged ? newData : prev;
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchAlerts(false);
    fetchInvitations();

    const interval = setInterval(() => {
      fetchAlerts(true);
      fetchInvitations();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchAlerts, fetchInvitations]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark_all_as_read/');
      showToast('All notifications marked as read.', 'success');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      showToast('Failed to mark read.', 'error');
    }
  }, [showToast]);

  const handleMarkRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleAcceptInvite = useCallback(async (id) => {
    try {
      const response = await api.post(`/memberships/${id}/accept_invitation/`);
      showToast(`Accepted invitation to join ${response.data.hackathon_details.title}!`, 'success');
      setInvitations(prev => prev.filter(invite => invite.id !== id));
      selectHackathon(response.data.hackathon);
    } catch (err) {
      console.error(err);
      showToast('Failed to accept invitation.', 'error');
    }
  }, [showToast, selectHackathon]);

  const handleRejectInvite = useCallback(async (id) => {
    try {
      await api.post(`/memberships/${id}/reject_invitation/`);
      showToast('Invitation declined.', 'success');
      setInvitations(prev => prev.filter(invite => invite.id !== id));
    } catch (err) {
      console.error(err);
      showToast('Failed to decline invitation.', 'error');
    }
  }, [showToast]);

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
              <NotificationRow
                key={n.id}
                n={n}
                onMarkRead={handleMarkRead}
              />
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

const NotificationRow = React.memo(({ n, onMarkRead }) => {
  const [read, setRead] = useState(n.read);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRead(n.read);
  }, [n.read]);

  const handleMarkRead = async () => {
    try {
      setLoading(true);
      await api.post(`/notifications/${n.id}/mark_as_read/`);
      setRead(true);
      if (onMarkRead) {
        onMarkRead(n.id);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div 
      className={`p-5 flex items-start justify-between space-x-4 transition-all duration-300 hover:bg-gray-50/20 ${!read ? 'bg-blue-50/20' : ''}`}
    >
      <div className="flex items-start space-x-3.5">
        <span className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${!read ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
          <Bell size={16} />
        </span>
        <div>
          <h4 className={`text-sm font-bold text-gray-800 ${!read ? 'text-gray-900 font-extrabold' : ''}`}>{n.title}</h4>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-2 inline-block">
            {new Date(n.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      {!read && (
        <div className="flex items-center justify-center flex-shrink-0">
          {loading ? (
            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
          ) : (
            <button
              onClick={handleMarkRead}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Mark as read"
            >
              <Check size={14} className="stroke-[3]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});
