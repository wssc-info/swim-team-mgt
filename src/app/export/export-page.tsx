'use client';

import { useState, useEffect } from 'react';
import {fetchMeets, fetchSwimmers, fetchSwimmerMeetEvents, fetchRelayTeams, fetchAllEvents, fetchClub} from '@/lib/api';
import { exportMeetData } from '@/lib/api';
import {useAuth} from '@/lib/auth-context';
import {getClubId} from '@/lib/utils';
import MeetSelector from '@/components/export/MeetSelector';
import ExportPreview from '@/components/export/ExportPreview';
import ExportContent from '@/components/export/ExportContent';
import ExportInfo from '@/components/export/ExportInfo';
import {Meet, RelayTeam, Swimmer} from "@/lib/types";

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
        let clubId: string | null = null;
        try { clubId = getClubId(user); } catch { /* no club selected */ }

        const [meetData, swimmerData, clubData] = await Promise.all([
          fetchMeets(false, clubId ?? undefined),
          fetchSwimmers(clubId ?? undefined),
          clubId ? fetchClub(clubId) : Promise.resolve(null),
        ]);

        setMeets(meetData);
        setSwimmers(swimmerData);

        // Auto-select active meet from club
        if (clubData?.activeMeetId) {
          const activeMeet = meetData.find(m => m.id === clubData.activeMeetId);
          if (activeMeet) {
            setSelectedMeet(activeMeet);
            await loadPreviewData(activeMeet, swimmerData, clubId ?? undefined);
          }
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

  const loadPreviewData = async (meet: Meet, swimmerData: Swimmer[], clubId?: string) => {
    try {
      const relayData = await fetchRelayTeams(meet.id, clubId);
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
      const availableEventsArray = typeof meet.availableEvents === 'string' 
        ? JSON.parse(meet.availableEvents) 
        : meet.availableEvents;
        
      relayData.forEach(team => {
        if (availableEventsArray.includes(team.eventId)) {
          const event = allEvents.find(e => e.id === team.eventId);
          if (event && event.isRelay) {
            const teamSwimmers = team.swimmers.map((swimmerId) =>
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
    let clubId: string | undefined;
    try { clubId = getClubId(user) ?? undefined; } catch { /* ignore */ }
    await loadPreviewData(meet, swimmers, clubId);
  };

  const handleExport = async () => {
    if (!selectedMeet) return;

    setExporting(true);
    try {
      let clubId: string | undefined;
      try { clubId = getClubId(user) ?? undefined; } catch { /* ignore */ }
      const result = await exportMeetData(selectedMeet.id, clubId);
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
