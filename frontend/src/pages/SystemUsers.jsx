import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import Modal from '../components/Modal';
import { Search, UserCheck, ShieldCheck, UserMinus, ShieldAlert } from 'lucide-react';

export default function SystemUsers() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // User activity logs modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/', {
        params: { search }
      });
      setUsers(response.data.results || response.data);
    } catch (e) {
      console.error(e);
      showToast('Failed to load users list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleCreatePermission = async (userObj) => {
    const nextVal = !userObj.can_create_hackathon;
    try {
      const response = await api.patch(`/users/${userObj.id}/`, {
        can_create_hackathon: nextVal
      });
      showToast(`Updated creation rights for ${userObj.username}.`, 'success');
      setUsers(prev => prev.map(u => u.id === userObj.id ? { ...u, ...response.data } : u));
    } catch (e) {
      showToast('Failed to update permissions.', 'error');
    }
  };

  const toggleSuspension = async (userObj) => {
    if (userObj.id === user?.id) {
      showToast('You cannot suspend yourself.', 'error');
      return;
    }

    const nextVal = !userObj.is_active;
    const confirmMsg = nextVal 
      ? `Activate account for ${userObj.username}?`
      : `Suspend account for ${userObj.username}? Suspended users cannot login or request tokens.`;
    
    if (!(await confirm(confirmMsg, 'Confirm Suspension Toggle'))) return;

    try {
      const response = await api.patch(`/users/${userObj.id}/`, {
        is_active: nextVal
      });
      showToast(`Account status updated for ${userObj.username}.`, 'success');
      setUsers(prev => prev.map(u => u.id === userObj.id ? { ...u, ...response.data } : u));
    } catch (e) {
      const errMsg = e.response?.data?.detail || 'Failed to update account status.';
      showToast(errMsg, 'error');
    }
  };

  const handleOpenUserLogs = async (userObj) => {
    setSelectedUser(userObj);
    setLoadingLogs(true);
    setUserLogs([]);
    try {
      const response = await api.get('/activity-logs/', {
        params: { user_id: userObj.id }
      });
      setUserLogs(response.data.results || response.data);
    } catch (e) {
      console.error(e);
      showToast('Failed to load user logs.', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <div className="space-y-6 py-4 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900">System Users Control</h2>
        <p className="text-xs text-gray-500 mt-1">Manage global user credentials, suspend memberships, and assign event creation rights.</p>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-xs">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, username, email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">Loading users...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Can Host Hackathons</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {users.map((u) => {
                  const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                  
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/30 transition">
                      <td className="px-6 py-4 flex items-center space-x-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="h-8 w-8 rounded-full object-cover border" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{name}</span>
                          <button
                            onClick={() => handleOpenUserLogs(u)}
                            className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline font-semibold text-left transition mt-0.5"
                            title="Click to view user activity logs"
                          >
                            {u.email}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-100">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleCreatePermission(u)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition ${
                            u.can_create_hackathon || u.is_staff
                              ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                              : 'bg-gray-50 text-gray-400 border-gray-250 hover:bg-gray-100'
                          }`}
                        >
                          {u.can_create_hackathon || u.is_staff ? 'Granted' : 'Standard'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.id === user?.id ? (
                          <span className="text-[10px] text-gray-400 italic font-semibold">Current User</span>
                        ) : (
                          <button
                            onClick={() => toggleSuspension(u)}
                            className={`p-1 px-2.5 rounded-lg font-bold border transition ${
                              u.is_active
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100'
                            }`}
                          >
                            {u.is_active ? 'Suspend' : 'Unsuspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400 text-xs">
            No users match this search criteria.
          </div>
        )}
      </div>

      <Modal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        title={`Activity Logs: ${selectedUser?.username}`}
      >
        {loadingLogs ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">Loading activity logs...</div>
        ) : userLogs.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {userLogs.map((log) => (
              <div key={log.id} className="p-3 bg-gray-50 border border-gray-100/50 rounded-xl space-y-1">
                <p className="text-xs text-gray-800 font-semibold">{log.action}</p>
                {log.details && <p className="text-[10px] text-gray-400 leading-relaxed">{log.details}</p>}
                <div className="text-[9px] font-bold text-gray-400 uppercase pt-0.5">
                  {new Date(log.timestamp).toLocaleString('en-US', { timeZone: 'UTC' })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 font-medium">No activity logged for this user.</div>
        )}
      </Modal>
    </div>
  );
}
