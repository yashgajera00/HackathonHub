import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Users, FileText, CheckCircle, Clock, Award, Activity } from 'lucide-react';

export default function OrganizerDashboard() {
  const { activeHackathon } = useHackathon();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeHackathon) {
      fetchAnalytics(false);
      
      const interval = setInterval(() => {
        fetchAnalytics(true);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [activeHackathon]);

  const fetchAnalytics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/dashboard-analytics/organizer/', {
        params: { hackathon_id: activeHackathon.id }
      });
      setData(response.data);
    } catch (e) {
      console.error(e);
      if (!silent) showToast('Failed to load organizer analytics.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-60 bg-white border animate-pulse rounded-3xl"></div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8 py-4">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900">Organizer Dashboard</h2>
        <p className="text-xs text-gray-500 mt-1">Review event enrollments, project submission counts, and logs.</p>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm font-semibold">
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Registrations</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-0.5">{data.registrations.total}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Total Teams</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-0.5">{data.teams.total}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Projects Submitted</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-0.5">{data.teams.submitted}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Award size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Present Attendance</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-0.5">{data.checked_in_attendance}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hackathon log */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Event Log Audit</h3>
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
            {data.recent_activity.length > 0 ? (
              data.recent_activity.map((log) => (
                <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex items-start space-x-3">
                  <Activity size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-800 font-semibold">{log.action}</p>
                    {log.details && <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{log.details}</p>}
                    <span className="text-[9px] font-bold text-gray-400 uppercase mt-1 inline-block">
                      {log.user_username} • {new Date(log.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No logs generated for this hackathon yet.</p>
            )}
          </div>
        </div>

        {/* Status breakdowns */}
        <div className="space-y-6 lg:col-span-1">
          {/* Enrollments state breakdown */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registration Status</h3>
            <div className="space-y-2 text-xs font-semibold text-gray-700">
              <div className="flex justify-between items-center">
                <span>Approved (Participants)</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border rounded-md">{data.registrations.approved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Pending Approvals</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border rounded-md">{data.registrations.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Rejected / Cancelled</span>
                <span className="px-2 py-0.5 bg-red-50 text-red-700 border rounded-md">{data.registrations.rejected}</span>
              </div>
            </div>
          </div>

          {/* Members role distribution */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roster Breakdown</h3>
            <div className="space-y-2 text-xs font-semibold text-gray-700">
              <div className="flex justify-between items-center">
                <span>Organizers</span>
                <span className="font-bold text-gray-900">{data.members.Organizer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Volunteers</span>
                <span className="font-bold text-gray-900">{data.members.Volunteer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Judges</span>
                <span className="font-bold text-gray-900">{data.members.Judge}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Mentors</span>
                <span className="font-bold text-gray-900">{data.members.Mentor}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Participants</span>
                <span className="font-bold text-gray-900">{data.members.Participant}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
