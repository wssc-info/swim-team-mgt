'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchClubs, fetchLeagues, createClub, updateClubApi, deleteClubApi } from '@/lib/api';
import type { SwimClub, League } from '@/lib/types';
import { Building2, Pencil, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface ClubFormData {
  name: string;
  abbreviation: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  leagueId: string;
  maxEventsPerSwimmer: number;
}

const emptyForm: ClubFormData = {
  name: '', abbreviation: '', address: '', city: '', state: '',
  zipCode: '', phone: '', email: '', website: '', leagueId: '', maxEventsPerSwimmer: 0,
};

export default function AdminClubsPage() {
  const { user } = useAuth();
  const isLeagueAdmin = user?.role === 'leagueAdmin';
  const myLeagueId = user?.leagueId;

  const [clubs, setClubs] = useState<SwimClub[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SwimClub | null>(null);
  const [formData, setFormData] = useState<ClubFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortCol, setSortCol] = useState<'name' | 'abbreviation' | 'city' | 'league'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const load = async () => {
    setLoading(true);
    try {
      const [cs, ls] = await Promise.all([fetchClubs(), fetchLeagues()]);
      setClubs(isLeagueAdmin && myLeagueId ? cs.filter(c => c.leagueId === myLeagueId) : cs);
      setLeagues(ls);
    } catch {
      setError('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const leagueMap = useMemo(
    () => Object.fromEntries(leagues.map(l => [l.id, l])),
    [leagues]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clubs
      .filter(c => {
        if (q && !c.name.toLowerCase().includes(q) && !c.abbreviation.toLowerCase().includes(q) && !c.city.toLowerCase().includes(q)) return false;
        if (leagueFilter === '__none' && c.leagueId) return false;
        if (leagueFilter && leagueFilter !== '__none' && c.leagueId !== leagueFilter) return false;
        if (statusFilter === 'active' && !c.isActive) return false;
        if (statusFilter === 'inactive' && c.isActive) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortCol === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortCol === 'abbreviation') cmp = a.abbreviation.localeCompare(b.abbreviation);
        else if (sortCol === 'city') cmp = a.city.localeCompare(b.city);
        else if (sortCol === 'league') {
          const la = leagueMap[a.leagueId ?? '']?.name ?? '';
          const lb = leagueMap[b.leagueId ?? '']?.name ?? '';
          cmp = la.localeCompare(lb);
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [clubs, search, leagueFilter, statusFilter, sortCol, sortDir, leagueMap]);

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
    setFormData({ ...emptyForm, leagueId: isLeagueAdmin && myLeagueId ? myLeagueId : '' });
    setShowForm(true);
  };

  const openEdit = (club: SwimClub) => {
    setEditing(club);
    setFormData({
      name: club.name,
      abbreviation: club.abbreviation,
      address: club.address,
      city: club.city,
      state: club.state,
      zipCode: club.zipCode,
      phone: club.phone ?? '',
      email: club.email ?? '',
      website: club.website ?? '',
      leagueId: club.leagueId ?? '',
      maxEventsPerSwimmer: club.maxEventsPerSwimmer ?? 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        abbreviation: formData.abbreviation,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        leagueId: formData.leagueId || undefined,
        isActive: true,
        maxEventsPerSwimmer: formData.maxEventsPerSwimmer,
      };
      if (editing) {
        await updateClubApi(editing.id, payload);
      } else {
        await createClub(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (club: SwimClub) => {
    try {
      await updateClubApi(club.id, { isActive: !club.isActive });
      await load();
    } catch {
      setError('Failed to update club status');
    }
  };

  const handleDelete = async (club: SwimClub) => {
    if (!confirm(`Delete "${club.name}"? This cannot be undone.`)) return;
    try {
      await deleteClubApi(club.id);
      await load();
    } catch {
      setError('Failed to delete club');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading clubs...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold">Swim Clubs</h1>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add Club
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {showForm && (
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Club' : 'Add New Club'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label>
                <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation *</label>
                <input value={formData.abbreviation}
                  onChange={e => setFormData(p => ({ ...p, abbreviation: e.target.value.toUpperCase() }))}
                  required maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                  required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                  required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value.toUpperCase() }))}
                  required maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
                <input value={formData.zipCode} onChange={e => setFormData(p => ({ ...p, zipCode: e.target.value }))}
                  required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              {!isLeagueAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">League</label>
                  <select value={formData.leagueId} onChange={e => setFormData(p => ({ ...p, leagueId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">No league</option>
                    {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Events per Swimmer (Family)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.maxEventsPerSwimmer}
                  onChange={e => setFormData(p => ({ ...p, maxEventsPerSwimmer: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0 = families view only (events assigned by coach). N = families can self-select up to N events when signup is open.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Club' : 'Add Club'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Search name, abbr, city…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-56"
        />
        {!isLeagueAdmin && (
          <select
            value={leagueFilter}
            onChange={e => setLeagueFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Leagues</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            <option value="__none">No League</option>
          </select>
        )}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-sm text-gray-500">{filtered.length} of {clubs.length}</span>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('name')}>
                Name <SortIcon col="name" />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('abbreviation')}>
                Abbr <SortIcon col="abbreviation" />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none hidden lg:table-cell" onClick={() => toggleSort('league')}>
                League <SortIcon col="league" />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort('city')}>
                City <SortIcon col="city" />
              </th>
              <th className="px-4 py-3 text-left hidden xl:table-cell">Contact</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  {clubs.length === 0 ? 'No clubs yet. Add one above.' : 'No results for that filter.'}
                </td>
              </tr>
            ) : filtered.map(club => (
              <tr key={club.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{club.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                    {club.abbreviation}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                  {club.leagueId && leagueMap[club.leagueId]
                    ? <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">{leagueMap[club.leagueId].abbreviation}</span>
                    : <span className="text-gray-300">—</span>
                  }
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                  {club.city}, {club.state}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-gray-500 text-xs space-y-0.5">
                  {club.phone && <div>{club.phone}</div>}
                  {club.email && <div>{club.email}</div>}
                  <div className="text-gray-400">Max events: {club.maxEventsPerSwimmer ?? 0}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleActive(club)}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      club.isActive
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {club.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(club)}
                      className="p-1.5 border border-gray-200 rounded hover:bg-gray-50">
                      <Pencil className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(club)}
                      className="p-1.5 border border-gray-200 rounded hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
