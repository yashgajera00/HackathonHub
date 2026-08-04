import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Trophy, ExternalLink, Search, Filter, CheckCircle, XCircle, Award, RefreshCw, Plus, Star, Users, FileText, CheckCircle2 } from 'lucide-react';

export default function SubmissionsPage() {
  const { activeHackathon, activeHackathonRole } = useHackathon();
  const { showToast } = useToast();

  const [teams, setTeams] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Team Modal for Detail / Judge Evaluation / Leader Submission
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view' | 'submit' | 'score'

  // Submit Form (for Leader)
  const [submitForm, setSubmitForm] = useState({
    project_title: '',
    project_description: '',
    project_submission_link: ''
  });
  const [submittingProject, setSubmittingProject] = useState(false);

  // Score Form (for Judge / Organizer)
  const [scoreForm, setScoreForm] = useState({
    design_score: 8,
    execution_score: 8,
    innovation_score: 8,
    presentation_score: 8,
    feedback: ''
  });
  const [submittingScore, setSubmittingScore] = useState(false);

  const isOrganizer = activeHackathonRole === 'Organizer' || activeHackathonRole === 'Superuser';
  const isJudge = activeHackathonRole === 'Judge' || isOrganizer;

  useEffect(() => {
    if (activeHackathon?.id) {
      fetchSubmissionsData();
    }
  }, [activeHackathon?.id]);

  const fetchSubmissionsData = async () => {
    setLoading(true);
    try {
      const [teamsRes, scoresRes] = await Promise.all([
        api.get('/teams/', { params: { hackathon_id: activeHackathon.id } }),
        api.get('/scores/', { params: { hackathon_id: activeHackathon.id } })
      ]);

      const teamsData = teamsRes.data.results || teamsRes.data;
      setTeams(teamsData);

      const scoresData = scoresRes.data.results || scoresRes.data;
      const scoresMap = {};
      scoresData.forEach(s => {
        scoresMap[s.team] = s;
      });
      setScores(scoresMap);
    } catch (err) {
      console.error(err);
      showToast('Failed to load project submissions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit Project Details (Team Leader)
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setSubmittingProject(true);
    try {
      const response = await api.post(`/teams/${selectedTeam.id}/submit_project/`, submitForm);
      showToast('Project submission saved successfully!', 'success');
      setTeams(prev => prev.map(t => t.id === selectedTeam.id ? response.data : t));
      setSelectedTeam(response.data);
      setModalMode('view');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to save submission.', 'error');
    } finally {
      setSubmittingProject(false);
    }
  };

  // Judge Score Submit
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setSubmittingScore(true);
    try {
      const response = await api.post('/scores/', {
        ...scoreForm,
        team: selectedTeam.id,
        hackathon: activeHackathon.id
      });
      showToast(`Evaluation score submitted for ${selectedTeam.name}!`, 'success');
      setScores(prev => ({ ...prev, [selectedTeam.id]: response.data }));
      setModalMode('view');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to submit score.', 'error');
    } finally {
      setSubmittingScore(false);
    }
  };

  // Organizer Approve / Reject Actions
  const handleApproveTeam = async (teamId) => {
    try {
      const response = await api.post(`/teams/${teamId}/approve/`);
      showToast('Team approved & selected for hackathon!', 'success');
      setTeams(prev => prev.map(t => t.id === teamId ? response.data : t));
      setSelectedTeam(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to approve team.', 'error');
    }
  };

  const handleRejectTeam = async (teamId) => {
    try {
      const response = await api.post(`/teams/${teamId}/reject/`);
      showToast('Team selection rejected.', 'success');
      setTeams(prev => prev.map(t => t.id === teamId ? response.data : t));
      setSelectedTeam(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to reject team.', 'error');
    }
  };

  const openModal = (teamObj, mode = 'view') => {
    setSelectedTeam(teamObj);
    setModalMode(mode);

    if (mode === 'submit') {
      setSubmitForm({
        project_title: teamObj.project_title || '',
        project_description: teamObj.project_description || '',
        project_submission_link: teamObj.project_submission_link || ''
      });
    } else if (mode === 'score') {
      const existing = scores[teamObj.id];
      setScoreForm({
        design_score: existing ? existing.design_score : 8,
        execution_score: existing ? existing.execution_score : 8,
        innovation_score: existing ? existing.innovation_score : 8,
        presentation_score: existing ? existing.presentation_score : 8,
        feedback: existing ? existing.feedback : ''
      });
    }
  };

  const isParticipant = activeHackathonRole === 'Participant';

  // Filtered Teams Logic
  const filteredTeams = teams.filter(t => {
    // Participants only see their own team submission
    if (isParticipant && !t.is_member && !t.is_leader) {
      return false;
    }

    const matchesSearch = (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.project_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.created_by_username || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'SUBMITTED') return !!t.project_title;
    if (statusFilter === 'APPROVED') return t.status === 'Approved';
    if (statusFilter === 'REJECTED') return t.status === 'Rejected';
    if (statusFilter === 'PENDING') return t.status === 'Pending' || !t.status;
    return true;
  });

  const submittedCount = teams.filter(t => !!t.project_title).length;
  const approvedCount = teams.filter(t => t.status === 'Approved').length;

  if (!activeHackathon) {
    return (
      <div className="max-w-md mx-auto py-12 text-center text-gray-500 text-xs font-semibold">
        Please select an active hackathon to view project submissions.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-3 sm:px-4 space-y-6">
      {/* Page Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <Trophy size={24} className="text-amber-300" />
            <h1 className="text-2xl font-bold font-display">
              {isParticipant ? 'My Team Submission' : 'Project Submissions Hub'}
            </h1>
          </div>
          <p className="text-xs text-blue-100 font-medium">
            {isParticipant
              ? "View and manage your team's hackathon project submission."
              : "Review hackathon team deliverables, evaluate projects, and manage selection status."}
          </p>
        </div>

        {!isParticipant && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
              Total Teams: <span className="text-amber-300">{teams.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
              Submitted: <span className="text-emerald-300">{submittedCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
              Selected: <span className="text-cyan-300">{approvedCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar (Staff / Judge / Organizer only) */}
      {!isParticipant && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search by team name, project title, or leader..."
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'SUBMITTED', 'APPROVED', 'PENDING', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition shrink-0 ${
                  statusFilter === st ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Projects Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 bg-white border animate-pulse rounded-2xl"></div>
          <div className="h-44 bg-white border animate-pulse rounded-2xl"></div>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 text-xs font-semibold">
          No project submissions found for the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((t) => {
            const scoreObj = scores[t.id];
            const hasSubmitted = !!t.project_title;

            return (
              <div
                key={t.id}
                onClick={() => openModal(t, 'view')}
                className="bg-white border border-gray-100 rounded-3xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        <Trophy size={16} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{t.name}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold">Leader: {t.created_by_username}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                      t.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                      t.status === 'Rejected' ? 'bg-rose-50 text-rose-800 border-rose-100' :
                      'bg-amber-50 text-amber-800 border-amber-100'
                    }`}>
                      {t.status || 'Pending'}
                    </span>
                  </div>

                  {/* Project Details */}
                  {hasSubmitted ? (
                    <div className="space-y-1.5 bg-gray-50/60 p-3 rounded-2xl border border-gray-100/80">
                      <h4 className="text-xs font-bold text-blue-700 truncate">{t.project_title}</h4>
                      <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                        {t.project_description || 'No description provided.'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-2xl text-center text-gray-400 text-xs italic">
                      No project deliverables submitted yet.
                    </div>
                  )}
                </div>

                {/* Score & Links Footer */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs">
                    {scoreObj ? (
                      <div className="flex items-center space-x-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>Score: {scoreObj.total_score || (scoreObj.design_score + scoreObj.execution_score + scoreObj.innovation_score + scoreObj.presentation_score)} / 40</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-semibold">Not evaluated</span>
                    )}

                    {t.project_submission_link && (
                      <a
                        href={t.project_submission_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold text-xs hover:underline"
                      >
                        <span>Link</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {(t.is_leader || isJudge) && (
                    <div className="flex space-x-2">
                      {t.is_leader && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal(t, 'submit'); }}
                          className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                        >
                          Submit / Edit
                        </button>
                      )}
                      {isJudge && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal(t, 'score'); }}
                          className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition"
                        >
                          Score
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedTeam.name}</h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Team Details & Deliverables</span>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Mode 1: View Details */}
            {modalMode === 'view' && (
              <div className="space-y-4 text-xs font-semibold text-gray-700">
                <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Project Title</span>
                  <div className="text-sm font-bold text-gray-900">{selectedTeam.project_title || 'Not submitted'}</div>
                </div>

                <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Project Description</span>
                  <div className="text-gray-700 leading-relaxed">{selectedTeam.project_description || 'No description provided.'}</div>
                </div>

                {selectedTeam.project_submission_link && (
                  <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-2xl space-y-1">
                    <span className="text-[10px] text-blue-600 uppercase tracking-wider block font-bold">Submission Link</span>
                    <a
                      href={selectedTeam.project_submission_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-bold flex items-center space-x-1"
                    >
                      <span className="truncate">{selectedTeam.project_submission_link}</span>
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  </div>
                )}

                {/* Organizer Review Actions */}
                {isOrganizer && (
                  <div className="space-y-2 pt-3 border-t">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Organizer Review Action</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveTeam(selectedTeam.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        Approve Team
                      </button>
                      <button
                        onClick={() => handleRejectTeam(selectedTeam.id)}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        Reject Team
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Leader Project Submission Form */}
            {modalMode === 'submit' && (
              <form onSubmit={handleProjectSubmit} className="space-y-4 text-xs font-semibold text-gray-600">
                <div>
                  <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Project Title</label>
                  <input
                    type="text"
                    required
                    value={submitForm.project_title}
                    onChange={(e) => setSubmitForm({ ...submitForm, project_title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-gray-50 focus:bg-white text-gray-800 text-xs"
                    placeholder="Ex: HackathonHub AI Platform"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Project Description</label>
                  <textarea
                    rows={3}
                    required
                    value={submitForm.project_description}
                    onChange={(e) => setSubmitForm({ ...submitForm, project_description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-gray-50 focus:bg-white text-gray-800 text-xs"
                    placeholder="Explain what your project does and tech stack..."
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Submission Link (GitHub / Demo Video / Live URL)</label>
                  <input
                    type="url"
                    required
                    value={submitForm.project_submission_link}
                    onChange={(e) => setSubmitForm({ ...submitForm, project_submission_link: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-gray-50 focus:bg-white text-gray-800 text-xs"
                    placeholder="https://github.com/myteam/project"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setModalMode('view')} className="px-3 py-2 border rounded-xl font-bold">Cancel</button>
                  <button type="submit" disabled={submittingProject} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center space-x-1">
                    {submittingProject && <RefreshCw size={12} className="animate-spin" />}
                    <span>Save Project</span>
                  </button>
                </div>
              </form>
            )}

            {/* Mode 3: Judge Evaluation Form */}
            {modalMode === 'score' && (
              <form onSubmit={handleScoreSubmit} className="space-y-4 text-xs font-semibold text-gray-600">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Design (0-10)</label>
                    <input type="number" min="0" max="10" required value={scoreForm.design_score} onChange={(e) => setScoreForm({ ...scoreForm, design_score: parseInt(e.target.value) || 0 })} className="w-full p-2 border rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Execution (0-10)</label>
                    <input type="number" min="0" max="10" required value={scoreForm.execution_score} onChange={(e) => setScoreForm({ ...scoreForm, execution_score: parseInt(e.target.value) || 0 })} className="w-full p-2 border rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Innovation (0-10)</label>
                    <input type="number" min="0" max="10" required value={scoreForm.innovation_score} onChange={(e) => setScoreForm({ ...scoreForm, innovation_score: parseInt(e.target.value) || 0 })} className="w-full p-2 border rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Presentation (0-10)</label>
                    <input type="number" min="0" max="10" required value={scoreForm.presentation_score} onChange={(e) => setScoreForm({ ...scoreForm, presentation_score: parseInt(e.target.value) || 0 })} className="w-full p-2 border rounded-xl text-gray-800" />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Feedback & Comments</label>
                  <textarea value={scoreForm.feedback} onChange={(e) => setScoreForm({ ...scoreForm, feedback: e.target.value })} className="w-full p-2 border rounded-xl text-gray-800" rows={2} placeholder="Feedback for the team..." />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setModalMode('view')} className="px-3 py-2 border rounded-xl font-bold">Cancel</button>
                  <button type="submit" disabled={submittingScore} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center space-x-1">
                    {submittingScore && <RefreshCw size={12} className="animate-spin" />}
                    <span>Submit Score</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
