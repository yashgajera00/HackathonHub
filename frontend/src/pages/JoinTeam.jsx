import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';

export default function JoinTeam() {
  const { inviteCode } = useParams();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (inviteCode) {
      performJoin();
    }
  }, [inviteCode]);

  const performJoin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/teams/join_by_invite_code/', {
        invite_code: inviteCode
      });

      setSuccessMsg(response.data.detail || 'Successfully joined the team!');
      showToast(response.data.detail || 'Successfully joined the team!', 'success');
      
      // Select this hackathon context if team has a hackathon field
      if (response.data.team_id) {
        // Fetch the team details to extract the hackathon id if needed, 
        // but redirecting to /my-team will trigger context reload.
        // Let's delay redirect slightly so user sees success.
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to join team. The link may be invalid, or the team is full.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        
        {loading && (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-bold font-display text-gray-900">Requesting to Join</h2>
            <p className="text-xs text-gray-400">Verifying invite credentials and roster brackets...</p>
          </div>
        )}

        {!loading && successMsg && (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
            </div>
            <h2 className="text-xl font-bold font-display text-gray-900">Request Sent!</h2>
            <p className="text-xs text-gray-500">{successMsg}</p>
            <p className="text-[10px] text-gray-400 animate-pulse mt-2">Redirecting you to dashboard...</p>
          </div>
        )}

        {!loading && error && (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                <ShieldAlert size={28} />
              </div>
            </div>
            <h2 className="text-xl font-bold font-display text-gray-900">Unable to Request Join</h2>
            <p className="text-xs text-rose-600 leading-relaxed px-2 bg-rose-50/50 py-2 border border-rose-100/50 rounded-xl">{error}</p>
            
            <div className="pt-4 flex flex-col space-y-2">
              <button
                onClick={() => navigate('/')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
