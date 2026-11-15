'use client';

import { useState, useEffect } from 'react';
import {
  fetchMeetTemplates, createMeetTemplate, updateMeetTemplateApi, deleteMeetTemplateApi,
  fetchLeagues, fetchClubs, fetchAllEvents,
} from '@/lib/api';
import type { MeetTemplate, League, SwimClub, SwimEvent, MeetEvent } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';

type TemplateFormData = {
  name: string;
  description: string;
  scope: 'league' | 'club';
  leagueId: string;
  clubId: string;
  course: 'SCY' | 'SCM' | 'LCM';
  meetEvents: MeetEvent[];
  availableEvents: string[];
};

const EMPTY_FORM: TemplateFormData = {
  name: '',
  description: '',
  scope: 'club',
  leagueId: '',
  clubId: '',
  course: 'SCY',
  meetEvents: [],
  availableEvents: [],
};

export default function MeetTemplatesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'leagueAdmin', 'coach']}>
      <MeetTemplatesContent />
    </ProtectedRoute>
  );
}

function MeetTemplatesContent() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MeetTemplate[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [clubs, setClubs] = useState<SwimClub[]>([]);
  const [allEvents, setAllEvents] = useState<SwimEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MeetTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [eventFilter, setEventFilter] = useState({ stroke: 'all', ageGroup: 'all', eventType: 'all' });

  const isAdmin = user?.role === 'admin';
  const isLeagueAdmin = user?.role === 'leagueAdmin';
  const myLeagueId = user?.leagueId;

  const load = async () => {
    setLoading(true);
    try {
      const [ts, ls, cs, evts] = await Promise.all([
        fetchMeetTemplates(),
        fetchLeagues(),
        fetchClubs(),
        fetchAllEvents(),
      ]);
      const leagueClubIds = isLeagueAdmin && myLeagueId
        ? new Set(cs.filter(c => c.leagueId === myLeagueId).map(c => c.id))
        : null;
      setTemplates(leagueClubIds
        ? ts.filter(t =>
            (t.scope === 'league' && t.leagueId === myLeagueId) ||
            (t.scope === 'club' && t.clubId && leagueClubIds.has(t.clubId))
          )
        : ts);
      setLeagues(ls);
      setClubs(isLeagueAdmin && myLeagueId ? cs.filter(c => c.leagueId === myLeagueId) : cs);
      setAllEvents(evts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditing(null);
    const defaults = { ...EMPTY_FORM };
    if (!isAdmin && user?.clubId) {
      defaults.clubId = user.clubId;
      defaults.scope = 'club';
    }
    setFormData(defaults);
    setShowForm(true);
  };

  const openEdit = (t: MeetTemplate) => {
    setEditing(t);
    setFormData({
      name: t.name,
      description: t.description ?? '',
      scope: t.scope,
      leagueId: t.leagueId ?? '',
      clubId: t.clubId ?? '',
      course: t.course,
      meetEvents: t.meetEvents,
      availableEvents: t.availableEvents,
    });
    setShowForm(true);
  };

  const openClone = (t: MeetTemplate) => {
    setEditing(null);
    const callerClubId = !isAdmin && user?.clubId ? user.clubId : '';
    const forcedToClub = !isAdmin && t.scope === 'league';
    setFormData({
      name: `Copy of ${t.name}`,
      description: t.description ?? '',
      scope: forcedToClub ? 'club' : t.scope,
      leagueId: forcedToClub ? '' : (t.leagueId ?? ''),
      clubId: forcedToClub ? callerClubId : (t.clubId ?? ''),
      course: t.course,
      meetEvents: t.meetEvents,
      availableEvents: t.availableEvents,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Name is required'); return; }
    if (formData.meetEvents.length === 0) { setError('Add at least one event'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...formData,
        leagueId: formData.leagueId || undefined,
        clubId: formData.clubId || undefined,
      };
      if (editing) {
        await updateMeetTemplateApi(editing.id, payload);
      } else {
        await createMeetTemplate(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: MeetTemplate) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    try {
      await deleteMeetTemplateApi(t.id);
      await load();
    } catch {
      setError('Delete failed');
    }
  };

  const filteredEvents = allEvents.filter((e) => {
    if (e.course !== formData.course) return false;
    if (eventFilter.stroke !== 'all' && e.stroke !== eventFilter.stroke) return false;
    if (eventFilter.ageGroup !== 'all' && !e.ageGroups.includes(eventFilter.ageGroup)) return false;
    if (eventFilter.eventType === 'individual' && e.isRelay) return false;
    if (eventFilter.eventType === 'relay' && !e.isRelay) return false;
    return true;
  });

  const getAvailableCombinations = (event: SwimEvent) => {
    const used = formData.meetEvents.filter((me) => me.eventId === event.id).map((me) => `${me.ageGroup}-${me.gender}`);
    const genders: ('M' | 'F' | 'Mixed')[] = event.isRelay ? ['M', 'F', 'Mixed'] : ['M', 'F'];
    return genders
      .flatMap((g) => event.ageGroups.map((ag) => ({ ageGroup: ag, gender: g })))
      .filter(({ ageGroup, gender }) => !used.includes(`${ageGroup}-${gender}`));
  };

  const addEvent = (eventId: string, ageGroup: string, gender: 'M' | 'F' | 'Mixed') => {
    const nextNum = Math.max(0, ...formData.meetEvents.map((me) => me.eventNumber)) + 1;
    const newEvent: MeetEvent = { eventId, gender, eventNumber: nextNum, ageGroup };
    setFormData((prev) => ({
      ...prev,
      meetEvents: [...prev.meetEvents, newEvent],
      availableEvents: [...new Set([...prev.availableEvents, eventId])],
    }));
    setError('');
  };

  const removeEvent = (eventId: string, ageGroup: string, gender: 'M' | 'F' | 'Mixed') => {
    setFormData((prev) => {
      const newMeetEvents = prev.meetEvents.filter(
        (me) => !(me.eventId === eventId && me.ageGroup === ageGroup && me.gender === gender)
      );
      const stillUsed = newMeetEvents.some((me) => me.eventId === eventId);
      return {
        ...prev,
        meetEvents: newMeetEvents,
        availableEvents: stillUsed ? prev.availableEvents : prev.availableEvents.filter((id) => id !== eventId),
      };
    });
  };

  const templateClubName = (t: MeetTemplate) => {
    if (t.scope === 'league') return leagues.find((l) => l.id === t.leagueId)?.name ?? 'League';
    return clubs.find((c) => c.id === t.clubId)?.abbreviation ?? 'Club';
  };

  if (loading) return <div className="p-8 text-center">Loading…</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Meet Templates</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + New Template
        </button>
      </div>

      {error && !showForm && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      {templates.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No templates yet. Create one to speed up meet setup.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <div className="text-xs text-gray-500 mt-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-white text-xs mr-1 ${t.scope === 'league' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                      {t.scope === 'league' ? 'League' : 'Club'}
                    </span>
                    {templateClubName(t)} · {t.course}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => openClone(t)}
                    className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded hover:bg-green-50"
                  >
                    Clone
                  </button>
                  {(isAdmin || t.scope !== 'league') && (
                    <>
                      <button
                        onClick={() => openEdit(t)}
                        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              {t.description && <p className="text-sm text-gray-600 mb-2">{t.description}</p>}
              <p className="text-sm text-gray-500">{t.meetEvents.length} event slots</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editing ? 'Edit Template' : 'New Meet Template'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Standard Dual Meet SCY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData((p) => ({ ...p, course: e.target.value as 'SCY' | 'SCM' | 'LCM', meetEvents: [], availableEvents: [] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SCY">Short Course Yards (SCY)</option>
                    <option value="SCM">Short Course Meters (SCM)</option>
                    <option value="LCM">Long Course Meters (LCM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope *</label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData((p) => ({ ...p, scope: e.target.value as 'league' | 'club', leagueId: '', clubId: '' }))}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="club">Club (this club only)</option>
                    {isAdmin && <option value="league">League (all clubs in league)</option>}
                  </select>
                </div>

                {formData.scope === 'league' && isAdmin ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">League *</label>
                    <select
                      value={formData.leagueId}
                      onChange={(e) => setFormData((p) => ({ ...p, leagueId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select league</option>
                      {leagues.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Club *</label>
                    <select
                      value={formData.clubId}
                      onChange={(e) => setFormData((p) => ({ ...p, clubId: e.target.value }))}
                      disabled={!isAdmin}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select club</option>
                      {clubs.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.abbreviation})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events * ({formData.meetEvents.length} selected)
                </label>

                {formData.meetEvents.length > 0 && (
                  <div className="mb-3 border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Evt #</th>
                          <th className="px-3 py-2 text-left">Age Group</th>
                          <th className="px-3 py-2 text-left">Gender</th>
                          <th className="px-3 py-2 text-left">Event</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...formData.meetEvents].sort((a, b) => a.eventNumber - b.eventNumber).map((me) => {
                          const ev = allEvents.find((e) => e.id === me.eventId);
                          return (
                            <tr key={`${me.eventId}-${me.ageGroup}-${me.gender}`} className="border-t">
                              <td className="px-3 py-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  value={me.eventNumber}
                                  onChange={(e) =>
                                    setFormData((p) => ({
                                      ...p,
                                      meetEvents: p.meetEvents.map((x) =>
                                        x.eventId === me.eventId && x.ageGroup === me.ageGroup && x.gender === me.gender
                                          ? { ...x, eventNumber: parseInt(e.target.value) || 1 }
                                          : x
                                      ),
                                    }))
                                  }
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </td>
                              <td className="px-3 py-1.5 text-gray-700">{me.ageGroup}</td>
                              <td className="px-3 py-1.5 text-gray-700">{{ M: 'Male', F: 'Female', Mixed: 'Mixed' }[me.gender]}</td>
                              <td className="px-3 py-1.5">
                                <span className={ev?.isRelay ? 'text-purple-700' : ''}>{ev?.name ?? 'Unknown'}</span>
                              </td>
                              <td className="px-3 py-1.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeEvent(me.eventId, me.ageGroup, me.gender)}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Add Events (showing {formData.course} events):
                  </h4>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <select
                      value={eventFilter.stroke}
                      onChange={(e) => setEventFilter((p) => ({ ...p, stroke: e.target.value }))}
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="all">All Strokes</option>
                      <option value="freestyle">Freestyle</option>
                      <option value="backstroke">Backstroke</option>
                      <option value="breaststroke">Breaststroke</option>
                      <option value="butterfly">Butterfly</option>
                      <option value="medley">IM</option>
                    </select>
                    <select
                      value={eventFilter.ageGroup}
                      onChange={(e) => setEventFilter((p) => ({ ...p, ageGroup: e.target.value }))}
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="all">All Ages</option>
                      <option value="8&U">8 & Under</option>
                      <option value="9-10">9-10</option>
                      <option value="11-12">11-12</option>
                      <option value="13-14">13-14</option>
                      <option value="15-18">15-18</option>
                    </select>
                    <select
                      value={eventFilter.eventType}
                      onChange={(e) => setEventFilter((p) => ({ ...p, eventType: e.target.value }))}
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="all">All Types</option>
                      <option value="individual">Individual</option>
                      <option value="relay">Relay</option>
                    </select>
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded bg-white p-2 space-y-2">
                    {filteredEvents.map((ev) => {
                      const combos = getAvailableCombinations(ev);
                      if (!combos.length) return null;
                      return (
                        <div key={ev.id} className="border border-gray-100 rounded p-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className={`text-xs font-medium ${ev.isRelay ? 'text-purple-700' : ''}`}>{ev.name}</span>
                              <div className="text-xs text-gray-400">{ev.course} · {ev.distance}m {ev.stroke}</div>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {combos.map(({ ageGroup, gender }) => (
                                <button
                                  key={`${ageGroup}-${gender}`}
                                  type="button"
                                  onClick={() => addEvent(ev.id, ageGroup, gender)}
                                  className={`text-xs px-1.5 py-0.5 rounded text-white hover:opacity-80 ${
                                    gender === 'M' ? 'bg-blue-400' : gender === 'F' ? 'bg-pink-400' : 'bg-purple-600'
                                  }`}
                                >
                                  {ageGroup} {gender}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredEvents.every((ev) => getAvailableCombinations(ev).length === 0) && (
                      <p className="text-xs text-gray-500 text-center py-4">No more combinations to add</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editing ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
