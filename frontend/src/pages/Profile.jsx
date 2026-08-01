import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { User, Phone, Upload, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleTextChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use FormData to support file upload
      const submissionData = new FormData();
      submissionData.append('first_name', formData.first_name);
      submissionData.append('last_name', formData.last_name);
      submissionData.append('phone', formData.phone);
      if (avatarFile) {
        submissionData.append('avatar', avatarFile);
      }

      await updateProfile(submissionData);
      showToast('Profile updated successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900">Personal Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your hackathon identities and contact details.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-24 w-24 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
              ) : (
                <div className="h-24 w-24 rounded-full bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-600 font-bold uppercase text-2xl">
                  {user?.username.slice(0, 2)}
                </div>
              )}
              <label 
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full border border-white cursor-pointer shadow-sm transition"
              >
                <Upload size={14} />
              </label>
              <input 
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800">Profile Picture</h4>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Username (Read-only)</label>
              <input 
                type="text" 
                disabled
                value={user?.username || ''}
                className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address (Read-only)</label>
              <input 
                type="email" 
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">First Name</label>
              <input 
                type="text" 
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleTextChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Last Name</label>
              <input 
                type="text" 
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleTextChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
              <input 
                type="text" 
                name="phone"
                required
                value={formData.phone}
                onChange={handleTextChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="+1555000000"
              />
            </div>
            
            {/* Hackathon Permission Status */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hackathon Creator Status</label>
              <div className="flex items-center space-x-2 mt-2">
                {user?.can_create_hackathon || user?.is_superuser ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Check size={12} className="mr-1" /> Authorized Creator
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    Standard Member
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-sm transition disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
