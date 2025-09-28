'use client';

import { ColumnDef } from '@tanstack/react-table';
import { User, Swimmer } from '@/lib/types';

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

      return (
        <div className="text-sm text-gray-900">
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
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <div className="text-sm text-gray-900">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="text-sm font-medium space-x-2">
        <button
          onClick={() => onEditUser(row.original)}
          className="text-blue-600 hover:text-blue-900"
        >
          Edit
        </button>
        {row.original.role === 'family' && (
          <button
            onClick={() => onManageAssociations(row.original)}
            className="text-green-600 hover:text-green-900"
          >
            Manage Swimmers
          </button>
        )}
        <button
          onClick={() => onDeleteUser(row.original.id)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </div>
    ),
  },
];
