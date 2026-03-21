'use client';

import {useEffect, useState} from 'react';
import {authenticatedFetch, deleteSwimmerApi, fetchClubs, fetchSwimmers} from '@/lib/api';
import SwimmerForm from '@/components/SwimmerForm';
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
  }, []);

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
      }
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
          <button
            onClick={handleAddSwimmer}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add New Swimmer
          </button>
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
          <button
            onClick={() => setUploadResults(null)}
            className="mt-3 text-sm text-gray-600 hover:text-gray-800"
          >
            Dismiss
          </button>
        </div>
      )}


      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
            <SwimmerForm
              swimmer={editingSwimmer}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}

      <DataTable
        columns={getColumns(handleEditSwimmer, handleDeleteSwimmer, swimmers, clubs, user?.role === 'admin')}
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
