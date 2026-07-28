import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Users, Trophy, UserCheck, Shield, Award, Activity } from 'lucide-react';

export default function SystemDashboard() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard-analytics/platform_owner/');
      setData(response.data);
    } catch (e) {
      console.error(e);
      showToast('Failed to load system analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-60 bg-white border animate-pulse rounded-3xl"></div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8 py-4">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900">System Dashboard</h2>
        <p className="text-xs text-gray-500 mt-1">Platform-wide global analytics and user session audit logs.</p>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm font-semibold">
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Registered Users</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-0.5">{data.users.total}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Trophy size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Total Hackathons</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-0.5">{data.hackathons.total}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Approvals Rate</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {data.registrations.total > 0 
                ? `${Math.round((data.registrations.approved / data.registrations.total) * 100)}%` 
                : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Award size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Pending Registrations</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-0.5">{data.registrations.pending}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main activity logs audit feed */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Activity Logs Audit</h3>
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {data.recent_activity.length > 0 ? (
              data.recent_activity.map((log) => (
                <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex items-start space-x-3">
                  <Activity size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-800 font-semibold">{log.action}</p>
                    {log.details && <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{log.details}</p>}
                    <span className="text-[9px] font-bold text-gray-400 uppercase mt-1 inline-block">
                      {log.user_username} • {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No system activity has been logged yet.</p>
            )}
          </div>
        </div>

        {/* Breakdown side panel */}
        <div className="space-y-6 lg:col-span-1">
          {/* Hackathons state breakdown */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hackathons Statuses</h3>
            <div className="space-y-2 text-xs font-semibold text-gray-700">
              <div className="flex justify-between items-center">
                <span>Active Running</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border rounded-md">{data.hackathons.running}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Published Open</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border rounded-md">{data.hackathons.published}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Completed</span>
                <span className="px-2 py-0.5 bg-gray-50 text-gray-700 border rounded-md">{data.hackathons.completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Drafts (Hidden)</span>
                <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border rounded-md">{data.hackathons.draft}</span>
              </div>
            </div>
          </div>

          {/* Members role distribution */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Accepted Member Roles</h3>
            <div className="space-y-2 text-xs font-semibold text-gray-700">
              <div className="flex justify-between items-center">
                <span>Organizers</span>
                <span className="font-bold text-gray-900">{data.memberships.organizers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Volunteers</span>
                <span className="font-bold text-gray-900">{data.memberships.volunteers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Judges</span>
                <span className="font-bold text-gray-900">{data.memberships.judges}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Participants</span>
                <span className="font-bold text-gray-900">{data.memberships.participants}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
