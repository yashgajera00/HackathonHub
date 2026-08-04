import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Trophy, Users, X, ExternalLink, RefreshCw, CheckCircle, XCircle, CheckCircle2, Clock } from 'lucide-react';

export default function TeamsList() {
  const { activeHackathon, activeHackathonRole } = useHackathon();
  const { showToast } = useToast();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Score Submissions
  const [scores, setScores] = useState({});
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [scoreForm, setScoreForm] = useState({
    design_score: 5,
    execution_score: 5,
    innovation_score: 5,
    presentation_score: 5,
    feedback: ''
  });
  const [submittingScore, setSubmittingScore] = useState(false);

  useEffect(() => {
    if (activeHackathon) {
      fetchTeams();
      if (activeHackathonRole === 'Judge') {
        fetchJudgeScores();
      }
    }
  }, [activeHackathon, activeHackathonRole]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teams/', {
        params: { hackathon_id: activeHackathon.id }
      });
      const newTeams = response.data.results || response.data;
      setTeams(newTeams);
      // Update selected team if modal is open
      if (selectedTeam) {
        const updated = newTeams.find(t => t.id === selectedTeam.id);
        if (updated) setSelectedTeam(updated);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load teams.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchJudgeScores = async () => {
    try {
      const response = await api.get('/scores/', {
        params: { hackathon_id: activeHackathon.id }
      });
      const mapping = {};
      const data = response.data.results || response.data;
      data.forEach(s => {
        mapping[s.team] = s;
      });
      setScores(mapping);
    } catch (e) {
      console.error(e);
    }
  };

  const handleScoreEdit = (team) => {
    setEditingTeamId(team.id);
    const existingScore = scores[team.id];
    if (existingScore) {
      setScoreForm({
        design_score: existingScore.design_score,
        execution_score: existingScore.execution_score,
        innovation_score: existingScore.innovation_score,
        presentation_score: existingScore.presentation_score,
        feedback: existingScore.feedback || ''
      });
    } else {
      setScoreForm({
        design_score: 5,
        execution_score: 5,
        innovation_score: 5,
        presentation_score: 5,
        feedback: ''
      });
    }
  };

  const handleScoreSubmit = async (e, teamId) => {
    e.preventDefault();
    setSubmittingScore(true);
    try {
      const existingScore = scores[teamId];
      if (existingScore) {
        const response = await api.put(`/scores/${existingScore.id}/`, {
          ...scoreForm,
          hackathon: activeHackathon.id,
          team: teamId
        });
        showToast('Evaluation updated!', 'success');
        setScores({ ...scores, [teamId]: response.data });
      } else {
        const response = await api.post('/scores/', {
          ...scoreForm,
          hackathon: activeHackathon.id,
          team: teamId
        });
        showToast('Evaluation submitted successfully!', 'success');
        setScores({ ...scores, [teamId]: response.data });
      }
      setEditingTeamId(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to submit evaluation.', 'error');
    } finally {
      setSubmittingScore(false);
    }
  };

  const handleApproveTeam = async (teamId) => {
    try {
      const response = await api.post(`/teams/${teamId}/approve/`);
      showToast('Team approved & selected for hackathon!', 'success');
      setTeams(prev => prev.map(t => t.id === teamId ? response.data : t));
      if (selectedTeam?.id === teamId) setSelectedTeam(response.data);
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
      if (selectedTeam?.id === teamId) setSelectedTeam(response.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to reject team.', 'error');
    }
  };

  const isJudge = activeHackathonRole === 'Judge';
  const isOrganizer = activeHackathonRole === 'Organizer';

  const statusBadge = (status) => {
    const map = {
      Approved: 'bg-emerald-50 text-emerald-800 border-emerald-100',
      Submitted: 'bg-blue-50 text-blue-800 border-blue-100',
      Rejected: 'bg-rose-50 text-rose-800 border-rose-100',
    };
    return map[status] || 'bg-amber-50 text-amber-800 border-amber-100';
  };

  return (
    <div className="space-y-6 py-4 flex-1 flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900">Teams & Projects</h2>
          <p className="text-xs text-gray-500 mt-1">Click on any team to view full details.</p>
        </div>
        <button
          onClick={fetchTeams}
          className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-700 transition flex items-center justify-center"
          title="Refresh List"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-24 bg-white border animate-pulse rounded-2xl"></div>
        </div>
      ) : teams.length > 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Team Name</th>
                  <th className="px-6 py-4">Leader</th>
                  <th className="px-6 py-4">Members</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Project</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {teams.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTeam(t)}
                    className="hover:bg-blue-50/40 cursor-pointer transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                          <Trophy size={14} />
                        </div>
                        <span className="font-bold text-gray-900">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{t.created_by_username}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        <Users size={13} className="text-gray-400" />
                        <span>{t.members.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${statusBadge(t.status)}`}>
                        {t.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {t.project_title ? (
                        <span className="text-gray-700 truncate max-w-[150px] block">{t.project_title}</span>
                      ) : (
                        <span className="text-gray-400 italic">Not submitted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 text-xs">
          No teams have been formed in this hackathon yet.
        </div>
      )}

      {/* Team Detail Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => { setSelectedTeam(null); setEditingTeamId(null); }}>
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] my-auto overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-3xl z-10">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{selectedTeam.name}</h3>
                  <p className="text-[10px] text-gray-400 font-semibold">Created by {selectedTeam.created_by_username}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedTeam(null); setEditingTeamId(null); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Date */}
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${statusBadge(selectedTeam.status)}`}>
                  {selectedTeam.status || 'Pending'}
                </span>
                <span className="text-[10px] text-gray-400 font-semibold">
                  Formed on {new Date(selectedTeam.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Members */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Team Members ({selectedTeam.members.length})</h4>
                <div className="space-y-2">
                  {selectedTeam.members.map((m) => {
                    const u = m.user_details;
                    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                    return (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl border border-gray-100/80">
                        <div className="flex items-center space-x-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="h-8 w-8 rounded-full object-cover border" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-gray-800">{name}</p>
                            <p className="text-[10px] text-gray-400">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {m.checked_in && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60 flex items-center space-x-1">
                              <CheckCircle2 size={10} className="text-emerald-600" />
                              <span>Checked In</span>
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${m.role === 'Leader' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                            {m.role}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Project Submission</h4>
                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  {selectedTeam.project_title ? (
                    <div className="space-y-2">
                      <h5 className="text-sm font-bold text-gray-800">{selectedTeam.project_title}</h5>
                      {selectedTeam.project_description && (
                        <p className="text-xs text-gray-500 leading-relaxed">{selectedTeam.project_description}</p>
                      )}
                      {selectedTeam.project_submission_link && (
                        <a
                          href={selectedTeam.project_submission_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:underline pt-1"
                        >
                          <span>View Repository</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No project details submitted yet.</p>
                  )}
                </div>
              </div>

              {/* Judge Scoring Panel */}
              {isJudge && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Evaluation</h4>
                  {editingTeamId !== selectedTeam.id ? (
                    <div className="flex justify-between items-center">
                      {scores[selectedTeam.id] && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-lg border border-blue-100">
                          Score: {scores[selectedTeam.id].total_score}/40
                        </span>
                      )}
                      <button
                        onClick={() => handleScoreEdit(selectedTeam)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                      >
                        {scores[selectedTeam.id] ? 'Edit Score' : 'Submit Scores'}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={(e) => handleScoreSubmit(e, selectedTeam.id)} className="space-y-4 text-xs font-semibold text-gray-600">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Design (0-10)</label>
                          <input type="number" min="0" max="10" required value={scoreForm.design_score} onChange={(e) => setScoreForm({ ...scoreForm, design_score: parseInt(e.target.value) || 0 })} className="w-full p-1.5 border rounded-lg text-gray-800" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Execution (0-10)</label>
                          <input type="number" min="0" max="10" required value={scoreForm.execution_score} onChange={(e) => setScoreForm({ ...scoreForm, execution_score: parseInt(e.target.value) || 0 })} className="w-full p-1.5 border rounded-lg text-gray-800" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Innovation (0-10)</label>
                          <input type="number" min="0" max="10" required value={scoreForm.innovation_score} onChange={(e) => setScoreForm({ ...scoreForm, innovation_score: parseInt(e.target.value) || 0 })} className="w-full p-1.5 border rounded-lg text-gray-800" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Presentation (0-10)</label>
                          <input type="number" min="0" max="10" required value={scoreForm.presentation_score} onChange={(e) => setScoreForm({ ...scoreForm, presentation_score: parseInt(e.target.value) || 0 })} className="w-full p-1.5 border rounded-lg text-gray-800" />
                        </div>
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Feedback & Comments</label>
                        <textarea value={scoreForm.feedback} onChange={(e) => setScoreForm({ ...scoreForm, feedback: e.target.value })} className="w-full p-2 border rounded-lg text-gray-800" rows={2} placeholder="Great execution but could simplify user interface..." />
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={() => setEditingTeamId(null)} className="px-3 py-1.5 border rounded-lg font-bold">Cancel</button>
                        <button type="submit" disabled={submittingScore} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition flex items-center space-x-1">
                          {submittingScore && <RefreshCw size={12} className="animate-spin" />}
                          <span>Submit</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Organizer Approval Panel */}
              {isOrganizer && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Team Selection Review</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveTeam(selectedTeam.id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle size={14} />
                      <span>Approve Team</span>
                    </button>
                    <button
                      onClick={() => handleRejectTeam(selectedTeam.id)}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
                    >
                      <XCircle size={14} />
                      <span>Reject Team</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
