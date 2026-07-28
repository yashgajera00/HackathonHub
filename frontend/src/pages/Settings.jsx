import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Lock, Check } from 'lucide-react';

export default function Settings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    try {
      setLoading(true);
      // Call update profile with the new password
      await api.put('/users/profile/', {
        password: passwords.new_password,
      });
      showToast('Password changed successfully!', 'success');
      setPasswords({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      console.error(err);
      showToast('Failed to change password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900">Security Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage passwords and system safety settings.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
            <div className="relative rounded-md shadow-xs max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input 
                type="password" 
                name="new_password"
                required
                value={passwords.new_password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Confirm New Password</label>
            <div className="relative rounded-md shadow-xs max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input 
                type="password" 
                name="confirm_password"
                required
                value={passwords.confirm_password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-sm transition disabled:opacity-50"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
