'use client';

import { useState, useEffect } from 'react';
import { fetchMeets, fetchSwimmers, fetchSwimmerMeetEvents, fetchRelayTeams } from '@/lib/api';
import { USA_SWIMMING_EVENTS, SwimEvent } from '@/lib/events';
import { exportMeetData } from '@/lib/api';

interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
}

interface Meet {
  id: string;
  name: string;
  date: string;
  location: string;
  availableEvents: string[];
  isActive: boolean;
  createdAt: string;
}

interface RelayTeam {
  id: string;
  meetId: string;
  eventId: string;
  name: string;
  swimmers: string[];
  ageGroup: string;
  gender: 'M' | 'F' | 'Mixed';
}

export default function ExportPage() {
  const [meets, setMeets] = useState<Meet[]>([]);
  const [selectedMeet, setSelectedMeet] = useState<Meet | null>(null);
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [relayTeams, setRelayTeams] = useState<RelayTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<{
    content: string;
    fileName: string;
  } | null>(null);
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
          const relayData = await fetchRelayTeams(activeMeet.id);
          setRelayTeams(relayData);
          await loadPreviewData(activeMeet, swimmerData, relayData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const loadPreviewData = async (meet: Meet, swimmerData: Swimmer[], relayData: RelayTeam[]) => {
    try {
      // Create preview data from swimmers and their meet event selections
      const meetIndividualEntries: any[] = [];
      const meetRelayEntries: any[] = [];
      
      // Individual entries - fetch event selections for each swimmer
      for (const swimmer of swimmerData) {
        try {
          const swimmerMeetEvents = await fetchSwimmerMeetEvents(swimmer.id, meet.id);
          
          swimmerMeetEvents.forEach(sme => {
            if (meet.availableEvents.includes(sme.eventId)) {
              const event = USA_SWIMMING_EVENTS.find(e => e.id === sme.eventId);
              if (event && !event.isRelay) {
                meetIndividualEntries.push({
                  swimmer,
                  event,
                  seedTime: sme.seedTime
                });
              }
            }
          });
        } catch (error) {
          console.error(`Error loading events for swimmer ${swimmer.id}:`, error);
        }
      }
      
      // Relay entries - filter relay teams for events available in this meet
      relayData.forEach(team => {
        if (meet.availableEvents.includes(team.eventId)) {
          const event = USA_SWIMMING_EVENTS.find(e => e.id === team.eventId);
          if (event && event.isRelay) {
            const teamSwimmers = team.swimmers.map(swimmerId => 
              swimmerData.find(s => s.id === swimmerId)
            ).filter(Boolean);
            
            meetRelayEntries.push({
              team,
              event,
              swimmers: teamSwimmers
            });
          }
        }
      });
      
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
    const relayData = await fetchRelayTeams(meet.id);
    setRelayTeams(relayData);
    await loadPreviewData(meet, swimmers, relayData);
  };

  const handleMeetSelect = async (meet: Meet) => {
    setSelectedMeet(meet);
    await loadPreviewData(meet, swimmers, relayTeams);
  };

  const handleExport = async () => {
    if (!selectedMeet) return;
    
    setExporting(true);
    try {
      const result = await exportMeetData(selectedMeet.id);
      setExportData(result);
    } catch (error) {
      console.error('Error generating export:', error);
      alert('Failed to generate export file. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportData) return;
    
    const blob = new Blob([exportData.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportData.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    if (!exportData) return;
    
    try {
      await navigator.clipboard.writeText(exportData.content);
      alert('Content copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard. Please select and copy manually.');
    }
  };

  const handleClearExport = () => {
    setExportData(null);
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
              {exporting ? 'Generating...' : 'Generate SDIF Content'}
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

      {/* Export Content */}
      {exportData && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">SDIF Export Content</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyToClipboard}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Download File
              </button>
              <button
                onClick={handleClearExport}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              File name: <span className="font-mono">{exportData.fileName}</span>
            </p>
            <p className="text-sm text-gray-600">
              Content size: {exportData.content.length} characters
            </p>
          </div>

          <textarea
            value={exportData.content}
            readOnly
            className="w-full h-96 p-3 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
            placeholder="SDIF content will appear here..."
          />

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Instructions:</strong> You can copy this content to your clipboard and paste it into a text file, 
              or use the "Download File" button to save it directly as a .sd3 file for import into Meet Manager.
            </p>
          </div>
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
