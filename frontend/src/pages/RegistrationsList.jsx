import React, { useState, useEffect, useCallback } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Search, UserCheck, UserX, Check, Scan, SearchIcon, SlidersHorizontal, RefreshCw } from 'lucide-react';
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
    }
  }, [activeHackathon, statusFilter, checkinFilter]);

  const fetchRegistrations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/registrations/', {
        params: { hackathon_id: activeHackathon.id }
      });
      const newData = response.data.results || response.data;
      
      setRegistrations(prev => {
        let changed = false;
        const updated = prev.map(item => {
          const newItem = newData.find(n => n.id === item.id);
          if (!newItem) return item;
          
          const isItemChanged = item.status !== newItem.status || 
                                item.checked_in !== newItem.checked_in;
          
          if (isItemChanged) {
            changed = true;
            return newItem;
          }
          return item;
        });

        if (newData.length !== prev.length) {
          return newData;
        }
        
        return changed ? updated : prev;
      });
    } catch (e) {
      console.error(e);
      if (!silent) showToast('Failed to load registrations.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStatusChange = useCallback((id, updatedReg) => {
    setRegistrations(prev => 
      prev.map(reg => reg.id === id ? updatedReg : reg)
    );
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900">Registrations & Attendance</h2>
          <p className="text-xs text-gray-500 mt-1">Review participant applications and verify physical desk check-ins.</p>
        </div>
        <button
          onClick={() => fetchRegistrations(false)}
          className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-700 transition flex items-center justify-center"
          title="Refresh List"
        >
          <RefreshCw size={16} />
        </button>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {filteredRegs.map((r) => (
                  <RegistrationRow
                    key={r.id}
                    r={r}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400 text-xs">
            No registrations match this criteria.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {typeof totalCount !== 'undefined' && totalCount > 10 && (
        <div className="flex items-center justify-between bg-white border border-gray-100 px-4 py-3 rounded-2xl shadow-xs">
          <span className="text-xs text-gray-500 font-medium">Page {page} of {Math.ceil(totalCount / 10)}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!prevPage}
              className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!nextPage}
              className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const RegistrationRow = React.memo(({ r }) => {
  const userObj = r.user_details || {};
  const fullName = `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() || userObj.username;

  return (
    <tr className="hover:bg-gray-50/40 transition">
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
    </tr>
  );
});
