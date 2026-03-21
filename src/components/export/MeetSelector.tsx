'use client';

import { Meet } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useMemo } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { buildFilter, buildDateRangeFilter, buildTextFilter } from '@/components/datatable/buildFilter';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface MeetSelectorProps {
  meets: Meet[];
  selectedMeet: Meet | null;
  onMeetSelect: (meet: Meet) => void;
  loading: boolean;
}

export default function MeetSelector({ meets, selectedMeet, onMeetSelect, loading }: MeetSelectorProps) {
  const { user } = useAuth();
  const [activeMeetId, setActiveMeetId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    if (!user?.clubId) return;
    fetch(`/api/admin/clubs/${user.clubId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setActiveMeetId(data?.activeMeetId ?? null))
      .catch(() => {});
  }, [user]);

  const SortIcon = ({ column }: { column: any }) => {
    const sorted = column.getIsSorted();
    if (sorted === 'asc') return <ArrowUp className="h-3 w-3 ml-1 inline" />;
    if (sorted === 'desc') return <ArrowDown className="h-3 w-3 ml-1 inline" />;
    return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-40" />;
  };

  const columns = useMemo<ColumnDef<Meet>[]>(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <button
            className="flex items-center hover:text-gray-900 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name <SortIcon column={column} />
          </button>
          {buildTextFilter(column, '', () => {})}
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {activeMeetId === row.original.id && (
            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
              Active
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <button
            className="flex items-center hover:text-gray-900 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date <SortIcon column={column} />
          </button>
          {buildDateRangeFilter(column)}
        </div>
      ),
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
      filterFn: (row, _columnId, filterValue: { from?: string; to?: string }) => {
        if (!filterValue) return true;
        const d = row.original.date;
        if (filterValue.from && d < filterValue.from) return false;
        if (filterValue.to && d > filterValue.to) return false;
        return true;
      },
      sortingFn: 'alphanumeric',
    },
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <button
            className="flex items-center hover:text-gray-900 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Location <SortIcon column={column} />
          </button>
          {buildTextFilter(column, '', () => {})}
        </div>
      ),
    },
    {
      accessorKey: 'course',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          Course
          {buildFilter(column, [
            { value: 'SCY', text: 'SCY' },
            { value: 'SCM', text: 'SCM' },
            { value: 'LCM', text: 'LCM' },
          ])}
        </div>
      ),
      cell: ({ row }) => (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-mono">
          {row.original.course}
        </span>
      ),
    },
    {
      id: 'events',
      header: 'Events',
      cell: ({ row }) => {
        const count = row.original.meetEvents?.length;
        return <span className="text-sm text-gray-600">{count}</span>;
      },
    },
  ], [activeMeetId]);

  const table = useReactTable({
    data: meets,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading meets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Select Meet to Export</h2>
      {meets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No meets available for export.</p>
          <p className="text-sm text-gray-400">Create a meet first to export data.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    onClick={() => onMeetSelect(row.original)}
                    className={`cursor-pointer transition-colors ${
                      selectedMeet?.id === row.original.id
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <TableCell
                        key={cell.id}
                        className={
                          selectedMeet?.id === row.original.id && cellIndex === 0
                            ? 'border-l-4 border-l-blue-500'
                            : ''
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                    No meets match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
