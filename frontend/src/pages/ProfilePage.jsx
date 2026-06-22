import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Mail, Calendar, Save, CheckCircle } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-8">Profile</h1>

      {/* Avatar Card */}
      <div className="card mb-6 flex items-center gap-5">
        <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-semibold text-lg">{user?.name}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-5">Edit Profile</h2>

        {success && (
          <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-400 rounded-lg px-4 py-3 mb-5 flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            Profile updated successfully.
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input pl-9"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input pl-9"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
