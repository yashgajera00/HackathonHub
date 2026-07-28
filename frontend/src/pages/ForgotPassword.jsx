import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldAlert } from 'lucide-react';

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
      
      // Reveal the link directly in debug mode so the user can easily reset password locally
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-display">
          Reset password
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Enter your email to receive recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-gray-100 shadow-xl rounded-2xl sm:px-10">
          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                    placeholder="admin@hackathonhub.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-sm font-medium">
                Instructions have been logged. In a production system, a mail service would deliver the reset link.
              </div>
              
              {resetLink && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-left space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-600">
                    <ShieldAlert size={14} />
                    <span>LOCAL TESTING LINK (DEV ONLY)</span>
                  </div>
                  <p className="text-xs text-gray-500">Since we are using SQLite and simulating emails, click below to complete reset:</p>
                  <Link 
                    to={resetLink} 
                    className="block text-center py-1.5 px-3 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 text-xs transition"
                  >
                    Go to Reset Password Form
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Link to="/login" className="flex items-center space-x-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition">
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
