import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Search, UserCheck, UserX, Check, Scan, SearchIcon, SlidersHorizontal } from 'lucide-react';
import Modal from '../components/Modal';

export default function RegistrationsList() {
  const { activeHackathon, activeHackathonRole } = useHackathon();
  const { showToast } = useToast();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [checkinFilter, setCheckinFilter] = useState('');

  useEffect(() => {
    if (activeHackathon) {
      fetchRegistrations(false);
      
      const interval = setInterval(() => {
        fetchRegistrations(true);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [activeHackathon, statusFilter, checkinFilter]);

  const fetchRegistrations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/registrations/', {
        params: { hackathon_id: activeHackathon.id }
      });
      setRegistrations(response.data.results || response.data);
    } catch (e) {
      console.error(e);
      if (!silent) showToast('Failed to load registrations.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/registrations/${id}/approve/`);
      showToast('Registration approved successfully! User is now a participant.', 'success');
      setRegistrations(prev => 
        prev.map(reg => reg.id === id ? { ...reg, status: 'Approved' } : reg)
      );
    } catch (err) {
      console.error(err);
      showToast('Failed to approve registration.', 'error');
    }
  };

  const handleReject = (id) => {
    setRejectingId(id);
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    try {
      await api.post(`/registrations/${rejectingId}/reject/`);
      showToast('Registration rejected.', 'success');
      setRegistrations(prev => 
        prev.map(reg => reg.id === rejectingId ? { ...reg, status: 'Rejected', checked_in: false, checked_in_at: null } : reg)
      );
    } catch (err) {
      console.error(err);
      showToast('Failed to reject registration.', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  const handleManualCheckIn = async (id) => {
    try {
      await api.post(`/registrations/${id}/check_in/`);
      showToast('Participant checked in successfully!', 'success');
      setRegistrations(prev => 
        prev.map(reg => reg.id === id ? { ...reg, checked_in: true, checked_in_at: new Date().toISOString() } : reg)
      );
    } catch (err) {
      console.error(err);
      showToast('Failed to complete check-in.', 'error');
    }
  };

  const isOrganizer = activeHackathonRole === 'Organizer';
  const isVolunteer = activeHackathonRole === 'Volunteer';
  const hasEditRights = isOrganizer || isVolunteer;

  // Filtered registrations
  const filteredRegs = registrations.filter(r => {
    const userObj = r.user_details || {};
    const fullName = `${userObj.first_name || ''} ${userObj.last_name || ''}`.toLowerCase();
    const username = (userObj.username || '').toLowerCase();
    const email = (userObj.email || '').toLowerCase();
    const searchLower = search.toLowerCase();

    const matchesSearch = fullName.includes(searchLower) || username.includes(searchLower) || email.includes(searchLower);
    
    // Status match
    const matchesStatus = statusFilter ? r.status === statusFilter : true;
    
    // Checkin match
    const matchesCheckin = checkinFilter 
      ? (checkinFilter === 'checked_in' ? r.checked_in : !r.checked_in)
      : true;

    return matchesSearch && matchesStatus && matchesCheckin;
  });

  return (
    <div className="space-y-6 py-4">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900">Registrations & Attendance</h2>
        <p className="text-xs text-gray-500 mt-1">Review participant applications and verify physical desk check-ins.</p>
      </div>

      {/* Filter Options */}
      <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by participant name, email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
          />
        </div>

        <div className="flex w-full md:w-auto items-center space-x-3 justify-end">
          <SlidersHorizontal size={16} className="text-gray-400" />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={checkinFilter}
            onChange={(e) => setCheckinFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            <option value="">Check-in Status</option>
            <option value="checked_in">Checked In</option>
            <option value="not_checked_in">Not Checked In</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="h-6 w-full bg-gray-50 animate-pulse rounded"></div>
          </div>
        ) : filteredRegs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Participant</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Registered</th>
                  <th className="px-6 py-4">Attendance</th>
                  {hasEditRights && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {filteredRegs.map((r) => {
                  const userObj = r.user_details || {};
                  const fullName = `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() || userObj.username;
                  
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/40 transition">
                      <td className="px-6 py-4 flex items-center space-x-3">
                        {userObj.avatar ? (
                          <img src={userObj.avatar} alt="" className="h-8 w-8 rounded-full object-cover border" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {userObj.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{fullName}</span>
                          <span className="text-[10px] text-gray-400">{userObj.email} • {userObj.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          r.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                          r.status === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                          'bg-red-50 text-red-800 border-red-100'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(r.registered_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {r.checked_in ? (
                          <span className="inline-flex items-center text-emerald-600 space-x-1">
                            <Check size={14} className="stroke-[3]" />
                            <span>Checked In</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">Not Present</span>
                        )}
                      </td>
                      {hasEditRights && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Organizer Registration Approvals */}
                            {isOrganizer && (
                              <>
                                {(r.status === 'Pending' || r.status === 'Rejected') && (
                                  <button
                                    onClick={() => handleApprove(r.id)}
                                    className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-100 rounded-lg transition"
                                    title="Approve registration"
                                  >
                                    Approve
                                  </button>
                                )}
                                {(r.status === 'Pending' || r.status === 'Approved') && (
                                  <button
                                    onClick={() => handleReject(r.id)}
                                    className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-100 rounded-lg transition"
                                    title="Reject registration"
                                  >
                                    Reject
                                  </button>
                                )}
                              </>
                            )}
                            
                            {r.status === 'Approved' && r.checked_in && (
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Ready</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400 text-xs">
            No registrations match this criteria.
          </div>
        )}
      </div>

      <Modal
        isOpen={rejectingId !== null}
        onClose={() => setRejectingId(null)}
        title="Confirm Rejection"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Are you sure you want to reject this registration? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setRejectingId(null)}
              className="px-4 py-2 border border-gray-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmReject}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
            >
              Reject Registration
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
