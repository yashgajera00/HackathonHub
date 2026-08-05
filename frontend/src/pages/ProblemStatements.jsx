import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../services/api';
import { Tag, Plus, Trash2, Sparkles, RefreshCw, FileText, CheckCircle2, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

export default function ProblemStatements() {
  const { activeHackathon, activeHackathonRole, refreshHackathonDetails } = useHackathon();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingRelease, setTogglingRelease] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    if (activeHackathon) {
      fetchTitles(false);
      const interval = setInterval(() => {
        fetchTitles(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeHackathon?.id]);

  const fetchTitles = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/hackathon-titles/', {
        params: { hackathon_id: activeHackathon.id }
      });
      setTitles(response.data.results || response.data);
    } catch (e) {
      console.error(e);
      if (!silent) showToast('Failed to load problem statements.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleToggleRelease = async () => {
    if (!activeHackathon) return;
    setTogglingRelease(true);
    try {
      const response = await api.post(`/hackathons/${activeHackathon.id}/toggle_release_titles/`);
      showToast(response.data.detail, 'success');
      if (refreshHackathonDetails) await refreshHackathonDetails();
    } catch (err) {
      console.error(err);
      showToast('Failed to update release status.', 'error');
    } finally {
      setTogglingRelease(false);
    }
  };

  const handleAddTitle = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/hackathon-titles/', {
        ...formData,
        hackathon: activeHackathon.id
      });
      showToast('Problem statement added successfully!', 'success');
      setShowForm(false);
      setFormData({ title: '', description: '' });
      fetchTitles();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to add problem statement.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTitle = async (id, titleName) => {
    if (!(await confirm(`Delete problem statement "${titleName}"?`, 'Delete Problem Statement'))) return;
    try {
      await api.delete(`/hackathon-titles/${id}/`);
      showToast('Problem statement deleted.', 'success');
      fetchTitles();
    } catch (e) {
      console.error(e);
      showToast('Failed to delete problem statement.', 'error');
    }
  };

  if (!activeHackathon) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs text-gray-500 text-xs font-semibold">
          Please select a hackathon from the header menu to view problem statements.
        </div>
      </div>
    );
  }

  const isOrganizer = activeHackathonRole === 'Organizer';
  const isReleased = activeHackathon.is_problem_statements_released;

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
              <Tag size={12} />
              <span>Hackathon Topics & Tasks</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              isReleased 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isReleased ? 'Released to Participants' : 'Locked / Unreleased'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-gray-900">
            Problem Statements
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Explore problem statements defined by organizers for {activeHackathon.title}.
          </p>
        </div>

        {isOrganizer && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleToggleRelease}
              disabled={togglingRelease}
              className={`px-4 py-2.5 font-bold rounded-xl text-xs transition shadow-sm flex items-center space-x-1.5 ${
                isReleased 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {togglingRelease ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : isReleased ? (
                <Lock size={14} />
              ) : (
                <Unlock size={14} />
              )}
              <span>{isReleased ? 'Hide Problem Statements' : 'Release Problem Statements'}</span>
            </button>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center space-x-1.5"
            >
              <Plus size={16} />
              <span>Add Statement</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Form (Organizer Mode) */}
      {showForm && isOrganizer && (
        <form onSubmit={handleAddTitle} className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm space-y-4 text-xs font-medium animate-fade-in">
          <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
            <Sparkles size={16} className="text-blue-600" />
            <span>Create New Problem Statement</span>
          </h3>

          <div>
            <label className="block text-gray-500 mb-1.5 font-bold uppercase tracking-wider text-[10px]">Title Name</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 text-sm text-gray-900"
              placeholder="Ex: AI Powered Healthcare Assistant"
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-1.5 font-bold uppercase tracking-wider text-[10px]">Description & Requirements (Optional)</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 text-sm text-gray-900 leading-relaxed"
              placeholder="Describe the problem background, objectives, guidelines, or reference links..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center space-x-1.5 disabled:opacity-50"
            >
              {submitting && <RefreshCw size={12} className="animate-spin" />}
              <span>Save Problem Statement</span>
            </button>
          </div>
        </form>
      )}

      {/* Problem Statements List or Locked Notice */}
      {!isReleased && !isOrganizer ? (
        <div className="bg-white border border-amber-200 rounded-3xl p-12 text-center text-gray-600 shadow-xs space-y-3">
          <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
            <Lock size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 font-display">Problem Statements Not Released Yet</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            The hackathon organizers have not released the problem statements yet. Once released, all participants can view the statements here, and team leaders can select one for their approved team.
          </p>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="h-28 bg-white border border-gray-100 animate-pulse rounded-3xl"></div>
          <div className="h-28 bg-white border border-gray-100 animate-pulse rounded-3xl"></div>
        </div>
      ) : titles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {titles.map((t, idx) => (
            <div key={t.id} className="bg-white border border-gray-100 hover:border-blue-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <span className="h-9 w-9 bg-blue-50 text-blue-600 font-bold text-xs rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                    <Tag size={16} />
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-gray-900">{t.title}</h3>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                        Statement #{idx + 1}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-xs text-gray-600 mt-2.5 leading-relaxed whitespace-pre-line">
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>

                {isOrganizer && (
                  <button
                    onClick={() => handleDeleteTitle(t.id, t.title)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition shrink-0"
                    title="Delete Problem Statement"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 shadow-xs space-y-2">
          <FileText size={40} className="mx-auto text-gray-300 mb-2" />
          <h3 className="text-sm font-bold text-gray-700">No problem statements added yet</h3>
          <p className="text-xs text-gray-400">
            {isOrganizer ? 'Click "Add Statement" above to create topics for participants.' : 'Organizers have not posted problem statements for this hackathon yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
