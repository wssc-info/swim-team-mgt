'use client';

import { useState, useEffect } from 'react';
import { Meet, Swimmer, RelayTeam } from '@/lib/swimmers';
import { fetchMeets, fetchSwimmers } from '@/lib/api';
import { USA_SWIMMING_EVENTS, SwimEvent } from '@/lib/events';
import { getMeetEntries } from '@/lib/meetmanager';
import { exportMeetData } from '@/lib/api';

export default function ExportPage() {
  const [meets, setMeets] = useState<Meet[]>([]);
  const [selectedMeet, setSelectedMeet] = useState<Meet | null>(null);
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [previewData, setPreviewData] = useState<{
    individual: any[];
    relays: any[];
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meetData, swimmerData] = await Promise.all([
          fetchMeets(),
          fetchSwimmers()
        ]);
        
        setMeets(meetData);
        setSwimmers(swimmerData);
        
        // Auto-select active meet if available
        const activeMeet = meetData.find(m => m.isActive);
        if (activeMeet) {
          setSelectedMeet(activeMeet);
          await loadPreviewData(activeMeet, swimmerData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const loadPreviewData = async (meet: Meet, swimmerData: Swimmer[]) => {
    try {
      const entries = await getMeetEntries();
      
      // Filter entries for selected meet
      const meetIndividualEntries = entries.individual.filter(entry =>
        meet.availableEvents.includes(entry.event.id) &&
        swimmerData.some(s => s.id === entry.swimmer.id && s.selectedEvents.includes(entry.event.id))
      );
      
      const meetRelayEntries = entries.relays.filter(relay =>
        meet.availableEvents.includes(relay.event.id)
      );
      
      setPreviewData({
        individual: meetIndividualEntries,
        relays: meetRelayEntries
      });
    } catch (error) {
      console.error('Error loading preview data:', error);
      setPreviewData({ individual: [], relays: [] });
    }
  };

  const handleMeetSelect = async (meet: Meet) => {
    setSelectedMeet(meet);
    await loadPreviewData(meet, swimmers);
  };

  const handleExport = async () => {
    if (!selectedMeet) return;
    
    setExporting(true);
    try {
      await exportMeetData(selectedMeet.id);
    } catch (error) {
      console.error('Error generating export:', error);
      alert('Failed to generate export file. Please try again.');
    } finally {
      setExporting(false);
    }
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
      <h1 className="text-3xl font-bold mb-6">Export Meet Data</h1>
      
      {/* Meet Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Meet to Export</h2>
        
        {meets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No meets available for export.</p>
            <p className="text-sm text-gray-400">Create a meet first to export data.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {meets.map((meet) => (
              <div
                key={meet.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedMeet?.id === meet.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleMeetSelect(meet)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center">
                      {meet.name}
                      {meet.isActive && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {new Date(meet.date).toLocaleDateString()} • {meet.location}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {meet.availableEvents.length} events available
                    </p>
                  </div>
                  <div className="flex items-center">
                    {selectedMeet?.id === meet.id && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Preview */}
      {selectedMeet && previewData && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Export Preview</h2>
            <button
              onClick={handleExport}
              disabled={exporting || (previewData.individual.length === 0 && previewData.relays.length === 0)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Generating...' : 'Export SDIF File'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Individual Events */}
            <div>
              <h3 className="text-lg font-medium mb-3">
                Individual Events ({previewData.individual.length})
              </h3>
              
              {previewData.individual.length === 0 ? (
                <p className="text-gray-500 text-sm">No individual event entries found.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewData.individual.map((entry, index) => (
                    <div key={index} className="border rounded p-3 text-sm">
                      <div className="font-medium">
                        {entry.swimmer.firstName} {entry.swimmer.lastName}
                      </div>
                      <div className="text-gray-600">
                        {entry.event.name} • {entry.seedTime || 'NT'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.swimmer.ageGroup} • {entry.swimmer.gender}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Relay Events */}
            <div>
              <h3 className="text-lg font-medium mb-3">
                Relay Events ({previewData.relays.length})
              </h3>
              
              {previewData.relays.length === 0 ? (
                <p className="text-gray-500 text-sm">No relay team entries found.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewData.relays.map((relay, index) => (
                    <div key={index} className="border rounded p-3 text-sm">
                      <div className="font-medium">
                        {relay.team.name}
                      </div>
                      <div className="text-gray-600">
                        {relay.event.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {relay.team.ageGroup} • {relay.team.gender} • {relay.swimmers.length} swimmers
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {relay.swimmers.map((s: any) => `${s.firstName} ${s.lastName}`).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Export Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Meet</div>
                <div className="font-medium">{selectedMeet.name}</div>
              </div>
              <div>
                <div className="text-gray-600">Date</div>
                <div className="font-medium">{new Date(selectedMeet.date).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Individual Entries</div>
                <div className="font-medium">{previewData.individual.length}</div>
              </div>
              <div>
                <div className="text-gray-600">Relay Entries</div>
                <div className="font-medium">{previewData.relays.length}</div>
              </div>
            </div>
          </div>

          {previewData.individual.length === 0 && previewData.relays.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                <strong>No entries found for this meet.</strong> Make sure swimmers have selected events 
                and relay teams have been created for the events available in this meet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Export Information */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">About SDIF Export</h2>
        <div className="text-blue-700 space-y-2 text-sm">
          <p>
            The export generates a Swimming Data Interchange Format (SDIF) .sd3 file that can be imported 
            into Meet Manager and other swimming meet management software.
          </p>
          <p>
            <strong>What's included:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Individual event entries with swimmer details and seed times</li>
            <li>Relay team entries with swimmer lineups</li>
            <li>Proper SDIF formatting for meet management software compatibility</li>
            <li>Team information and meet details</li>
          </ul>
          <p className="mt-3">
            <strong>Note:</strong> Only swimmers who have selected events for the chosen meet and 
            relay teams created for available events will be included in the export.
          </p>
        </div>
      </div>
    </div>
  );
}
