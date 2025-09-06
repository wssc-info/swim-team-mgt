'use client';

import { useState, useEffect } from 'react';
import { fetchSwimmers, fetchTimeRecords, deleteTimeRecordApi } from '@/lib/api';
import { USA_SWIMMING_EVENTS } from '@/lib/events';
import TimeRecordForm from '@/components/TimeRecordForm';

interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
  selectedEvents: string[];
  seedTimes: Record<string, string>;
}

interface TimeRecord {
  id: string;
  swimmerId: string;
  eventId: string;
  time: string;
  meetName: string;
  meetDate: string;
  isPersonalBest: boolean;
  createdAt: string;
}

export default function TimesPage() {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [selectedSwimmer, setSelectedSwimmer] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [swimmerData, recordData] = await Promise.all([
          fetchSwimmers(),
          fetchTimeRecords()
        ]);
        setSwimmers(swimmerData);
        setTimeRecords(recordData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSwimmerChange = async (swimmerId: string) => {
    setSelectedSwimmer(swimmerId);
    if (swimmerId) {
      try {
        const records = await fetchTimeRecords(swimmerId);
        setTimeRecords(records);
      } catch (error) {
        console.error('Error loading swimmer records:', error);
      }
    } else {
      try {
        const records = await fetchTimeRecords();
        setTimeRecords(records);
      } catch (error) {
        console.error('Error loading all records:', error);
      }
    }
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleEditRecord = (record: TimeRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this time record?')) {
      try {
        await deleteTimeRecordApi(id);
        await handleSwimmerChange(selectedSwimmer);
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  const handleFormClose = async () => {
    setShowForm(false);
    setEditingRecord(null);
    await handleSwimmerChange(selectedSwimmer);
  };

  const filteredRecords = selectedSwimmer 
    ? timeRecords.filter(record => record.swimmerId === selectedSwimmer)
    : timeRecords;

  const getSwimmerName = (swimmerId: string) => {
    const swimmer = swimmers.find(s => s.id === swimmerId);
    return swimmer ? `${swimmer.firstName} ${swimmer.lastName}` : 'Unknown Swimmer';
  };

  const getEventName = (eventId: string) => {
    const event = USA_SWIMMING_EVENTS.find(e => e.id === eventId);
    return event ? `${event.name} (${event.course})` : 'Unknown Event';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Time Records</h1>
        <button
          onClick={handleAddRecord}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Time Record
        </button>
      </div>

      {/* Swimmer Filter */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <label htmlFor="swimmerFilter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Swimmer
        </label>
        <select
          id="swimmerFilter"
          value={selectedSwimmer}
          onChange={(e) => handleSwimmerChange(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Swimmers</option>
          {swimmers
            .sort((a, b) => `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`))
            .map(swimmer => (
              <option key={swimmer.id} value={swimmer.id}>
                {swimmer.lastName}, {swimmer.firstName} ({swimmer.ageGroup})
              </option>
            ))}
        </select>
      </div>

      {/* Time Record Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <TimeRecordForm
              record={editingRecord}
              swimmers={swimmers}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Time Records List */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            {selectedSwimmer ? 'No time records found for this swimmer.' : 'No time records found.'}
          </p>
          <button
            onClick={handleAddRecord}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Add First Time Record
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Swimmer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className={record.isPersonalBest ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getSwimmerName(record.swimmerId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getEventName(record.eventId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${record.isPersonalBest ? 'text-yellow-600' : 'text-gray-900'}`}>
                          {record.time}
                        </span>
                        {record.isPersonalBest && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            PB
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.meetName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(record.meetDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditRecord(record)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
