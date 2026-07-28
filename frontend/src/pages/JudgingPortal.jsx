import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Award, CheckCircle, RefreshCw, Star } from 'lucide-react';

export default function JudgingPortal() {
  const { activeHackathon } = useHackathon();
  const { showToast } = useToast();

  const [teams, setTeams] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [scoreForm, setScoreForm] = useState({
    design_score: 5,
    execution_score: 5,
    innovation_score: 5,
    presentation_score: 5,
    feedback: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeHackathon) {
      fetchTeamsAndScores();
    }
  }, [activeHackathon]);

  const fetchTeamsAndScores = async () => {
    try {
      setLoading(true);
      // Fetch teams
      const teamsResponse = await api.get('/teams/', {
        params: { hackathon_id: activeHackathon.id }
      });
      const teamsData = teamsResponse.data.results || teamsResponse.data;
      setTeams(teamsData);

      // Fetch existing scores by this judge
      const scoresResponse = await api.get('/scores/', {
        params: { hackathon_id: activeHackathon.id }
      });
      const scoresData = scoresResponse.data.results || scoresResponse.data;
      
      const mapping = {};
      scoresData.forEach(s => {
        mapping[s.team] = s;
      });
      setScores(mapping);
    } catch (e) {
      console.error(e);
      showToast('Failed to load portal data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
    const existing = scores[team.id];
    if (existing) {
      setScoreForm({
        design_score: existing.design_score,
        execution_score: existing.execution_score,
        innovation_score: existing.innovation_score,
        presentation_score: existing.presentation_score,
        feedback: existing.feedback || ''
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

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setSubmitting(true);
    
    try {
      const existing = scores[selectedTeam.id];
      if (existing) {
        // Update
        const res = await api.put(`/scores/${existing.id}/`, {
          ...scoreForm,
          hackathon: activeHackathon.id,
          team: selectedTeam.id
        });
        showToast('Evaluation updated successfully!', 'success');
        setScores({ ...scores, [selectedTeam.id]: res.data });
      } else {
        // Create
        const res = await api.post('/scores/', {
          ...scoreForm,
          hackathon: activeHackathon.id,
          team: selectedTeam.id
        });
        showToast('Evaluation submitted successfully!', 'success');
        setScores({ ...scores, [selectedTeam.id]: res.data });
      }
      setSelectedTeam(null);
      fetchTeamsAndScores();
    } catch (err) {
      console.error(err);
      showToast('Failed to save scores.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-60 bg-white border animate-pulse rounded-3xl"></div>;
  }

  return (
    <div className="space-y-6 py-4 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900">Judging Portal</h2>
        <p className="text-xs text-gray-500 mt-1">Review team project deliverables and submit scores on key criteria.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Teams list */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Submissions List</h3>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-xs divide-y divide-gray-50 overflow-hidden">
            {teams.map((t) => {
              const scored = scores[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTeam(t)}
                  className={`w-full text-left p-4 hover:bg-gray-50/50 transition flex items-center justify-between text-xs ${selectedTeam?.id === t.id ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="space-y-1">
                    <span className="font-bold text-gray-800 truncate block max-w-[150px]">{t.name}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{t.project_title || 'No submission yet'}</span>
                  </div>
                  {scored ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 rounded-md">
                      {scored.total_score} pts
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-200/50 rounded-md">
                      Pending
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scoring View */}
        <div className="md:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Evaluation Form</h3>
          {selectedTeam ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Evaluate {selectedTeam.name}</h3>
                {selectedTeam.project_title ? (
                  <div className="mt-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <h4 className="text-xs font-bold text-gray-800">{selectedTeam.project_title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{selectedTeam.project_description}</p>
                    {selectedTeam.project_submission_link && (
                      <a 
                        href={selectedTeam.project_submission_link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-block text-xs font-bold text-blue-600 hover:underline pt-1.5"
                      >
                        Open Project Workspace &rarr;
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic mt-2">Team has not posted submission deliverables yet.</p>
                )}
              </div>

              <form onSubmit={handleScoreSubmit} className="space-y-4 text-xs font-semibold text-gray-600">
                <div className="grid grid-cols-2 gap-4">
                  {/* Scores sliders/inputs */}
                  {[
                    { label: 'Design & UX (0-10)', field: 'design_score' },
                    { label: 'Technical Execution (0-10)', field: 'execution_score' },
                    { label: 'Innovation Value (0-10)', field: 'innovation_score' },
                    { label: 'Presentation & Pitch (0-10)', field: 'presentation_score' },
                  ].map((item) => (
                    <div key={item.field}>
                      <label className="block mb-1.5 text-gray-400 uppercase tracking-wider">{item.label}</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        required
                        value={scoreForm[item.field]}
                        onChange={(e) => setScoreForm({ ...scoreForm, [item.field]: parseInt(e.target.value) || 0 })}
                        className="w-full p-2 border border-gray-200 rounded-xl"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block mb-1.5 text-gray-400 uppercase tracking-wider">Evaluation Comments</label>
                  <textarea
                    value={scoreForm.feedback}
                    onChange={(e) => setScoreForm({ ...scoreForm, feedback: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl"
                    rows={3}
                    placeholder="Provide constructive feedback for the team..."
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setSelectedTeam(null)}
                    className="px-4 py-2 border rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center space-x-1.5"
                  >
                    {submitting && <RefreshCw size={12} className="animate-spin" />}
                    <span>Submit Evaluation</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white border rounded-3xl p-12 text-center text-gray-400 text-xs">
              Select a team from the list to start evaluating.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
