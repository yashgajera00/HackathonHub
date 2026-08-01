import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import { Search, MapPin, Calendar, Users, SlidersHorizontal, ArrowRight, Sparkles, Trophy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function HackathonsList() {
  const { user, refreshUser } = useAuth();
  const { selectHackathon, activeHackathonId } = useHackathon();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && refreshUser) {
      refreshUser().catch(err => console.error("Error refreshing user profile", err));
    }
  }, []);

  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  // Users' registration states (to prevent double register clicks)
  const [regs, setRegs] = useState({});

  useEffect(() => {
    fetchHackathons(false);
    fetchUserRegistrations();

    const interval = setInterval(() => {
      fetchHackathons(true);
      fetchUserRegistrations();
    }, 5000);

    return () => clearInterval(interval);
  }, [search, statusFilter, ordering, page]);

  const fetchHackathons = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = {
        search,
        page,
        ordering,
      };
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/hackathons/', { params });
      
      if (response.data.results) {
        setHackathons(response.data.results);
        setTotalCount(response.data.count);
        setNextPage(response.data.next);
        setPrevPage(response.data.previous);
      } else {
        setHackathons(response.data);
      }
    } catch (e) {
      console.error(e);
      if (!silent) showToast('Failed to load hackathons.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    try {
      const response = await api.get('/registrations/');
      const mapping = {};
      const data = response.data.results || response.data;
      data.forEach(r => {
        mapping[r.hackathon] = r.status;
      });
      setRegs(mapping);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegister = async (hackathonId) => {
    try {
      const response = await api.post('/registrations/', { hackathon: hackathonId });
      showToast('Registration submitted! Awaiting organizer approval.', 'success');
      setRegs({
        ...regs,
        [hackathonId]: 'Pending'
      });
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to submit registration.', 'error');
    }
  };

  const handleEnterDashboard = (hackathonId) => {
    selectHackathon(hackathonId);
    navigate('/');
  };

  return (
    <div className="space-y-8 py-4">
      {/* Hero Banner Banner */}
      <div className="bg-linear-to-br from-blue-600 via-indigo-600 to-violet-700 text-white rounded-3xl p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="space-y-4 max-w-xl relative z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-md">
            <Sparkles size={12} />
            <span>Discover & Create Hackathons</span>
          </div>
          <h1 className="text-2xl md:text-5xl font-extrabold font-display leading-tight tracking-tight m-0">
            Build the Future at HackathonHub.
          </h1>
          <p className="text-sm md:text-base text-blue-100 font-medium">
            Join elite developer cohorts, form cross-functional teams, build production-grade prototypes, and pitch to global judges.
          </p>
        </div>
        
        {user?.can_create_hackathon && (
          <Link 
            to="/create-hackathon" 
            className="px-6 py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition shadow-lg relative z-10 flex-shrink-0 flex items-center space-x-2"
          >
            <span>Host a Hackathon</span>
            <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by title, location, description..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
          />
        </div>

        {/* Filters */}
        <div className="flex w-full md:w-auto items-center space-x-3 justify-end">
          <SlidersHorizontal size={16} className="text-gray-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Registration Open">Registration Open</option>
            <option value="Registration Closed">Registration Closed</option>
            <option value="Running">Running</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={ordering}
            onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            <option value="-created_at">Newest First</option>
            <option value="start_date">Starts Soonest</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid of Hackathons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl h-80 animate-pulse"></div>
          ))}
        </div>
      ) : hackathons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((h) => {
            const userRole = h.role;
            const regStatus = regs[h.id];

            return (
              <div 
                key={h.id} 
                className="bg-white border border-gray-100 hover:border-blue-200 rounded-2xl shadow-xs hover:shadow-md transition overflow-hidden flex flex-col group"
              >
                {/* Banner */}
                <div className="h-32 bg-gray-100 relative overflow-hidden">
                  {h.banner ? (
                    <img src={h.banner} alt={h.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Trophy size={40} className="text-white/20" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <span className={`absolute top-4 right-4 px-2 py-1 text-xs font-bold rounded-lg ${
                    h.status === 'Registration Open' ? 'bg-emerald-500 text-white' :
                    h.status === 'Running' ? 'bg-blue-600 text-white' :
                    h.status === 'Draft' ? 'bg-gray-500 text-white' :
                    'bg-gray-800 text-white'
                  }`}>
                    {h.status}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex-grow flex flex-col space-y-4">
                  <div>
                    <h3 className="text-lg font-bold font-display text-gray-900 group-hover:text-blue-600 transition truncate">{h.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{h.description || 'No description provided.'}</p>
                  </div>

                  {/* Meta items */}
                  <div className="space-y-1.5 text-xs text-gray-500 font-medium">
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{new Date(h.start_date).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })} - {new Date(h.end_date).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="truncate">{h.venue}, {h.city}, {h.country}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users size={14} className="text-gray-400" />
                      <span>Teams: {h.min_team_size}-{h.max_team_size} members</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                    {userRole ? (
                      <>
                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center space-x-1">
                          <span>{userRole}</span>
                        </span>
                        <button
                          onClick={() => handleEnterDashboard(h.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition"
                        >
                          Enter Dashboard
                        </button>
                      </>
                    ) : regStatus ? (
                      <>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          regStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          regStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          Reg: {regStatus}
                        </span>
                        {regStatus === 'Approved' ? (
                          <button
                            onClick={() => handleEnterDashboard(h.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition"
                          >
                            Enter Dashboard
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-semibold">Awaiting Action</span>
                        )}
                      </>
                    ) : h.status === 'Registration Open' ? (
                      <>
                        <span className="text-xs text-gray-400">Not Registered</span>
                        <button
                          onClick={() => handleRegister(h.id)}
                          className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl text-xs transition"
                        >
                          Register to Participate
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-gray-400">Registrations Closed</span>
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-100 text-gray-400 font-semibold rounded-xl text-xs transition cursor-not-allowed"
                        >
                          Closed
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-500 shadow-xs">
          <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 font-display">No hackathons discovered</h3>
          <p className="text-sm mt-1">Try refining search query or filters.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > 10 && (
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
