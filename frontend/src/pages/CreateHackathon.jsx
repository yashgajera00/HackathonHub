import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useHackathon } from '../context/HackathonContext';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Sparkles } from 'lucide-react';

export default function CreateHackathon() {
  const { showToast } = useToast();
  const { selectHackathon } = useHackathon();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    publish_time: '',
    start_date: '',
    end_date: '',
    registration_start: '',
    registration_end: '',
    venue: '',
    city: '',
    state: '',
    country: '',
    max_team_size: 4,
    min_team_size: 1,
    status: 'Draft',
  });

  const [banner, setBanner] = useState(null);
  const [logo, setLogo] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (banner) data.append('banner', banner);
      if (logo) data.append('logo', logo);

      const response = await api.post('/hackathons/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast('Hackathon created successfully!', 'success');
      // Automatically select this hackathon
      selectHackathon(response.data.id);
      navigate('/');
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        const firstErrKey = Object.keys(errors)[0];
        const firstErrVal = errors[firstErrKey];
        showToast(`${firstErrKey}: ${Array.isArray(firstErrVal) ? firstErrVal[0] : firstErrVal}`, 'error');
      } else {
        showToast(err.response?.data?.detail || 'Failed to create hackathon.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-8">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
            <PlusCircle size={12} />
            <span>Create Event</span>
          </div>
          <h2 className="text-3xl font-extrabold font-display text-gray-900 mt-2">New Hackathon</h2>
          <p className="text-sm text-gray-500 mt-1">Initialize the hackathon timeline, rules, and participant brackets.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hackathon Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="Global AI Hackathon 2026"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="Detail the theme, tracks, and prizes of the hackathon..."
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Logo Thumbnail</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogo(e.target.files[0])}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Banner Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBanner(e.target.files[0])}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="border-t border-gray-100 md:col-span-2 my-2"></div>

            {/* Dates */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Publish Date & Time (Optional)</label>
              <input
                type="datetime-local"
                name="publish_time"
                value={formData.publish_time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
              />
              <p className="text-[10px] text-gray-400 mt-1">If set, the event will remain a Draft until this time, after which it will automatically publish.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Registration Start Date</label>
              <input
                type="datetime-local"
                name="registration_start"
                required
                value={formData.registration_start}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Registration End Date</label>
              <input
                type="datetime-local"
                name="registration_end"
                required
                value={formData.registration_end}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hackathon Start Date</label>
              <input
                type="datetime-local"
                name="start_date"
                required
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hackathon End Date</label>
              <input
                type="datetime-local"
                name="end_date"
                required
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
              />
            </div>

            <div className="border-t border-gray-100 md:col-span-2 my-2"></div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Venue (or 'Virtual')</label>
              <input
                type="text"
                name="venue"
                required
                value={formData.venue}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="Tech Center Room 101"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">City</label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="San Francisco"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">State</label>
              <input
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="California"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Country</label>
              <input
                type="text"
                name="country"
                required
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
                placeholder="United States"
              />
            </div>

            <div className="border-t border-gray-100 md:col-span-2 my-2"></div>

            {/* Team rules */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Min Team Size</label>
              <input
                type="number"
                name="min_team_size"
                required
                value={formData.min_team_size}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Max Team Size</label>
              <input
                type="number"
                name="max_team_size"
                required
                value={formData.max_team_size}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100 space-x-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="py-2.5 px-6 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-sm transition disabled:opacity-50"
            >
              {loading ? 'Creating event...' : 'Create Hackathon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
