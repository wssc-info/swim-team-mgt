'use client';

import { useState, useEffect } from 'react';
import { fetchSwimmers, fetchTimeRecords, deleteTimeRecordApi } from '@/lib/api';
import { USA_SWIMMING_EVENTS } from '@/lib/events';
import TimeRecordForm from '@/components/TimeRecordForm';
import { Swimmer, TimeRecord } from '@/lib/types';

export default function TimesPage() {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [selectedSwimmer, setSelectedSwimmer] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{success: number, errors: string[]} | null>(null);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setUploading(true);
    setUploadResults(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['swimmer', 'event', 'time', 'meet', 'date'];
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        alert(`CSV file is missing required columns: ${missingHeaders.join(', ')}\nRequired columns: swimmer, event, time, meet, date`);
        return;
      }

      const results = { success: 0, errors: [] as string[] };

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        try {
          // Find swimmer by name
          const swimmerName = row.swimmer;
          const swimmer = swimmers.find(s => 
            `${s.firstName} ${s.lastName}`.toLowerCase() === swimmerName.toLowerCase() ||
            `${s.lastName}, ${s.firstName}`.toLowerCase() === swimmerName.toLowerCase()
          );

          if (!swimmer) {
            results.errors.push(`Row ${i}: Swimmer "${swimmerName}" not found`);
            continue;
          }

          // Find event by name
          const eventName = row.event;
          const event = USA_SWIMMING_EVENTS.find(e => 
            e.name.toLowerCase().includes(eventName.toLowerCase()) ||
            eventName.toLowerCase().includes(e.name.toLowerCase())
          );

          if (!event) {
            results.errors.push(`Row ${i}: Event "${eventName}" not found`);
            continue;
          }

          // Validate time format (basic check)
          const time = row.time;
          if (!time || !/^\d+:\d{2}\.\d{2}$/.test(time)) {
            results.errors.push(`Row ${i}: Invalid time format "${time}". Expected format: MM:SS.HH`);
            continue;
          }

          // Parse date
          const dateStr = row.date;
          const meetDate = new Date(dateStr);
          if (isNaN(meetDate.getTime())) {
            results.errors.push(`Row ${i}: Invalid date format "${dateStr}"`);
            continue;
          }

          // Create time record
          const timeRecord = {
            swimmerId: swimmer.id,
            eventId: event.id,
            time: time,
            meetName: row.meet,
            meetDate: meetDate.toISOString().split('T')[0]
          };

          const response = await fetch('/api/times', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(timeRecord),
          });

          if (!response.ok) {
            const error = await response.text();
            results.errors.push(`Row ${i}: Failed to save record - ${error}`);
          } else {
            results.success++;
          }
        } catch (error) {
          results.errors.push(`Row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setUploadResults(results);
      await handleSwimmerChange(selectedSwimmer);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the file format.');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
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
        <div className="flex space-x-3">
          <label className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer">
            {uploading ? 'Uploading...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <button
            onClick={handleAddRecord}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Time Record
          </button>
        </div>
      </div>

      {/* Upload Results */}
      {uploadResults && (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3">Import Results</h3>
          <div className="space-y-2">
            <p className="text-green-600">Successfully imported: {uploadResults.success} records</p>
            {uploadResults.errors.length > 0 && (
              <div>
                <p className="text-red-600 font-medium">Errors ({uploadResults.errors.length}):</p>
                <ul className="text-sm text-red-600 ml-4 max-h-32 overflow-y-auto">
                  {uploadResults.errors.map((error, index) => (
                    <li key={index} className="list-disc">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={() => setUploadResults(null)}
            className="mt-3 text-sm text-gray-600 hover:text-gray-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* CSV Format Help */}
      <div className="mb-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">CSV Import Format</h3>
        <p className="text-sm text-blue-700 mb-2">
          Your CSV file should have these columns: <code>swimmer, event, time, meet, date</code>
        </p>
        <p className="text-xs text-blue-600">
          Example: &#34;John Smith, 50 Free, 25.43, Summer Championships, 2024-07-15&#34;
        </p>
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
