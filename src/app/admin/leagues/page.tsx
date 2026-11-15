'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  fetchLeagues, createLeague, updateLeagueApi, deleteLeagueApi,
  fetchClubs, updateClubApi,
} from '@/lib/api';
import type { League, SwimClub } from '@/lib/types';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function LeaguesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <LeaguesContent />
    </ProtectedRoute>
  );
}

function LeaguesContent() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [clubs, setClubs] = useState<SwimClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<League | null>(null);
  const [formData, setFormData] = useState({ name: '', abbreviation: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<'name' | 'abbreviation' | 'clubs'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const load = async () => {
    setLoading(true);
    try {
      const [ls, cs] = await Promise.all([fetchLeagues(), fetchClubs()]);
      setLeagues(ls);
      setClubs(cs);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const clubCountMap = useMemo(
    () => Object.fromEntries(leagues.map(l => [l.id, clubs.filter(c => c.leagueId === l.id).length])),
    [leagues, clubs]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leagues
      .filter(l =>
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.abbreviation.toLowerCase().includes(q) ||
        (l.description ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        let cmp = 0;
        if (sortCol === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortCol === 'abbreviation') cmp = a.abbreviation.localeCompare(b.abbreviation);
        else if (sortCol === 'clubs') cmp = (clubCountMap[a.id] ?? 0) - (clubCountMap[b.id] ?? 0);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [leagues, search, sortCol, sortDir, clubCountMap]);

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortCol }) =>
    sortCol === col
      ? <span className="ml-1 text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
      : <span className="ml-1 text-gray-300">↕</span>;

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', abbreviation: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (league: League) => {
    setEditing(league);
    setFormData({ name: league.name, abbreviation: league.abbreviation, description: league.description ?? '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateLeagueApi(editing.id, { ...formData, isActive: editing.isActive });
      } else {
        await createLeague({ ...formData, isActive: true });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (league: League) => {
    const count = clubCountMap[league.id] ?? 0;
    if (count > 0) {
      alert(`Cannot delete "${league.name}" — ${count} club(s) are assigned to it. Reassign them first.`);
      return;
    }
    if (!confirm(`Delete league "${league.name}"?`)) return;
    try {
      await deleteLeagueApi(league.id);
      await load();
    } catch {
      setError('Failed to delete league');
    }
  };

  const handleClubLeagueChange = async (clubId: string, leagueId: string) => {
    try {
      await updateClubApi(clubId, { leagueId: leagueId || undefined });
      setClubs(prev => prev.map(c => c.id === clubId ? { ...c, leagueId: leagueId || undefined } : c));
    } catch {
      setError('Failed to update club league');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leagues</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          + New League
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {showForm && (
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">{editing ? 'Edit League' : 'New League'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation *</label>
                <input
                  value={formData.abbreviation}
                  onChange={e => setFormData(p => ({ ...p, abbreviation: e.target.value.toUpperCase() }))}
                  required maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4 flex gap-3 items-center">
        <input
          type="search"
          placeholder="Filter by name or abbreviation…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-72"
        />
        <span className="text-sm text-gray-500">{filtered.length} of {leagues.length}</span>
      </div>

      <div className="border rounded-lg overflow-hidden mb-10">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('name')}>
                Name <SortIcon col="name" />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('abbreviation')}>
                Abbr <SortIcon col="abbreviation" />
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Description</th>
              <th className="px-4 py-3 text-center cursor-pointer select-none" onClick={() => toggleSort('clubs')}>
                Clubs <SortIcon col="clubs" />
              </th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">
                  {leagues.length === 0 ? 'No leagues yet. Create one above.' : 'No results for that filter.'}
                </td>
              </tr>
            ) : filtered.map(league => (
              <tr key={league.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{league.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
                    {league.abbreviation}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{league.description ?? '—'}</td>
                <td className="px-4 py-3 text-center text-gray-600">{clubCountMap[league.id] ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(league)}
                    className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50 mr-1">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(league)}
                    className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Assign Clubs to Leagues</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Club</th>
                <th className="px-4 py-3 text-left">Abbr</th>
                <th className="px-4 py-3 text-left">League</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clubs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-gray-400">No clubs found.</td>
                </tr>
              ) : [...clubs].sort((a, b) => a.name.localeCompare(b.name)).map(club => (
                <tr key={club.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{club.name}</td>
                  <td className="px-4 py-2 text-gray-500">{club.abbreviation}</td>
                  <td className="px-4 py-2">
                    <select
                      value={club.leagueId ?? ''}
                      onChange={e => handleClubLeagueChange(club.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">No league</option>
                      {leagues.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
