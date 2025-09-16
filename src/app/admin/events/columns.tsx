"use client"

import {ColumnDef} from "@tanstack/react-table"
import {SwimEvent, Swimmer} from "@/lib/types";
import {ArrowUpDown, FilterIcon, MoreHorizontal} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const getStrokeColor = (stroke: string) => {
  const colors = {
    'freestyle': 'bg-blue-100 text-blue-800',
    'backstroke': 'bg-green-100 text-green-800',
    'breaststroke': 'bg-yellow-100 text-yellow-800',
    'butterfly': 'bg-purple-100 text-purple-800',
    'individual-medley': 'bg-red-100 text-red-800'
  };
  return colors[stroke as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const buildFilter = (column: any, filters: { value: any, text: string }[]) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="px-1!">
          <FilterIcon className="h-2 w-2"/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {filters.map((filter) => {
          return (
            <DropdownMenuCheckboxItem
              key={filter.value}
              className="capitalize"
              checked={column.getFilterValue() === filter.value}
              onCheckedChange={
                (value) => {
                  if (value) {
                    column?.setFilterValue(filter.value)
                  } else {
                    column?.setFilterValue(undefined);
                  }
                }
              }
            >
              {filter.text}
            </DropdownMenuCheckboxItem>
          );
        })
        }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const getColumns = (editFunction: (swimEvent: SwimEvent) => void,
                           deleteFunction: (id: string) => void): ColumnDef<SwimEvent>[] => {
  return [
    {
      accessorKey: "name",
      header: ({column}) => {
        return (
          <>
            Event Name
            <Button
              variant="ghost"
              className="px-1!"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              <ArrowUpDown className="h-4 w-4"/>
            </Button>
          </>
        );
      }
    },
    {
      accessorKey: "distance",
      header: ({column}) => {
        return (
          <>
            Distance
            <Button
              variant="ghost"
              className="px-1!"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              <ArrowUpDown className="h-4 w-4"/>
            </Button>
          </>
        );
      }
    },
    {
      accessorKey: "stroke",
      header: ({column}) => {
        return (
          <>
            Stroke
            {buildFilter(column, [
              {value: 'freestyle', text: 'Freestyle'},
              {value: 'backstroke', text: 'Backstroke'},
              {value: 'breaststroke', text: 'Breaststroke'},
              {value: 'butterfly', text: 'Butterfly'},
              {value: 'individual-medley', text: 'Individual Medley'},
            ])}
          </>
        );
      },
      cell: ({row}) => {
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStrokeColor(row.original.stroke)}`}>
              {row.original.stroke.replace('-', ' ')}
          </span>)
      }
    },
    {
      accessorKey: "course",
      header: ({column}) => {
        return (
          <>
            Course
            {buildFilter(column, [
              {value: 'SCY', text: 'Short Course Yards (SCY)'},
              {value: 'SCM', text: 'Short Course Meters (SCM)'},
              {value: 'LCM', text: 'Long Course Meters (LCM)'},
            ])}
          </>
        );
      }
    },
    {
      accessorKey: "isRelay",
      header: ({column}) => {
        return (
          <>
            Type
            {buildFilter(column, [
              {value: true, text: 'Relay'},
              {value: false, text: 'Individual'},
            ])}
          </>
        );
      },
      cell: ({row}) => {
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            row.original.isRelay ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {row.original.isRelay ? 'Relay' : 'Individual'}
          </span>
        );
      }
    },
    {
      accessorKey: "ageGroups",
      header: "Age Groups",
      cell: ({row}) => {
        return (
          <>
            <div className="flex flex-wrap gap-1 w-40">
              {row.original.ageGroups.map(ageGroup => (
                <span key={ageGroup} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          {ageGroup}
                        </span>
              ))}
            </div>
          </>
        );
      }
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({row}) => {
        return (
          <>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              row.original.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                      {row.original.isActive ? 'Active' : 'Inactive'}
                    </span>
          </>
        );
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