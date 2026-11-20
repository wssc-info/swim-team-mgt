'use client';

import {useEffect, useState} from 'react';
import {authenticatedFetch, deleteSwimmerApi, fetchClubs, fetchSwimmers} from '@/lib/api';
import SwimmerForm from '@/components/SwimmerForm';
import Modal from '@/components/Modal';
import {SwimClub, Swimmer} from '@/lib/types';
import {Spinner} from "@/components/ui/shadcn-io/spinner";
import {DataTable} from "@/components/datatable/dataTable";
import {getColumns} from "@/app/admin/swimmers/columns";
import {processTeamUnifyFile} from '@/lib/team-unify-import';
import {useAuth} from '@/lib/auth-context';
import {Button} from "@/components/ui/button";
import {Table} from "@tanstack/table-core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper function to properly parse CSV lines with quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes ("")
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

export default function SwimmersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSwimmer, setEditingSwimmer] = useState<Swimmer | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number, activated?: number, successTimeRecords: number, info: string[], errors: string[] } | null>(null);
  const [importProgress, setImportProgress] = useState<{ currentRow: number, totalRows: number, currentAction: string, errors: string[] } | null>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<SwimClub[]>([]);
  const [seedTimesSwimmer, setSeedTimesSwimmer] = useState<Swimmer | null>(null);
  const [seedTimes, setSeedTimes] = useState<Record<string, string> | null>(null);
  const [loadingSeedTimes, setLoadingSeedTimes] = useState(false);

  // Pending associations
  const [pendingAssociations, setPendingAssociations] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Merge UI
  const [showMerge, setShowMerge] = useState(false);
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeMessage, setMergeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [swimmerData, eventsData, clubsData] = await Promise.all([
          fetchSwimmers(undefined, true),
          fetch('/api/admin/events').then(res => res.json()),
          fetchClubs(),
        ]);
        setSwimmers(swimmerData);
        setAllEvents(eventsData);
        setClubs(clubsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();
    loadPending();
  }, []);

  const loadPending = async () => {
    setPendingLoading(true);
    try {
      const res = await authenticatedFetch('/api/admin/associations?status=pending');
      if (res.ok) setPendingAssociations(await res.json());
    } catch (e) {
      console.error('Error loading pending associations:', e);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleAssociation = async (id: string, action: 'approve' | 'deny') => {
    try {
      const res = await authenticatedFetch(`/api/admin/associations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await loadPending();
        const updatedSwimmers = await fetchSwimmers(undefined, true);
        setSwimmers(updatedSwimmers);
      }
    } catch (e) {
      console.error('Error updating association:', e);
    }
  };

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    setMergeLoading(true);
    setMergeMessage(null);
    try {
      const res = await authenticatedFetch('/api/admin/swimmers/merge', {
        method: 'POST',
        body: JSON.stringify({ sourceId: mergeSource, targetId: mergeTarget }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMergeMessage({ type: 'error', text: data.error || 'Merge failed' });
      } else {
        setMergeMessage({ type: 'success', text: `Merge complete. ${data.movedTimes} time records moved.` });
        setMergeSource('');
        setMergeTarget('');
        const updatedSwimmers = await fetchSwimmers(undefined, true);
        setSwimmers(updatedSwimmers);
      }
    } catch {
      setMergeMessage({ type: 'error', text: 'Network error' });
    } finally {
      setMergeLoading(false);
    }
  };

  const handleAddSwimmer = () => {
    setEditingSwimmer(null);
    setShowForm(true);
  };

  const handleEditSwimmer = (swimmer: Swimmer) => {
    setEditingSwimmer(swimmer);
    setShowForm(true);
  };

  const handleDeleteSwimmer = async (id: string) => {
    if (confirm('Are you sure you want to delete this swimmer?')) {
      try {
        await deleteSwimmerApi(id);
        const updatedSwimmers = await fetchSwimmers(undefined, true);
        setSwimmers(updatedSwimmers);
        setLoading(false);
      } catch (error) {
        console.error('Error deleting swimmer:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete swimmer');
      }
    }
  };

  const handleViewSeedTimes = async (swimmer: Swimmer) => {
    setSeedTimesSwimmer(swimmer);
    setSeedTimes(null);
    setLoadingSeedTimes(true);
    try {
      const res = await authenticatedFetch(`/api/swimmers/${swimmer.id}/best-times`);
      if (res.ok) setSeedTimes(await res.json());
    } catch (e) {
      console.error('Error loading seed times:', e);
    } finally {
      setLoadingSeedTimes(false);
    }
  };

  const handleFormClose = async () => {
    setShowForm(false);
    setEditingSwimmer(null);
    try {
      const updatedSwimmers = await fetchSwimmers(undefined, true);
      setSwimmers(updatedSwimmers);
    } catch (error) {
      console.error('Error loading swimmers:', error);
    }
  };

  const handleTeamUnifyUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setUploading(true);
    setUploadResults(null);
    setImportProgress(null);

    try {
      const results = await processTeamUnifyFile(
        file, 
        swimmers, 
        allEvents, 
        user?.clubId,
        (progress) => {
          setImportProgress(progress);
        }
      );
      setUploadResults(results);
      
      // Reload swimmers to show newly imported ones
      const updatedSwimmers = await fetchSwimmers(undefined, true);
      setSwimmers(updatedSwimmers);
    } catch (error) {
      console.error('Error processing Team Unify file:', error);
      alert(error instanceof Error ? error.message : 'Error processing file. Please check the file format.');
    } finally {
      setUploading(false);
      setImportProgress(null);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    const markActive = confirm('Mark uploaded swimmers as active?\n\nNew swimmers will be created as active. Existing swimmers will be reactivated.');

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
      const requiredHeaders = ['firstname', 'lastname', 'dateofbirth', 'gender'];

      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        alert(`CSV file is missing required columns: ${missingHeaders.join(', ')}\nRequired columns: firstname, lastname, dateofbirth, gender\nOptional columns: externalid`);
        return;
      }

      const results = { success: 0, activated: 0, errors: [] as string[] };
      const toActivateIds: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        try {
          // Validate required fields
          if (!row.firstname || !row.lastname || !row.dateofbirth || !row.gender) {
            results.errors.push(`Row ${i}: Missing required fields (firstname, lastname, dateofbirth, gender)`);
            continue;
          }

          // Validate gender
          const gender = row.gender.toLowerCase();
          if (gender !== 'male' && gender !== 'female' && gender !== 'm' && gender !== 'f') {
            results.errors.push(`Row ${i}: Invalid gender "${row.gender}". Must be Male, Female, M, or F`);
            continue;
          }

          // Parse and validate date of birth
          const dateOfBirth = new Date(row.dateofbirth);
          if (isNaN(dateOfBirth.getTime())) {
            results.errors.push(`Row ${i}: Invalid date format "${row.dateofbirth}"`);
            continue;
          }

          // Check if swimmer already exists
          const existingSwimmer = swimmers.find(s =>
            s.firstName.toLowerCase() === row.firstname.toLowerCase() &&
            s.lastName.toLowerCase() === row.lastname.toLowerCase() &&
            new Date(s.dateOfBirth).getTime() === dateOfBirth.getTime()
          );

          if (existingSwimmer) {
            if (markActive && !existingSwimmer.active) {
              toActivateIds.push(existingSwimmer.id);
              results.activated++;
            } else {
              results.errors.push(`Row ${i}: Swimmer "${row.firstname} ${row.lastname}" already exists`);
            }
            continue;
          }

          // Normalize gender
          const normalizedGender = gender === 'm' || gender === 'male' ? 'M' : 'F';

          // Create swimmer record
          const swimmerData = {
            firstName: row.firstname,
            lastName: row.lastname,
            dateOfBirth: dateOfBirth.toISOString().split('T')[0],
            gender: normalizedGender,
            active: markActive,
            ...(row.externalid && { externalId: row.externalid })
          };

          const response = await authenticatedFetch('/api/swimmers', {
            method: 'POST',
            body: JSON.stringify(swimmerData),
          });

          if (!response.ok) {
            const error = await response.text();
            results.errors.push(`Row ${i}: Failed to save swimmer - ${error}`);
          } else {
            results.success++;
          }
        } catch (error) {
          results.errors.push(`Row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Batch-activate existing swimmers in one request
      if (toActivateIds.length > 0) {
        await fetch('/api/swimmers/active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ swimmerIds: toActivateIds, activeFlag: true }),
        });
      }

      setUploadResults({ successTimeRecords: 0, info: [], ...results });
      // Reload swimmers to show newly imported ones
      const updatedSwimmers = await fetchSwimmers(undefined, true);
      setSwimmers(updatedSwimmers);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the file format.');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  if (loading) {
    return <div className={'items-center text-center'}>
      <Spinner size={64} variant={'circle'} speed={1} className={'mr-auto ml-auto my-5'}/>
    </div>;
  }

  const setActiveFlag = async (swimmerIds: string[], activeFlag: boolean) => {
    try {
      console.log('Setting swimmers as active:', swimmerIds);
      const response = await fetch('/api/swimmers/active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ swimmerIds, activeFlag: activeFlag }),
      });
      if (response.ok) {
        const updatedSwimmers = await fetchSwimmers(undefined, true);
        setSwimmers(updatedSwimmers);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to set swimmers as active');
      }
    } catch (error) {
      console.error('Error setting swimmers as active:', error);
      alert('Failed to set swimmers as active');
    }
  }

  const assignToClub = async (swimmerIds: string[], clubId: string | null) => {
    try {
      const response = await authenticatedFetch('/api/swimmers/club', {
        method: 'POST',
        body: JSON.stringify({ swimmerIds, clubId }),
      });
      if (response.ok) {
        const updatedSwimmers = await fetchSwimmers(undefined, true);
        setSwimmers(updatedSwimmers);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to assign club');
      }
    } catch (error) {
      console.error('Error assigning club:', error);
      alert('Failed to assign club');
    }
  };

  const createFilters = (table: Table<any>) => {
    const selectedIds = table.getSelectedRowModel().flatRows.map(r => r.original.id);
    const hasSelection = selectedIds.length > 0;
    return (
      <>
        <div className="flex-1"></div>
        {user?.role === 'admin' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="mr-2" disabled={!hasSelection}>
                Assign Club ({selectedIds.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {clubs.map(club => (
                <DropdownMenuItem
                  key={club.id}
                  onClick={() => assignToClub(selectedIds, club.id)}
                >
                  {club.abbreviation || club.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => assignToClub(selectedIds, null)}>
                <span className="text-gray-500">Remove Club Assignment</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          disabled={!hasSelection}
          onClick={() => setActiveFlag(selectedIds, true)}
        >Activate ({selectedIds.length})</Button>
        <Button
            className="ml-2"
            disabled={!hasSelection}
            onClick={() => setActiveFlag(selectedIds, false)}
        >Deactivate ({selectedIds.length})</Button>
      </>

    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Swimmers</h1>
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
          <label className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 cursor-pointer">
            {uploading ? 'Uploading...' : 'Import Team Unify'}
            <input
              type="file"
              accept=".csv"
              onChange={handleTeamUnifyUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <Button onClick={handleAddSwimmer}>
            Add New Swimmer
          </Button>
        </div>
      </div>


      {/* Import Progress */}
      {importProgress && (
        <div className="mb-6 bg-blue-50 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">Team Unify Import Progress</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.currentRow / importProgress.totalRows) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-blue-700">
                {importProgress.currentRow} / {importProgress.totalRows}
              </span>
            </div>
            <p className="text-blue-700 text-sm">{importProgress.currentAction}</p>
            {importProgress.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto">
                <p className="text-red-600 font-medium text-sm">Recent Errors:</p>
                <ul className="text-xs text-red-600 ml-4 space-y-1">
                  {importProgress.errors.slice(-5).map((error, index) => (
                    <li key={index} className="list-disc">{error}</li>
                  ))}
                </ul>
                {importProgress.errors.length > 5 && (
                  <p className="text-xs text-gray-500 ml-4">... and {importProgress.errors.length - 5} more errors</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResults && !importProgress && (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3">Import Results</h3>
          <div className="space-y-2">
            <p className="text-green-600">Successfully created: {uploadResults.success} swimmers</p>
            {(uploadResults.activated ?? 0) > 0 && (
              <p className="text-blue-600">Reactivated: {uploadResults.activated} existing swimmers</p>
            )}
            {uploadResults.info.length > 0 && (
              <div>
                <p className="text-green-600 font-medium">Info ({uploadResults.info.length}):</p>
                <ul className="text-sm text-green-600 ml-4 max-h-32 overflow-y-auto">
                  {uploadResults.info.map((info, index) => (
                    <li key={index} className="list-disc">{info}</li>
                  ))}
                </ul>
              </div>
            )}
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
          <Button variant="link" size="sm" onClick={() => setUploadResults(null)} className="mt-3 h-auto p-0">
            Dismiss
          </Button>
        </div>
      )}


      {showForm && (
        <SwimmerForm
          swimmer={editingSwimmer}
          onClose={handleFormClose}
        />
      )}

      {/* Seed Times Modal */}
      {seedTimesSwimmer && (
        <Modal
          title={
            <div>
              <div>Seed Times — {seedTimesSwimmer.firstName} {seedTimesSwimmer.lastName}</div>
              <p className="text-sm font-normal text-gray-500 mt-0.5">Age Group: {seedTimesSwimmer.ageGroup} · {seedTimesSwimmer.gender === 'M' ? 'Male' : 'Female'}</p>
            </div>
          }
          onClose={() => setSeedTimesSwimmer(null)}
          footer={
            <div className="text-right">
              <Button variant="secondary" size="sm" onClick={() => setSeedTimesSwimmer(null)}>Close</Button>
            </div>
          }
          size="2xl"
          maxHeight="max-h-[80vh]"
        >
          {loadingSeedTimes ? (
            <p className="text-gray-500 text-center py-8">Loading...</p>
          ) : !seedTimes || Object.keys(seedTimes).length === 0 ? (
            <p className="text-gray-500 text-center py-8 italic">No seed times on record for this swimmer.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-gray-500 font-medium">
                  <th className="pb-2 pr-4">Event</th>
                  <th className="pb-2 pr-4">Course</th>
                  <th className="pb-2 pr-4">Distance</th>
                  <th className="pb-2 pr-4">Stroke</th>
                  <th className="pb-2 text-right">Personal Best</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(seedTimes)
                  .map(([eventId, time]) => {
                    const event = allEvents.find((e: any) => e.id === eventId);
                    return { eventId, time, event };
                  })
                  .sort((a, b) => {
                    if (!a.event || !b.event) return 0;
                    const courseOrder = ['SCY', 'SCM', 'LCM'];
                    const cA = courseOrder.indexOf(a.event.course);
                    const cB = courseOrder.indexOf(b.event.course);
                    if (cA !== cB) return cA - cB;
                    return (a.event.distance ?? 0) - (b.event.distance ?? 0);
                  })
                  .map(({ eventId, time, event }) => (
                    <tr key={eventId} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{event?.name ?? eventId}</td>
                      <td className="py-2 pr-4 text-gray-600">{event?.course ?? '—'}</td>
                      <td className="py-2 pr-4 text-gray-600">{event ? `${event.distance}m` : '—'}</td>
                      <td className="py-2 pr-4 text-gray-600 capitalize">{event?.stroke ?? '—'}</td>
                      <td className="py-2 text-right font-mono font-semibold">{time}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {/* Pending Associations */}
      {(pendingLoading || pendingAssociations.length > 0) && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            Pending Swimmer Requests
            {pendingAssociations.length > 0 && (
              <span className="ml-2 bg-yellow-200 text-yellow-800 text-sm font-normal px-2 py-0.5 rounded-full">
                {pendingAssociations.length}
              </span>
            )}
          </h3>
          {pendingLoading ? (
            <p className="text-yellow-700 text-sm">Loading...</p>
          ) : (
            <div className="space-y-3">
              {pendingAssociations.map((assoc: any) => (
                <div key={assoc.id} className="flex items-center justify-between bg-white rounded border border-yellow-100 px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">
                      {assoc.swimmer?.firstName} {assoc.swimmer?.lastName}
                      <span className="ml-2 text-xs text-gray-500">
                        DOB: {assoc.swimmer?.dateOfBirth ? new Date(assoc.swimmer.dateOfBirth).toLocaleDateString() : '—'} · {assoc.swimmer?.gender}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Requested by: {assoc.familyUser?.firstName} {assoc.familyUser?.lastName} ({assoc.familyUser?.email})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs h-7"
                      onClick={() => {
                        const full = swimmers.find(s => s.id === assoc.swimmer?.id);
                        if (full) handleEditSwimmer(full);
                      }}
                    >
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => handleAssociation(assoc.id, 'approve')} className="bg-green-600 hover:bg-green-700 text-xs h-7">
                      Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleAssociation(assoc.id, 'deny')} className="text-xs h-7">
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Merge Swimmers */}
      <div className="mb-6">
        <Button variant="link" size="sm" onClick={() => { setShowMerge(v => !v); setMergeMessage(null); }} className="h-auto p-0 text-gray-600">
          {showMerge ? 'Hide Merge Tool' : 'Merge Swimmers'}
        </Button>
        {showMerge && (
          <div className="mt-3 bg-white border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-1">Merge Swimmers</h3>
            <p className="text-sm text-gray-500 mb-4">
              All times and associations from the source swimmer will be moved to the target swimmer. The source swimmer will be deleted.
            </p>
            <form onSubmit={handleMerge} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-gray-700 mb-1">Source swimmer (will be deleted)</label>
                <select
                  required
                  value={mergeSource}
                  onChange={e => setMergeSource(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select source...</option>
                  {swimmers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.lastName}, {s.firstName} ({s.gender}, {s.ageGroup})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-gray-700 mb-1">Target swimmer (keep this one)</label>
                <select
                  required
                  value={mergeTarget}
                  onChange={e => setMergeTarget(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select target...</option>
                  {swimmers.filter(s => s.id !== mergeSource).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.lastName}, {s.firstName} ({s.gender}, {s.ageGroup})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={mergeLoading || !mergeSource || !mergeTarget} className="bg-orange-600 hover:bg-orange-700">
                {mergeLoading ? 'Merging...' : 'Merge'}
              </Button>
            </form>
            {mergeMessage && (
              <p className={`mt-3 text-sm ${mergeMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {mergeMessage.text}
              </p>
            )}
          </div>
        )}
      </div>

      <DataTable
        columns={getColumns(handleEditSwimmer, handleDeleteSwimmer, swimmers, clubs, user?.role === 'admin', handleViewSeedTimes)}
        data={swimmers}
        aboveTable={createFilters}
        pageSizeOptions={[10, 20, 50, 100, 200, 400, 9999]}
      />


      {/* Import Format Help */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">CSV Import Format</h3>
          <p className="text-sm text-blue-700 mb-2">
            Your CSV file should have these columns: <code>firstname, lastname, dateofbirth, gender</code>
          </p>
          <p className="text-sm text-blue-700 mb-2">
            Optional columns: <code>externalid</code>
          </p>
          <p className="text-xs text-blue-600">
            Example: &#34;John, Smith, 2010-05-15, Male, USA123456&#34;
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-purple-800 mb-2">Team Unify Import Format</h3>
          <p className="text-sm text-purple-700 mb-2">
            Import swimmers and their best times from Team Unify export files.
          </p>
          <p className="text-sm text-purple-700 mb-2">
            Format: Swimmer info in first column, times in subsequent rows with "1" in first column.
          </p>
          <p className="text-xs text-purple-600">
            Creates both swimmer records and time records automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
