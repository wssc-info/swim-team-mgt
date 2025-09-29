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
          // This would need to be enhanced to show actual event names
          // For now, showing the eventId - you might want to join with events data
          return (
            <div className="font-medium">
              {
                `${eventMap.get(row.original.eventId)?.name} (${eventMap.get(row.original.eventId)?.course})`
                ||
                row.original.eventId
              }
            </div>
          );
        },
      },
      {
        accessorKey: "time",
        header: () => <div className="text-right pr-3">Time</div>,
        cell: ({row}) => (
          <div className="font-mono font-medium text-right">
            {row.original.isPersonalBest && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-4">
                PB
              </span>
            )}
            {row.original.time}
          </div>
        ),
      },
      {
        accessorKey: "meetDate",
        header: "Meet Date",
        cell: ({row}) => (
          <div className="text-sm text-gray-600">
            {new Date(row.original.meetDate).toLocaleDateString()}
          </div>
        ),
      },
      {
        accessorKey: "meetName",
        header: "Meet",
        cell: ({row}) => (
            <div className="font-medium">{row.original.meetName}</div>

        ),
      },
    ];
}
