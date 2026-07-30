import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { Trophy, Award, Crown, User, Star } from 'lucide-react';

export default function Leaderboard() {
  const { activeHackathon, activeHackathonRole } = useHackathon();
  const { showToast } = useToast();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  if (activeHackathon && activeHackathonRole === 'Participant' && activeHackathon?.active_team_status !== 'Approved') {
    return <Navigate to="/my-team" replace />;
  }

  useEffect(() => {
    if (activeHackathon) {
      fetchLeaderboard();
    }
  }, [activeHackathon]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaderboard/', {
        params: { hackathon_id: activeHackathon.id }
      });
      setLeaderboard(response.data);
    } catch (e) {
      console.error(e);
      showToast('Failed to load leaderboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-60 bg-white border animate-pulse rounded-3xl"></div>;
  }

  // Spotlight cards for top 3
  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  // Reorder top three for visual podium: [2nd, 1st, 3rd]
  const podium = [];
  if (topThree[1]) podium.push(topThree[1]); // 2nd
  if (topThree[0]) podium.push(topThree[0]); // 1st
  if (topThree[2]) podium.push(topThree[2]); // 3rd

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex h-9 w-9 bg-blue-50 text-blue-600 rounded-xl items-center justify-center">
          <Trophy size={20} />
        </div>
        <h2 className="text-3xl font-extrabold font-display text-gray-900 tracking-tight">Hackathon Leaderboard</h2>
        <p className="text-xs text-gray-500">Live evaluations sorted by average judge scores across categories.</p>
      </div>

      {leaderboard.length > 0 ? (
        <div className="space-y-8">
          {/* Podium Spotlight */}
          {topThree.length > 0 && (
            <div className="flex flex-col sm:flex-row items-end justify-center gap-6 pt-8">
              {podium.map((team) => {
                const isFirst = team.rank === 1;
                const isSecond = team.rank === 2;
                const isThird = team.rank === 3;
                
                let rankStyles = 'bg-gray-100 text-gray-800 border-gray-200';
                let medalColor = 'text-gray-400';
                let height = 'h-52';
                
                if (isFirst) {
                  rankStyles = 'bg-amber-100 text-amber-800 border-amber-200 shadow-amber-100/50';
                  medalColor = 'text-amber-500';
                  height = 'h-64';
                } else if (isSecond) {
                  rankStyles = 'bg-slate-100 text-slate-800 border-slate-200';
                  medalColor = 'text-slate-400';
                  height = 'h-56';
                } else if (isThird) {
                  rankStyles = 'bg-orange-100 text-orange-800 border-orange-200';
                  medalColor = 'text-orange-600';
                  height = 'h-48';
                }

                return (
                  <div 
                    key={team.team_id}
                    className={`w-full sm:w-60 bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-lg relative transition hover:-translate-y-1 ${height}`}
                  >
                    {/* Crown or Award Icon */}
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        {isFirst ? (
                          <Crown size={28} className="text-amber-500 animate-bounce" />
                        ) : (
                          <Award size={24} className={medalColor} />
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 truncate max-w-[180px]">{team.team_name}</h3>
                      <p className="text-[10px] text-gray-400 font-semibold line-clamp-1">{team.project_title}</p>
                    </div>

                    {/* Stats podium bottom */}
                    <div className="space-y-3 w-full">
                      <div className="text-3xl font-extrabold text-gray-900 font-display">
                        {team.avg_total}
                        <span className="text-xs text-gray-400 font-semibold">/40</span>
                      </div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        Scores count: {team.scores_submitted}
                      </div>
                      
                      <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${rankStyles}`}>
                        Rank #{team.rank}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Remaining Ranks List */}
          {remaining.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Team</th>
                    <th className="px-6 py-4">Design</th>
                    <th className="px-6 py-4">Execution</th>
                    <th className="px-6 py-4">Innovation</th>
                    <th className="px-6 py-4">Presentation</th>
                    <th className="px-6 py-4 text-right">Total Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {remaining.map((team) => (
                    <tr key={team.team_id} className="hover:bg-gray-50/40">
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md border font-bold">
                          #{team.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex flex-col">
                        <span className="font-bold text-gray-900">{team.team_name}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{team.project_title}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono">{team.avg_design}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono">{team.avg_execution}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono">{team.avg_innovation}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono">{team.avg_presentation}</td>
                      <td className="px-6 py-4 text-right font-extrabold text-gray-900 font-mono text-sm">
                        {team.avg_total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 text-xs">
          No scores have been submitted yet. Leaderboard will generate as evaluations post.
        </div>
      )}
    </div>
  );
}
