'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchClub, updateClubApi } from '@/lib/api';
import { SwimClub } from '@/lib/types';
import { getClubId } from '@/lib/utils';

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'coach', 'leagueAdmin']}>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const [club, setClub] = useState<SwimClub | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    maxEventsPerSwimmer: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        let clubId: string | null = null;
        try { clubId = getClubId(user); } catch { /* ignore */ }
        if (!clubId) { setLoading(false); return; }
        const data = await fetchClub(clubId);
        setClub(data);
        setForm({
          name: data.name ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          website: data.website ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          zipCode: data.zipCode ?? '',
          maxEventsPerSwimmer: data.maxEventsPerSwimmer ?? 0,
        });
      } catch (e) {
        setErrorMsg('Failed to load club settings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await updateClubApi(club.id, {
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
        address: form.address,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        maxEventsPerSwimmer: form.maxEventsPerSwimmer,
      });
      setSuccessMsg('Settings saved.');
    } catch (e) {
      setErrorMsg('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (loading) return <div className="max-w-2xl mx-auto p-6 text-gray-500">Loading…</div>;
  if (!club) return <div className="max-w-2xl mx-auto p-6 text-gray-500">No club found.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Team Settings</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">

        {/* Contact Information */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={form.address}
                onChange={set('address')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={set('city')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={set('state')}
                  maxLength={2}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={form.zipCode}
                  onChange={set('zipCode')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Website */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Website</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Club Website URL</label>
            <input
              type="url"
              value={form.website}
              onChange={set('website')}
              placeholder="https://example.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        {/* Family Signup */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Family Signup</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Events Per Swimmer</label>
            <input
              type="number"
              min={0}
              value={form.maxEventsPerSwimmer}
              onChange={e => setForm(prev => ({ ...prev, maxEventsPerSwimmer: parseInt(e.target.value) || 0 }))}
              className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              0 = families can only view assigned events. Any other number = families can self-select up to that many events when a meet's signup is open.
            </p>
          </div>
        </section>

        {successMsg && <p className="text-green-700 text-sm">{successMsg}</p>}
        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
