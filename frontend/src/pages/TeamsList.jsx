import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Trophy, FileSpreadsheet, PlusCircle, CheckCircle, ChevronDown, RefreshCw } from 'lucide-react';

export default function TeamsList() {
  const { activeHackathon, activeHackathonRole } = useHackathon();
  const { showToast } = useToast();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Score Submissions
  const [scores, setScores] = useState({}); // mapped by team_id: score details
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
      setTeams(response.data.results || response.data);
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
        // PUT update
        const response = await api.put(`/scores/${existingScore.id}/`, {
          ...scoreForm,
          hackathon: activeHackathon.id,
          team: teamId
        });
        showToast('Evaluation updated!', 'success');
        setScores({ ...scores, [teamId]: response.data });
      } else {
        // POST create
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

  const isJudge = activeHackathonRole === 'Judge';

  return (
    <div className="space-y-6 py-4">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900">Teams & Submissions</h2>
        <p className="text-xs text-gray-500 mt-1">Review registrations, repository submissions, and evaluation scores.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-24 bg-white border animate-pulse rounded-2xl"></div>
        </div>
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((t) => {
            const isEditing = editingTeamId === t.id;
            const savedScore = scores[t.id];

            return (
              <div 
                key={t.id} 
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-sm transition"
              >
                <div className="space-y-4">
                  {/* Title & Members */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{t.name}</h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Leader: {t.created_by_username}</p>
                    </div>
                    {savedScore && (
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-lg border border-blue-100">
                        Scored: {savedScore.total_score}/40
                      </span>
                    )}
                  </div>

                  {/* Members list */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Team Members</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {t.members.map((m) => (
                        <span key={m.id} className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md border border-gray-200/50">
                          {m.user_details.first_name ? `${m.user_details.first_name} ${m.user_details.last_name.slice(0, 1)}.` : m.user_details.username}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Project Submission */}
                  <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Project Submission</span>
                    {t.project_title ? (
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-gray-800">{t.project_title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-3">{t.project_description}</p>
                        {t.project_submission_link && (
                          <a 
                            href={t.project_submission_link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-block text-xs font-bold text-blue-600 hover:underline pt-1.5"
                          >
                            Go to Submission Repository &rarr;
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No project details submitted yet.</p>
                    )}
                  </div>
                </div>

                {/* Judging panel */}
                {isJudge && (
                  <div className="pt-4 border-t border-gray-50 mt-6 space-y-4">
                    {!isEditing ? (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-semibold">Evaluation Portal</span>
                        <button
                          onClick={() => handleScoreEdit(t)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                        >
                          {savedScore ? 'Edit Score' : 'Submit Scores'}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={(e) => handleScoreSubmit(e, t.id)} className="space-y-4 text-xs font-semibold text-gray-600">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Design (0-10)</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              required
                              value={scoreForm.design_score}
                              onChange={(e) => setScoreForm({ ...scoreForm, design_score: parseInt(e.target.value) || 0 })}
                              className="w-full p-1.5 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Execution (0-10)</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              required
                              value={scoreForm.execution_score}
                              onChange={(e) => setScoreForm({ ...scoreForm, execution_score: parseInt(e.target.value) || 0 })}
                              className="w-full p-1.5 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Innovation (0-10)</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              required
                              value={scoreForm.innovation_score}
                              onChange={(e) => setScoreForm({ ...scoreForm, innovation_score: parseInt(e.target.value) || 0 })}
                              className="w-full p-1.5 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Presentation (0-10)</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              required
                              value={scoreForm.presentation_score}
                              onChange={(e) => setScoreForm({ ...scoreForm, presentation_score: parseInt(e.target.value) || 0 })}
                              className="w-full p-1.5 border rounded-lg"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block mb-1 text-[10px] text-gray-400 uppercase tracking-wider">Feedback & Comments</label>
                          <textarea
                            value={scoreForm.feedback}
                            onChange={(e) => setScoreForm({ ...scoreForm, feedback: e.target.value })}
                            className="w-full p-2 border rounded-lg"
                            rows={2}
                            placeholder="Great execution but could simplify user interface..."
                          />
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingTeamId(null)}
                            className="px-3 py-1.5 border rounded-lg font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submittingScore}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition flex items-center space-x-1"
                          >
                            {submittingScore && <RefreshCw size={12} className="animate-spin" />}
                            <span>Submit Evaluation</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 text-xs">
          No teams have been formed in this hackathon yet.
        </div>
      )}
    </div>
  );
}
