import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldAlert, Sparkles, CheckCircle2, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const response = await api.post('/auth/forgot-password/', { email });
      setSuccess(true);
      showToast('Instructions sent (Mocked).', 'success');
      
      if (response.data.reset_link) {
        setResetLink(response.data.reset_link);
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to request reset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      
      {/* Background Decorative Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-200/60 via-indigo-200/50 to-purple-200/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <span className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold font-display text-xl shadow-md shadow-blue-600/30 group-hover:scale-105 transition-all">
            H
          </span>
          <span className="text-2xl font-bold font-display tracking-tight text-slate-900">
            Hackathon<span className="text-blue-600">Hub</span>
          </span>
        </Link>

        <Link to="/login" className="flex items-center space-x-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </Link>
      </header>

      {/* Form Area */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-12 my-auto">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-3xl p-6 sm:p-10 relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-slate-900">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your email address to receive recovery instructions.
            </p>
          </div>

          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email address
                </label>
                <div className="relative rounded-2xl shadow-2xs group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition font-medium"
                    placeholder="admin@hackathonhub.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-blue-600/25 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending reset link...</span>
                    </div>
                  ) : (
                    <span>Send Recovery Link</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-sm font-medium flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Instructions sent! In a production system, a mail service would deliver the link to {email}.</span>
              </div>
              
              {resetLink && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                    <ShieldAlert size={14} />
                    <span>Dev Local Reset Helper</span>
                  </div>
                  <p className="text-xs text-slate-500">Click below to complete password reset:</p>
                  <Link 
                    to={resetLink} 
                    className="block text-center py-2.5 px-4 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-xl hover:bg-blue-100 text-xs transition shadow-2xs"
                  >
                    Proceed to Reset Password Form
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200/80 flex justify-center">
            <Link to="/login" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition">
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200/60 mt-auto text-center text-xs text-slate-500">
        <p>© 2026 HackathonHub. All rights reserved.</p>
      </footer>

    </div>
  );
}


