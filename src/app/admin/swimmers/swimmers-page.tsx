'use client';

import {useEffect, useState} from 'react';
import {deleteSwimmerApi, fetchSwimmers} from '@/lib/api';
import SwimmerForm from '@/components/SwimmerForm';
import {Swimmer} from '@/lib/types';
import {Spinner} from "@/components/ui/shadcn-io/spinner";
import {DataTable} from "@/components/datatable/dataTable";
import {getColumns} from "@/app/admin/swimmers/columns";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {processTeamUnifyFile} from '@/lib/team-unify-import';
import {useAuth} from '@/lib/auth-context';

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
  const [uploadResults, setUploadResults] = useState<{ success: number, errors: string[] } | null>(null);
  const [importProgress, setImportProgress] = useState<{ currentRow: number, totalRows: number, currentAction: string, errors: string[] } | null>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [swimmerData, eventsData] = await Promise.all([
          fetchSwimmers(),
          fetch('/api/admin/events').then(res => res.json())
        ]);
        setSwimmers(swimmerData);
        setAllEvents(eventsData);
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
        const updatedSwimmers = await fetchSwimmers();
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
      const updatedSwimmers = await fetchSwimmers();
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
      const updatedSwimmers = await fetchSwimmers();
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

      const results = {success: 0, errors: [] as string[]};

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
            results.errors.push(`Row ${i}: Swimmer "${row.firstname} ${row.lastname}" with this birth date already exists`);
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
            ...(row.externalid && { externalId: row.externalid })
          };
          console.log('saving swimmer', swimmerData);

          const response = await fetch('/api/swimmers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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

      setUploadResults(results);
      // Reload swimmers to show newly imported ones
      const updatedSwimmers = await fetchSwimmers();
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

  // const groupedSwimmers = swimmers.reduce((groups, swimmer) => {
  //   const group = groups[swimmer.ageGroup] || [];
  //   group.push(swimmer);
  //   groups[swimmer.ageGroup] = group;
  //   return groups;
  // }, {} as Record<string, Swimmer[]>);

  if (loading) {
    return <div className={'items-center text-center'}>
      <Spinner size={64} variant={'circle'} speed={1} className={'mr-auto ml-auto my-5'}/>
    </div>;
  }

  const createFilters = (table: any) => {
    return (
      <>
        <Input
          placeholder="Filter Last Name..."
          value={(table.getColumn("lastName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("lastName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select value={(table.getColumn("ageGroup")?.getFilterValue() as string) ?? "ALL"}
                onValueChange={(value) => {
                  if (value === "ALL") {
                    table.getColumn("ageGroup")?.setFilterValue(undefined);
                  } else {
                    table.getColumn("ageGroup")?.setFilterValue(value);
                  }
                }}>
          <SelectTrigger className="ml-4">
            <SelectValue placeholder="Filter Age Group..."/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={"8&U"}>
              8 & Under
            </SelectItem>
            <SelectItem value={"9-10"}>
              9-10
            </SelectItem>
            <SelectItem value={"11-12"}>
              11-12
            </SelectItem>
            <SelectItem value={"13-14"}>
              13-14
            </SelectItem>
            <SelectItem value={"15-18"}>
              15-18
            </SelectItem>
            <SelectItem value={"ALL"}>
              All Age Groups
            </SelectItem>
          </SelectContent>
        </Select>
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
            <p className="text-green-600">Successfully imported: {uploadResults.success} swimmers</p>
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
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <SwimmerForm
              swimmer={editingSwimmer}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}

      <DataTable columns={getColumns(handleEditSwimmer, handleDeleteSwimmer)} data={swimmers} filters={createFilters}/>


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
