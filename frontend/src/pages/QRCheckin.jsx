import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
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
  const isScanningRef = useRef(false);
  const [modalData, setModalData] = useState(null);

  const closeModal = () => {
    setModalData(null);
    setTimeout(() => {
      isScanningRef.current = false;
    }, 1500); // 1.5s cooldown before next scan
  };

  // Simulated scan database helpers
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    if (activeHackathon) {
      fetchUncheckedParticipants();
    }
  }, [activeHackathon]);

  useEffect(() => {
    if (!activeHackathon) return;

    const scanner = new Html5QrcodeScanner(
      "qr-scanner-camera",
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        videoConstraints: {
          facingMode: "environment"
        }
      },
      false
    );

    const onScanSuccess = (decodedText) => {
      if (decodedText && !isScanningRef.current) {
        isScanningRef.current = true;
        handleCheckInSubmit(null, decodedText);
      }
    };

    const onScanFailure = (error) => {
      // ignore
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch((err) => {
        console.error("Failed to clear html5-qrcode scanner", err);
      });
    };
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
      setModalData({
        success: true,
        title: "Check-in Successful",
        message: response.data.detail,
        user: participantName,
        code: targetUuid
      });
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
      setModalData({
        success: false,
        title: "Check-in Failed",
        message: errorMsg,
        code: targetUuid
      });
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

          {/* Custom Styles to Override html5-qrcode's Native Styling */}
          <style>{`
            #qr-scanner-camera {
              border: none !important;
              padding: 0 !important;
            }
            #qr-scanner-camera__dashboard {
              padding: 12px !important;
              background: #f8fafc !important;
              border-radius: 16px !important;
              border: 1px solid #e2e8f0 !important;
            }
            #qr-scanner-camera button {
              background-color: #2563eb !important;
              color: white !important;
              border: none !important;
              border-radius: 8px !important;
              padding: 8px 16px !important;
              font-size: 11px !important;
              font-weight: bold !important;
              cursor: pointer !important;
              transition: background 0.15s ease !important;
              margin: 4px !important;
            }
            #qr-scanner-camera button:hover {
              background-color: #1d4ed8 !important;
            }
            #qr-scanner-camera select {
              border: 1px solid #e2e8f0 !important;
              border-radius: 8px !important;
              padding: 6px 10px !important;
              font-size: 11px !important;
              background-color: white !important;
              outline: none !important;
            }
          `}</style>

          {/* Real Web Camera Scanner Container */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 relative overflow-hidden">
            <div id="qr-scanner-camera" className="w-full rounded-xl overflow-hidden bg-black"></div>
            <p className="text-[10px] text-gray-400 mt-2 text-center font-semibold flex items-center justify-center space-x-1.5">
              <Scan size={12} className="text-blue-600 animate-pulse" />
              <span>Camera Stream ready</span>
            </p>
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

      {/* Scan Results Modal Overlay */}
      {modalData && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-xs">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-155">
            <div className="flex justify-center">
              {modalData.success ? (
                <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                  <CheckCircle size={36} className="stroke-[2.5]" />
                </div>
              ) : (
                <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-100">
                  <AlertTriangle size={36} className="stroke-[2.5]" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className={`text-lg font-black font-display tracking-tight ${
                modalData.success ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {modalData.title}
              </h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                {modalData.message}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left text-[10px] font-mono text-gray-600 space-y-1">
              {modalData.success && modalData.user && (
                <p><span className="font-bold text-gray-400">User:</span> {modalData.user}</p>
              )}
              <p className="break-all"><span className="font-bold text-gray-400">Code:</span> {modalData.code}</p>
              <p><span className="font-bold text-gray-400">Timestamp:</span> {new Date().toLocaleTimeString()}</p>
            </div>

            <button
              onClick={closeModal}
              className={`w-full py-2.5 text-white font-bold rounded-xl text-xs transition shadow-sm ${
                modalData.success 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Scan Next / Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
