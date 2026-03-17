"use client"

import {ColumnDef} from "@tanstack/react-table"
import {Swimmer, SwimClub} from "@/lib/types";
import {ArrowUpDown, MoreHorizontal} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Checkbox} from "@/components/ui/checkbox";
import {buildSort} from "@/components/datatable/buildSort";
import {buildFilter, buildTextFilter} from "@/components/datatable/buildFilter";
import {AGE_GROUPS} from "@/lib/constants";

export const getColumns = (editFunction: (swimmer:Swimmer) => void,
                           deleteFunction: (id:string) => void,
                           swimmers: Swimmer[],
                           clubs: SwimClub[] = [],
                           isAdmin: boolean = false): ColumnDef<Swimmer>[] => {
  const clubColumn: ColumnDef<Swimmer> = {
    accessorKey: "clubId",
    filterFn: (row, _columnId, filterValue) => {
      if (filterValue === 'none') return !row.original.clubId;
      return row.original.clubId === filterValue;
    },
    header: ({ column }) => (
      <div>
        Club
        {buildFilter(column, [
          { value: 'none', text: 'No Club' },
          ...clubs.map(c => ({ value: c.id, text: c.abbreviation || c.name })),
        ])}
      </div>
    ),
    cell: ({ row }) => {
      const club = clubs.find(c => c.id === row.original.clubId);
      return club ? (club.abbreviation || club.name) : '—';
    },
  };

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "ageGroup",
      header: ({column, table}) => {
        return (
          <div>
            Age Group
            {buildFilter(column,
              [
                {value: '', text: 'All'},
                ...AGE_GROUPS.map((ageGroup) => ({value: ageGroup, text: ageGroup}))
              ]
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "firstName",
      header: "First Name",
    },
    {
      accessorKey: "lastName",
      header: ({column, table}) => {
        return (
          <div>
            Last Name
            {buildSort(column)}
            {buildTextFilter(column, '', (value) => {})}
          </div>
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
      accessorKey: "externalId",
      header: "External Id",
    },
    {
      accessorKey: "active",
      header: ({column, table}) => {
        return (
          <div>
            Active
            {buildFilter(column,
              [
                {value: true, text: 'Active'},
                {value: false, text: 'In-Active'},
              ]
            )}
          </div>
        );
      },
    },
    ...(isAdmin ? [clubColumn] : []),
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