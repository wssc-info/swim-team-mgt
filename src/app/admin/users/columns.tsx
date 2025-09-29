'use client';

import { ColumnDef } from '@tanstack/react-table';
import { User, Swimmer } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {MoreHorizontal} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";

interface UserWithAssociations extends User {
  associatedSwimmers?: string[];
}

interface UserColumnsProps {
  swimmers: Swimmer[];
  onEditUser: (user: UserWithAssociations) => void;
  onManageAssociations: (user: UserWithAssociations) => void;
  onDeleteUser: (userId: string) => void;
}

export const createUserColumns = ({
  swimmers,
  onEditUser,
  onManageAssociations,
  onDeleteUser,
}: UserColumnsProps): ColumnDef<UserWithAssociations>[] => [
  {
    accessorKey: "firstName",
    header: "User",
    cell: ({ row }) => (
      <div className="text-sm font-medium text-gray-900">
        {row.original.firstName} {row.original.lastName}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="text-sm text-gray-900">{row.original.email}</div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        row.original.role === 'admin'
          ? 'bg-red-100 text-red-800'
          : row.original.role === 'coach'
            ? 'bg-green-100 text-green-800'
            : 'bg-blue-100 text-blue-800'
      }`}>
        {row.original.role}
      </span>
    ),
  },
  {
    accessorKey: "associatedSwimmers",
    header: "Associated Swimmers",
    cell: ({ row }) => {
      const getSwimmerNames = (swimmerIds: string[]) => {
        return swimmerIds
          .map(id => {
            const swimmer = swimmers.find(s => s.id === id);
            return swimmer ? `${swimmer.firstName} ${swimmer.lastName}` : 'Unknown';
          })
          .join(', ');
      };
      const getSwimmerName = (swimmerId: string) => {
        const swimmer = swimmers.find(s => s.id === swimmerId);
        return swimmer ? `${swimmer.firstName} ${swimmer.lastName}` : 'Unknown';
      };

      return (
        <div className="text-sm text-gray-900">
          <Tooltip>
            <TooltipTrigger>
              {row.original.role === 'family' && row.original.associatedSwimmers ? (
                row.original.associatedSwimmers.length > 0 ? (
                  <div className="max-w-xs truncate" title={getSwimmerNames(row.original.associatedSwimmers)}>
                    {getSwimmerNames(row.original.associatedSwimmers)}
                  </div>
                ) : (
                  <span className="text-gray-500 italic">No swimmers assigned</span>
                )
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </TooltipTrigger>
            <TooltipContent>
              {row.original.role === 'family' && row.original.associatedSwimmers ? (
                row.original.associatedSwimmers.length > 0 ? (
                  row.original.associatedSwimmers.map(swimmerId => (
                    <div key={swimmerId}>{getSwimmerName(swimmerId)}</div>
                  ))
                ) : (
                  <span className="text-gray-500 italic">No swimmers assigned</span>
                )
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </TooltipContent>
          </Tooltip>

        </div>
      );
    },
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
              onClick={() => onEditUser(row.original)}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onManageAssociations(row.original)}
              className="text-green-600 hover:text-green-900"
            >
              Manage Swimmers
            </DropdownMenuItem>
            <DropdownMenuSeparator/>
            <DropdownMenuItem onClick={() => onDeleteUser(row.original.id)}>
              <div className={'text-red-500'}>Delete</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];
