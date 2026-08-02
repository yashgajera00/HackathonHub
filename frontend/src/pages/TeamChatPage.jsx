import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import TeamChat from '../components/TeamChat';
import { MessageSquare, Users, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';

export default function TeamChatPage() {
  const { activeHackathon } = useHackathon();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeHackathon) {
      fetchMyTeam(false);
      const interval = setInterval(() => {
        fetchMyTeam(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeHackathon?.id]);

  const fetchMyTeam = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/teams/', {
        params: { my_only: true }
      });
      const userTeams = response.data.results || response.data;
      if (userTeams.length > 0) {
        setTeam(userTeams[0]);
      } else {
        setTeam(null);
      }
    } catch (err) {
      console.error("Failed to load team for chat page", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  if (loading && !team) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2 text-gray-500 font-semibold text-sm">
          <RefreshCw size={18} className="animate-spin text-blue-600" />
          <span>Loading Team Chat...</span>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <MessageSquare size={28} />
          </div>
          <h2 className="text-xl font-bold font-display text-gray-900">No Team Found</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            You need to create or join a team first to use the live Team Chat feature.
          </p>
          <Link
            to="/my-team"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <Users size={14} />
            <span>Go to My Team Page</span>
          </Link>
        </div>
      </div>
    );
  }

  if (team.members.length <= 1) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <UserPlus size={28} />
          </div>
          <h2 className="text-xl font-bold font-display text-gray-900">Invite Teammates to Chat</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            Your team <span className="font-bold text-gray-800">"{team.name}"</span> currently has only 1 member (you). Team chat activates as soon as another teammate joins your team.
          </p>
          <Link
            to="/my-team"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <UserPlus size={14} />
            <span>Invite Teammates on My Team</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white">
      <TeamChat teamId={team.id} teamName={team.name} fullScreen={true} />
    </div>
  );
}
