'use client';

import { ColumnDef } from '@tanstack/react-table';
import {SwimEvent, TimeRecord} from '@/lib/types';
import {Badge} from "@/components/ui/badge";
import {buildSort} from "@/components/datatable/buildSort";

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
          <div>
            {row.original.time}
            {row.original.isPersonalBest && (
            <Badge variant="outline" className="ml-4 border-green-800 bg-green-100 text-green-800"
              >PB</Badge>
             )}
          </div>
        ),
      },
      {
        accessorKey: "meetName",
        header: "Meet",
        cell: ({row}) => (
          <div>
            {row.original.meetName}
          </div>
        ),
      },
      {
        accessorKey: "meetDate",
        header: ({column}) => {
          return <div>
            Date
            {buildSort(column)}
          </div>
        },
        cell: ({row}) => (
          <div className="text-sm text-gray-600">
            {new Date(row.original.meetDate).toLocaleDateString()}
          </div>
        ),
      },
    ];
}
