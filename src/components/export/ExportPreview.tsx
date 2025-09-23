'use client';

import { DataTable } from '@/components/datatable/dataTable';
import { ColumnDef } from '@tanstack/react-table';
import {Meet, RelayTeam, Swimmer} from "@/lib/types";


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

interface PreviewData {
  individual: IndividualEntry[];
  relays: RelayEntry[];
}

interface ExportPreviewProps {
  selectedMeet: Meet | null;
  previewData: PreviewData | null;
  exporting: boolean;
  onExport: () => void;
}

export default function ExportPreview({ selectedMeet, previewData, exporting, onExport }: ExportPreviewProps) {
  // Column definitions for individual entries
  const individualColumns: ColumnDef<IndividualEntry>[] = [
    {
      accessorKey: "swimmer.firstName",
      header: "First Name",
      cell: ({ row }) => row.original.swimmer.firstName,
    },
    {
      accessorKey: "swimmer.lastName", 
      header: "Last Name",
      cell: ({ row }) => row.original.swimmer.lastName,
    },
    {
      accessorKey: "event.name",
      header: "Event",
      cell: ({ row }) => row.original.event.name,
    },
    {
      accessorKey: "seedTime",
      header: "Seed Time",
      cell: ({ row }) => row.original.seedTime || 'NT',
    },
    {
      accessorKey: "swimmer.ageGroup",
      header: "Age Group",
      cell: ({ row }) => row.original.swimmer.ageGroup,
    },
    {
      accessorKey: "swimmer.gender",
      header: "Gender",
      cell: ({ row }) => row.original.swimmer.gender,
    },
  ];

  // Column definitions for relay entries
  const relayColumns: ColumnDef<RelayEntry>[] = [
    {
      accessorKey: "team.name",
      header: "Team Name",
      cell: ({ row }) => row.original.team.name,
    },
    {
      accessorKey: "event.name",
      header: "Event",
      cell: ({ row }) => row.original.event.name,
    },
    {
      accessorKey: "team.ageGroup",
      header: "Age Group",
      cell: ({ row }) => row.original.team.ageGroup,
    },
    {
      accessorKey: "team.gender",
      header: "Gender",
      cell: ({ row }) => row.original.team.gender,
    },
    {
      accessorKey: "swimmers",
      header: "Swimmers",
      cell: ({ row }) => row.original.swimmers.map(s => `${s.firstName} ${s.lastName}`).join(', '),
    },
  ];

  if (!selectedMeet || !previewData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Export Preview</h2>
        <button
          onClick={onExport}
          disabled={exporting || (previewData.individual.length === 0 && previewData.relays.length === 0)}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? 'Generating...' : 'Generate SDIF Content'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Individual Events */}
        <div>
          <h3 className="text-lg font-medium mb-3">
            Individual Events ({previewData.individual.length})
          </h3>
          
          {previewData.individual.length === 0 ? (
            <p className="text-gray-500 text-sm">No individual event entries found.</p>
          ) : (
            <DataTable 
              columns={individualColumns} 
              data={previewData.individual}
            />
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
            <DataTable 
              columns={relayColumns} 
              data={previewData.relays}
            />
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
  );
}
