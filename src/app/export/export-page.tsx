'use client';

import { useState, useEffect } from 'react';
import {fetchMeets, fetchSwimmers, fetchSwimmerMeetEvents, fetchRelayTeams, fetchAllEvents} from '@/lib/api';
import { exportMeetData } from '@/lib/api';
import {useAuth} from '@/lib/auth-context';
import MeetSelector from '@/components/export/MeetSelector';
import ExportPreview from '@/components/export/ExportPreview';
import ExportContent from '@/components/export/ExportContent';
import ExportInfo from '@/components/export/ExportInfo';

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

interface IndividualEntry {
  swimmer: Swimmer;
  event: any;
  seedTime: string;
}

interface RelayEntry {
  team: RelayTeam;
  event: any;
  swimmers: Swimmer[];
}

export default function ExportPage() {
  const { user } = useAuth();
  const [meets, setMeets] = useState<Meet[]>([]);
  const [selectedMeet, setSelectedMeet] = useState<Meet | null>(null);
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
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
          fetchSwimmers(user?.clubId)
        ]);
        
        // Filter meets to only show those for the user's club
        const filteredMeets = user?.clubId 
          ? meetData.filter(meet => meet.clubId === user.clubId)
          : meetData;
        
        setMeets(filteredMeets);
        setSwimmers(swimmerData);
        
        // Auto-select active meet if available
        const activeMeet = filteredMeets.find(m => m.isActive);
        if (activeMeet) {
          setSelectedMeet(activeMeet);
          const relayData = await fetchRelayTeams(activeMeet.id);
          // setRelayTeams(relayData);
          await loadPreviewData(activeMeet, swimmerData, relayData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  const loadPreviewData = async (meet: Meet, swimmerData: Swimmer[], relayData: RelayTeam[]) => {
    try {
      // Create preview data from swimmers and their meet event selections
      const meetIndividualEntries: any[] = [];
      const meetRelayEntries: any[] = [];

      const allEvents = await fetchAllEvents();

      const allEventsForMeet = await fetchSwimmerMeetEvents(meet.id);
      console.log("All events for meet:", allEventsForMeet);

      swimmerData.map((swimmer) => {
        try {
          const selectedEvents = allEventsForMeet.filter(sme=> sme.swimmerId === swimmer.id);
          selectedEvents.forEach(sme=>{
            const swimEvent = allEvents.find(e => e.id === sme.eventId);
            meetIndividualEntries.push({
              swimmer,
              event: swimEvent,
              seedTime: sme.seedTime
            })
          })
        } catch (error) {
          console.error(`Error loading events for swimmer ${swimmer.id}:`, error);
        }
      });

      // Relay entries - filter relay teams for events available in this meet
      relayData.forEach(team => {
        if (meet.availableEvents.includes(team.eventId)) {
          const event = allEvents.find(e => e.id === team.eventId);
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
    // setRelayTeams(relayData);
    await loadPreviewData(meet, swimmers, relayData);
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
      
      <MeetSelector 
        meets={meets}
        selectedMeet={selectedMeet}
        onMeetSelect={handleMeetSelect}
        loading={loading}
      />

      <ExportPreview 
        selectedMeet={selectedMeet}
        previewData={previewData}
        exporting={exporting}
        onExport={handleExport}
      />

      <ExportContent 
        exportData={exportData}
        onCopyToClipboard={handleCopyToClipboard}
        onDownload={handleDownload}
        onClear={handleClearExport}
      />

      <ExportInfo />
    </div>
  );
}
