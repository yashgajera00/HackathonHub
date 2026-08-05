import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../services/api';
import { 
  Calendar, MapPin, Users, BookOpen, Clock, Plus, Trash2, 
  Sparkles, CheckCircle, ShieldCheck, Trophy, RefreshCw, AlertTriangle, Tag, CheckCircle2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function HackathonDetails() {
  const { activeHackathon, activeHackathonRole, refreshHackathonDetails } = useHackathon();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialTab = searchParams.get('tab') || 'schedule';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'schedule';
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };
  const [schedule, setSchedule] = useState([]);
  const [rules, setRules] = useState([]);
  const [titles, setTitles] = useState([]);
  const [userRegistration, setUserRegistration] = useState(null);
  
  // Loading flags
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [loadingRegistration, setLoadingRegistration] = useState(false);

  // Forms
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showTitleForm, setShowTitleForm] = useState(false);
  
  const [scheduleData, setScheduleData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    venue: '',
  });

  const [ruleData, setRuleData] = useState({
    title: '',
    content: '',
  });

  const [titleData, setTitleData] = useState({
    title: '',
    description: '',
  });

  const [registering, setRegistering] = useState(false);

  const handleRegister = async () => {
    if (!activeHackathon) return;
    setRegistering(true);
    try {
      await api.post('/registrations/', { hackathon: activeHackathon.id });
      showToast('Registration submitted successfully!', 'success');
      await fetchUserRegistration();
      if (refreshHackathonDetails) refreshHackathonDetails();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to submit registration.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    if (activeHackathon) {
      fetchSchedule(false);
      fetchRules(false);
      fetchTitles(false);
      fetchUserRegistration(false);

      const interval = setInterval(() => {
        refreshHackathonDetails(true);
        fetchSchedule(true);
        fetchRules(true);
        fetchTitles(true);
        fetchUserRegistration(true);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [activeHackathon?.id, activeHackathonRole]);

  const fetchUserRegistration = async (silent = false) => {
    try {
      if (!silent) setLoadingRegistration(true);
      const response = await api.get('/registrations/', {
        params: { hackathon_id: activeHackathon.id }
      });
      const regs = response.data.results || response.data;
      if (regs.length > 0) {
        setUserRegistration(regs[0]);
      } else {
        setUserRegistration(null);
      }
    } catch (e) {
      console.error("Failed to fetch user registration", e);
      setUserRegistration(null);
    } finally {
      if (!silent) setLoadingRegistration(false);
    }
  };

  const fetchSchedule = async (silent = false) => {
    try {
      if (!silent) setLoadingSchedule(true);
      const response = await api.get('/schedules/', {
        params: { hackathon_id: activeHackathon.id }
      });
      setSchedule(response.data.results || response.data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoadingSchedule(false);
    }
  };

  const fetchRules = async (silent = false) => {
    try {
      if (!silent) setLoadingRules(true);
      const response = await api.get('/rules/', {
        params: { hackathon_id: activeHackathon.id }
      });
      setRules(response.data.results || response.data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoadingRules(false);
    }
  };

  const fetchTitles = async (silent = false) => {
    try {
      if (!silent) setLoadingTitles(true);
      const response = await api.get('/hackathon-titles/', {
        params: { hackathon_id: activeHackathon.id }
      });
      setTitles(response.data.results || response.data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoadingTitles(false);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/schedules/', {
        ...scheduleData,
        hackathon: activeHackathon.id
      });
      showToast('Schedule item added!', 'success');
      setShowScheduleForm(false);
      setScheduleData({ title: '', description: '', start_time: '', end_time: '', venue: '' });
      fetchSchedule();
    } catch (err) {
      console.error(err);
      showToast('Failed to add schedule item.', 'error');
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rules/', {
        ...ruleData,
        hackathon: activeHackathon.id
      });
      showToast('Rule added!', 'success');
      setShowRuleForm(false);
      setRuleData({ title: '', content: '' });
      fetchRules();
    } catch (err) {
      console.error(err);
      showToast('Failed to add rule.', 'error');
    }
  };

  const handleAddTitle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hackathon-titles/', {
        ...titleData,
        hackathon: activeHackathon.id
      });
      showToast('Problem title added!', 'success');
      setShowTitleForm(false);
      setTitleData({ title: '', description: '' });
      fetchTitles();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to add problem title.', 'error');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!(await confirm('Delete this schedule item?', 'Delete Schedule Item'))) return;
    try {
      await api.delete(`/schedules/${id}/`);
      showToast('Schedule item deleted.', 'success');
      fetchSchedule();
    } catch (e) {
      showToast('Failed to delete.', 'error');
    }
  };

  const handleDeleteRule = async (id) => {
    if (!(await confirm('Delete this rule?', 'Delete Rule'))) return;
    try {
      await api.delete(`/rules/${id}/`);
      showToast('Rule deleted.', 'success');
      fetchRules();
    } catch (e) {
      showToast('Failed to delete.', 'error');
    }
  };

  const handleDeleteTitle = async (id) => {
    if (!(await confirm('Delete this problem title?', 'Delete Title'))) return;
    try {
      await api.delete(`/hackathon-titles/${id}/`);
      showToast('Problem title deleted.', 'success');
      fetchTitles();
    } catch (e) {
      showToast('Failed to delete.', 'error');
    }
  };

  if (!activeHackathon) {
    return (
      <div className="h-60 bg-white border border-gray-100 rounded-3xl p-8 flex items-center justify-center text-gray-400 font-medium animate-pulse">
        Loading event details...
      </div>
    );
  }

  const isOrganizer = activeHackathonRole === 'Organizer';

  return (
    <div className="space-y-8 py-4">
      {/* Banner */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="h-48 bg-gray-100 relative">
          {activeHackathon.banner ? (
            <img src={activeHackathon.banner} alt={activeHackathon.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
              <Trophy size={48} className="text-white/20" />
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-auto flex items-center space-x-3 md:space-x-4 bg-white/95 backdrop-blur-md px-3 md:px-4 py-2.5 rounded-2xl border border-gray-200/50 shadow-lg md:max-w-lg">
            {activeHackathon.logo ? (
              <img src={activeHackathon.logo} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                {activeHackathon.title.slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm md:text-base font-bold font-display text-gray-900 leading-tight truncate">{activeHackathon.title}</h2>
              <span className="text-[10px] font-bold text-blue-600 uppercase mt-0.5 inline-block">Active Role: {activeHackathonRole}</span>
            </div>
          </div>
        </div>

        {/* Briefing */}
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-sm text-gray-600">
          <div className="md:col-span-2 space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">About the Hackathon</h3>
            <p className="leading-relaxed">{activeHackathon.description || 'No description provided.'}</p>
          </div>
          <div className="space-y-4 bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Event Timeline</h3>
            <div className="space-y-2.5 text-xs font-semibold text-gray-700">
              <div className="flex items-center space-x-2">
                <Calendar size={14} className="text-gray-400" />
                <span>Starts: {new Date(activeHackathon.start_date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={14} className="text-gray-400" />
                <span>Ends: {new Date(activeHackathon.end_date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={14} className="text-gray-400" />
                <span>Venue: {activeHackathon.venue}, {activeHackathon.city}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users size={14} className="text-gray-400" />
                <span>Team brackets: {activeHackathon.min_team_size}-{activeHackathon.max_team_size} members</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Status Banner / Action Card */}
      {!userRegistration && activeHackathonRole !== 'Organizer' && activeHackathonRole !== 'Volunteer' && activeHackathonRole !== 'Judge' && activeHackathonRole !== 'Mentor' && (
        <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-md">
              <Sparkles size={12} />
              <span>Hackathon Registration</span>
            </div>
            <h3 className="text-lg font-bold">You are not registered for {activeHackathon.title} yet.</h3>
            <p className="text-xs text-blue-100 font-medium">
              Register to join this hackathon, form or join a team, and select problem statements!
            </p>
          </div>
          <button
            onClick={handleRegister}
            disabled={registering}
            className="px-6 py-3 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-2xl text-xs transition shadow-lg shrink-0 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {registering ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={16} />}
            <span>Register to Participate</span>
          </button>
        </div>
      )}

      {userRegistration && activeHackathonRole !== 'Organizer' && activeHackathonRole !== 'Volunteer' && activeHackathonRole !== 'Judge' && activeHackathonRole !== 'Mentor' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={18} className={userRegistration.status === 'Approved' ? "text-emerald-500" : "text-amber-500"} />
            <span className="font-bold text-gray-700">
              Registration Status:
            </span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
              userRegistration.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              userRegistration.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {userRegistration.status}
            </span>
          </div>
          {userRegistration.status === 'Approved' && (
            <button
              onClick={() => handleTabChange('ticket')}
              className="text-blue-600 font-bold hover:underline"
            >
              View Check-in QR Ticket &rarr;
            </button>
          )}
        </div>
      )}

      {/* Tabs Menu */}
      <div className="border-b border-gray-200 flex space-x-4 md:space-x-6 text-sm font-semibold overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => handleTabChange('schedule')}
          className={`pb-3 relative transition whitespace-nowrap ${activeTab === 'schedule' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <span>Schedule</span>
          {activeTab === 'schedule' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full"></span>}
        </button>
        <button
          onClick={() => handleTabChange('rules')}
          className={`pb-3 relative transition whitespace-nowrap ${activeTab === 'rules' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <span>Rules</span>
          {activeTab === 'rules' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full"></span>}
        </button>
        <button
          onClick={() => handleTabChange('titles')}
          className={`pb-3 relative transition whitespace-nowrap ${activeTab === 'titles' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <span>Problem Titles</span>
          {activeTab === 'titles' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full"></span>}
        </button>
        {userRegistration && activeHackathonRole !== 'Organizer' && activeHackathonRole !== 'Volunteer' && activeHackathonRole !== 'Judge' && activeHackathonRole !== 'Mentor' && (
          <button
            onClick={() => handleTabChange('ticket')}
            className={`pb-3 relative transition whitespace-nowrap ${activeTab === 'ticket' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <span>Check-in QR Ticket</span>
            {activeTab === 'ticket' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full"></span>}
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 md:p-6 shadow-xs min-h-[300px]">
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display text-gray-900">Event Timeline</h3>
              {isOrganizer && (
                <button
                  onClick={() => setShowScheduleForm(!showScheduleForm)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                >
                  <Plus size={14} />
                  <span>Add Timeline Item</span>
                </button>
              )}
            </div>

            {/* Schedule Form */}
            {showScheduleForm && (
              <form onSubmit={handleAddSchedule} className="bg-gray-50 border border-gray-150 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                <div className="md:col-span-2">
                  <label className="block text-gray-500 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={scheduleData.title}
                    onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-sm"
                    placeholder="Opening Ceremony & Orientation"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-500 mb-1">Description</label>
                  <textarea
                    value={scheduleData.description}
                    onChange={(e) => setScheduleData({ ...scheduleData, description: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-sm"
                    placeholder="Initial checkins and introduction speech by organizers..."
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleData.start_time}
                    onChange={(e) => setScheduleData({ ...scheduleData, start_time: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleData.end_time}
                    onChange={(e) => setScheduleData({ ...scheduleData, end_time: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Venue / Room</label>
                  <input
                    type="text"
                    value={scheduleData.venue}
                    onChange={(e) => setScheduleData({ ...scheduleData, venue: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-sm"
                    placeholder="Main Stage Hall A"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Schedule Items */}
            {loadingSchedule ? (
              <div className="space-y-4">
                <div className="h-16 bg-gray-50 animate-pulse rounded-xl"></div>
                <div className="h-16 bg-gray-50 animate-pulse rounded-xl"></div>
              </div>
            ) : schedule.length > 0 ? (
              <div className="relative border-l border-gray-200 ml-4 pl-6 space-y-6">
                {schedule.map((item) => (
                  <div key={item.id} className="relative">
                    {/* Node Dot */}
                    <span className="absolute -left-9 top-1.5 h-6 w-6 bg-blue-100 border-4 border-white text-blue-600 rounded-full flex items-center justify-center">
                      <Clock size={10} />
                    </span>
                    <div className="flex items-start justify-between border border-gray-50 hover:border-gray-100 rounded-2xl p-4 transition shadow-2xs">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{item.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-[10px] font-bold text-gray-400 uppercase">
                          <span>{new Date(item.start_time).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} - {new Date(item.end_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</span>
                          {item.venue && <span>• {item.venue}</span>}
                        </div>
                      </div>
                      {isOrganizer && (
                        <button
                          onClick={() => handleDeleteSchedule(item.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12 text-xs">
                No schedule items have been posted yet.
              </div>
            )}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display text-gray-900">Event Rules</h3>
              {isOrganizer && (
                <button
                  onClick={() => setShowRuleForm(!showRuleForm)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                >
                  <Plus size={14} />
                  <span>Add Rule</span>
                </button>
              )}
            </div>

            {/* Rule Form */}
            {showRuleForm && (
              <form onSubmit={handleAddRule} className="bg-gray-50 border border-gray-150 p-4 rounded-2xl space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-gray-500 mb-1">Rule Title</label>
                  <input
                    type="text"
                    required
                    value={ruleData.title}
                    onChange={(e) => setRuleData({ ...ruleData, title: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-sm"
                    placeholder="Original Code Submission"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Content Details</label>
                  <textarea
                    required
                    rows={3}
                    value={ruleData.content}
                    onChange={(e) => setRuleData({ ...ruleData, content: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-sm"
                    placeholder="All repositories must be initialized during the start of hacking. Pre-built templates should be declared..."
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRuleForm(false)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Rules Items */}
            {loadingRules ? (
              <div className="space-y-4">
                <div className="h-16 bg-gray-50 animate-pulse rounded-xl"></div>
              </div>
            ) : rules.length > 0 ? (
              <div className="space-y-4">
                {rules.map((rule, idx) => (
                  <div key={rule.id} className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-3">
                        <span className="h-6 w-6 bg-blue-50 text-blue-600 font-bold text-xs rounded-full flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">{rule.title}</h4>
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed whitespace-pre-line">{rule.content}</p>
                        </div>
                      </div>
                      {isOrganizer && (
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12 text-xs">
                No rules have been uploaded yet.
              </div>
            )}
          </div>
        )}

        {/* Problem Titles Tab */}
        {activeTab === 'titles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-gray-900">Problem Statements & Titles</h3>
                <p className="text-xs text-gray-500 mt-0.5">Organizers add titles here. Approved teams can select one for their project.</p>
              </div>
              {isOrganizer && (
                <button
                  onClick={() => setShowTitleForm(!showTitleForm)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                >
                  <Plus size={14} />
                  <span>Add Problem Title</span>
                </button>
              )}
            </div>

            {/* Title Form */}
            {showTitleForm && (
              <form onSubmit={handleAddTitle} className="bg-gray-50 border border-gray-150 p-4 rounded-2xl space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-gray-500 mb-1">Title Name</label>
                  <input
                    type="text"
                    required
                    value={titleData.title}
                    onChange={(e) => setTitleData({ ...titleData, title: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-sm"
                    placeholder="AI Powered Smart Healthcare System"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Description / Problem Statement (Optional)</label>
                  <textarea
                    rows={3}
                    value={titleData.description}
                    onChange={(e) => setTitleData({ ...titleData, description: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none bg-white text-sm"
                    placeholder="Build a system that leverages machine learning models to assist doctors..."
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTitleForm(false)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                  >
                    Save Title
                  </button>
                </div>
              </form>
            )}

            {/* Problem Titles List */}
            {loadingTitles ? (
              <div className="space-y-4">
                <div className="h-16 bg-gray-50 animate-pulse rounded-xl"></div>
              </div>
            ) : titles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {titles.map((t, idx) => (
                  <div key={t.id} className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition shadow-2xs bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-3">
                        <span className="h-7 w-7 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl flex items-center justify-center shrink-0">
                          <Tag size={14} />
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-gray-900">{t.title}</h4>
                            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-100">
                              Title #{idx + 1}
                            </span>
                          </div>
                          {t.description && (
                            <p className="text-xs text-gray-500 mt-2 leading-relaxed whitespace-pre-line">{t.description}</p>
                          )}
                        </div>
                      </div>
                      {isOrganizer && (
                        <button
                          onClick={() => handleDeleteTitle(t.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition shrink-0"
                          title="Delete Title"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12 text-xs">
                No problem titles have been added for this hackathon yet.
              </div>
            )}
          </div>
        )}

        {/* Ticket Tab */}
        {activeTab === 'ticket' && userRegistration && activeHackathonRole !== 'Organizer' && activeHackathonRole !== 'Volunteer' && activeHackathonRole !== 'Judge' && activeHackathonRole !== 'Mentor' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display text-gray-900 font-sans">Check-in QR Ticket</h3>
              <button
                type="button"
                onClick={fetchUserRegistration}
                disabled={loadingRegistration}
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold transition"
              >
                <RefreshCw size={14} className={loadingRegistration ? "animate-spin" : ""} />
                <span>Refresh Status</span>
              </button>
            </div>

            {loadingRegistration ? (
              <div className="h-48 bg-gray-50 animate-pulse rounded-3xl"></div>
            ) : (
              <div className="bg-radial from-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-800/80 flex flex-col md:flex-row relative">
                {/* Rip-off Stub Circles (Desktop) */}
                <div className="hidden md:block absolute left-2/3 top-0 -translate-y-1/2 w-8 h-8 bg-white rounded-full z-20"></div>
                <div className="hidden md:block absolute left-2/3 bottom-0 translate-y-1/2 w-8 h-8 bg-white rounded-full z-20"></div>
                
                {/* Left Section (Ticket Info) */}
                <div className="relative p-6 md:p-8 flex-grow space-y-6 border-b-2 border-dashed border-slate-800/60 md:border-b-0 md:border-r-2 md:border-slate-800/60">
                  {/* Mobile Cutout Circles (centered on the bottom dashed border) */}
                  <div className="block md:hidden absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-8 h-8 bg-white rounded-full z-20"></div>
                  <div className="block md:hidden absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-8 h-8 bg-white rounded-full z-20"></div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-500">EVENT ENTRY PASS</span>
                    <h2 className="text-xl md:text-2xl font-black font-display tracking-tight leading-tight">{activeHackathon.title}</h2>
                    <p className="text-xs text-slate-400 font-medium">{activeHackathon.venue}, {activeHackathon.city}</p>
                  </div>

                  <div className="border-t border-slate-800/80 my-4"></div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] font-bold tracking-wider">Participant</span>
                      <p className="font-bold text-slate-200 mt-0.5">
                        {userRegistration.user_details 
                          ? `${userRegistration.user_details.first_name || ''} ${userRegistration.user_details.last_name || ''}`.trim() || userRegistration.user_details.username
                          : 'Attendee'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] font-bold tracking-wider">Username</span>
                      <p className="font-bold text-slate-200 mt-0.5 font-mono">@{userRegistration.user_details?.username}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] font-bold tracking-wider">Role</span>
                      <p className="font-bold text-slate-200 mt-0.5">Participant</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] font-bold tracking-wider">Pass Status</span>
                      <div className="mt-0.5">
                        {userRegistration.checked_in ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase rounded-lg">
                            Checked In
                          </span>
                        ) : userRegistration.status === 'Approved' ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase rounded-lg animate-pulse">
                            Awaiting Desk Scan
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase rounded-lg">
                            {userRegistration.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {userRegistration.checked_in && userRegistration.checked_in_at && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex items-start space-x-2 text-[10px] text-emerald-400 font-medium">
                      <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold">Desk Check-in Complete</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Verified at: {new Date(userRegistration.checked_in_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Section (QR Code) */}
                <div className="p-6 md:p-8 md:w-1/3 flex flex-col items-center justify-center space-y-4 bg-slate-950/40 relative">
                  {userRegistration.status === 'Approved' ? (
                    userRegistration.checked_in ? (
                      <div className="text-center space-y-2 p-4 flex flex-col items-center justify-center">
                        <CheckCircle size={48} className="text-emerald-500 animate-pulse" />
                        <h4 className="text-xs font-bold text-emerald-400 mt-2">Entry Granted</h4>
                        <p className="text-[10px] text-slate-400 leading-normal text-center">
                          You have checked in at the desk. Enjoy the event!
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white p-2 rounded-2xl shadow-md border border-slate-800 flex items-center justify-center">
                          <QRCodeSVG 
                            value={userRegistration.qr_code_uuid} 
                            size={128}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"L"}
                            includeMargin={false}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 tracking-wider text-center break-all select-all">
                          {userRegistration.qr_code_uuid}
                        </span>
                      </>
                    )
                  ) : (
                    <div className="text-center space-y-2 p-4">
                      <AlertTriangle size={32} className="mx-auto text-amber-500" />
                      <p className="text-[10px] text-slate-400 leading-normal">
                        QR code is generated once your registration request is approved.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
