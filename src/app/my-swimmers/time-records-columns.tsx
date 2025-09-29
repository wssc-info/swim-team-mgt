'use client';

import { ColumnDef } from '@tanstack/react-table';
import {SwimEvent, TimeRecord} from '@/lib/types';

export const createTimeRecordsColumns = (events: SwimEvent[]): ColumnDef<TimeRecord>[] => {
  const eventMap = new Map(events.map(event => [event.id, event]));
  return [
      {
        accessorKey: "eventId",
        header: "Event",
        cell: ({row}) => {
          const event = eventMap.get(row.original.eventId);
          return (
            <div className="font-medium">
              {event ? `${event.name} (${event.course})` : `Event ${row.original.eventId}`}
            </div>
          );
        },
      },
      {
        accessorKey: "time",
        header: "Time",
        cell: ({row}) => (
          <div className="font-mono font-medium">
            {row.original.time}
          </div>
        ),
      },
      {
        accessorKey: "meetName",
        header: "Meet",
        cell: ({row}) => (
          <div>
            <div className="font-medium">{row.original.meetName}</div>
            <div className="text-sm text-gray-500">
              {new Date(row.original.meetDate).toLocaleDateString()}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "isPersonalBest",
        header: "PB",
        cell: ({row}) => (
          <div className="text-center">
            {row.original.isPersonalBest && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                PB
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Recorded",
        cell: ({row}) => (
          <div className="text-sm text-gray-600">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </div>
        ),
      },
    ];
}
