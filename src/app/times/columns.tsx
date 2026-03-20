"use client"

import {ColumnDef, Row} from "@tanstack/react-table"
import {SwimEvent, Swimmer, TimeRecord} from "@/lib/types";
import {ArrowUpDown, FilterIcon, MoreHorizontal} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {buildDateRangeFilter, buildFilter, buildTextFilter} from "@/components/datatable/buildFilter";
import {buildSort} from "@/components/datatable/buildSort";

export function timeToLong(timeString: string): number {
  const parts = timeString.split(':');
  let totalSeconds = 0.0;
  if (parts.length == 2) {
    totalSeconds += parseFloat(parts[0]) * 60; // minutes to seconds
  }
  totalSeconds += parseFloat(parts[parts.length - 1]); // add seconds
  return totalSeconds;
}

export const getColumns = (
  editFunction: (timeRecord: TimeRecord) => void,
  deleteFunction: (id: string) => void,
  swimmers: Swimmer[],
  allEvents: SwimEvent[],
  allRowRecords: TimeRecord[]): ColumnDef<TimeRecord>[] => {
  const getSwimmerName = (swimmerId: string) => {
    const swimmer = swimmers.find(s => s.id === swimmerId);
    return swimmer ? `${swimmer.firstName} ${swimmer.lastName}` : 'Unknown Swimmer';
  };

  const getEventName = (eventId: string) => {
    const event = allEvents.find(e => e.id === eventId);
    return event ? `${event.name} (${event.course})` : 'Unknown Event';
  };
  return [
    {
      accessorKey: "swimmerId",
      header: ({column}) => {
        return (
          <>
            Swimmer
            {buildSort(column)}
            {buildFilter(column,
              [{value: '', text: 'All'},
                ...swimmers
                  .map(swimmer => ({value: swimmer.id, text: swimmer.firstName + ' ' + swimmer.lastName}))
                  .sort((e1, e2) => e1.text.localeCompare(e2.text))
              ]
            )
            }
          </>
        );
      },
      cell: ({row}) => {
        return getSwimmerName(row.original.swimmerId)
      },
      sortingFn: (rowA: Row<TimeRecord>, rowB: Row<TimeRecord>, columnId: string) => {
        const swimmerA = swimmers.find(s => s.id === rowA.original.swimmerId);
        const swimmerB = swimmers.find(s => s.id === rowB.original.swimmerId);
        if (!swimmerA || !swimmerB) return 0;
        return swimmerA.lastName.localeCompare(swimmerB.lastName) || swimmerA.firstName.localeCompare(swimmerB.firstName);
      }
    },
    {
      accessorKey: "eventId",
      header: ({column}) => {
        return (
          <>
            Event
            {buildSort(column)}
            {buildFilter(column,
              [{value: '', text: 'All'},
                ...allEvents
                  .sort((e1, e2) => {
                    const distance = e1.distance - e2.distance;
                    if (distance !== 0) return distance;
                    return e1.stroke.localeCompare(e2.stroke);
                  })
                  .map(event => ({value: event.id, text: `${event.name} (${event.course})`}))
              ])
            }
        </>
        );
      },
      cell: ({row}) => {
        return getEventName(row.original.eventId)
      },
      sortingFn:
        (rowA: Row<TimeRecord>, rowB: Row<TimeRecord>, columnId: string) => {
          const eventA = allEvents.find(e => e.id === rowA.original.eventId);
          const eventB = allEvents.find(e => e.id === rowB.original.eventId);
          if (!eventA || !eventB) return 0;
          const distance = eventA.distance - eventB.distance;
          if (distance !== 0) return distance;
          return eventA.stroke.localeCompare(eventB.stroke);
        }
    },
    {
      accessorKey: "time",
      header: ({column}) => (
        <>
          Time
          {buildSort(column)}
        </>
      ),
      cell: ({row}) => {
        const record = row.original;
        return (<>
                  <span
                    className={`text-sm font-medium ${record.isPersonalBest ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {record.time}
                  </span>
            {record.isPersonalBest && (
              <span
                className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        PB
                    </span>
            )}
          </>
        )
      },
      sortingFn: (rowA: Row<TimeRecord>, rowB: Row<TimeRecord>, columnId: string) => {
        const eventA = allEvents.find(e => e.id === rowA.original.eventId);
        const eventB = allEvents.find(e => e.id === rowB.original.eventId);
        if (!eventA || !eventB) return 0;
        return timeToLong(rowA.original.time) - timeToLong(rowB.original.time);
      }
    },
    {
      accessorKey: "meetName",
      header: ({column}) => (
        <>
          Meet
          {buildFilter(column,
            allRowRecords
              .map(tr => ({value: tr.meetName, text: tr.meetName}))
              .filter((value, index, self) =>
                index === self.findIndex((t) => (
                  t.value === value.value
                )))
              .sort((e1, e2) => e1.text.localeCompare(e2.text))
          )}
        </>
      ),
    },
    {
      accessorKey: "meetDate",
      filterFn: (row, columnId, filterValue: { from?: string; to?: string }) => {
        const date = row.getValue<string>(columnId);
        if (!date) return true;
        if (filterValue?.from && date < filterValue.from) return false;
        if (filterValue?.to && date > filterValue.to) return false;
        return true;
      },
      header: ({column}) => (
        <>
          Date
          {buildSort(column)}
          {buildDateRangeFilter(column)}
        </>
      ),
    },
    {
      id: "actions",
      cell: ({row}) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => editFunction(row.original)}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator/>
              <DropdownMenuItem onClick={() => deleteFunction(row.original.id)}>
                <div className={'text-red-500'}>Delete</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];
}
export const columns: ColumnDef<Swimmer>[] = [
  {
    accessorKey: "ageGroup",
    header: "Age Group",
  },
  {
    accessorKey: "firstName",
    header: "First Name",
  },
  {
    accessorKey: "lastName",
    header: ({column}) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Name
          <ArrowUpDown className="ml-2 h-4 w-4"/>
        </Button>
      );
    }
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date of Birth",
  },
  {
    id: "actions",
    cell: ({row}) => {
      const payment = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator/>
            <DropdownMenuItem>
              <div className={'text-red-500'}>Delete</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]