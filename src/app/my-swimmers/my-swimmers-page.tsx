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
}

export default function MySwimmersPage() {
  const { user } = useAuth();
  const [swimmers, setSwimmers] = useState<SwimmerWithTimes[]>([]);
  const [events, setEvents] = useState<SwimEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPersonalBestsOnly, setShowPersonalBestsOnly] = useState(false);
  const [expandedSwimmers, setExpandedSwimmers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSwimmersAndTimes();
    fetchAllEvents().then(r => setEvents(r));
  }, [user, loadSwimmersAndTimes]);

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

  if (swimmers.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Swimmers</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No swimmers are associated with your account.</p>
          <p className="text-sm text-gray-400">
            Contact your coach or administrator to associate swimmers with your family account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Swimmers</h1>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPersonalBestsOnly}
              onChange={(e) => setShowPersonalBestsOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Show Personal Bests Only</span>
          </label>
        </div>
      </div>

      <div className="space-y-6">
        {swimmers.map((swimmer) => {
          const isExpanded = expandedSwimmers.has(swimmer.id);
          const filteredRecords = getFilteredTimeRecords(swimmer.timeRecords);
          const personalBestCount = swimmer.timeRecords.filter(r => r.isPersonalBest).length;

          return (
            <div key={swimmer.id} className="bg-white rounded-lg shadow">
              {/* Swimmer Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSwimmerExpansion(swimmer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {swimmer.firstName} {swimmer.lastName}
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>Age Group: {swimmer.ageGroup}</span>
                        <span>Gender: {swimmer.gender}</span>
                        <span>Born: {new Date(swimmer.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
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
                </div>
              </div>

              {/* Time Records Table */}
              {isExpanded && (
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
