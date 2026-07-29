import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { QrCode, Scan, ArrowRight, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

export default function QRCheckin() {
  const { activeHackathon } = useHackathon();
  const { showToast } = useToast();

  const [uuidInput, setUuidInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState(null);

  // Simulated scan database helpers
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    if (activeHackathon) {
      fetchUncheckedParticipants();
    }
  }, [activeHackathon]);

  const fetchUncheckedParticipants = async () => {
    try {
      setLoadingParticipants(true);
      // Fetch registrations that are approved but not checked-in
      const response = await api.get('/registrations/', {
        params: { hackathon_id: activeHackathon.id }
      });
      const data = response.data.results || response.data;
      const filtered = data.filter(r => r.status === 'Approved' && !r.checked_in);
      setPendingParticipants(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleCheckInSubmit = async (e, directUuid = null) => {
    if (e) e.preventDefault();
    
    const targetUuid = directUuid || uuidInput;
    if (!targetUuid) {
      showToast('Please enter or select a verification code.', 'error');
      return;
    }

    setLoading(true);
    setOutcome(null);
    try {
      const response = await api.post('/registrations/check_in_by_qr/', {
        qr_code_uuid: targetUuid
      });
      const participantName = response.data.registration?.user_details
        ? `${response.data.registration.user_details.first_name || ''} ${response.data.registration.user_details.last_name || ''}`.trim() || response.data.registration.user_details.username
        : 'Participant';
      showToast(response.data.detail, 'success');
      alert(`✅ CHECK-IN SUCCESSFUL!\n\nUser: ${participantName}\nCode: ${targetUuid}\nStatus: Checked In Successfully.`);
      setOutcome({
        success: true,
        message: response.data.detail,
        data: response.data.registration
      });
      setUuidInput('');
      fetchUncheckedParticipants(); // Refresh simulator list
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || 'Scan verification failed. Code is invalid or not approved.';
      showToast(errorMsg, 'error');
      alert(`❌ INVALID OR DUP-CHECK-IN!\n\nError: ${errorMsg}\nCode Attempted: ${targetUuid}`);
      setOutcome({
        success: false,
        message: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Scanner Mockup Portal */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-display flex items-center space-x-2">
              <QrCode className="text-blue-600" />
              <span>QR Scanner Terminal</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">Scan or input participant check-in code to check them in.</p>
          </div>

          {/* Scanner Mockup Border */}
          <div className="h-44 bg-gray-900 border-4 border-dashed border-blue-600/60 rounded-3xl flex flex-col items-center justify-center text-white relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-linear-to-b from-blue-500/10 via-transparent to-transparent animate-pulse-slow"></div>
            <Scan size={44} className="text-blue-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-3">Camera Scanner Ready</span>
          </div>

          {/* Manual input */}
          <form onSubmit={(e) => handleCheckInSubmit(e)} className="space-y-3 text-xs font-semibold text-gray-400">
            <div>
              <label className="block mb-1.5 uppercase tracking-wider">Manual QR Code Input (UUID)</label>
              <input
                type="text"
                value={uuidInput}
                onChange={(e) => setUuidInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition font-mono"
                placeholder="Paste code or UUID here"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <>
                  <span>Verify & Check In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Scan outcomes */}
        {outcome && (
          <div className={`mt-6 p-4 border rounded-2xl text-xs ${
            outcome.success 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
              : 'bg-rose-50 text-rose-800 border-rose-100'
          }`}>
            <div className="flex items-start space-x-2">
              {outcome.success ? (
                <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="font-bold">{outcome.message}</p>
                {outcome.success && outcome.data && (
                  <div className="mt-2 space-y-0.5 text-[10px] text-emerald-700 font-semibold uppercase">
                    <p>User: {outcome.data.user_details.username}</p>
                    <p>Status: Checked In Successfully</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simulator Portal */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900 font-display">Check-in Simulator</h3>
          <p className="text-xs text-gray-400 mt-1">Select an approved participant to simulate their scan event.</p>
        </div>

        {loadingParticipants ? (
          <div className="h-40 bg-gray-50 animate-pulse rounded-2xl"></div>
        ) : pendingParticipants.length > 0 ? (
          <div className="divide-y divide-gray-150 border border-gray-150 rounded-2xl overflow-hidden max-h-[320px] overflow-y-auto">
            {pendingParticipants.map((p) => {
              const u = p.user_details || {};
              const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
              
              return (
                <div key={p.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-50/50 transition">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{name}</span>
                    <span className="text-[10px] font-mono text-gray-400 mt-0.5 select-all">{p.qr_code_uuid}</span>
                  </div>
                  <button
                    onClick={() => handleCheckInSubmit(null, p.qr_code_uuid)}
                    className="py-1 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-100 rounded-lg text-[10px] transition"
                  >
                    Simulate Scan
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 text-xs py-12 bg-gray-50 rounded-2xl">
            No pending approved check-ins left.
          </div>
        )}
      </div>
    </div>
  );
}
