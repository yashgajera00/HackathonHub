import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { Megaphone, Trash2, Plus, RefreshCw } from 'lucide-react';

export default function AnnouncementsList() {
  const { activeHackathon, activeHackathonRole } = useHackathon();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  if (activeHackathon && activeHackathonRole === 'Participant' && activeHackathon?.active_team_status !== 'Approved') {
    return <Navigate to="/my-team" replace />;
  }

  useEffect(() => {
    if (activeHackathon) {
      fetchAnnouncements(false);
      
      const interval = setInterval(() => {
        fetchAnnouncements(true);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [activeHackathon]);

  const fetchAnnouncements = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/announcements/', {
        params: { hackathon_id: activeHackathon.id }
      });
      setAnnouncements(response.data.results || response.data);
    } catch (e) {
      console.error(e);
      if (!silent) showToast('Failed to load announcements.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/announcements/', {
        ...formData,
        hackathon: activeHackathon.id
      });
      showToast('Announcement posted successfully!', 'success');
      setShowForm(false);
      setFormData({ title: '', content: '' });
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      showToast('Failed to post announcement.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}/`);
      showToast('Announcement deleted.', 'success');
      fetchAnnouncements();
    } catch (e) {
      showToast('Failed to delete.', 'error');
    }
  };

  const isOrganizer = activeHackathonRole === 'Organizer';

  return (
    <div className="space-y-6 py-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900">Announcements</h2>
          <p className="text-xs text-gray-500 mt-1">Latest updates and instructions from the hackathon staff.</p>
        </div>
        {isOrganizer && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus size={14} />
            <span>Create Announcement</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Announcement Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="Team Formations Deadline Extended"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Content Details</label>
              <textarea
                required
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="Teams must have their members finalized by 6 PM today. If you need a partner..."
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5"
              >
                {submitting && <RefreshCw size={12} className="animate-spin" />}
                <span>Post Broadcast</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-24 bg-white border border-gray-100 rounded-2xl animate-pulse"></div>
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition shadow-2xs flex items-start space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
                <Megaphone size={20} />
              </div>
              <div className="flex-grow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-gray-800">{ann.title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                      By {ann.created_by_username} • {new Date(ann.created_at).toLocaleString()}
                    </p>
                  </div>
                  {isOrganizer && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-3 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-50">
                  {ann.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400">
          <Megaphone size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-xs">No announcements have been broadcasted yet.</p>
        </div>
      )}
    </div>
  );
}
