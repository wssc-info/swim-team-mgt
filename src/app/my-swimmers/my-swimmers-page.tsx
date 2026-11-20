'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {SwimEvent, Swimmer, TimeRecord} from '@/lib/types';
import {authenticatedFetch, fetchAllEvents} from '@/lib/api';
import { DataTable } from '@/components/datatable/dataTable';
import { createTimeRecordsColumns } from './time-records-columns';
import {getAllEvents} from "@/lib/events";

interface SwimmerWithTimes extends Swimmer {
  timeRecords: TimeRecord[];
  associationStatus?: string;
}

interface ClaimForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | '';
}

export default function MySwimmersPage() {
  const { user } = useAuth();
  const [swimmers, setSwimmers] = useState<SwimmerWithTimes[]>([]);
  const [events, setEvents] = useState<SwimEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPersonalBestsOnly, setShowPersonalBestsOnly] = useState(false);
  const [expandedSwimmers, setExpandedSwimmers] = useState<Set<string>>(new Set());
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimForm, setClaimForm] = useState<ClaimForm>({ firstName: '', lastName: '', dateOfBirth: '', gender: '' });
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);



  useEffect(() => {

    const loadSwimmersAndTimes = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Get swimmers associated with this family user
        const swimmersResponse = await authenticatedFetch(`/api/family/swimmers`);
        if (!swimmersResponse.ok) {
          throw new Error('Failed to fetch swimmers');
        }
        const swimmersData = await swimmersResponse.json();

        // Get time records for each swimmer
        const swimmersWithTimes = await Promise.all(
          swimmersData.map(async (swimmer: Swimmer) => {
            try {
              const timesResponse = await authenticatedFetch(`/api/times?swimmerId=${swimmer.id}`);
              if (timesResponse.ok) {
                const timeRecords = await timesResponse.json();
                return { ...swimmer, timeRecords };
              }
              return { ...swimmer, timeRecords: [] };
            } catch (error) {
              console.error(`Error loading times for swimmer ${swimmer.id}:`, error);
              return { ...swimmer, timeRecords: [] };
            }
          })
        );

        setSwimmers(swimmersWithTimes);
      } catch (error) {
        console.error('Error loading swimmers and times:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSwimmersAndTimes();
  }, [user]);

  useEffect(() => {
    fetchAllEvents().then(r => setEvents(r));
  }, []);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimForm.gender) return;
    setClaimLoading(true);
    setClaimMessage(null);
    try {
      const res = await authenticatedFetch('/api/swimmers/claim', {
        method: 'POST',
        body: JSON.stringify(claimForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimMessage({ type: 'error', text: data.error || 'Failed to submit' });
      } else {
        const msg = data.matched
          ? 'Your swimmer was found! Your request is pending coach approval.'
          : 'No exact match found — a new swimmer record was created and is pending coach approval.';
        setClaimMessage({ type: 'success', text: msg });
        setClaimForm({ firstName: '', lastName: '', dateOfBirth: '', gender: '' });
        setShowClaimForm(false);
        // Reload swimmers to show pending
        const swimmersResponse = await authenticatedFetch('/api/family/swimmers');
        if (swimmersResponse.ok) {
          const swimmersData = await swimmersResponse.json();
          const swimmersWithTimes = await Promise.all(
            swimmersData.map(async (swimmer: Swimmer) => {
              const timesResponse = await authenticatedFetch(`/api/times?swimmerId=${swimmer.id}`);
              const timeRecords = timesResponse.ok ? await timesResponse.json() : [];
              return { ...swimmer, timeRecords };
            })
          );
          setSwimmers(swimmersWithTimes);
        }
      }
    } catch {
      setClaimMessage({ type: 'error', text: 'Network error — please try again.' });
    } finally {
      setClaimLoading(false);
    }
  };

  const toggleSwimmerExpansion = (swimmerId: string) => {
    const newExpanded = new Set(expandedSwimmers);
    if (newExpanded.has(swimmerId)) {
      newExpanded.delete(swimmerId);
    } else {
      newExpanded.add(swimmerId);
    }
    setExpandedSwimmers(newExpanded);
  };

  const getFilteredTimeRecords = (timeRecords: TimeRecord[]) => {
    if (!showPersonalBestsOnly) {
      return timeRecords;
    }
    return timeRecords.filter(record => record.isPersonalBest);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading swimmers...</p>
        </div>
      </div>
    );
  }

  const claimFormPanel = showClaimForm && (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Add a Swimmer</h2>
      <form onSubmit={handleClaim} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input required className="w-full border rounded px-3 py-2 text-sm"
            value={claimForm.firstName} onChange={e => setClaimForm(f => ({ ...f, firstName: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input required className="w-full border rounded px-3 py-2 text-sm"
            value={claimForm.lastName} onChange={e => setClaimForm(f => ({ ...f, lastName: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input required type="date" className="w-full border rounded px-3 py-2 text-sm"
            value={claimForm.dateOfBirth} onChange={e => setClaimForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select required className="w-full border rounded px-3 py-2 text-sm"
            value={claimForm.gender} onChange={e => setClaimForm(f => ({ ...f, gender: e.target.value as 'M' | 'F' }))}>
            <option value="">Select...</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <div className="sm:col-span-2 flex gap-3">
          <button type="submit" disabled={claimLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {claimLoading ? 'Submitting...' : 'Submit Request'}
          </button>
          <button type="button" onClick={() => { setShowClaimForm(false); setClaimMessage(null); }}
            className="border px-4 py-2 rounded text-sm hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );

  if (swimmers.length === 0 && !showClaimForm) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Swimmers</h1>
        {claimMessage && (
          <div className={`mb-4 p-4 rounded ${claimMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {claimMessage.text}
          </div>
        )}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No swimmers are associated with your account.</p>
          <button onClick={() => setShowClaimForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add a Swimmer
          </button>
        </div>
        {claimFormPanel}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Swimmers</h1>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPersonalBestsOnly}
              onChange={(e) => setShowPersonalBestsOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Show Personal Bests Only</span>
          </label>
          <button onClick={() => { setShowClaimForm(v => !v); setClaimMessage(null); }}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
            + Add a Swimmer
          </button>
        </div>
      </div>
      {claimMessage && (
        <div className={`mb-4 p-4 rounded ${claimMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {claimMessage.text}
        </div>
      )}
      {claimFormPanel}

      <div className="space-y-6">
        {swimmers.map((swimmer) => {
          const isExpanded = expandedSwimmers.has(swimmer.id);
          const filteredRecords = getFilteredTimeRecords(swimmer.timeRecords);
          const personalBestCount = swimmer.timeRecords.filter(r => r.isPersonalBest).length;

          const isPending = swimmer.associationStatus === 'pending';

          return (
            <div key={swimmer.id} className="bg-white rounded-lg shadow">
              {/* Swimmer Header */}
              <div
                className={`p-6 transition-colors ${isPending ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}`}
                onClick={() => !isPending && toggleSwimmerExpansion(swimmer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        {swimmer.firstName} {swimmer.lastName}
                        {isPending && (
                          <span className="text-xs font-normal bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded-full">
                            Pending Approval
                          </span>
                        )}
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>Age Group: {swimmer.ageGroup}</span>
                        <span>Gender: {swimmer.gender}</span>
                        <span>Born: {new Date(swimmer.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {isPending ? (
                    <p className="text-sm text-yellow-700 italic">Times and events available after coach approves</p>
                  ) : (
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {swimmer.timeRecords.length} total times
                      </div>
                      <div className="text-green-600">
                        {personalBestCount} personal bests
                      </div>
                    </div>
                    <div className="text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                  )}
                </div>
              </div>

              {/* Time Records Table */}
              {!isPending && isExpanded && (
                <div className="border-t">
                  {filteredRecords.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      {showPersonalBestsOnly 
                        ? 'No personal best times recorded yet.'
                        : 'No time records found for this swimmer.'
                      }
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                          Time Records 
                          {showPersonalBestsOnly && (
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              (Personal Bests Only)
                            </span>
                          )}
                        </h3>
                        <div className="text-sm text-gray-600">
                          Showing {filteredRecords.length} of {swimmer.timeRecords.length} records
                        </div>
                      </div>
                      <DataTable
                        columns={createTimeRecordsColumns(events)}
                        data={filteredRecords}
                        defaultPageSize={10}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
