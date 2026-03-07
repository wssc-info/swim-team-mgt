'use client';

import { ColumnDef } from '@tanstack/react-table';
import {Meet, SwimEvent, TimeRecord} from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {MoreHorizontal, Pill} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Badge} from "@/components/ui/badge";

export const createMeetsColumns =
  (actionFunction: (action: string, meet: Meet) => void,
   activeMeet?: Meet): ColumnDef<Meet>[] => {
  return [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({row}) => (<div>
          {row.original.name}
            { row.original.id === activeMeet?.id &&
              <Badge variant={"outline"} className='bg-green-50 ml-4'>Active</Badge>
            }
        </div>),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({row}) => (
          <div>
            {new Date(row.original.date).toLocaleDateString()}
          </div>
        ),
      },
      {
        accessorKey: "location",
        header: "Location",
      },
      {
        accessorKey: "course",
        header: "Course",
      },
    {
      id: "eventCount",
      header: "Events",
      cell: ({row}) => {
        const sortedEvents = row.original.meetEvents?.sort((a, b) => {
          return a.eventNumber - b.eventNumber;
        }) || [];
        return (
          <div>
            <Tooltip>
              <TooltipTrigger>
                {row.original.meetEvents.length}
              </TooltipTrigger>
              <TooltipContent>
                {
                  sortedEvents.map(meetEvent => {
                    return (
                      <div key={meetEvent.eventNumber}>
                        {meetEvent.eventNumber}: {meetEvent.ageGroup} {meetEvent.gender} - {meetEvent.eventId}
                      </div>
                    )
                  })
                }
              </TooltipContent>
            </Tooltip>
          </div>
        )
      }
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
              <DropdownMenuItem onClick={() => actionFunction("activate", row.original)}>
                <div>Set Active</div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actionFunction("edit", row.original)}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator/>
              <DropdownMenuItem onClick={() => actionFunction("clone", row.original)}>
                <div>Clone Events (new)</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator/>
              <DropdownMenuItem onClick={() => actionFunction("delete", row.original)}>
                <div className={'text-red-500'}>Delete</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
    ];
}
